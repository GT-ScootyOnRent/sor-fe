/**
 * Default contact fallback configuration.
 * Used when the API fails or no contact is configured for the selected city.
 * Values are loaded from environment variables.
 */

export const DEFAULT_CONTACT = {
    name: import.meta.env.VITE_DEFAULT_CONTACT_NAME || 'Support',
    phoneNumber: import.meta.env.VITE_DEFAULT_CONTACT_NUMBER || '919549882266',
} as const;

/**
 * Build a tel: href from a phone number string.
 * Strips all non-digit characters except leading +.
 */
export const buildTelHref = (raw: string) => `tel:${raw.replace(/[^\d+]/g, '')}`;
