import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from './baseQueryWithReauth';

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    'Vehicle',
    'Booking',
    'User',
    'Admin',
    'City',
    'State',
    'Location',
    'Payment',
    'Alert',
  ],
  endpoints: () => ({}),
});

export default baseApi;