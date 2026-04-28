import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, UserCog, MapPin, Tag,
  LogOut, Menu, X, ShieldCheck
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { logout } from '../store/slices/authSlice';
import { resetPasswordChangeFlag } from '../store/slices/adminAuthSlice';
import AdminManagementTab from '../components/superadmin/AdminManagementTab';
// Re-use existing admin tab components for shared functionality
import BookingsTab from '../components/admin/BookingsTab';
import UsersTab from '../components/admin/UsersTab';
import VehiclesTab from '../components/admin/VehiclesTab';

type Tab =
  | 'overview'
  | 'admins'
  | 'users'
  | 'bookings'
  | 'vehicles'
  | 'pickup-points'
  | 'promo-codes';

const TAB_CONFIG: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'admins', label: 'Admins', icon: UserCog },
  { id: 'users', label: 'Customers', icon: Users },
  { id: 'bookings', label: 'Bookings', icon: LayoutDashboard },
  { id: 'vehicles', label: 'Vehicles', icon: LayoutDashboard },
  { id: 'pickup-points', label: 'Pickup Points', icon: MapPin },
  { id: 'promo-codes', label: 'Promo Codes', icon: Tag },
];

const SuperAdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);

  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    dispatch(logout());
    dispatch(resetPasswordChangeFlag());
    localStorage.removeItem('token');
    localStorage.removeItem('adminToken');
    localStorage.removeItem('user');
    localStorage.removeItem('adminUser');
    localStorage.removeItem('adminHasChangedPassword');
    navigate('/login', { replace: true });
  };

  const renderTab = () => {
    switch (activeTab) {
      case 'overview': return <SuperAdminOverview />;
      case 'admins': return <AdminManagementTab />;
      case 'users': return <UsersTab />;
      case 'bookings': return <BookingsTab />;
      case 'vehicles': return <VehiclesTab />;
      case 'pickup-points': return <div className="p-6 text-gray-500">Pickup Points — Phase 5</div>;
      case 'promo-codes': return <div className="p-6 text-gray-500">Promo Codes — Phase 6</div>;
      default: return null;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">

      {/* ── Sidebar ── */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 text-white flex flex-col
        transform transition-transform duration-200 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:relative lg:translate-x-0
      `}>
        {/* Logo / Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-700">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-purple-400" />
              <span className="font-bold text-lg tracking-tight">SuperAdmin</span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5 truncate">{user?.email || user?.name}</p>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-gray-400 hover:text-white"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          {TAB_CONFIG.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => { setActiveTab(id); setSidebarOpen(false); }}
              className={`
                w-full flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 text-sm font-medium transition
                ${activeTab === id
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'}
              `}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </button>
          ))}
        </nav>

        {/* Logout */}
        <div className="px-3 pb-4 border-t border-gray-700 pt-4">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-300 hover:bg-red-900 hover:text-red-200 transition"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Sidebar overlay on mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Main Content ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Top bar */}
        <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-gray-500 hover:text-gray-700"
              aria-label="Open sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-semibold text-gray-800">
              {TAB_CONFIG.find((t) => t.id === activeTab)?.label ?? 'Dashboard'}
            </h1>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span className="hidden sm:block">{user?.name}</span>
            <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold">
              SuperAdmin
            </span>
          </div>
        </header>

        {/* Tab content */}
        <main className="flex-1 overflow-y-auto">
          {renderTab()}
        </main>
      </div>
    </div>
  );
};

// ── Overview tab (inline — no separate file needed) ──────────────────────────
const SuperAdminOverview: React.FC = () => (
  <div className="p-6 space-y-6">
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {[
        { label: 'Total Admins', value: '—', color: 'bg-purple-50 text-purple-700' },
        { label: 'Total Customers', value: '—', color: 'bg-blue-50 text-blue-700' },
        { label: 'Total Bookings', value: '—', color: 'bg-green-50 text-green-700' },
        { label: 'Active Promos', value: '—', color: 'bg-orange-50 text-orange-700' },
      ].map(({ label, value, color }) => (
        <div key={label} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">{label}</p>
          <p className={`text-2xl font-bold mt-1 ${color} px-2 py-0.5 rounded inline-block`}>{value}</p>
        </div>
      ))}
    </div>
    <p className="text-sm text-gray-400">Overview stats will populate once connected to the analytics endpoints.</p>
  </div>
);

export default SuperAdminDashboard;