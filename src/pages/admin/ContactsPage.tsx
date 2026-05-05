import React, { useMemo, useState } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  AlertCircle,
  Search,
  X,
  Save,
  Phone,
  MapPin,
  Star,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  useGetAdminContactsQuery,
  useCreateContactMutation,
  useUpdateContactMutation,
  useDeleteContactMutation,
  type ContactDto,
  type CreateContactPayload,
} from '../../store/api/contactApi';
import { useGetCitiesQuery } from '../../store/api/cityApi';

// ── Form helpers ────────────────────────────────────────────────────────────

type FormState = {
  cityId: number | null;
  name: string;
  phoneNumber: string;
  email: string;
  address: string;
  isActive: boolean;
  isDefault: boolean;
};

const EMPTY_FORM: FormState = {
  cityId: null,
  name: '',
  phoneNumber: '',
  email: '',
  address: '',
  isActive: true,
  isDefault: false,
};

const PHONE_RE = /^\+?\d[\d\s\-]{8,18}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ── Page ────────────────────────────────────────────────────────────────────

const ContactsPage: React.FC = () => {
  const { data: contacts = [], isLoading, isError, refetch } = useGetAdminContactsQuery();
  const { data: cities = [] } = useGetCitiesQuery({ page: 1, size: 200 });
  const [createContact, { isLoading: isCreating }] = useCreateContactMutation();
  const [updateContact, { isLoading: isUpdating }] = useUpdateContactMutation();
  const [deleteContact, { isLoading: isDeleting }] = useDeleteContactMutation();

  const [search, setSearch] = useState('');
  const [cityFilter, setCityFilter] = useState<string>('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<ContactDto | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  const isSaving = isCreating || isUpdating;

  const cityNameById = useMemo(() => {
    const m = new Map<number, string>();
    cities.forEach((c: { id: number; name: string }) => m.set(c.id, c.name));
    return m;
  }, [cities]);

  // Cities that already have an active contact (excluding the row being edited)
  const occupiedCityIds = useMemo(() => {
    const s = new Set<number>();
    contacts.forEach((c) => {
      if (c.isActive && c.cityId != null && c.id !== editing?.id) s.add(c.cityId);
    });
    return s;
  }, [contacts, editing?.id]);

  // Is there already an active default (excluding the row being edited)?
  const hasActiveDefault = useMemo(
    () => contacts.some((c) => c.isActive && c.isDefault && c.id !== editing?.id),
    [contacts, editing?.id],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return contacts.filter((c) => {
      if (cityFilter === 'default' && !c.isDefault) return false;
      if (cityFilter && cityFilter !== 'default' && String(c.cityId) !== cityFilter) return false;
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        c.phoneNumber.toLowerCase().includes(q) ||
        (c.email ?? '').toLowerCase().includes(q)
      );
    });
  }, [contacts, search, cityFilter]);

  // ── Modal open / close ──────────────────────────────────────────────────

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setErrors({});
    setShowModal(true);
  };

  const openEdit = (row: ContactDto) => {
    setEditing(row);
    setForm({
      cityId: row.cityId,
      name: row.name,
      phoneNumber: row.phoneNumber,
      email: row.email ?? '',
      address: row.address ?? '',
      isActive: row.isActive,
      isDefault: row.isDefault,
    });
    setErrors({});
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditing(null);
    setForm(EMPTY_FORM);
    setErrors({});
  };

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  // ── Validation ──────────────────────────────────────────────────────────

  const validate = (): boolean => {
    const next: Partial<Record<keyof FormState, string>> = {};

    if (!form.name.trim()) next.name = 'Name is required';
    else if (form.name.trim().length > 200) next.name = 'Name must be 200 characters or fewer';

    if (!form.phoneNumber.trim()) next.phoneNumber = 'Phone number is required';
    else if (!PHONE_RE.test(form.phoneNumber.trim())) next.phoneNumber = 'Enter a valid phone number';

    if (form.email.trim() && !EMAIL_RE.test(form.email.trim())) {
      next.email = 'Enter a valid email address';
    }

    if (form.address.trim().length > 500) next.address = 'Address must be 500 characters or fewer';

    // Domain rules
    if (form.isDefault) {
      if (form.cityId != null) next.cityId = 'A default contact must NOT have a city';
    } else if (form.cityId == null) {
      next.cityId = 'Select a city or mark as default';
    }

    // Soft client-side conflict check (server still authoritative via 409)
    if (form.isActive) {
      if (form.isDefault && hasActiveDefault) {
        next.isDefault = 'An active default contact already exists';
      }
      if (!form.isDefault && form.cityId != null && occupiedCityIds.has(form.cityId)) {
        next.cityId = 'This city already has an active contact';
      }
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  // ── Submit ──────────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const payload: CreateContactPayload = {
      cityId: form.isDefault ? null : form.cityId,
      name: form.name.trim(),
      phoneNumber: form.phoneNumber.trim(),
      email: form.email.trim() || null,
      address: form.address.trim() || null,
      isActive: form.isActive,
      isDefault: form.isDefault,
    };

    try {
      if (editing) {
        await updateContact({ id: editing.id, body: payload }).unwrap();
        toast.success('Contact updated');
      } else {
        await createContact(payload).unwrap();
        toast.success('Contact created');
      }
      closeModal();
    } catch (err: any) {
      const status = err?.status;
      if (status === 409) {
        toast.error(err?.data?.error ?? 'An active contact already exists for this city or as default');
      } else if (status === 400 && err?.data?.errors) {
        const next: Partial<Record<keyof FormState, string>> = {};
        for (const [k, v] of Object.entries(err.data.errors as Record<string, string[]>)) {
          const key = (k.charAt(0).toLowerCase() + k.slice(1)) as keyof FormState;
          next[key] = Array.isArray(v) ? v[0] : String(v);
        }
        setErrors(next);
        toast.error('Please fix the highlighted fields');
      } else {
        toast.error(err?.data?.error ?? 'Failed to save contact');
      }
    }
  };

  const handleDelete = async () => {
    if (confirmDeleteId == null) return;
    try {
      await deleteContact(confirmDeleteId).unwrap();
      toast.success('Contact deleted');
      setConfirmDeleteId(null);
    } catch {
      toast.error('Failed to delete contact');
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Phone className="w-7 h-7 text-primary-600" />
            Contacts
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            One active contact per city, plus a single global default fallback.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add Contact
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-md p-4 mb-6 grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="md:col-span-2 relative">
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
          value={cityFilter}
          onChange={(e) => setCityFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm bg-white"
        >
          <option value="">All Cities</option>
          <option value="default">Default (Global)</option>
          {cities.map((c: { id: number; name: string }) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
        </div>
      ) : isError ? (
        <div className="bg-white rounded-xl shadow-md p-10 text-center">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
          <p className="text-gray-700 mb-4">Failed to load contacts.</p>
          <button onClick={() => refetch()} className="text-primary-600 hover:underline">
            Try again
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-10 text-center text-gray-500">
          <Phone className="w-10 h-10 text-gray-400 mx-auto mb-3" />
          <p>No contacts match the current filters.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
                <tr>
                  <th className="px-5 py-3 text-left">Name</th>
                  <th className="px-5 py-3 text-left">Phone</th>
                  <th className="px-5 py-3 text-left">City</th>
                  <th className="px-5 py-3 text-left">Email</th>
                  <th className="px-5 py-3 text-left">Default</th>
                  <th className="px-5 py-3 text-left">Active</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50 transition">
                    <td className="px-5 py-4 font-medium text-gray-900">{row.name}</td>
                    <td className="px-5 py-4 text-gray-700">
                      <a
                        href={`tel:${row.phoneNumber.replace(/[^\d+]/g, '')}`}
                        className="hover:text-primary-600 inline-flex items-center gap-1.5"
                      >
                        <Phone className="w-3.5 h-3.5 text-gray-400" />
                        {row.phoneNumber}
                      </a>
                    </td>
                    <td className="px-5 py-4 text-gray-700">
                      {row.cityId == null ? (
                        <span className="text-gray-400">—</span>
                      ) : (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-gray-400" />
                          {cityNameById.get(row.cityId) ?? `City #${row.cityId}`}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-gray-600 text-xs">
                      {row.email ?? <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-5 py-4">
                      {row.isDefault ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                          <Star className="w-3 h-3" />
                          Default
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      {row.isActive ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 text-xs font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-gray-400 text-xs font-medium">
                          <XCircle className="w-3.5 h-3.5" />
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(row)}
                          className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
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

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl shadow-xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">
                {editing ? 'Edit Contact' : 'Add Contact'}
              </h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto" noValidate>
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setField('name', e.target.value)}
                  maxLength={200}
                  className={`w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm ${errors.name ? 'border-red-400' : 'border-gray-300'}`}
                />
                {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name}</p>}
              </div>

              {/* Phone + Email */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={form.phoneNumber}
                    onChange={(e) => setField('phoneNumber', e.target.value)}
                    placeholder="+91 9876543210"
                    className={`w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm ${errors.phoneNumber ? 'border-red-400' : 'border-gray-300'}`}
                  />
                  {errors.phoneNumber && <p className="text-xs text-red-600 mt-1">{errors.phoneNumber}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Email <span className="text-gray-400 text-xs">(optional)</span>
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setField('email', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm ${errors.email ? 'border-red-400' : 'border-gray-300'}`}
                  />
                  {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email}</p>}
                </div>
              </div>

              {/* City + Default */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    City {!form.isDefault && <span className="text-red-500">*</span>}
                  </label>
                  <select
                    value={form.cityId ?? ''}
                    onChange={(e) =>
                      setField('cityId', e.target.value ? Number(e.target.value) : null)
                    }
                    disabled={form.isDefault}
                    className={`w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm bg-white disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed ${errors.cityId ? 'border-red-400' : 'border-gray-300'}`}
                  >
                    <option value="">Select a city</option>
                    {cities.map((c: { id: number; name: string }) => {
                      const isOccupied = form.isActive && occupiedCityIds.has(c.id) && c.id !== form.cityId;
                      return (
                        <option key={c.id} value={c.id} disabled={isOccupied}>
                          {c.name}
                          {isOccupied ? ' (already has a contact)' : ''}
                        </option>
                      );
                    })}
                  </select>
                  {errors.cityId && <p className="text-xs text-red-600 mt-1">{errors.cityId}</p>}
                  {form.isActive && form.cityId != null && occupiedCityIds.has(form.cityId) && !errors.cityId && (
                    <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      This city already has an active contact.
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-2 justify-end pb-1">
                  <label className="inline-flex items-center gap-2 cursor-pointer text-sm text-gray-800">
                    <input
                      type="checkbox"
                      checked={form.isDefault}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setForm((prev) => ({
                          ...prev,
                          isDefault: checked,
                          cityId: checked ? null : prev.cityId,
                        }));
                        if (errors.isDefault || errors.cityId) {
                          setErrors((prev) => ({ ...prev, isDefault: undefined, cityId: undefined }));
                        }
                      }}
                      className="w-4 h-4 accent-primary-500"
                    />
                    Default (global fallback)
                  </label>
                  <label className="inline-flex items-center gap-2 cursor-pointer text-sm text-gray-800">
                    <input
                      type="checkbox"
                      checked={form.isActive}
                      onChange={(e) => setField('isActive', e.target.checked)}
                      className="w-4 h-4 accent-primary-500"
                    />
                    Active
                  </label>
                  {errors.isDefault && <p className="text-xs text-red-600">{errors.isDefault}</p>}
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Address <span className="text-gray-400 text-xs">(optional)</span>
                </label>
                <textarea
                  value={form.address}
                  onChange={(e) => setField('address', e.target.value)}
                  rows={2}
                  maxLength={500}
                  className={`w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm ${errors.address ? 'border-red-400' : 'border-gray-300'}`}
                />
                {errors.address && <p className="text-xs text-red-600 mt-1">{errors.address}</p>}
              </div>

              <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 inline-flex items-center"
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  {editing ? 'Save changes' : 'Create contact'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {confirmDeleteId != null && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Delete contact?</h3>
            <p className="text-sm text-gray-600 mb-5">
              This will permanently remove the contact. This action cannot be undone.
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

export default ContactsPage;
