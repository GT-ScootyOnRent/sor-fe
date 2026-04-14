export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASEURL || 'https://app.scootyonrent.com/api',
  GOOGLE_MAPS_KEY: import.meta.env.VITE_GOOGLE_MAPS_KEY || '',
};

export const API_ENDPOINTS = {
  // Auth
  LOGIN: `Auth/login`,
  SENDOTP: `Auth/send-otp`,
  VERIFYOTP: `Auth/verify-otp`,
  LOGOUT: `Auth/logout`,
  REFRESH: `Auth/refresh`,

  // Admin Management
  ADMINS: '/Admins',
  ADMIN_BY_ID: (id: number) => `/Admins/${id}`,

  // User Management (admin only)
  USERS: '/Users',
  USER_BY_ID: (id: number) => `/Users/${id}`,

  // Vehicles
  VEHICLES: '/Vehicles',
  VEHICLE_BY_ID: (id: number) => `/Vehicles/${id}`,
  AVAILABLE_VEHICLES: '/Vehicles/available',

  // Vehicle Images (NEW)
  VEHICLE_IMAGES: '/VehicleImages',
  VEHICLE_IMAGES_BY_VEHICLE: (vehicleId: number) => `/VehicleImages/vehicle/${vehicleId}`,

  // Bookings
  BOOKINGS: '/Bookings',
  BOOKING_BY_ID: (id: number) => `/Bookings/${id}`,
  BOOKINGS_BY_USER: (userId: number) => `/Bookings/user/${userId}`,

  // Locations
  LOCATIONS: '/Locations',
  LOCATIONS_BY_CITY: (cityId: number) => `/Locations/city/${cityId}`,

  // Cities
  CITIES: '/Cities',
  CITY_BY_ID: (id: number) => `/Cities/${id}`,

  // States
  STATES: '/States',
  STATE_BY_ID: (id: number) => `/States/${id}`,

  // Payments
  PAYMENTS: '/Payments',
  PAYMENTS_BY_USER: (userId: number) => `/Payments/user/${userId}`,

  // Alerts (admin only)
  ALERTS_BY_ADMIN: (adminId: number) => `/Alerts/admin/${adminId}`,
  MARK_ALERT_READ: (id: number) => `/Alerts/${id}/read`,

  // Offline Bookings
  OFFLINE_BOOKINGS: 'OfflineBookings',

  // Pickup Locations (NEW)
  PICKUP_LOCATIONS: '/PickupLocations',
  PICKUP_LOCATIONS_BY_CITY: (cityId: number) => `/PickupLocations/city/${cityId}`,
  PICKUP_LOCATIONS_ACTIVE_BY_CITY: (cityId: number) => `/PickupLocations/city/${cityId}/active`,

  INITIATEPAYMENT: `Payments/initiate`,
  VERIFYPAYMENT: `Payments/verify`,
  // Website Reviews (NEW)
  WEBSITE_REVIEWS: '/WebsiteReviews',
  WEBSITE_REVIEWS_ACTIVE: '/WebsiteReviews/active',
  WEBSITE_REVIEW_BY_ID: (id: number) => `/WebsiteReviews/${id}`,

  // Promo Codes (NEW)
  PROMOCODES: 'PromoCodes',
  PROMOCODEBYID: (id: number) => `PromoCodes/${id}`,
  VALIDATEPROMOCODE: 'PromoCodes/validate',
  RECORDPROMOUSAGE: 'PromoCodes/record-usage',

  // Admin Password Management (NEW)
  ADMIN_FORGOT_PASSWORD: 'Auth/admin/forgot-password',
  ADMIN_VERIFY_OTP: 'Auth/admin/verify-otp',
  ADMIN_RESET_PASSWORD: 'Auth/admin/reset-password',
  ADMIN_CHANGE_PASSWORD: 'Auth/admin/change-password',
};

export default API_CONFIG;