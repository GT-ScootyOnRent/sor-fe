import { type RouteObject } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';

// Layouts
import MainLayout from '../components/MainLayout';

// User pages
import HomePage from '../pages/HomePage';
import AuthPage from '../pages/AuthPage';
import Login from '../pages/Login';
import Contact from '../pages/Contact';
import VehicleListingPage from '../pages/VehicleListingPage';
import TermsAndConditions from '../pages/TermsAndConditions';
import PrivacyPolicy from '../pages/PrivacyPolicy';
import BookNow from '../pages/BookNow';
import PaymentSuccessPage from '../pages/PaymentSuccessPage';
import PaymentFailurePage from '../pages/PaymentFailurePage';
import Profile from '../pages/ProfilePage';
import NotFoundPage from '../pages/NotFoundPage';

export const mainRoutes: RouteObject[] = [
    {
        element: <MainLayout />,
        children: [
            { path: '/', element: <HomePage /> },
            { path: '/auth', element: <AuthPage /> },
            { path: '/login', element: <Login /> },
            { path: '/contact', element: <Contact /> },
            { path: '/vehicles', element: <VehicleListingPage /> },
            { path: '/terms', element: <TermsAndConditions /> },
            { path: '/privacy-policy', element: <PrivacyPolicy /> },
            {
                path: '/book/:id',
                element: (
                    <ProtectedRoute allowedRoles={['user']}>
                        <BookNow />
                    </ProtectedRoute>
                ),
            },
            { path: '/booking-success', element: <PaymentSuccessPage /> },
            { path: '/payment-failure', element: <PaymentFailurePage /> },
            {
                path: '/profile',
                element: (
                    <ProtectedRoute allowedRoles={['user']}>
                        <Profile />
                    </ProtectedRoute>
                ),
            },
        ],
    },
    // Catch-all 404
    { path: '*', element: <NotFoundPage /> },
];
