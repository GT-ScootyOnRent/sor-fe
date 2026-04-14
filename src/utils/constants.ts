export const API_BASE_URL = import.meta.env.VITE_API_BASEURL || 'https://app.scootyonrent.com/api';

export const BOOKING_STATUS = {
  PENDING: 0,
  CONFIRMED: 1,
  COMPLETED: 2,
  CANCELLED: 3,
} as const;

export const USER_ROLES = {
  USER: 'user',
  ADMIN: 'admin',
  SUPERADMIN: 'superadmin',
} as const;

export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  FAILED: 'failed',
} as const;