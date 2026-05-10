import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Calendar,
    LogOut,
    User,
    FileText,
    Menu,
    X,
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
    const [sidebarOpen, setSidebarOpen] = useState(false);

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

    const handleNavClick = (path: string) => {
        navigate(path);
        setSidebarOpen(false);
    };

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Mobile Header */}
            <div className="lg:hidden fixed top-0 left-0 right-0 z-30 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
                <h2 className="text-lg font-bold bg-gradient-to-r from-primary-600 to-indigo-600 bg-clip-text text-transparent">
                    scootyonrent
                </h2>
                <button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="p-2 rounded-lg hover:bg-gray-100 transition"
                >
                    {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
            </div>

            {/* Mobile Overlay */}
            {sidebarOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-black/50 z-30"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                fixed h-full z-40 bg-white shadow-lg
                w-64 lg:w-64
                transform transition-transform duration-300 ease-in-out
                ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                top-0 lg:top-0
            `}>
                <div className="p-4 lg:p-6">
                    <h2 className="text-xl lg:text-2xl font-bold bg-gradient-to-r from-primary-600 to-indigo-600 bg-clip-text text-transparent mb-1">
                        scootyonrent
                    </h2>
                    <p className="text-xs text-gray-500">Staff Portal</p>

                    {staffUser && (
                        <div className="mt-3 p-2 lg:p-3 bg-primary-50 rounded-lg flex items-center gap-2 lg:gap-3">
                            <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-full overflow-hidden bg-primary-100 flex items-center justify-center flex-shrink-0">
                                {profile?.profilePicUrl ? (
                                    <img
                                        src={profile.profilePicUrl}
                                        alt={staffUser.username}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <User className="w-4 h-4 lg:w-5 lg:h-5 text-primary-600" />
                                )}
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs lg:text-sm font-medium text-blue-900 truncate">{staffUser.username}</p>
                                <p className="text-xs text-primary-600">{profile?.cityName || `City #${staffUser.cityId}`}</p>
                            </div>
                        </div>
                    )}
                </div>

                <nav className="px-3 lg:px-4 space-y-1 lg:space-y-2">
                    {navItems.map(({ id, path, icon: Icon, label }) => (
                        <button
                            key={id}
                            onClick={() => handleNavClick(path)}
                            className={`w-full flex items-center px-3 lg:px-4 py-2.5 lg:py-3 rounded-lg transition text-sm lg:text-base font-semibold ${isActive(path)
                                ? 'bg-primary-50 text-primary-600'
                                : 'text-gray-700 hover:bg-gray-50'
                                }`}
                        >
                            <Icon className="w-4 h-4 lg:w-5 lg:h-5 mr-2 lg:mr-3 flex-shrink-0" />
                            <span className="truncate">{label}</span>
                        </button>
                    ))}
                </nav>

                {/* Profile and Logout at bottom */}
                <div className="absolute bottom-4 lg:bottom-6 left-0 right-0 px-3 lg:px-4">
                    <div className="bg-gray-100 rounded-xl p-2 lg:p-3">
                        <button
                            onClick={() => handleNavClick('/profile')}
                            className={`w-full flex items-center px-3 lg:px-4 py-2.5 lg:py-3 rounded-lg transition text-sm lg:text-base font-semibold ${isActive('/profile')
                                ? 'bg-white text-primary-600 shadow-sm'
                                : 'text-gray-700 hover:bg-white hover:shadow-sm'
                                }`}
                        >
                            <User className="w-4 h-4 lg:w-5 lg:h-5 mr-2 lg:mr-3" />
                            Profile
                        </button>
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center px-3 lg:px-4 py-2.5 lg:py-3 rounded-lg text-red-600 hover:bg-white hover:shadow-sm transition text-sm lg:text-base font-semibold"
                        >
                            <LogOut className="w-4 h-4 lg:w-5 lg:h-5 mr-2 lg:mr-3" />
                            Logout
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main content area */}
            <main className="flex-1 lg:ml-64 p-4 lg:p-8 pt-16 lg:pt-8">
                <Outlet />
            </main>
        </div>
    );
};

export default StaffLayout;
