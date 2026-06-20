import React, { useMemo, useState } from 'react';
import { Search, Phone, Mail, Calendar, Users as UsersIcon, UserPlus } from 'lucide-react';
import { useGetStaffCustomersQuery, type StaffCustomerDto } from '../../store/api/staffApi';
import { LoadingSpinner } from '../../components/LoadingSpinner';

// ── Helpers ─────────────────────────────────────────────────────────────────
const customerName = (c: StaffCustomerDto) => c.name?.trim() || c.phone || '—';
const initials = (c: StaffCustomerDto) =>
    (c.name?.trim()
        ? c.name.trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join('')
        : (c.phone ?? '—').slice(-2)
    ).toUpperCase();
const fmtDate = (iso?: string) => {
    if (!iso) return '—';
    const date = new Date(iso);
    return Number.isNaN(date.getTime())
        ? String(iso)
        : date.toLocaleString('en-IN', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              hour12: true,
          });
};

const StaffCustomersPage: React.FC = () => {
    const { data: customers = [], isLoading } = useGetStaffCustomersQuery();
    const [searchQuery, setSearchQuery] = useState('');

    const filteredCustomers = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        if (!q) return customers;
        return customers.filter(
            (c) =>
                c.name?.toLowerCase().includes(q) ||
                c.phone?.toLowerCase().includes(q) ||
                c.email?.toLowerCase().includes(q),
        );
    }, [customers, searchQuery]);

    return (
        <div>
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl lg:text-3xl font-extrabold text-gray-900">Customers</h1>
                    <p className="text-sm text-gray-500 mt-1">Customers who joined in the last 7 days</p>
                </div>
            </div>

            {/* Stat strip */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                <StatCard icon={<UsersIcon className="w-5 h-5" />} tone="bg-primary-50 text-primary-600" label="Total" value={String(customers.length)} />
                <StatCard icon={<UserPlus className="w-5 h-5" />} tone="bg-amber-50 text-amber-600" label="New (last 7 days)" value={String(customers.length)} />
            </div>

            {/* Toolbar */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-5">
                <div className="relative flex-1">
                    <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by name, phone or email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-500"
                    />
                </div>
            </div>

            {isLoading ? <LoadingSpinner /> : (
                <>
                    {/* Column header (desktop) */}
                    <div className="hidden lg:grid px-5 mb-2 gap-4 items-center text-[11px] font-bold uppercase tracking-wide text-gray-400"
                         style={{ gridTemplateColumns: '1.6fr 1.4fr 1fr' }}>
                        <span>Customer</span><span>Email</span><span>Joined</span>
                    </div>

                    <div className="space-y-2.5">
                        {filteredCustomers.map((customer) => (
                            <div
                                key={customer.id}
                                className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition"
                            >
                                <div className="px-5 py-4 grid gap-3 lg:gap-4 items-center grid-cols-1 lg:[grid-template-columns:1.6fr_1.4fr_1fr]">
                                    {/* Customer */}
                                    <div className="flex items-center gap-3">
                                        <div className="w-11 h-11 rounded-xl flex items-center justify-center font-bold shrink-0 bg-primary-100 text-primary-700">
                                            {initials(customer)}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-bold text-gray-900 truncate">{customerName(customer)}</p>
                                            <p className="text-xs text-gray-500 flex items-center gap-1"><Phone className="w-3 h-3" />{customer.phone || '—'}</p>
                                        </div>
                                    </div>
                                    {/* Email */}
                                    <div className="min-w-0">
                                        <p className="lg:hidden text-[11px] uppercase text-gray-400 font-semibold">Email</p>
                                        <p className="text-sm text-gray-700 truncate flex items-center gap-1.5">
                                            <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                            {customer.email || <span className="text-gray-300">—</span>}
                                        </p>
                                    </div>
                                    {/* Joined */}
                                    <div>
                                        <p className="lg:hidden text-[11px] uppercase text-gray-400 font-semibold">Joined</p>
                                        <p className="text-sm text-gray-700 flex items-center gap-1.5">
                                            <Calendar className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                            {fmtDate(customer.createdAt)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {filteredCustomers.length === 0 && (
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-16 text-center text-gray-500">
                                No customers found
                            </div>
                        )}
                    </div>
                </>
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

export default StaffCustomersPage;
