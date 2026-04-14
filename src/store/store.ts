import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';

import authReducer from './slices/authSlice';
import adminAuthReducer from './slices/adminAuthSlice';
import staffAuthReducer from './slices/staffAuthSlice';
import cityReducer from './slices/citySlice';

import { vehicleApi } from './api/vehicleApi';
import { vehicleImageApi } from './api/vehicleImageApi';
import { userApi } from './api/userApi';
import { bookingApi } from './api/bookingApi';
import { cityApi } from './api/cityApi';
import { locationApi } from './api/locationApi';
import { pickupLocationApi } from './api/pickupLocationApi';
import { paymentApi } from './api/paymentApi';
import { authApi } from './api/authApi';
import { websiteReviewApi } from './api/websiteReviewApi';
import { adminApi } from './api/adminApi';        // ← replaces adminAuthApi
import { promoCodeApi } from './api/promoCodeApi'; // ← NEW
import { offlineBookingApi } from './api/offlineBookingApi';
import { staffApi } from './api/staffApi';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    adminAuth: adminAuthReducer, // ← NEW
    staffAuth: staffAuthReducer, // ← Staff auth
    city: cityReducer, // ← City selection

    [vehicleApi.reducerPath]: vehicleApi.reducer,
    [vehicleImageApi.reducerPath]: vehicleImageApi.reducer,
    [userApi.reducerPath]: userApi.reducer,
    [bookingApi.reducerPath]: bookingApi.reducer,
    [cityApi.reducerPath]: cityApi.reducer,
    [locationApi.reducerPath]: locationApi.reducer,
    [pickupLocationApi.reducerPath]: pickupLocationApi.reducer,
    [paymentApi.reducerPath]: paymentApi.reducer,
    [authApi.reducerPath]: authApi.reducer,
    [websiteReviewApi.reducerPath]: websiteReviewApi.reducer,
    [adminApi.reducerPath]: adminApi.reducer,       // reducerPath = 'adminAuthApi' (unchanged)
    [promoCodeApi.reducerPath]: promoCodeApi.reducer, // reducerPath = 'promoCodeApi'
    [offlineBookingApi.reducerPath]: offlineBookingApi.reducer, // reducerPath = 'offlineBookingApi'
    [staffApi.reducerPath]: staffApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      vehicleApi.middleware,
      vehicleImageApi.middleware,
      userApi.middleware,
      bookingApi.middleware,
      cityApi.middleware,
      locationApi.middleware,
      pickupLocationApi.middleware,
      paymentApi.middleware,
      authApi.middleware,
      websiteReviewApi.middleware,
      adminApi.middleware,
      promoCodeApi.middleware,
      offlineBookingApi.middleware,
      staffApi.middleware
    ),
});

setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;