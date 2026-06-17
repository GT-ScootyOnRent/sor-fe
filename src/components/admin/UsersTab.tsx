import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Search, Download, Eye, X, Phone, Mail, MapPin,
  Users as UsersIcon, UserCheck, UserPlus, Bike, IdCard,
} from 'lucide-react';
import { toast } from 'sonner';

import {
  useGetUsersQuery,
  type UserDto,
} from '../../store/api/userApi';
import { useGetBookingsQuery, type BookingDto } from '../../store/api/bookingApi';
import { useGetCitiesQuery } from '../../store/api/cityApi';
import { useGetAdminBookingCustomerDetailsQuery } from '../../store/api/bookingCustomerDetailsApi';
import DashboardCityFilter, { useDashboardCityFilter } from './DashboardCityFilter';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { exportToExcel, formatUsersForExport } from '../../utils/excelExport';

// ── Helpers ─────────────────────────────────────────────────────────────────
const STATUS_BADGE: Record<number, { label: string; cls: string }> = {
  0: { label: 'Pending', cls: 'bg-yellow-100 text-yellow-700' },
  1: { label: 'Confirmed', cls: 'bg-green-100 text-green-700' },
  2: { label: 'Completed', cls: 'bg-blue-100 text-blue-700' },
  3: { label: 'Cancelled', cls: 'bg-red-100 text-red-700' },
};
const inr = (n: number) => '₹' + (n || 0).toLocaleString('en-IN');
const customerName = (u?: UserDto) => u?.name?.trim() || u?.userNumber || '—';
const initials = (u: UserDto) =>
  (u.name?.trim() ? u.name.trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join('') : u.userNumber.slice(-2)).toUpperCase();
const fmtDate = (d?: string) => {
  if (!d) return '—';
  const date = new Date(d);
  return Number.isNaN(date.getTime()) ? String(d) : date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

interface CustomerStats { count: number; spent: number; bookings: BookingDto[]; }

const UsersTab: React.FC = () => {
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'with' | 'new'>('all');
  const [selectedUser, setSelectedUser] = useState<UserDto | null>(null);
  const [searchParams] = useSearchParams();
  const highlightId = Number(searchParams.get('highlight')) || null;
  const [flashId, setFlashId] = useState<number | null>(null);
  const highlightRowRef = useRef<HTMLDivElement | null>(null);

  // ── API Calls ──────────────────────────────────────────────────────────
  const { data: users = [], isLoading: usersLoading } = useGetUsersQuery({ page: 1, size: 100 });
  const { data: bookings = [] } = useGetBookingsQuery({ page: 1, size: 1000 });
  const { data: cities = [] } = useGetCitiesQuery({ page: 1, size: 100 });
  const { cityIdParam } = useDashboardCityFilter();

  // city id → name
  const cityMap = useMemo(() => {
    const m = new Map<number, string>();
    cities.forEach((c) => m.set(c.id, c.name));
    return m;
  }, [cities]);

  // userId → { count, spent, bookings }  (derived from the bookings list, no extra calls)
  const statsMap = useMemo(() => {
    const m = new Map<number, CustomerStats>();
    bookings.forEach((b) => {
      if (b.userId == null) return;
      const s = m.get(b.userId) ?? { count: 0, spent: 0, bookings: [] };
      s.count += 1;
      if (b.status !== 3) s.spent += Number(b.totalAmount) || 0; // exclude cancelled from spend
      s.bookings.push(b);
      m.set(b.userId, s);
    });
    return m;
  }, [bookings]);

  const totals = useMemo(() => {
    const withBookings = users.filter((u) => (statsMap.get(u.id)?.count ?? 0) > 0).length;
    return { total: users.length, withBookings, fresh: users.length - withBookings };
  }, [users, statsMap]);

  // Flash + scroll to the row referenced by the ?highlight query param
  useEffect(() => {
    if (!highlightId || usersLoading) return;
    setFlashId(highlightId);
    const scrollTimer = setTimeout(() => {
      highlightRowRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
    const clearTimer = setTimeout(() => setFlashId(null), 3000);
    return () => { clearTimeout(scrollTimer); clearTimeout(clearTimer); };
  }, [highlightId, usersLoading]);

  // ── Filtered Data ──────────────────────────────────────────────────────
  const filteredUsers = useMemo(() => {
    const q = userSearchQuery.trim().toLowerCase();
    return users.filter((u) => {
      if (cityIdParam != null && u.cityId !== cityIdParam) return false;
      const count = statsMap.get(u.id)?.count ?? 0;
      if (activeFilter === 'with' && count === 0) return false;
      if (activeFilter === 'new' && count > 0) return false;
      if (!q) return true;
      return (
        u.userNumber.toLowerCase().includes(q) ||
        (u.name ?? '').toLowerCase().includes(q) ||
        (u.email ?? '').toLowerCase().includes(q)
      );
    });
  }, [users, userSearchQuery, activeFilter, statsMap, cityIdParam]);

  // ── Export Handler ─────────────────────────────────────────────────────
  const handleExportCustomers = () => {
    if (users.length === 0) { toast.error('No customers to export'); return; }
    exportToExcel(formatUsersForExport(users), 'Customers', 'Customers');
    toast.success('Customers exported successfully');
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-gray-900">Customer Management</h1>
          <p className="text-sm text-gray-500 mt-1">All registered customers, their activity and spend</p>
        </div>
        <button
          onClick={handleExportCustomers}
          className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition text-sm font-semibold shadow-sm"
        >
          <Download className="w-4 h-4 text-green-600" /> Export Customers
        </button>
      </div>

      {/* Stat strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <StatCard icon={<UsersIcon className="w-5 h-5" />} tone="bg-primary-50 text-primary-600" label="Total" value={String(totals.total)} />
        <StatCard icon={<UserCheck className="w-5 h-5" />} tone="bg-blue-50 text-blue-600" label="With Bookings" value={String(totals.withBookings)} />
        <StatCard icon={<UserPlus className="w-5 h-5" />} tone="bg-amber-50 text-amber-600" label="New (no booking)" value={String(totals.fresh)} />
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-5">
        <div className="flex flex-col lg:flex-row lg:items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, phone or email..."
              value={userSearchQuery}
              onChange={(e) => setUserSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-500"
            />
          </div>
          <DashboardCityFilter />
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl">
            {([['all', 'All'], ['with', 'With bookings'], ['new', 'New']] as const).map(([val, lbl]) => (
              <button
                key={val}
                onClick={() => setActiveFilter(val)}
                className={`px-3.5 py-1.5 rounded-lg text-sm whitespace-nowrap transition ${
                  activeFilter === val ? 'bg-white text-primary-700 font-semibold shadow-sm' : 'text-gray-500 hover:text-gray-800 font-medium'
                }`}
              >
                {lbl}
              </button>
            ))}
          </div>
        </div>
      </div>

      {usersLoading ? <LoadingSpinner /> : (
        <>
          {/* Column header (desktop) */}
          <div className="hidden lg:grid px-5 mb-2 gap-4 items-center text-[11px] font-bold uppercase tracking-wide text-gray-400"
               style={{ gridTemplateColumns: '1.6fr 1.2fr 1fr 0.8fr 0.8fr 80px' }}>
            <span>Customer</span><span>Email</span><span>City</span><span>Bookings</span><span className="text-right">Total Spent</span><span className="text-right">Action</span>
          </div>

          <div className="space-y-2.5">
            {filteredUsers.map((user) => {
              const stats = statsMap.get(user.id);
              const count = stats?.count ?? 0;
              return (
                <div
                  key={user.id}
                  ref={user.id === highlightId ? highlightRowRef : undefined}
                  className={`bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition ${flashId === user.id ? 'bg-yellow-100 ring-2 ring-yellow-400' : ''}`}
                >
                  <div className="px-5 py-4 grid gap-3 lg:gap-4 items-center grid-cols-1 lg:[grid-template-columns:1.6fr_1.2fr_1fr_0.8fr_0.8fr_80px]">
                    {/* Customer */}
                    <div className="flex items-center gap-3">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold shrink-0 ${count ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-400'}`}>
                        {initials(user)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-gray-900 truncate">{customerName(user)}</p>
                        <p className="text-xs text-gray-500 flex items-center gap-1"><Phone className="w-3 h-3" />{user.userNumber}</p>
                      </div>
                    </div>
                    {/* Email */}
                    <div className="min-w-0">
                      <p className="lg:hidden text-[11px] uppercase text-gray-400 font-semibold">Email</p>
                      <p className="text-sm text-gray-700 truncate">{user.email || <span className="text-gray-300">—</span>}</p>
                    </div>
                    {/* City */}
                    <div>
                      <p className="lg:hidden text-[11px] uppercase text-gray-400 font-semibold">City</p>
                      <p className="text-sm text-gray-700">{user.cityId != null ? (cityMap.get(user.cityId) ?? `City #${user.cityId}`) : '—'}</p>
                    </div>
                    {/* Bookings */}
                    <div>
                      <p className="lg:hidden text-[11px] uppercase text-gray-400 font-semibold">Bookings</p>
                      {count
                        ? <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-primary-50 text-primary-700">{count} booking{count > 1 ? 's' : ''}</span>
                        : <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-400">New</span>}
                    </div>
                    {/* Spent */}
                    <div className="lg:text-right">
                      <p className="lg:hidden text-[11px] uppercase text-gray-400 font-semibold">Total Spent</p>
                      <p className="font-bold text-gray-900">{inr(stats?.spent ?? 0)}</p>
                    </div>
                    {/* Action */}
                    <div className="flex lg:justify-end">
                      <button
                        onClick={() => setSelectedUser(user)}
                        className="w-9 h-9 flex items-center justify-center rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition"
                        title="View customer profile"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
            {filteredUsers.length === 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-16 text-center text-gray-500">
                No customers found
              </div>
            )}
          </div>
        </>
      )}

      {/* Profile drawer */}
      {selectedUser && (
        <CustomerDrawer
          user={selectedUser}
          stats={statsMap.get(selectedUser.id)}
          cityName={selectedUser.cityId != null ? cityMap.get(selectedUser.cityId) : undefined}
          onClose={() => setSelectedUser(null)}
        />
      )}
    </div>
  );
};

// ── Stat card ───────────────────────────────────────────────────────────────
const StatCard: React.FC<{ icon: React.ReactNode; tone: string; label: string; value: string }> = ({ icon, tone, label, value }) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
    <div className="flex items-center gap-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tone}`}>{icon}</div>
      <div>
        <p className="text-xs text-gray-400 font-semibold uppercase">{label}</p>
        <p className="text-xl font-extrabold text-gray-900">{value}</p>
      </div>
    </div>
  </div>
);

// ── Customer drawer ───────────────────────────────────────────────────────────
interface DrawerProps {
  user: UserDto;
  stats?: CustomerStats;
  cityName?: string;
  onClose: () => void;
}

const CustomerDrawer: React.FC<DrawerProps> = ({ user, stats, cityName, onClose }) => {
  const history = useMemo(
    () => [...(stats?.bookings ?? [])].sort((a, b) => (b.id ?? 0) - (a.id ?? 0)),
    [stats],
  );
  // Latest booking holds the customer's submitted form data (DL, address, etc.)
  const latestBookingId = history[0]?.id;
  const { data: form } = useGetAdminBookingCustomerDetailsQuery(latestBookingId as number, { skip: latestBookingId == null });

  return (
    <>
      <div onClick={onClose} className="fixed inset-0 bg-black/40 z-40" />
      <div className="fixed top-0 right-0 h-full w-full max-w-md bg-gray-50 shadow-2xl z-50 overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between z-10">
          <div>
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Customer Profile</p>
            <h3 className="text-lg font-extrabold text-gray-900">{customerName(user)}</h3>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-lg hover:bg-gray-100 text-gray-500 flex items-center justify-center">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Profile head */}
          <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-primary-100 text-primary-700 flex items-center justify-center text-xl font-extrabold">{initials(user)}</div>
            <div className="min-w-0">
              <p className="font-extrabold text-gray-900 text-lg truncate">{customerName(user)}</p>
              <p className="text-sm text-gray-500">Customer #{user.id}</p>
            </div>
          </div>

          {/* Contact */}
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <h4 className="text-xs font-bold uppercase text-gray-400 tracking-wide mb-3">Contact</h4>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3"><Phone className="w-4 h-4 text-gray-400" /><span className="font-medium">{user.userNumber}</span></div>
              <div className="flex items-center gap-3"><Mail className="w-4 h-4 text-gray-400" /><span className="font-medium">{user.email || '—'}</span></div>
              <div className="flex items-center gap-3"><MapPin className="w-4 h-4 text-gray-400" /><span className="font-medium">{cityName ?? (user.cityId != null ? `City #${user.cityId}` : '—')}</span></div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center">
              <p className="text-2xl font-extrabold text-gray-900">{stats?.count ?? 0}</p>
              <p className="text-xs text-gray-400 font-semibold uppercase mt-1">Bookings</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center">
              <p className="text-2xl font-extrabold text-gray-900">{inr(stats?.spent ?? 0)}</p>
              <p className="text-xs text-gray-400 font-semibold uppercase mt-1">Total Spent</p>
            </div>
          </div>

          {/* Submitted details (from latest booking form) */}
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <h4 className="text-xs font-bold uppercase text-gray-400 tracking-wide mb-3 flex items-center gap-2"><IdCard className="w-4 h-4" /> Submitted Details</h4>
            {!form ? (
              <p className="text-sm text-gray-400">No submitted details on record.</p>
            ) : (
              <div className="space-y-3 text-sm">
                <DetailRow label="Driving License No." value={form.drivingLicenseNo} />
                <DetailRow label="Address" value={form.guestAddress} />
                <div className="grid grid-cols-2 gap-x-4">
                  <DetailRow label="Hotel Name" value={form.hotelName} />
                  <DetailRow label="Hotel Address" value={form.hotelAddress} />
                </div>
                <DetailRow label="F&F Contact" value={form.friendFamilyContactNumber} />
              </div>
            )}
          </div>

          {/* Booking history */}
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <h4 className="text-xs font-bold uppercase text-gray-400 tracking-wide mb-3">Booking History</h4>
            {history.length === 0 ? (
              <p className="text-sm text-gray-400">No bookings yet.</p>
            ) : (
              <div className="space-y-2 text-sm">
                {history.map((b) => {
                  const st = STATUS_BADGE[b.status] ?? STATUS_BADGE[0];
                  return (
                    <div key={b.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-800 flex items-center gap-1.5">
                          <Bike className="w-3.5 h-3.5 text-gray-400" />#{b.id} · <span className="truncate">{b.vehicleName || `Vehicle #${b.vehicleId}`}</span>
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">{fmtDate(b.bookingStartDate)} · {inr(Number(b.totalAmount) || 0)}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold shrink-0 ${st.cls}`}>{st.label}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

const DetailRow: React.FC<{ label: string; value?: React.ReactNode }> = ({ label, value }) => (
  <div>
    <p className="text-gray-400 text-xs">{label}</p>
    <p className="font-medium text-gray-800 break-words">{value || '—'}</p>
  </div>
);

export default UsersTab;