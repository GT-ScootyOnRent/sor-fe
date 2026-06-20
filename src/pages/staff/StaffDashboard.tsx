import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, FileText, Clock, LogIn, LogOut, RotateCcw, Plus, ChevronRight } from 'lucide-react';
import { useAppSelector } from '../../store/hooks';
import {
    useGetStaffBookingsQuery,
    useGetStaffProfileQuery,
    useGetStaffRestoreRequestsQuery,
} from '../../store/api/staffApi';

// Local 'YYYY-MM-DD' for comparing dates without timezone surprises.
const toYmd = (d: Date): string => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const StaffDashboard: React.FC = () => {
    const navigate = useNavigate();
    const staff = useAppSelector((state) => state.staffAuth.staff);
    const { data: bookings = [], isLoading } = useGetStaffBookingsQuery({});
    const { data: profile } = useGetStaffProfileQuery();
    const { data: restoreRequests = [] } = useGetStaffRestoreRequestsQuery();

    const canOfflineBook = staff?.canOfflineBook || profile?.canOfflineBook;
    const today = toYmd(new Date());

    const pickupsToday = bookings.filter((b) => toYmd(new Date(b.startDate)) === today && b.status !== 'cancelled');
    const returnsToday = bookings.filter((b) => toYmd(new Date(b.endDate)) === today && b.status !== 'cancelled');
    const activeBookings = bookings.filter((b) => b.status === 'confirmed' || b.status === 'active');
    const pendingBookings = bookings.filter((b) => b.status === 'pending');
    const pendingRestores = restoreRequests.filter((r) => r.status === 'pending');

    const todayBookings = bookings.filter(
        (b) => toYmd(new Date(b.startDate)) === today || toYmd(new Date(b.endDate)) === today,
    );

    const stats = [
        { label: 'Pickups Today', value: pickupsToday.length, icon: LogIn, color: 'bg-blue-100 text-blue-600', filter: 'confirmed' },
        { label: 'Returns Today', value: returnsToday.length, icon: LogOut, color: 'bg-purple-100 text-purple-600', filter: 'active' },
        { label: 'Active / Confirmed', value: activeBookings.length, icon: Clock, color: 'bg-green-100 text-green-600', filter: 'confirmed' },
        { label: 'Pending', value: pendingBookings.length, icon: FileText, color: 'bg-yellow-100 text-yellow-600', filter: 'pending' },
    ];

    const formatTime = (iso: string) =>
        new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });

    return (
        <div>
            <div className="mb-6 lg:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Welcome, {staff?.username}!</h1>
                    <p className="text-gray-500 mt-1 text-sm lg:text-base">Here's what's happening in your city today.</p>
                </div>
                <div className="flex items-center gap-2">
                    {canOfflineBook && (
                        <button
                            onClick={() => navigate('/offline-booking')}
                            className="inline-flex items-center gap-1.5 bg-primary-600 text-white px-3.5 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 transition"
                        >
                            <Plus className="w-4 h-4" /> New Offline Booking
                        </button>
                    )}
                    <button
                        onClick={() => navigate('/bookings')}
                        className="inline-flex items-center gap-1.5 bg-white border border-gray-200 text-gray-700 px-3.5 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition"
                    >
                        <Calendar className="w-4 h-4" /> All Bookings
                    </button>
                </div>
            </div>

            {/* Pending restore requests banner */}
            {pendingRestores.length > 0 && (
                <button
                    onClick={() => navigate('/bookings?status=cancelled')}
                    className="w-full mb-6 flex items-center justify-between gap-3 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-left hover:bg-amber-100 transition"
                >
                    <span className="flex items-center gap-2 text-sm font-medium text-amber-800">
                        <RotateCcw className="w-4 h-4" />
                        {pendingRestores.length} restore {pendingRestores.length === 1 ? 'request' : 'requests'} pending SuperAdmin approval
                    </span>
                    <ChevronRight className="w-4 h-4 text-amber-700" />
                </button>
            )}

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-6 lg:mb-8">
                {stats.map(({ label, value, icon: Icon, color, filter }) => (
                    <button
                        key={label}
                        onClick={() => navigate(`/bookings?status=${filter}`)}
                        className="bg-white rounded-xl shadow-md p-4 lg:p-6 text-left hover:shadow-lg hover:-translate-y-0.5 transition"
                    >
                        <div className="flex items-center gap-3 lg:gap-4">
                            <div className={`w-10 h-10 lg:w-12 lg:h-12 rounded-lg ${color} flex items-center justify-center`}>
                                <Icon className="w-5 h-5 lg:w-6 lg:h-6" />
                            </div>
                            <div>
                                <p className="text-xl lg:text-2xl font-bold text-gray-900">
                                    {isLoading ? '—' : value}
                                </p>
                                <p className="text-xs lg:text-sm text-gray-500">{label}</p>
                            </div>
                        </div>
                    </button>
                ))}
            </div>

            {/* Today's Bookings List */}
            <div className="bg-white rounded-xl shadow-md p-4 lg:p-6">
                <h2 className="text-base lg:text-lg font-bold text-gray-900 mb-4">Today's Pickups &amp; Returns</h2>
                {isLoading ? (
                    <div className="space-y-3">
                        {[0, 1, 2].map((i) => (
                            <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
                        ))}
                    </div>
                ) : todayBookings.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No pickups or returns scheduled for today.</p>
                ) : (
                    <div className="space-y-4">
                        {todayBookings.slice(0, 8).map((booking) => {
                            const isPickup = toYmd(new Date(booking.startDate)) === today;
                            const isReturn = toYmd(new Date(booking.endDate)) === today;
                            return (
                                <button
                                    key={booking.id}
                                    onClick={() => navigate(`/bookings/${booking.id}`)}
                                    className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-lg text-left hover:bg-gray-100 transition"
                                >
                                    <div>
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <p className="font-medium text-gray-900">
                                                {booking.vehicleName || `Vehicle #${booking.vehicleId}`}
                                            </p>
                                            {isPickup && (
                                                <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                                                    <LogIn className="w-3 h-3" /> Pickup
                                                </span>
                                            )}
                                            {isReturn && (
                                                <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">
                                                    <LogOut className="w-3 h-3" /> Return
                                                </span>
                                            )}
                                            {booking.isOfflineBooking && (
                                                <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                                                    Offline
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-500">
                                            {booking.userName || 'Customer'} • {booking.userPhone}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${booking.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                                            booking.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                                booking.status === 'active' ? 'bg-blue-100 text-blue-700' :
                                                    booking.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                                        'bg-gray-100 text-gray-700'
                                            }`}>
                                            {booking.status}
                                        </span>
                                        <p className="text-xs text-gray-400 mt-1">
                                            #{booking.id} • {formatTime(booking.startDate)}–{formatTime(booking.endDate)}
                                        </p>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default StaffDashboard;
