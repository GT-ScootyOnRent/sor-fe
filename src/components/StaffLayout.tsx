import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Calendar,
    LogOut,
    User,
    FileText,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { staffLogout } from '../store/slices/staffAuthSlice';
import { useStaffLogoutMutation, useGetStaffProfileQuery } from '../store/api/staffApi';

type NavItem = {
    id: string;
    path: string;
    icon: React.ElementType;
    label: string;
};

const baseNavItems: NavItem[] = [
    { id: 'dashboard', path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'bookings', path: '/bookings', icon: Calendar, label: 'Bookings' },
];

/**
 * Staff site layout (staff.scootyonrent.com)
 * Provides sidebar navigation for staff pages
 */
const StaffLayout: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const dispatch = useAppDispatch();
    const staffUser = useAppSelector((state) => state.staffAuth.staff);
    const { data: profile } = useGetStaffProfileQuery();
    const [logoutApi] = useStaffLogoutMutation();

    // Build nav items dynamically based on permissions
    const canOfflineBook = staffUser?.canOfflineBook || profile?.canOfflineBook;
    const navItems: NavItem[] = [
        ...baseNavItems,
        ...(canOfflineBook ? [{ id: 'offline-booking', path: '/offline-booking', icon: FileText, label: 'Offline Booking' }] : []),
    ];

    const handleLogout = async () => {
        try {
            await logoutApi().unwrap();
        } catch {
            // Ignore logout API errors
        }
        dispatch(staffLogout());
        localStorage.clear();
        navigate('/login', { replace: true });
    };

    const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Sidebar */}
            <aside className="w-64 bg-white shadow-lg fixed h-full z-20">
                <div className="p-6">
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-indigo-600 bg-clip-text text-transparent mb-1">
                        scootyonrent
                    </h2>
                    <p className="text-xs text-gray-500">Staff Portal</p>

                    {staffUser && (
                        <div className="mt-3 p-3 bg-primary-50 rounded-lg flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full overflow-hidden bg-primary-100 flex items-center justify-center flex-shrink-0">
                                {profile?.profilePicUrl ? (
                                    <img
                                        src={profile.profilePicUrl}
                                        alt={staffUser.username}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <User className="w-5 h-5 text-primary-600" />
                                )}
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm font-medium text-blue-900 truncate">{staffUser.username}</p>
                                <p className="text-xs text-primary-600">{profile?.cityName || `City #${staffUser.cityId}`}</p>
                            </div>
                        </div>
                    )}
                </div>

                <nav className="px-4 space-y-2">
                    {navItems.map(({ id, path, icon: Icon, label }) => (
                        <button
                            key={id}
                            onClick={() => navigate(path)}
                            className={`w-full flex items-center px-4 py-3 rounded-lg transition ${isActive(path)
                                ? 'bg-primary-50 text-primary-600 font-semibold'
                                : 'text-gray-700 hover:bg-gray-50'
                                }`}
                        >
                            <Icon className="w-5 h-5 mr-3" />
                            {label}
                        </button>
                    ))}
                </nav>

                {/* Profile and Logout at bottom */}
                <div className="absolute bottom-6 left-0 right-0 px-4">
                    <div className="bg-gray-100 rounded-xl p-3">
                        <button
                            onClick={() => navigate('/profile')}
                            className={`w-full flex items-center px-4 py-3 rounded-lg transition ${isActive('/profile')
                                ? 'bg-white text-primary-600 font-semibold shadow-sm'
                                : 'text-gray-700 hover:bg-white hover:shadow-sm'
                                }`}
                        >
                            <User className="w-5 h-5 mr-3" />
                            Profile
                        </button>
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center px-4 py-3 rounded-lg text-red-600 hover:bg-white hover:shadow-sm transition"
                        >
                            <LogOut className="w-5 h-5 mr-3" />
                            Logout
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main content area */}
            <main className="flex-1 ml-64 p-8">
                <Outlet />
            </main>
        </div>
    );
};

export default StaffLayout;
