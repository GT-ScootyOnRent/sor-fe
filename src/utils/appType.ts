// App type from environment variable (injected at build time)
export const APP_TYPE = import.meta.env.VITE_APP_TYPE || 'main';

export const isAdminApp = APP_TYPE === 'admin';
export const isMainApp = APP_TYPE === 'main';
export const isStaffApp = APP_TYPE === 'staff';
