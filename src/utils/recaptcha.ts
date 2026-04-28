const SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY as string | undefined;

export async function executeRecaptcha(action: string): Promise<string> {
  if (!SITE_KEY) {
    throw new Error('reCAPTCHA site key is not configured (VITE_RECAPTCHA_SITE_KEY)');
  }
  if (!window.grecaptcha) {
    throw new Error('reCAPTCHA script has not loaded yet');
  }
  await new Promise<void>((resolve) => window.grecaptcha!.ready(resolve));
  return window.grecaptcha.execute(SITE_KEY, { action });
}
