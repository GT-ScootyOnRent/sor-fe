import React, { useEffect, useRef, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { isAdminApp } from '../utils/appType';
import { setCredentials } from '../store/slices/authSlice';
import { API_CONFIG } from '../config/api.config';

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
  const dispatch = useAppDispatch();
  const location = useLocation();

  const hasUser = isAuthenticated && !!user;

  // When there is no user in memory we may still have a valid HttpOnly refresh
  // cookie (e.g. access token expired, localStorage cleared, or a transient
  // logout). Attempt a silent session restore before redirecting to login so a
  // valid session isn't thrown away. The refresh endpoint's 401 is the source
  // of truth, not the absence of localStorage.
  const [restoreState, setRestoreState] = useState<'restoring' | 'failed'>(
    'restoring'
  );
  const attempted = useRef(false);

  useEffect(() => {
    if (hasUser || attempted.current) return;
    attempted.current = true;

    const base = API_CONFIG.BASE_URL.replace(/\/$/, '');
    (async () => {
      try {
        const res = await fetch(`${base}/Auth/refresh`, {
          method: 'POST',
          credentials: 'include',
        });
        if (!res.ok) {
          setRestoreState('failed');
          return;
        }
        const data = await res.json();
        if (data?.success && data.userData) {
          const resolvedUserType =
            (data.userType?.toLowerCase() as 'user' | 'admin' | 'superadmin') ||
            'user';
          dispatch(
            setCredentials({
              user: {
                id: data.userData.id,
                name: data.userData.username || data.userData.name || '',
                phone: data.userData.userNumber || data.userData.number || '',
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
        } else {
          setRestoreState('failed');
        }
      } catch {
        setRestoreState('failed');
      }
    })();
  }, [hasUser, dispatch]);

  // Not authenticated → try to restore, then redirect to login if that fails.
  if (!hasUser) {
    if (restoreState === 'restoring') {
      return (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              border: '3px solid #e5e7eb',
              borderTopColor: '#2563eb',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }}
          />
          <style>{'@keyframes spin{to{transform:rotate(360deg)}}'}</style>
        </div>
      );
    }

    return (
      <Navigate
        to="/login"
        state={{ from: location }}
        replace
      />
    );
  }

  // Role check - if user doesn't have required role
  if (allowedRoles && !allowedRoles.includes(user.userType as any)) {
    if (user.userType === 'admin' || user.userType === 'superadmin') {
      // /dashboard only exists in the admin app. In the customer (main) app, send
      // an admin/superadmin session to home instead of a non-existent route (404).
      return <Navigate to={isAdminApp ? '/dashboard' : '/'} replace />;
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