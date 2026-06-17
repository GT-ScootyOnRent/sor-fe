import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Eye, Download, Search, X, Ban, CheckCircle, Check,
  ArrowUpRight, Bike, RotateCcw,
} from 'lucide-react';
import { toast } from 'sonner';

import {
  useGetBookingsQuery,
  useUpdateBookingMutation,
  useSuperAdminCancelBookingMutation,
  useSuperAdminRestoreBookingMutation,
  type BookingDto,
} from '../../store/api/bookingApi';
import { useGetUsersQuery, type UserDto } from '../../store/api/userApi';
import { useGetAdminBookingCustomerDetailsQuery } from '../../store/api/bookingCustomerDetailsApi';
import { useAppSelector } from '../../store/hooks';
import DashboardCityFilter, { useDashboardCityFilter } from './DashboardCityFilter';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { exportToExcel, formatBookingsForExport, formatPaymentsForExport } from '../../utils/excelExport';

// ── Status helpers ──────────────────────────────────────────────────────────
type StatusMeta = { label: string; stripe: string; iconBg: string; badge: string; dot: string; activeTab: string };
const STATUS_META: Record<number, StatusMeta> = {
  0: { label: 'Pending',   stripe: 'border-yellow-400', iconBg: 'bg-yellow-50 text-yellow-600',  badge: 'bg-yellow-100 text-yellow-700', dot: 'bg-yellow-400', activeTab: 'bg-yellow-100 text-yellow-800' },
  1: { label: 'Confirmed', stripe: 'border-green-500',  iconBg: 'bg-primary-50 text-primary-600', badge: 'bg-green-100 text-green-700',  dot: 'bg-green-500',  activeTab: 'bg-green-100 text-green-800' },
  2: { label: 'Completed', stripe: 'border-blue-400',   iconBg: 'bg-blue-50 text-blue-600',       badge: 'bg-blue-100 text-blue-700',   dot: 'bg-blue-400',   activeTab: 'bg-blue-100 text-blue-800' },
  3: { label: 'Cancelled', stripe: 'border-red-400',    iconBg: 'bg-red-50 text-red-500',         badge: 'bg-red-100 text-red-700',     dot: 'bg-red-400',    activeTab: 'bg-red-100 text-red-800' },
};
const statusMeta = (s: number): StatusMeta => STATUS_META[s] ?? STATUS_META[0];

const STATUS_FILTERS: { label: string; value: 'all' | 0 | 1 | 2 | 3; dot?: string; activeTab?: string }[] = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 0, dot: STATUS_META[0].dot, activeTab: STATUS_META[0].activeTab },
  { label: 'Confirmed', value: 1, dot: STATUS_META[1].dot, activeTab: STATUS_META[1].activeTab },
  { label: 'Completed', value: 2, dot: STATUS_META[2].dot, activeTab: STATUS_META[2].activeTab },
  { label: 'Cancelled', value: 3, dot: STATUS_META[3].dot, activeTab: STATUS_META[3].activeTab },
];

// A booking is still cancellable only while its rental period hasn't ended yet.
const isBookingActive = (endDate?: string) => {
  if (!endDate) return false;
  const end = new Date(endDate);
  if (Number.isNaN(end.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  return end >= today;
};

const fmtDate = (d?: string) => {
  if (!d) return '—';
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return String(d);
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
};

const fmtDateTime = (d?: string, time?: string) => {
  if (!d) return '—';
  const date = new Date(d);
  const base = Number.isNaN(date.getTime())
    ? String(d)
    : date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  return time ? `${base}, ${time}` : base;
};

const customerLabel = (u?: UserDto, userId?: number) =>
  u?.name?.trim() || u?.userNumber || `Customer #${userId ?? '—'}`;

const SECURITY_DEPOSIT = 2000; // ₹2000 refundable security deposit

const BookingsTab: React.FC = () => {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<'all' | 0 | 1 | 2 | 3>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBooking, setSelectedBooking] = useState<BookingDto | null>(null);

  // Only SuperAdmin can force-cancel any booking (frees the vehicle instantly)
  const adminUser = useAppSelector((state) => state.auth.user);
  const isSuperAdmin = adminUser?.userType === 'superadmin';

  const { cityIdParam } = useDashboardCityFilter();

  // ── API Calls ──────────────────────────────────────────────────────────
  const { data: bookings = [], isLoading: bookingsLoading, refetch: refetchBookings } = useGetBookingsQuery({
    page: 1, size: 100, cityId: cityIdParam,
  });
  const { data: users = [] } = useGetUsersQuery({ page: 1, size: 1000 });
  const [updateBooking] = useUpdateBookingMutation();
  const [superAdminCancelBooking, { isLoading: isCancelling }] = useSuperAdminCancelBookingMutation();
  const [superAdminRestoreBooking, { isLoading: isRestoring }] = useSuperAdminRestoreBookingMutation();

  // userId → user map (single fetch, no N+1)
  const userMap = useMemo(() => {
    const m = new Map<number, UserDto>();
    users.forEach((u) => m.set(u.id, u));
    return m;
  }, [users]);

  // ── Handlers ──────────────────────────────────────────────────────────
  const handleUpdateBookingStatus = async (bookingId: number, status: 0 | 1 | 2 | 3) => {
    try {
      const booking = bookings.find((b) => b.id === bookingId);
      if (!booking) return;
      await updateBooking({ id: bookingId, booking: { ...booking, status } }).unwrap();
      toast.success('Booking status updated');
      setSelectedBooking(null);
      refetchBookings();
    } catch { toast.error('Failed to update booking'); }
  };

  const handleSuperAdminCancel = async (bookingId: number) => {
    if (!window.confirm('Cancel this booking? The vehicle will become available instantly.')) return;
    try {
      await superAdminCancelBooking(bookingId).unwrap();
      toast.success('Booking cancelled. Vehicle is now available.');
      setSelectedBooking(null);
      refetchBookings();
    } catch (err: any) {
      toast.error(err?.data?.error ?? 'Failed to cancel booking');
    }
  };

  const handleSuperAdminRestore = async (bookingId: number, status: 0 | 1) => {
    const label = status === 1 ? 'Confirmed' : 'Pending';
    if (!window.confirm(`Restore this booking as ${label}? The vehicle will be reserved again.`)) return;
    try {
      await superAdminRestoreBooking({ id: bookingId, status }).unwrap();
      toast.success(`Booking restored as ${label}.`);
      setSelectedBooking(null);
      refetchBookings();
    } catch (err: any) {
      toast.error(err?.data?.error ?? 'Failed to restore booking');
    }
  };

  const goToUser = (userId: number) => navigate(`/users?highlight=${userId}`);
  const goToVehicle = (vehicleId: number) => navigate(`/vehicles?highlight=${vehicleId}`);

  // ── Filtered Data ──────────────────────────────────────────────────────
  const filteredBookings = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return bookings
      .filter((b) => (statusFilter === 'all' ? true : b.status === statusFilter))
      .filter((b) => {
        if (!q) return true;
        const user = b.userId != null ? userMap.get(b.userId) : undefined;
        return (
          String(b.id ?? '').includes(q) ||
          (b.vehicleName ?? '').toLowerCase().includes(q) ||
          (b.vehicleRegistrationNumber ?? '').toLowerCase().includes(q) ||
          customerLabel(user, b.userId).toLowerCase().includes(q)
        );
      })
      .sort((a, b) => (b.id ?? 0) - (a.id ?? 0));
  }, [bookings, statusFilter, searchQuery, userMap]);

  // ── Export Handlers ─────────────────────────────────────────────────────
  const handleExportBookings = () => {
    if (bookings.length === 0) { toast.error('No bookings to export'); return; }
    exportToExcel(formatBookingsForExport(bookings), 'Bookings', 'Bookings');
    toast.success('Bookings exported successfully');
  };
  const handleExportPayments = () => {
    if (bookings.length === 0) { toast.error('No payment data to export'); return; }
    exportToExcel(formatPaymentsForExport(bookings), 'Payments', 'Payments');
    toast.success('Payments exported successfully');
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-gray-900">Booking Management</h1>
          <p className="text-sm text-gray-500 mt-1">Manage, track and act on all rental bookings</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExportBookings} className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition text-sm font-semibold shadow-sm">
            <Download className="w-4 h-4 text-green-600" /> Export Bookings
          </button>
          <button onClick={handleExportPayments} className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition text-sm font-semibold shadow-sm">
            <Download className="w-4 h-4 text-blue-600" /> Export Payments
          </button>
        </div>
      </div>

      {/* Toolbar: search + status tabs */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-5">
        <div className="flex flex-col lg:flex-row lg:items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by booking ID, vehicle, customer..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400"
            />
          </div>
          <DashboardCityFilter />
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl overflow-x-auto">
            {STATUS_FILTERS.map((f) => {
              const active = statusFilter === f.value;
              const activeClass = active
                ? f.activeTab
                  ? `${f.activeTab} font-semibold shadow-sm`
                  : 'bg-white text-primary-700 font-semibold shadow-sm'
                : 'text-gray-500 hover:text-gray-800 font-medium';
              return (
                <button
                  key={f.label}
                  onClick={() => setStatusFilter(f.value)}
                  className={`px-3.5 py-1.5 rounded-lg text-sm whitespace-nowrap transition inline-flex items-center gap-1.5 ${activeClass}`}
                >
                  {f.dot && <span className={`w-2 h-2 rounded-full ${f.dot}`} />}
                  {f.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {bookingsLoading ? <LoadingSpinner /> : (
        <>
          {/* Column header (desktop) */}
          <div className="hidden lg:grid px-5 mb-2 gap-4 items-center text-[11px] font-bold uppercase tracking-wide text-gray-400"
               style={{ gridTemplateColumns: '260px 1.3fr 1.1fr 1fr 1fr 0.9fr 80px' }}>
            <span>Booking / Vehicle</span>
            <span>Customer</span>
            <span>Dates</span>
            <span>Phone</span>
            <span>Security</span>
            <span className="text-right">Amount</span>
            <span className="text-right">Action</span>
          </div>

          <div className="space-y-2.5">
            {filteredBookings.map((booking) => {
              const meta = statusMeta(booking.status);
              const user = booking.userId != null ? userMap.get(booking.userId) : undefined;
              const muted = booking.status === 2 || booking.status === 3;
              return (
                <div key={booking.id} className={`bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition ${muted ? 'opacity-80' : ''}`}>
                  <div className={`border-l-4 ${meta.stripe} px-5 py-4 grid gap-3 lg:gap-4 items-center grid-cols-1 lg:[grid-template-columns:260px_1.3fr_1.1fr_1fr_1fr_0.9fr_80px]`}>
                    {/* Booking / Vehicle */}
                    <div className="flex items-center gap-3">
                      <div className={`w-11 h-11 rounded-xl ${meta.iconBg} flex items-center justify-center shrink-0`}>
                        <Bike className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-gray-900">#{booking.id}</p>
                        <button
                          onClick={() => goToVehicle(booking.vehicleId)}
                          className="text-xs text-primary-600 hover:underline truncate block max-w-[180px] text-left"
                          title="View vehicle"
                        >
                          {booking.vehicleName || `Vehicle #${booking.vehicleId}`}
                          {booking.vehicleRegistrationNumber ? ` · ${booking.vehicleRegistrationNumber}` : ''}
                        </button>
                      </div>
                    </div>
                    {/* Customer */}
                    <div className="min-w-0">
                      <p className="lg:hidden text-[11px] uppercase text-gray-400 font-semibold">Customer</p>
                      <button
                        onClick={() => booking.userId != null && goToUser(booking.userId)}
                        className="font-medium text-primary-600 hover:underline truncate inline-flex items-center gap-1 max-w-full text-left"
                        title="View customer"
                      >
                        <span className="truncate">{customerLabel(user, booking.userId)}</span>
                        <ArrowUpRight className="w-3 h-3 shrink-0" />
                      </button>
                    </div>
                    {/* Dates */}
                    <div>
                      <p className="lg:hidden text-[11px] uppercase text-gray-400 font-semibold">Dates</p>
                      <p className="font-medium text-gray-800 text-sm">{fmtDate(booking.bookingStartDate)} → {fmtDate(booking.bookingEndDate)}</p>
                      {(booking.startTime || booking.endTime) && (
                        <p className="text-xs text-gray-500">{booking.startTime || '—'} → {booking.endTime || '—'}</p>
                      )}
                    </div>
                    {/* Phone */}
                    <div className="min-w-0">
                      <p className="lg:hidden text-[11px] uppercase text-gray-400 font-semibold">Phone</p>
                      <p className="font-medium text-gray-800 text-sm truncate">{user?.userNumber ?? booking.friendFamilyContactNumber ?? '—'}</p>
                    </div>
                    {/* Security */}
                    <div className="min-w-0">
                      <p className="lg:hidden text-[11px] uppercase text-gray-400 font-semibold">Security</p>
                      <p className="font-medium text-gray-800 text-sm">₹{SECURITY_DEPOSIT}</p>
                      <span className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full ${booking.securityDepositMode === 'online' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                        {booking.securityDepositMode === 'online' ? 'Online' : 'At pickup'}
                      </span>
                    </div>
                    {/* Amount */}
                    <div className="lg:text-right">
                      <p className="lg:hidden text-[11px] uppercase text-gray-400 font-semibold">Amount</p>
                      <p className="font-bold text-gray-900">₹{booking.totalAmount.toFixed(2)}</p>
                    </div>
                    {/* Action */}
                    <div className="flex lg:justify-end">
                      <button
                        onClick={() => setSelectedBooking(booking)}
                        className="w-9 h-9 flex items-center justify-center rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition"
                        title="View booking details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
            {filteredBookings.length === 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-16 text-center text-gray-500">
                No bookings found
              </div>
            )}
          </div>
        </>
      )}

      {/* View Booking drawer */}
      {selectedBooking && (
        <BookingDetailDrawer
          booking={selectedBooking}
          user={selectedBooking.userId != null ? userMap.get(selectedBooking.userId) : undefined}
          isSuperAdmin={!!isSuperAdmin}
          isCancelling={isCancelling}
          isRestoring={isRestoring}
          onClose={() => setSelectedBooking(null)}
          onUpdateStatus={handleUpdateBookingStatus}
          onSuperAdminCancel={handleSuperAdminCancel}
          onSuperAdminRestore={handleSuperAdminRestore}
          onOpenUser={goToUser}
          onOpenVehicle={goToVehicle}
        />
      )}
    </div>
  );
};

// ── View Booking Drawer ─────────────────────────────────────────────────────
interface DrawerProps {
  booking: BookingDto;
  user?: UserDto;
  isSuperAdmin: boolean;
  isCancelling: boolean;
  isRestoring: boolean;
  onClose: () => void;
  onUpdateStatus: (id: number, status: 0 | 1 | 2 | 3) => void;
  onSuperAdminCancel: (id: number) => void;
  onSuperAdminRestore: (id: number, status: 0 | 1) => void;
  onOpenUser: (id: number) => void;
  onOpenVehicle: (id: number) => void;
}

const DetailRow: React.FC<{ label: string; value?: React.ReactNode }> = ({ label, value }) => (
  <div>
    <p className="text-gray-400 text-xs">{label}</p>
    <p className="font-medium text-gray-800 break-words">{value || '—'}</p>
  </div>
);

const BookingDetailDrawer: React.FC<DrawerProps> = ({
  booking, user, isSuperAdmin, isCancelling, isRestoring, onClose,
  onUpdateStatus, onSuperAdminCancel, onSuperAdminRestore, onOpenUser, onOpenVehicle,
}) => {
  const meta = statusMeta(booking.status);
  const { data: details, isLoading: detailsLoading, isError: detailsError } =
    useGetAdminBookingCustomerDetailsQuery(booking.id as number, { skip: booking.id == null });

  const canCancel = isSuperAdmin && (booking.status === 0 || booking.status === 1) && isBookingActive(booking.bookingEndDate);
  const canRestore = isSuperAdmin && booking.status === 3 && isBookingActive(booking.bookingEndDate);

  return (
    <>
      <div onClick={onClose} className="fixed inset-0 bg-black/40 z-40 transition-opacity" />
      <div className="fixed top-0 right-0 h-full w-full max-w-md bg-gray-50 shadow-2xl z-50 overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between z-10">
          <div>
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Booking Details</p>
            <h3 className="text-lg font-extrabold text-gray-900 flex items-center gap-2">
              #{booking.id} <span className={`px-2 py-0.5 rounded-full text-xs ${meta.badge}`}>{meta.label}</span>
            </h3>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-lg hover:bg-gray-100 text-gray-500 flex items-center justify-center">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Customer */}
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold uppercase text-gray-400 tracking-wide">Customer</h4>
              {booking.userId != null && (
                <button onClick={() => onOpenUser(booking.userId)} className="text-xs text-primary-600 hover:underline font-semibold inline-flex items-center gap-1">
                  Open profile <ArrowUpRight className="w-3 h-3" />
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm">
              <DetailRow label="Name" value={user?.name || customerLabel(user, booking.userId)} />
              <DetailRow label="Phone" value={user?.userNumber} />
              <DetailRow label="Email" value={user?.email} />
            </div>
          </div>

          {/* Vehicle */}
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold uppercase text-gray-400 tracking-wide">Vehicle</h4>
              <button onClick={() => onOpenVehicle(booking.vehicleId)} className="text-xs text-primary-600 hover:underline font-semibold inline-flex items-center gap-1">
                Open vehicle <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center"><Bike className="w-5 h-5" /></div>
              <div>
                <p className="font-bold text-gray-900">{booking.vehicleName || `Vehicle #${booking.vehicleId}`}</p>
                <p className="text-sm text-gray-500">
                  {[booking.vehicleRegistrationNumber, booking.vehicleMake, booking.vehicleModel].filter(Boolean).join(' · ') || '—'}
                </p>
              </div>
            </div>
          </div>

          {/* Trip */}
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <h4 className="text-xs font-bold uppercase text-gray-400 tracking-wide mb-3">Trip</h4>
            <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm">
              <DetailRow label="Pickup" value={fmtDateTime(booking.bookingStartDate, booking.startTime)} />
              <DetailRow label="Return" value={fmtDateTime(booking.bookingEndDate, booking.endTime)} />
              <DetailRow label="Pickup Location" value={booking.pickupLocationName} />
              <DetailRow label="2nd Helmet" value={booking.includeSecondHelmet ? 'Yes' : 'No'} />
            </div>
          </div>

          {/* Submitted Details */}
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <h4 className="text-xs font-bold uppercase text-gray-400 tracking-wide mb-3">Submitted Details</h4>
            {detailsLoading ? (
              <p className="text-sm text-gray-400">Loading…</p>
            ) : detailsError || !details ? (
              <p className="text-sm text-gray-400">No customer details submitted for this booking.</p>
            ) : (
              <div className="space-y-3 text-sm">
                <DetailRow label="Guest Address" value={details.guestAddress} />
                <div className="grid grid-cols-2 gap-x-4">
                  <DetailRow label="Hotel Name" value={details.hotelName} />
                  <DetailRow label="Hotel Address" value={details.hotelAddress} />
                </div>
                <div className="grid grid-cols-2 gap-x-4">
                  <DetailRow label="F&F Contact" value={details.friendFamilyContactNumber} />
                  <DetailRow label="Driving License No." value={details.drivingLicenseNo} />
                </div>
              </div>
            )}
          </div>

          {/* Payment */}
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <h4 className="text-xs font-bold uppercase text-gray-400 tracking-wide mb-3">Payment</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Total amount</span><span className="font-bold text-gray-900">₹{booking.totalAmount}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Security deposit</span><span className="font-medium">{booking.securityDepositMode === 'online' ? 'Paid online' : 'At pickup'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Payment status</span><span className="font-medium capitalize">{booking.paymentStatus ?? '—'}</span></div>
              {booking.transactionId && (
                <div className="flex justify-between"><span className="text-gray-500">Transaction ID</span><span className="font-mono text-xs">{booking.transactionId}</span></div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2 pb-6">
            {booking.status === 0 && (
              <button onClick={() => onUpdateStatus(booking.id as number, 1)} className="flex-1 min-w-[120px] px-4 py-2.5 text-sm font-semibold rounded-xl bg-green-600 text-white hover:bg-green-700 inline-flex items-center justify-center gap-1">
                <Check className="w-4 h-4" /> Confirm
              </button>
            )}
            {booking.status === 1 && (
              <button onClick={() => onUpdateStatus(booking.id as number, 2)} className="flex-1 min-w-[120px] px-4 py-2.5 text-sm font-semibold rounded-xl bg-primary-600 text-white hover:bg-primary-700 inline-flex items-center justify-center gap-1">
                <CheckCircle className="w-4 h-4" /> Mark Complete
              </button>
            )}
            {canCancel && (
              <button onClick={() => onSuperAdminCancel(booking.id as number)} disabled={isCancelling} className="flex-1 min-w-[120px] px-4 py-2.5 text-sm font-semibold rounded-xl bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 inline-flex items-center justify-center gap-1">
                <Ban className="w-4 h-4" /> Cancel & Free
              </button>
            )}
            {canRestore && (
              <>
                <button onClick={() => onSuperAdminRestore(booking.id as number, 0)} disabled={isRestoring} className="flex-1 min-w-[120px] px-4 py-2.5 text-sm font-semibold rounded-xl bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-50 inline-flex items-center justify-center gap-1">
                  <RotateCcw className="w-4 h-4" /> Restore as Pending
                </button>
                <button onClick={() => onSuperAdminRestore(booking.id as number, 1)} disabled={isRestoring} className="flex-1 min-w-[120px] px-4 py-2.5 text-sm font-semibold rounded-xl bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 inline-flex items-center justify-center gap-1">
                  <CheckCircle className="w-4 h-4" /> Restore as Confirmed
                </button>
              </>
            )}
            {(booking.status === 2 || (booking.status === 3 && !canRestore)) && (
              <p className="text-sm text-gray-400 italic w-full text-center py-2">No actions available for {meta.label.toLowerCase()} bookings.</p>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default BookingsTab;