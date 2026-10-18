/**
 * Enquiry form submission (architect.md §17.2, §17.4).
 *
 * THE RULE THIS FILE EXISTS TO ENFORCE: a success state is shown only when
 * Netlify returns 2xx. There is exactly one call to showSuccess(), inside the
 * `response.ok` branch. No optimistic success, no success on timeout, no
 * success in a `finally`. A form that says "thanks!" and silently drops the
 * enquiry is worse than no form at all.
 *
 * Without JavaScript the form posts natively to Netlify and lands on
 * /thank-you/, so nothing here is load-bearing for delivery.
 */

import { primaryPhone } from '@/data/business';

const MIN_FILL_MS = 3000;

/** Fallback contact line, shown whenever a submission fails. */
const FALLBACK = `Please call ${primaryPhone.display} or message us on WhatsApp — your details are still in the form.`;

type Field = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

function fieldWrap(el: Field): HTMLElement | null {
  return el.closest('[data-field]');
}

function setError(el: Field, message: string | null): void {
  const wrap = fieldWrap(el);
  if (!wrap) return;
  const err = wrap.querySelector<HTMLElement>('.field__error');
  if (message) {
    wrap.setAttribute('data-invalid', '');
    el.setAttribute('aria-invalid', 'true');
    if (err) {
      err.textContent = message;
      err.hidden = false;
    }
  } else {
    wrap.removeAttribute('data-invalid');
    el.removeAttribute('aria-invalid');
    if (err) {
      err.textContent = '';
      err.hidden = true;
    }
  }
}

/** Accepts 10-digit Indian mobiles with or without +91, spaces or dashes. */
function phoneIsPlausible(raw: string): boolean {
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 10) return /^[6-9]/.test(digits);
  if (digits.length === 12 && digits.startsWith('91')) return /^[6-9]/.test(digits.slice(2));
  return false;
}

function validate(el: Field): string | null {
  const label = fieldWrap(el)?.querySelector('.field__label')?.textContent?.replace('*', '').trim();
  const name = label || el.name;
  const value = el.value.trim();

  if (el.hasAttribute('required') && !value) return `${name} is required.`;
  if (!value) return null;

  if (el.getAttribute('type') === 'tel' && !phoneIsPlausible(value)) {
    return 'Enter a 10-digit mobile number, with or without +91.';
  }
  if (el.getAttribute('type') === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    return 'Enter a valid email address, or leave it blank.';
  }
  return null;
}

function init(form: HTMLFormElement): void {
  const status = form.parentElement?.querySelector<HTMLElement>('[data-form-status]');
  const success = form.parentElement?.querySelector<HTMLElement>('[data-form-success]');
  const button = form.querySelector<HTMLButtonElement>('button[type="submit"]');
  const startedAt = Date.now();

  const fields = Array.from(
    form.querySelectorAll<Field>('input:not([type="hidden"]):not([type="checkbox"]), textarea, select'),
  );

  // Validate on blur, never on keystroke — correcting someone mid-word is hostile.
  for (const el of fields) {
    el.addEventListener('blur', () => setError(el, validate(el)));
  }

  function showError(message: string): void {
    if (!status) return;
    status.hidden = false;
    status.textContent = message;
    status.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  function showSuccess(): void {
    if (success) {
      form.hidden = true;
      success.hidden = false;
      const heading = success.querySelector<HTMLElement>('[data-success-heading]');
      heading?.focus();
      success.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
    const name = form.getAttribute('name') ?? 'form';
    window.dispatchEvent(new CustomEvent('mmm:lead', { detail: { form: name } }));
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (status) status.hidden = true;

    const problems = fields
      .map((el) => ({ el, message: validate(el) }))
      .filter((r): r is { el: Field; message: string } => r.message !== null);

    for (const el of fields) setError(el, null);
    for (const p of problems) setError(p.el, p.message);

    if (problems.length) {
      showError(
        problems.length === 1
          ? 'One field needs attention — see below.'
          : `${problems.length} fields need attention — see below.`,
      );
      problems[0].el.focus();
      return;
    }

    // Spam traps. The honeypot is invisible to people; the time trap catches
    // bots that complete a twelve-field form in under three seconds.
    const honeypot = form.querySelector<HTMLInputElement>('input[name="bot-field"]');
    if (honeypot?.value) return;
    if (Date.now() - startedAt < MIN_FILL_MS) {
      showError('That was submitted very quickly. Please check the form and try again.');
      return;
    }

    const originalLabel = button?.textContent ?? '';
    if (button) {
      button.disabled = true;
      button.textContent = 'Sending…';
    }

    try {
      const body = new URLSearchParams(
        new FormData(form) as unknown as Record<string, string>,
      ).toString();

      const response = await fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
      });

      if (response.ok) {
        // The ONLY place success is shown.
        showSuccess();
        return;
      }

      showError(`We could not send that (error ${response.status}). ${FALLBACK}`);
    } catch {
      showError(`We could not send that — it may be your connection. ${FALLBACK}`);
    } finally {
      // Restores the button either way. Never touches the success state.
      if (button) {
        button.disabled = false;
        button.textContent = originalLabel;
      }
    }
  });
}

document.querySelectorAll<HTMLFormElement>('form[data-enquiry-form]').forEach(init);
