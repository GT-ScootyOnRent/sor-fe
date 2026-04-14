import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '../store/hooks';

interface StaffProtectedRouteProps {
    children: React.ReactNode;
}

export const StaffProtectedRoute: React.FC<StaffProtectedRouteProps> = ({
    children,
}) => {
    const { staff, isAuthenticated } = useAppSelector((state) => state.staffAuth);
    const location = useLocation();

    // Not authenticated → redirect to login
    if (!isAuthenticated || !staff) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Staff must change password on first login
    if (!staff.hasChangedPassword && location.pathname !== '/change-password') {
        return <Navigate to="/change-password" replace />;
    }

    return <>{children}</>;
};
