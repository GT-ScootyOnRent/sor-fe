import { fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query';
import { API_CONFIG } from '../../config/api.config';
import type { RootState } from '../store';
import { logout, setCredentials } from '../slices/authSlice';
import { Mutex } from 'async-mutex';

// Mutex to prevent multiple simultaneous refresh attempts
const mutex = new Mutex();

const baseQuery = fetchBaseQuery({
    baseUrl: API_CONFIG.BASE_URL,
    credentials: 'include',
    prepareHeaders: (headers, { getState, endpoint }) => {
        // Try Redux state first, then localStorage fallback for fresh login scenarios
        const token = (getState() as RootState).auth.token || localStorage.getItem('token');
        if (token) {
            headers.set('Authorization', `Bearer ${token}`);
        }
        // Don't set Content-Type for file uploads - browser will set it with boundary
        const multipartEndpoints = new Set(['uploadProfilePic', 'uploadMyDocument', 'createHeroBanner', 'updateHeroBanner']);
        if (!headers.has('Content-Type') && !multipartEndpoints.has(endpoint)) {
            headers.set('Content-Type', 'application/json');
        }
        return headers;
    },
});

export const baseQueryWithReauth: BaseQueryFn<
    string | FetchArgs,
    unknown,
    FetchBaseQueryError
> = async (args, api, extraOptions) => {
    // Wait if another refresh is in progress
    await mutex.waitForUnlock();

    let result = await baseQuery(args, api, extraOptions);

    if (result.error && result.error.status === 401) {
        // Check if we're not already refreshing and not calling the refresh endpoint itself
        const isRefreshRequest = typeof args === 'object' && args.url?.includes('Auth/refresh');

        if (!mutex.isLocked() && !isRefreshRequest) {
            const release = await mutex.acquire();

            try {
                // Try to refresh the token
                const refreshResult = await baseQuery(
                    { url: 'Auth/refresh', method: 'POST' },
                    api,
                    extraOptions
                );

                if (refreshResult.data) {
                    const data = refreshResult.data as {
                        success: boolean;
                        token?: string;
                        refreshToken?: string;
                        userData?: {
                            id: number;
                            username?: string;
                            name?: string;
                            email?: string;
                            userNumber?: string;
                            number?: string;
                            cityId?: number;
                            dateOfBirth?: string;
                            anniversaryDate?: string;
                            role?: number;
                        };
                        userType?: string;
                    };

                    if (data.success && data.userData) {
                        const resolvedUserType = (data.userType?.toLowerCase() as 'user' | 'admin' | 'superadmin') || 'admin';
                        const resolvedName = data.userData.username || data.userData.name || '';
                        const resolvedPhone = data.userData.userNumber || data.userData.number || '';

                        // Update Redux state with new tokens (cookies are set by backend)
                        api.dispatch(
                            setCredentials({
                                user: {
                                    id: data.userData.id,
                                    name: resolvedName,
                                    phone: resolvedPhone,
                                    email: data.userData.email,
                                    dateOfBirth: data.userData.dateOfBirth,
                                    anniversaryDate: data.userData.anniversaryDate,
                                    cityId: data.userData.cityId,
                                    userType: resolvedUserType,
                                },
                                token: data.token,
                                refreshToken: data.refreshToken,
                            })
                        );

                        // Retry the original request
                        result = await baseQuery(args, api, extraOptions);
                    } else {
                        // Refresh failed - clear credentials and redirect to login
                        api.dispatch(logout());
                    }
                } else {
                    // Refresh request failed - clear credentials
                    api.dispatch(logout());
                }
            } finally {
                release();
            }
        } else if (!isRefreshRequest) {
            // Another refresh is in progress, wait for it and retry
            await mutex.waitForUnlock();
            result = await baseQuery(args, api, extraOptions);
        }
    }

    return result;
};
