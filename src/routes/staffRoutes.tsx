import { type RouteObject } from 'react-router-dom';
import { StaffProtectedRoute } from './StaffProtectedRoute';

// Layouts
import StaffLayout from '../components/StaffLayout';

// Staff pages
import StaffLogin from '../pages/staff/StaffLogin';
import StaffDashboard from '../pages/staff/StaffDashboard';
import StaffBookingsPage from '../pages/staff/StaffBookingsPage';
import StaffProfilePage from '../pages/staff/StaffProfilePage';
import StaffChangePasswordPage from '../pages/staff/StaffChangePasswordPage';
import StaffOfflineBookingPage from '../pages/staff/StaffOfflineBookingPage';
import NotFoundPage from '../pages/NotFoundPage';

export const staffRoutes: RouteObject[] = [
    // Auth pages (no layout - standalone)
    { path: '/', element: <StaffLogin /> },
    { path: '/login', element: <StaffLogin /> },
    { path: '/change-password', element: <StaffChangePasswordPage /> },

    // Protected pages with StaffLayout (sidebar)
    {
        element: (
            <StaffProtectedRoute>
                <StaffLayout />
            </StaffProtectedRoute>
        ),
        children: [
            { path: '/dashboard', element: <StaffDashboard /> },
            { path: '/bookings', element: <StaffBookingsPage /> },
            { path: '/bookings/:id', element: <StaffBookingsPage /> },
            { path: '/profile', element: <StaffProfilePage /> },
            { path: '/offline-booking', element: <StaffOfflineBookingPage /> },
        ],
    },

    // Catch-all 404
    { path: '*', element: <NotFoundPage /> },
];
