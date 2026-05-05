import React, { useMemo, useState } from 'react';
import {
  Loader2,
  Search,
  Eye,
  Trash2,
  X,
  Save,
  AlertCircle,
  Briefcase,
  Phone,
  Mail,
  MapPin,
  IndianRupee,
  Calendar,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  useGetPartnerInquiriesQuery,
  useGetPartnerInquiryByIdQuery,
  useUpdatePartnerInquiryStatusMutation,
  useDeletePartnerInquiryMutation,
  type PartnerInquiry,
  type PartnerInquiryStatus,
  type ListInquiriesArgs,
} from '../../store/api/partnerInquiryApi';

// ── Status mapping (FE-friendly labels; backend stays canonical) ────────────

const STATUS_LABEL: Record<PartnerInquiryStatus, string> = {
  new: 'Pending',
  contacted: 'Contacted',
  in_progress: 'In Progress',
  closed: 'Approved',
  rejected: 'Rejected',
};

const STATUS_BADGE: Record<PartnerInquiryStatus, string> = {
  new: 'bg-blue-100 text-blue-700',
  contacted: 'bg-amber-100 text-amber-700',
  in_progress: 'bg-violet-100 text-violet-700',
  closed: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-rose-100 text-rose-700',
};

const STATUS_OPTIONS: PartnerInquiryStatus[] = [
  'new',
  'contacted',
  'in_progress',
  'closed',
  'rejected',
];

const INVESTMENT_LABEL: Record<PartnerInquiry['investmentAmount'], string> = {
  below_5_lakh: 'Below 5 Lakh',
  above_5_lakh: 'Above 5 Lakh',
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

// ── Page ────────────────────────────────────────────────────────────────────

const PartnerInquiriesPage: React.FC = () => {
  const [filters, setFilters] = useState<ListInquiriesArgs>({ page: 1, size: 100 });
  const [search, setSearch] = useState('');
  const [detailId, setDetailId] = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  const {
    data: inquiries = [],
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useGetPartnerInquiriesQuery(filters);

  const [deleteInquiry, { isLoading: isDeleting }] = useDeletePartnerInquiryMutation();

  const visibleInquiries = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return inquiries;
    return inquiries.filter(
      (i) =>
        i.name.toLowerCase().includes(q) ||
        i.phoneNumber.toLowerCase().includes(q) ||
        (i.email ?? '').toLowerCase().includes(q),
    );
  }, [inquiries, search]);

  const updateFilter = <K extends keyof ListInquiriesArgs>(key: K, value: ListInquiriesArgs[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value || undefined, page: 1 }));
  };

  const clearFilters = () => {
    setFilters({ page: 1, size: 100 });
    setSearch('');
  };

  const handleDelete = async () => {
    if (confirmDeleteId == null) return;
    try {
      await deleteInquiry(confirmDeleteId).unwrap();
      toast.success('Inquiry deleted');
      if (detailId === confirmDeleteId) setDetailId(null);
      setConfirmDeleteId(null);
    } catch {
      toast.error('Failed to delete inquiry');
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Briefcase className="w-7 h-7 text-primary-600" />
            Partner Inquiries
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {isLoading
              ? 'Loading inquiries…'
              : `${visibleInquiries.length} of ${inquiries.length} inquiries shown`}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-md p-4 mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
        <div className="lg:col-span-2 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search name, phone, or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
          />
        </div>

        <select
          value={filters.status ?? ''}
          onChange={(e) => updateFilter('status', (e.target.value || undefined) as PartnerInquiryStatus | undefined)}
          className="px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm bg-white"
        >
          <option value="">All Statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL[s]}
            </option>
          ))}
        </select>

        <input
          type="text"
          placeholder="City"
          value={filters.city ?? ''}
          onChange={(e) => updateFilter('city', e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
        />

        <input
          type="date"
          value={filters.startDate ?? ''}
          onChange={(e) => updateFilter('startDate', e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
          title="From date"
        />

        <input
          type="date"
          value={filters.endDate ?? ''}
          onChange={(e) => updateFilter('endDate', e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
          title="To date"
        />

        {(filters.status || filters.city || filters.state || filters.startDate || filters.endDate || search) && (
          <button
            onClick={clearFilters}
            className="lg:col-span-6 text-sm text-primary-600 hover:underline self-start"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
        </div>
      ) : isError ? (
        <div className="bg-white rounded-xl shadow-md p-10 text-center">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
          <p className="text-gray-700 mb-4">Failed to load inquiries.</p>
          <button onClick={() => refetch()} className="text-primary-600 hover:underline">
            Try again
          </button>
        </div>
      ) : visibleInquiries.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-10 text-center text-gray-500">
          <Briefcase className="w-10 h-10 text-gray-400 mx-auto mb-3" />
          <p>No inquiries match the current filters.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-md overflow-hidden relative">
          {isFetching && (
            <div className="absolute top-2 right-3 text-xs text-gray-400 flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin" />
              refreshing…
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
                <tr>
                  <th className="px-5 py-3 text-left">Name</th>
                  <th className="px-5 py-3 text-left">Contact</th>
                  <th className="px-5 py-3 text-left">Location</th>
                  <th className="px-5 py-3 text-left">Investment</th>
                  <th className="px-5 py-3 text-left">Vehicles</th>
                  <th className="px-5 py-3 text-left">Status</th>
                  <th className="px-5 py-3 text-left">Submitted</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {visibleInquiries.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50 transition">
                    <td className="px-5 py-4 font-medium text-gray-900">{row.name}</td>
                    <td className="px-5 py-4 text-gray-700">
                      <p>{row.phoneNumber}</p>
                      {row.email && <p className="text-xs text-gray-500">{row.email}</p>}
                    </td>
                    <td className="px-5 py-4 text-gray-700">
                      <p>{row.city}</p>
                      <p className="text-xs text-gray-500">{row.state}</p>
                    </td>
                    <td className="px-5 py-4 text-gray-700">
                      {INVESTMENT_LABEL[row.investmentAmount]}
                    </td>
                    <td className="px-5 py-4 text-gray-700">
                      {row.ownsVehicles ? `Yes · ${row.vehicleCount ?? 0}` : 'No'}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${STATUS_BADGE[row.status]}`}
                      >
                        {STATUS_LABEL[row.status]}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-gray-500 text-xs">{formatDate(row.createdAt)}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setDetailId(row.id)}
                          className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition"
                          title="View details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(row.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail / Status Update Modal */}
      {detailId != null && (
        <InquiryDetailModal id={detailId} onClose={() => setDetailId(null)} />
      )}

      {/* Delete Confirmation */}
      {confirmDeleteId != null && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Delete inquiry?</h3>
            <p className="text-sm text-gray-600 mb-5">
              This will permanently remove the inquiry. This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 inline-flex items-center"
              >
                {isDeleting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PartnerInquiriesPage;

// ── Detail Modal ────────────────────────────────────────────────────────────

interface InquiryDetailModalProps {
  id: number;
  onClose: () => void;
}

const InquiryDetailModal: React.FC<InquiryDetailModalProps> = ({ id, onClose }) => {
  const { data: inquiry, isLoading, isError } = useGetPartnerInquiryByIdQuery(id);
  const [updateStatus, { isLoading: isSaving }] = useUpdatePartnerInquiryStatusMutation();

  const [status, setStatus] = useState<PartnerInquiryStatus | ''>('');
  const [notes, setNotes] = useState('');
  const [hydrated, setHydrated] = useState(false);

  // Hydrate the form once the inquiry loads
  if (inquiry && !hydrated) {
    setStatus(inquiry.status);
    setNotes(inquiry.notes ?? '');
    setHydrated(true);
  }

  const dirty =
    inquiry != null && (status !== inquiry.status || notes !== (inquiry.notes ?? ''));

  const handleSave = async () => {
    if (!status || !inquiry) return;
    try {
      // Spec: null = keep existing, "" = clear, string = set.
      // The textarea pre-fills with the existing notes, and dirty check below
      // blocks saves when nothing changed — so we always send the user's
      // current intent verbatim ("" meaning "clear" if they emptied it).
      await updateStatus({
        id: inquiry.id,
        status,
        notes,
      }).unwrap();
      toast.success('Inquiry updated');
      onClose();
    } catch (err: any) {
      const msg = err?.data?.error || err?.data?.message || 'Failed to update inquiry';
      toast.error(msg);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-2xl shadow-xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900">Inquiry Details</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
            </div>
          ) : isError || !inquiry ? (
            <div className="text-center py-10 text-red-600">Failed to load inquiry.</div>
          ) : (
            <>
              {/* Read-only summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <Detail label="Name" value={inquiry.name} />
                <Detail
                  label="Phone"
                  value={
                    <span className="inline-flex items-center gap-1.5">
                      <Phone className="w-4 h-4 text-gray-400" />
                      {inquiry.phoneNumber}
                    </span>
                  }
                />
                <Detail
                  label="Email"
                  value={
                    inquiry.email ? (
                      <span className="inline-flex items-center gap-1.5">
                        <Mail className="w-4 h-4 text-gray-400" />
                        {inquiry.email}
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )
                  }
                />
                <Detail
                  label="Location"
                  value={
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      {inquiry.city}, {inquiry.state}
                    </span>
                  }
                />
                <Detail
                  label="Investment"
                  value={
                    <span className="inline-flex items-center gap-1.5">
                      <IndianRupee className="w-4 h-4 text-gray-400" />
                      {INVESTMENT_LABEL[inquiry.investmentAmount]}
                    </span>
                  }
                />
                <Detail
                  label="Owns Vehicles"
                  value={
                    inquiry.ownsVehicles
                      ? `Yes (${inquiry.vehicleCount ?? 0})`
                      : 'No'
                  }
                />
                <Detail
                  label="Submitted"
                  value={
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      {formatDate(inquiry.createdAt)}
                    </span>
                  }
                />
                <Detail label="Last updated" value={formatDate(inquiry.updatedAt)} />
              </div>

              {/* Status update */}
              <div className="border-t border-gray-100 pt-5 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {STATUS_OPTIONS.map((s) => {
                      const active = status === s;
                      return (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setStatus(s)}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium transition border ${
                            active
                              ? `${STATUS_BADGE[s]} border-transparent ring-2 ring-offset-1 ring-primary-300`
                              : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          {STATUS_LABEL[s]}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                    Notes
                  </label>
                  <textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={4}
                    maxLength={2000}
                    placeholder="Internal notes (optional)…"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                  />
                  <p className="text-xs text-gray-400 mt-1">{notes.length}/2000</p>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="p-5 border-t border-gray-100 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Close
          </button>
          <button
            onClick={handleSave}
            disabled={!inquiry || !dirty || isSaving}
            className="px-4 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save changes
          </button>
        </div>
      </div>
    </div>
  );
};

const Detail: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div>
    <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
    <div className="mt-1 text-sm text-gray-900">{value}</div>
  </div>
);
