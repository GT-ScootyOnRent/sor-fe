import React from 'react';
import { Calendar, FileText, Clock } from 'lucide-react';
import { useAppSelector } from '../../store/hooks';
import { useGetStaffBookingsQuery } from '../../store/api/staffApi';

const StaffDashboard: React.FC = () => {
    const staff = useAppSelector((state) => state.staffAuth.staff);
    const { data: bookings = [] } = useGetStaffBookingsQuery({});

    // Calculate stats
    const todayBookings = bookings.filter((b) => {
        const today = new Date().toDateString();
        return new Date(b.startDate).toDateString() === today;
    });
    const activeBookings = bookings.filter((b) => b.status === 'confirmed' || b.status === 'active');
    const pendingBookings = bookings.filter((b) => b.status === 'pending');

    const stats = [
        { label: "Today's Bookings", value: todayBookings.length, icon: Calendar, color: 'bg-blue-100 text-blue-600' },
        { label: 'Active Bookings', value: activeBookings.length, icon: Clock, color: 'bg-green-100 text-green-600' },
        { label: 'Pending', value: pendingBookings.length, icon: FileText, color: 'bg-yellow-100 text-yellow-600' },
    ];

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Welcome, {staff?.username}!</h1>
                <p className="text-gray-500 mt-1">Here's what's happening in your city today.</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {stats.map(({ label, value, icon: Icon, color }) => (
                    <div key={label} className="bg-white rounded-xl shadow-md p-6">
                        <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-lg ${color} flex items-center justify-center`}>
                                <Icon className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900">{value}</p>
                                <p className="text-sm text-gray-500">{label}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Today's Bookings List */}
            <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Today's Bookings</h2>
                {todayBookings.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No bookings scheduled for today.</p>
                ) : (
                    <div className="space-y-4">
                        {todayBookings.slice(0, 5).map((booking) => (
                            <div key={booking.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <p className="font-medium text-gray-900">
                                            {booking.vehicleName || `Vehicle #${booking.vehicleId}`}
                                        </p>
                                        {booking.isOfflineBooking && (
                                            <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                                                Offline Booking
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
                                            'bg-gray-100 text-gray-700'
                                        }`}>
                                        {booking.vehicleName || `Vehicle #${booking.vehicleId}`}
                                        {booking.status}
                                    </span>
                                    <p className="text-xs text-gray-400 mt-1">#{booking.id}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default StaffDashboard;
