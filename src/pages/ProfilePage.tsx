import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User, Phone, Mail, Calendar, Clock, MapPin,
  Edit2, Save, X, Loader2, Bike, CheckCircle, XCircle,
  AlertCircle, RefreshCw, ChevronLeft, ChevronRight
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { setCredentials } from '../store/slices/authSlice';
import { useGetBookingsByUserIdQuery } from '../store/api/bookingApi';
import { useUpdateUserMutation } from '../store/api/userApi';
import { toast } from 'sonner';
import Header from '../components/Header';

const BOOKINGS_PER_PAGE = 4;

const BOOKING_STATUS_MAP: Record<number, { label: string; color: string; icon: React.ReactNode }> = {
  0: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: <AlertCircle className="w-3.5 h-3.5" /> },
  1: { label: 'Confirmed', color: 'bg-green-100 text-green-800 border-green-200', icon: <CheckCircle className="w-3.5 h-3.5" /> },
  2: { label: 'Completed', color: 'bg-primary-100 text-blue-800 border-primary-200', icon: <CheckCircle className="w-3.5 h-3.5" /> },
  3: { label: 'Cancelled', color: 'bg-red-100 text-red-800 border-red-200', icon: <XCircle className="w-3.5 h-3.5" /> },
};

function StatusBadge({ status }: { status: number }) {
  const s = BOOKING_STATUS_MAP[status] ?? { label: 'Unknown', color: 'bg-gray-100 text-gray-700 border-gray-200', icon: null };
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${s.color}`}>
      {s.icon} {s.label}
    </span>
  );
}

function formatDate(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

function formatTime(timeStr: string) {
  try {
    return new Date(`2000-01-01T${timeStr}`).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return timeStr;
  }
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);

  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(user?.name ?? '');
  const [currentPage, setCurrentPage] = useState(1);
  const [activeFilter, setActiveFilter] = useState<number>(-1);

  const [updateUser, { isLoading: isUpdating }] = useUpdateUserMutation();
  const {
    data: bookings,
    isLoading: isLoadingBookings,
    isError: isBookingsError,
    refetch: refetchBookings,
  } = useGetBookingsByUserIdQuery(user?.id ?? 0, { skip: !user?.id });

  // Sort: most recent first
  const sortedBookings = bookings
    ? [...bookings].sort((a, b) => (b.id ?? 0) - (a.id ?? 0))
    : [];

  // Filter by active status tab
  const filteredBookings = activeFilter === -1
    ? sortedBookings
    : sortedBookings.filter((b) => b.status === activeFilter);

  const totalPages = Math.ceil(filteredBookings.length / BOOKINGS_PER_PAGE);
  const paginatedBookings = filteredBookings.slice(
    (currentPage - 1) * BOOKINGS_PER_PAGE,
    currentPage * BOOKINGS_PER_PAGE
  );

  // const handleLogout = () => {
  //   dispatch(logout());
  //   toast.success('Logged out successfully');
  //   navigate('/');
  // };

  const handleSaveName = async () => {
    if (!editedName.trim()) { toast.error('Name cannot be empty'); return; }
    if (!user?.id) return;
    try {
      await updateUser({
        id: user.id,
        user: {
          id: user.id,
          userNumber: user.phone,
          name: editedName.trim(),
          email: user.email ?? '',
          cityId: user.cityId,
        },
      }).unwrap();
      const updatedUser = { ...user, name: editedName.trim() };
      dispatch(setCredentials({
        token: localStorage.getItem('authToken')!,
        user: updatedUser,
      }));
      localStorage.setItem('user', JSON.stringify(updatedUser));
      toast.success('Name updated successfully');
      setIsEditingName(false);
    } catch (err: any) {
      toast.error('Failed to update name', {
        description: err?.data?.message ?? 'Please try again',
      });
    }
  };


  if (!user) { navigate('/login'); return null; }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-4 py-8 max-w-4xl">

        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
        </div>


        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── LEFT COLUMN ── */}
          <div className="lg:col-span-1 space-y-4">

            {/* Profile Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <div className="flex flex-col items-center text-center mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-indigo-600 rounded-full flex items-center justify-center mb-3">
                  <User className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">{user.name || 'User'}</h2>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 border border-green-200 mt-1">
                  Active Member
                </span>
              </div>

              <div className="space-y-3">
                {/* Name */}
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Full Name</span>
                    {!isEditingName && (
                      <button
                        onClick={() => { setIsEditingName(true); setEditedName(user.name ?? ''); }}
                        className="text-primary-500 hover:text-primary-600 transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  {isEditingName ? (
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="text"
                        value={editedName}
                        onChange={(e) => setEditedName(e.target.value)}
                        className="flex-1 text-sm px-2 py-1.5 border border-primary-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-500"
                        autoFocus
                      />
                      <button
                        onClick={handleSaveName}
                        disabled={isUpdating}
                        className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition"
                      >
                        {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => setIsEditingName(false)}
                        className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <p className="text-sm font-medium text-gray-900">{user.name}</p>
                  )}
                </div>

                {/* Phone */}
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">
                    <Phone className="inline w-3 h-3 mr-1" />Mobile
                  </span>
                  <p className="text-sm font-medium text-gray-900">+91 {user.phone}</p>
                </div>

                {/* Email */}
                {user.email && (
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">
                      <Mail className="inline w-3 h-3 mr-1" />Email
                    </span>
                    <p className="text-sm font-medium text-gray-900">{user.email}</p>
                  </div>
                )}
              </div>
            </div>



          </div>

          {/* ── RIGHT COLUMN: Booking History ── */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">

              {/* Header */}
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-primary-500" />
                    Booking History
                    {filteredBookings.length > 0 && (
                      <span className="text-sm font-normal text-gray-500">
                        ({filteredBookings.length} {activeFilter === -1 ? 'total' : 'found'})
                      </span>
                    )}
                  </h3>
                  <button
                    onClick={() => { refetchBookings(); setCurrentPage(1); }}
                    className="p-2 text-gray-400 hover:text-primary-500 hover:bg-primary-50 rounded-lg transition"
                    title="Refresh bookings"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>

                {/* Filter tabs */}
                <div className="flex items-center gap-2 flex-wrap">
                  {[
                    { label: 'All', value: -1, activeColor: 'bg-gray-700 text-white', inactiveColor: 'bg-gray-100 text-gray-600 hover:bg-gray-200', count: sortedBookings.length },
                    { label: 'Confirmed', value: 1, activeColor: 'bg-green-600 text-white', inactiveColor: 'bg-green-50 text-green-700 hover:bg-green-100', count: sortedBookings.filter(b => b.status === 1).length },
                    { label: 'Completed', value: 2, activeColor: 'bg-primary-600 text-white', inactiveColor: 'bg-primary-50 text-primary-700 hover:bg-primary-100', count: sortedBookings.filter(b => b.status === 2).length },
                    { label: 'Pending', value: 0, activeColor: 'bg-yellow-500 text-white', inactiveColor: 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100', count: sortedBookings.filter(b => b.status === 0).length },
                    { label: 'Cancelled', value: 3, activeColor: 'bg-red-500 text-white', inactiveColor: 'bg-red-50 text-red-700 hover:bg-red-100', count: sortedBookings.filter(b => b.status === 3).length },
                  ].map(({ label, value, activeColor, inactiveColor, count }) => (
                    <button
                      key={value}
                      onClick={() => { setActiveFilter(value); setCurrentPage(1); }}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${activeFilter === value ? activeColor : inactiveColor
                        }`}
                    >
                      {label}
                      <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${activeFilter === value ? 'bg-white/25' : 'bg-white border border-gray-200 text-gray-600'
                        }`}>
                        {count}
                      </span>
                    </button>
                  ))}
                </div>
              </div>


              {/* Loading */}
              {isLoadingBookings && (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
                  <span className="ml-3 text-gray-500">Loading bookings...</span>
                </div>
              )}

              {/* Error */}
              {isBookingsError && (
                <div className="flex flex-col items-center justify-center py-16 text-center px-6">
                  <AlertCircle className="w-12 h-12 text-red-400 mb-3" />
                  <p className="text-gray-600 mb-4">Failed to load bookings</p>
                  {/* <Button
                    onClick={() => { refetchBookings(); setCurrentPage(1); }}
                    variant="outline"
                    className="border-primary-500 text-primary-500 hover:bg-primary-50"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" /> Try Again
                  </Button> */}
                </div>
              )}

              {/* Empty state */}
              {!isLoadingBookings && !isBookingsError && filteredBookings.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-center px-6">
                  <Bike className="w-16 h-16 text-gray-300 mb-4" />
                  {sortedBookings.length === 0 ? (
                    <>
                      <h4 className="text-lg font-semibold text-gray-600 mb-2">No bookings yet</h4>
                      <p className="text-sm text-gray-400 mb-6">Book your first ride and it will appear here.</p>
                      <Button onClick={() => navigate('/vehicles')} className="bg-primary-500 hover:bg-primary-600 text-white">
                        Browse Vehicles
                      </Button>
                    </>
                  ) : (
                    <>
                      <h4 className="text-lg font-semibold text-gray-600 mb-2">No bookings found</h4>
                      <p className="text-sm text-gray-400 mb-4">No bookings match the selected filter.</p>
                      <button
                        onClick={() => { setActiveFilter(-1); setCurrentPage(1); }}
                        className="text-sm text-primary-500 hover:text-primary-600 font-medium"
                      >
                        Clear filter
                      </button>
                    </>
                  )}
                </div>
              )}

              {/* Bookings list */}
              {!isLoadingBookings && !isBookingsError && filteredBookings.length > 0 && (
                <>
                  <div className="divide-y divide-gray-100">
                    {paginatedBookings.map((booking) => (
                      <div key={booking.id} className="p-5 hover:bg-gray-50 transition-colors">
                        <div className="flex items-start justify-between gap-4">

                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                              <Bike className="w-5 h-5 text-primary-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                <span className="text-xs font-semibold text-gray-400">Booking #{booking.id}</span>
                                <StatusBadge status={booking.status} />
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-sm mt-2">
                                <div className="flex items-center gap-1.5 text-gray-600">
                                  <Calendar className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                                  <span>
                                    {formatDate(booking.bookingStartDate?.toString())} – {formatDate(booking.bookingEndDate?.toString())}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5 text-gray-600">
                                  <Clock className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                                  <span>
                                    {formatTime(booking.startTime?.toString())} – {formatTime(booking.endTime?.toString())}
                                  </span>
                                </div>
                                {booking.pickupLocationId && (
                                  <div className="flex items-center gap-1.5 text-gray-600">
                                    <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                                    <span>Pickup #{booking.pickupLocationId}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="text-right flex-shrink-0">
                            <p className="text-lg font-bold text-gray-900">
                              ₹{Number(booking.totalAmount).toLocaleString('en-IN')}
                            </p>
                          </div>

                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
                      <p className="text-sm text-gray-500">
                        Showing{' '}
                        <span className="font-semibold text-gray-700">
                          {(currentPage - 1) * BOOKINGS_PER_PAGE + 1}–{Math.min(currentPage * BOOKINGS_PER_PAGE, filteredBookings.length)}
                        </span>{' '}
                        of <span className="font-semibold text-gray-700">{filteredBookings.length}</span> bookings
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setCurrentPage((p) => p - 1)}
                          disabled={currentPage === 1}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-300 text-sm font-medium text-gray-600 hover:bg-white hover:border-primary-400 hover:text-primary-600 transition disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <ChevronLeft className="w-4 h-4" /> Prev
                        </button>
                        <button
                          onClick={() => setCurrentPage((p) => p + 1)}
                          disabled={currentPage === totalPages}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-300 text-sm font-medium text-gray-600 hover:bg-white hover:border-primary-400 hover:text-primary-600 transition disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          Next <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
