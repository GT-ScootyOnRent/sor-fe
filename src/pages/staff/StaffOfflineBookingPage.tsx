import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldX } from 'lucide-react';
import { useAppSelector } from '../../store/hooks';
import { useGetStaffProfileQuery } from '../../store/api/staffApi';
import OfflineBookingForm from '../../components/admin/OfflineBookingForm';

const StaffOfflineBookingPage: React.FC = () => {
    const navigate = useNavigate();
    const staffUser = useAppSelector((state) => state.staffAuth.staff);
    const { data: profile, isLoading } = useGetStaffProfileQuery();

    const canOfflineBook = staffUser?.canOfflineBook || profile?.canOfflineBook;

    useEffect(() => {
        // Redirect after profile loads if no permission
        if (!isLoading && !canOfflineBook) {
            navigate('/dashboard', { replace: true });
        }
    }, [isLoading, canOfflineBook, navigate]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    if (!canOfflineBook) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                <ShieldX className="w-16 h-16 mb-4 text-red-400" />
                <h2 className="text-xl font-semibold text-gray-700">Access Denied</h2>
                <p className="mt-2">You don't have permission to access offline booking.</p>
            </div>
        );
    }

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Offline Booking Entry</h1>
                <p className="text-gray-500 mt-1">Enter offline booking details from the physical form into the system.</p>
            </div>
            <OfflineBookingForm />
        </div>
    );
};

export default StaffOfflineBookingPage;
