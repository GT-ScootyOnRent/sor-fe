import { type RouteObject } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';

// Layouts
import AdminLayout from '../components/AdminLayout';

// Admin pages
import AdminLogin from '../pages/AdminLogin';
import AdminDashboard from '../pages/AdminDashboard';
import AdminForgotPassword from '../pages/AdminForgotPassword';
import AdminChangePassword from '../pages/AdminChangePassword';
import VehiclesPage from '../pages/admin/VehiclesPage';
import BookingsPage from '../pages/admin/BookingsPage';
import UsersPage from '../pages/admin/UsersPage';
import ProfilePage from '../pages/admin/ProfilePage';
import StaffManagementPage from '../pages/admin/StaffManagementPage';
import NotFoundPage from '../pages/NotFoundPage';
import OfflineBookingPage from '../pages/admin/OfflineBookingPage';
import SuperAdminPage from '../pages/admin/SuperAdminPage';
import PromoCodesPage from '../pages/admin/PromoCodesPage';
import CitiesPage from '../pages/admin/CitiesPage';
import StatesPage from '../pages/admin/StatesPage';
import AdminPickupPointsPage from '../components/admin/AdminPickupPoints'
import PartnerInquiriesPage from '../pages/admin/PartnerInquiriesPage';
import ContactsPage from '../pages/admin/ContactsPage';
import HeroBannersPage from '../pages/admin/HeroBannersPage';
import AnnouncementBannersPage from '../pages/admin/AnnouncementBannersPage';
import VehiclePackagesPage from '../pages/admin/VehiclePackagesPage';
export const adminRoutes: RouteObject[] = [
  // Auth pages — no layout
  { path: '', element: <AdminLogin /> },
  { path: 'login', element: <AdminLogin /> },
  { path: 'forgot-password', element: <AdminForgotPassword /> },
  {
    path: 'change-password',
    element: (
      <ProtectedRoute allowedRoles={['admin', 'superadmin']}>
        <AdminChangePassword />
      </ProtectedRoute>
    ),
  },

  // Protected pages with AdminLayout (sidebar)
  {
    element: (
      <ProtectedRoute allowedRoles={['admin', 'superadmin']}>
        <AdminLayout />
      </ProtectedRoute>
    ),
    children: [
      { path: 'dashboard', element: <AdminDashboard /> },
      { path: 'vehicles', element: <VehiclesPage /> },
      { path: 'vehicle-packages', element: <VehiclePackagesPage /> },
      { path: 'bookings', element: <BookingsPage /> },
      { path: 'users', element: <UsersPage /> },
      { path: 'staff', element: <StaffManagementPage /> },
      { path: 'profile', element: <ProfilePage /> },
      { path: 'offline-booking', element: <OfflineBookingPage /> },
      { path: 'promo-codes', element: <PromoCodesPage /> },
      { path: 'pickup-points', element: <AdminPickupPointsPage /> },
      {
        path: 'partner-inquiries',
        element: (
          <ProtectedRoute allowedRoles={['superadmin']}>
            <PartnerInquiriesPage />
          </ProtectedRoute>
        ),
      },
      { path: 'contacts', element: <ContactsPage /> },
      { path: 'hero-banners', element: <HeroBannersPage /> },
      { path: 'announcement-banners', element: <AnnouncementBannersPage /> },
      {
        path: 'superadmin',
        element: (
          <ProtectedRoute allowedRoles={['superadmin']}>
            <SuperAdminPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'cities',
        element: (
          <ProtectedRoute allowedRoles={['superadmin']}>
            <CitiesPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'states',
        element: (
          <ProtectedRoute allowedRoles={['superadmin']}>
            <StatesPage />
          </ProtectedRoute>
        ),
      },
    ],
  },

  // Catch-all 404
  { path: '*', element: <NotFoundPage /> },
];