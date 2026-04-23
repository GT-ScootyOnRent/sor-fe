import React from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  Bike,
  Calendar,
  LogOut,
  User,
  UserCog,
  ShieldCheck,
  Tag,
  MapPin,
} from 'lucide-react'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { logout } from '../store/slices/authSlice'
import { useGetAdminProfileQuery } from '../store/api/adminApi'

type NavItem = {
  id: string
  path: string
  icon: React.ElementType
  label: string
  roles?: string[]
}

const navItems: NavItem[] = [
  { id: 'dashboard', path: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { id: 'vehicles', path: 'vehicles', icon: Bike, label: 'Vehicles' },
  { id: 'bookings', path: 'bookings', icon: Calendar, label: 'Bookings' },
  { id: 'users', path: 'users', icon: Users, label: 'Users' },
  { id: 'staff', path: 'staff', icon: UserCog, label: 'Staff' },
  { id: 'promo-codes', path: 'promo-codes', icon: Tag, label: 'Promo Codes' },
  { id: 'pickup-points', path: 'pickup-points', icon: MapPin, label: 'Pickup Points' },
  { id: 'states', path: 'states', icon: MapPin, label: 'States', roles: ['superadmin'] },
  { id: 'cities', path: 'cities', icon: MapPin, label: 'Cities', roles: ['superadmin'] },
  { id: 'superadmin', path: 'superadmin', icon: ShieldCheck, label: 'Admins', roles: ['superadmin'] },
]

// Admin site layout — admin.scootyonrent.com
// Provides sidebar navigation for admin pages
const AdminLayout: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const dispatch = useAppDispatch()
  const adminUser = useAppSelector(state => state.auth.user)
  const { data: profile } = useGetAdminProfileQuery()

  const handleLogout = () => {
    dispatch(logout())
    localStorage.clear()
    window.dispatchEvent(new Event('user-logout'))
    navigate('login', { replace: true })
  }

  const isActive = (path: string) => location.pathname.includes(path)

  // Filter nav items based on user role
  const visibleNavItems = navItems.filter(item => {
    if (!item.roles) return true
    return item.roles.includes(adminUser?.userType ?? '')
  })

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-lg fixed h-full z-20 flex flex-col">
        <div className="p-6 flex-shrink-0">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-indigo-600 bg-clip-text text-transparent mb-1">
            scootyonrent
          </h2>
          <p className="text-xs text-gray-500">Admin Panel</p>

          {adminUser && (
            <div className="mt-3 p-3 bg-primary-50 rounded-lg flex items-center gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden bg-primary-100 flex items-center justify-center flex-shrink-0">
                {profile?.profilePicUrl ? (
                  <img
                    src={profile.profilePicUrl}
                    alt={adminUser.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-5 h-5 text-primary-600" />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-blue-900 truncate">{adminUser.name}</p>
                <p className="text-xs text-primary-600 capitalize">{adminUser.userType}</p>
              </div>
            </div>
          )}
        </div>

        {/* Scrollable navigation */}
        <nav className="px-4 space-y-2 overflow-y-auto flex-1 pb-4">
          {visibleNavItems.map(({ id, path, icon: Icon, label }) => (
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
        <div className="px-4 pb-6 flex-shrink-0">
          <div className="bg-gray-100 rounded-xl p-3">
            <button
              onClick={() => navigate('profile')}
              className={`w-full flex items-center px-4 py-3 rounded-lg transition ${isActive('profile')
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
  )
}

export default AdminLayout