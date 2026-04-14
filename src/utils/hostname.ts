/**
 * Hostname utilities for subdomain-based routing
 */

const MAIN_DOMAIN = 'scootyonrent.com';
const ADMIN_SUBDOMAIN = 'admin.scootyonrent.com';

/**
 * Check if current hostname is the admin subdomain
 */
export const isAdminSubdomain = (): boolean => {
    const hostname = window.location.hostname;

    // Allow admin routes on:
    // - admin.scootyonrent.com (production)
    // - localhost (development)
    // - 127.0.0.1 (development)
    return (
        hostname === ADMIN_SUBDOMAIN ||
        hostname === 'localhost' ||
        hostname === '127.0.0.1' ||
        hostname.startsWith('192.168.') // Local network dev
    );
};

/**
 * Check if current hostname is the main domain (user-facing)
 */
export const isMainDomain = (): boolean => {
    const hostname = window.location.hostname;
    return hostname === MAIN_DOMAIN || hostname === `www.${MAIN_DOMAIN}`;
};

/**
 * Get the admin panel URL
 */
export const getAdminUrl = (path: string = ''): string => {
    if (window.location.hostname === 'localhost') {
        return `http://localhost:${window.location.port}${path}`;
    }
    return `https://${ADMIN_SUBDOMAIN}${path}`;
};

/**
 * Get the main site URL
 */
export const getMainSiteUrl = (path: string = ''): string => {
    if (window.location.hostname === 'localhost') {
        return `http://localhost:${window.location.port}${path}`;
    }
    return `https://${MAIN_DOMAIN}${path}`;
};
