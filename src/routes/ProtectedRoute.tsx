import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '../store/hooks';
import { isAdminApp } from '../utils/appType';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ('user' | 'admin' | 'superadmin')[];
  requirePasswordChanged?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
}) => {
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const { hasChangedPassword } = useAppSelector((state) => state.adminAuth);
  const location = useLocation();

  // Not authenticated → redirect to login
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // Role check - if user doesn't have required role
  if (allowedRoles && !allowedRoles.includes(user.userType as any)) {
    if (user.userType === 'admin' || user.userType === 'superadmin') {
      return <Navigate to="/dashboard" replace />;
    }
    if (user.userType === 'user') {
      return <Navigate to="/login" replace />;
    }
  }

  // Admin first-login password change guard (only for admin, not superadmin)
  const isChangePasswordPage = location.pathname === '/change-password';
  const isAdmin = user.userType === 'admin';

  if (
    isAdminApp &&
    isAdmin &&
    !isChangePasswordPage &&
    !hasChangedPassword
  ) {
    return <Navigate to="/change-password" replace />;
  }

  return <>{children}</>;
};