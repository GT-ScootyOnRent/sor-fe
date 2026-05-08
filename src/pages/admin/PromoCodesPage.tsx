import React, { useState } from 'react';
import {
  Plus, Pencil, Trash2, ToggleLeft, ToggleRight,
  Loader2, AlertCircle, Search, Tag, X, Save,
} from 'lucide-react';
import {
  useGetPromoCodesQuery,
  useCreatePromoCodeMutation,
  useUpdatePromoCodeMutation,
  useDeletePromoCodeMutation,
  type PromoCodeDto,
} from '../../store/api/promoCodeApi';
import { useGetCitiesQuery } from '../../store/api/cityApi';
import { handleNumberInputChange, stripLeadingZeros } from '../../utils/numberInput';
import { useAppSelector } from '../../store/hooks';
import { toast } from 'sonner';

const EMPTY_FORM: Omit<PromoCodeDto, 'id' | 'usedCount' | 'createdAt' | 'updatedAt'> = {
  code: '',
  description: '',
  discountType: 'percentage',
  discountValue: 10,
  maxDiscountAmount: undefined,
  minOrderAmount: 0,
  maxUses: undefined,
  isFirstRideOnly: false,
  isActive: true,
  showOnHomepage: false,
  validFrom: new Date().toISOString().slice(0, 10),
  validUntil: undefined,
  cityId: null,
};

const PromoCodesPage: React.FC = () => {
  const adminUser = useAppSelector((state) => state.auth.user);
  const isSuperAdmin = adminUser?.userType === 'superadmin';

  const { data: promoCodes = [], isLoading, isError, refetch } = useGetPromoCodesQuery({});
  const { data: cities = [] } = useGetCitiesQuery({ page: 1, size: 100 });
  const [createPromoCode, { isLoading: isCreating }] = useCreatePromoCodeMutation();
  const [updatePromoCode, { isLoading: isUpdating }] = useUpdatePromoCodeMutation();
  const [deletePromoCode] = useDeletePromoCodeMutation();

  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingPromo, setEditingPromo] = useState<PromoCodeDto | null>(null);
  const [form, setForm] = useState<typeof EMPTY_FORM>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  const isSaving = isCreating || isUpdating;

  const getCityName = (id?: number | null) => {
    if (!id) return 'Global (All Cities)';
    return cities.find((d: any) => d.id === id)?.name ?? `City ${id}`;
  };

  const handleOpenAdd = () => {
    setEditingPromo(null);
    setFormError(null);
    setForm({
      ...EMPTY_FORM,
      // Pre-fill city for admin (they can only create for their own city)
      cityId: isSuperAdmin ? null : (adminUser?.cityId ?? null),
    });
    setShowModal(true);
  };

  const handleOpenEdit = (promo: PromoCodeDto) => {
    setEditingPromo(promo);
    setFormError(null);
    setForm({
      code: promo.code,
      description: promo.description ?? '',
      discountType: promo.discountType,
      discountValue: promo.discountValue,
      maxDiscountAmount: promo.maxDiscountAmount,
      minOrderAmount: promo.minOrderAmount,
      maxUses: promo.maxUses,
      isFirstRideOnly: promo.isFirstRideOnly,
      isActive: promo.isActive,
      showOnHomepage: promo.showOnHomepage ?? false,
      validFrom: promo.validFrom?.slice(0, 10) ?? '',
      validUntil: promo.validUntil?.slice(0, 10) || undefined,
      cityId: promo.cityId ?? null,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    setFormError(null);
    if (!form.code.trim()) { setFormError('Promo code is required'); return; }
    if (!form.discountValue || form.discountValue <= 0) { setFormError('Discount value must be greater than 0'); return; }
    if (form.discountType === 'percentage' && form.discountValue > 100) { setFormError('Percentage cannot exceed 100'); return; }
    if (!form.validFrom) { setFormError('Valid from date is required'); return; }

    // Prepare the payload - ensure validUntil is null if empty, not empty string
     const payload = {
      ...form,
      ...(form.validUntil ? { validUntil: form.validUntil } : {}),
    };

    try {
      if (editingPromo) {
        await updatePromoCode({ id: editingPromo.id, dto: { ...editingPromo, ...payload } as PromoCodeDto }).unwrap();
        toast.success('Promo code updated successfully');
      } else {
        await createPromoCode(payload).unwrap();
        toast.success('Promo code created successfully');
      }
      setShowModal(false);
      refetch();
    } catch (err: any) {
      setFormError(err?.data?.error ?? 'Failed to save promo code. Please try again.');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deletePromoCode(id).unwrap();
      toast.success('Promo code deleted');
      setConfirmDeleteId(null);
    } catch {
      toast.error('Failed to delete promo code');
    }
  };

  const handleToggleActive = async (promo: PromoCodeDto) => {
    try {
      await updatePromoCode({ id: promo.id, dto: { ...promo, isActive: !promo.isActive } }).unwrap();
      toast.success(`Promo code ${promo.isActive ? 'deactivated' : 'activated'}`);
      refetch();
    } catch {
      toast.error('Failed to update status');
    }
  };

  const filtered = promoCodes.filter((p) =>
    p.code.toLowerCase().includes(search.toLowerCase()) ||
    (p.description ?? '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">Promo Codes</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {promoCodes.length} promo code{promoCodes.length !== 1 ? 's' : ''} total
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition"
        >
          <Plus className="w-4 h-4" />
          Add Promo Code
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by code or description..."
          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-400 focus:border-transparent outline-none transition"
        />
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
          <span className="ml-2 text-sm text-gray-500">Loading promo codes...</span>
        </div>
      )}

      {/* Error */}
      {isError && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700">Failed to load promo codes.</p>
          <button onClick={refetch} className="ml-auto text-sm text-red-600 underline">Retry</button>
        </div>
      )}

      {/* Table */}
      {!isLoading && !isError && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                  <th className="px-4 py-3 text-left font-semibold">Code</th>
                  <th className="px-4 py-3 text-left font-semibold">Discount</th>
                  <th className="px-4 py-3 text-left font-semibold">City</th>
                  <th className="px-4 py-3 text-left font-semibold">Validity</th>
                  <th className="px-4 py-3 text-left font-semibold">Usage</th>
                  <th className="px-4 py-3 text-left font-semibold">Status</th>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-16 text-center">
                      <Tag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500 font-medium">
                        {search ? 'No promo codes matching your search' : 'No promo codes yet'}
                      </p>
                      {!search && (
                        <p className="text-gray-400 text-sm mt-1">
                          Click "Add Promo Code" to create your first promo code
                        </p>
                      )}
                    </td>
                  </tr>
                ) : (
                  filtered.map((promo) => (
                    <tr key={promo.id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Tag className="w-4 h-4 text-purple-400 flex-shrink-0" />
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-gray-800 tracking-wide">{promo.code}</p>
                              {promo.showOnHomepage && (
                                <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded text-xs font-medium">
                                  Homepage
                                </span>
                              )}
                            </div>
                            {promo.description && (
                              <p className="text-xs text-gray-400 mt-0.5">{promo.description}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-semibold text-purple-700">
                          {promo.discountType === 'percentage'
                            ? `${promo.discountValue}%`
                            : `₹${promo.discountValue}`}
                        </span>
                        {promo.maxDiscountAmount && (
                          <p className="text-xs text-gray-400">max ₹{promo.maxDiscountAmount}</p>
                        )}
                        {promo.minOrderAmount > 0 && (
                          <p className="text-xs text-gray-400">min ₹{promo.minOrderAmount}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-600 text-xs">
                        {promo.cityId ? (
                          <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full font-medium">
                            {getCityName(promo.cityId)}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-green-50 text-green-700 rounded-full font-medium">
                            Global
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        <p>From: {new Date(promo.validFrom).toLocaleDateString('en-IN')}</p>
                        {promo.validUntil && (
                          <p>Until: {new Date(promo.validUntil).toLocaleDateString('en-IN')}</p>
                        )}
                        {promo.isFirstRideOnly && (
                          <span className="px-1.5 py-0.5 bg-orange-50 text-orange-600 rounded text-xs font-medium">
                            First ride only
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {promo.usedCount}{promo.maxUses ? `/${promo.maxUses}` : ''} uses
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleToggleActive(promo)}
                          className="flex items-center gap-1.5 text-xs font-medium transition"
                          aria-label={promo.isActive ? 'Deactivate' : 'Activate'}
                        >
                          {promo.isActive ? (
                            <><ToggleRight className="w-5 h-5 text-green-500" /><span className="text-green-600">Active</span></>
                          ) : (
                            <><ToggleLeft className="w-5 h-5 text-gray-400" /><span className="text-gray-400">Inactive</span></>
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenEdit(promo)}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            aria-label="Edit promo"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          {isSuperAdmin && (
                            confirmDeleteId === promo.id ? (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleDelete(promo.id)}
                                  className="px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700 transition"
                                >
                                  Confirm
                                </button>
                                <button
                                  onClick={() => setConfirmDeleteId(null)}
                                  className="px-2 py-1 bg-gray-200 text-gray-600 rounded text-xs hover:bg-gray-300 transition"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setConfirmDeleteId(promo.id)}
                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                                aria-label="Delete promo"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h2 className="text-lg font-semibold text-gray-800">
                {editingPromo ? 'Edit Promo Code' : 'Add Promo Code'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5">
              {formError && (
                <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-xl">
                  <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-700">{formError}</p>
                </div>
              )}

              {/* Code */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Promo Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  placeholder="e.g. SAVE20"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-purple-400 focus:border-transparent outline-none transition font-mono tracking-widest uppercase"
                  disabled={!!editingPromo} // code cannot be changed after creation
                />
                {editingPromo && (
                  <p className="text-xs text-gray-400 mt-1">Promo code cannot be changed after creation.</p>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
                <input
                  type="text"
                  value={form.description ?? ''}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="e.g. 20% off for new customers"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-purple-400 focus:border-transparent outline-none transition"
                />
              </div>

              {/* Discount Type + Value */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Discount Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.discountType}
                    onChange={(e) => setForm({ ...form, discountType: e.target.value as 'percentage' | 'flat' })}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-purple-400 outline-none transition bg-white"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="flat">Flat Amount (₹)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Discount Value <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={form.discountValue}
                    onChange={(e) => {
                      const next = handleNumberInputChange(e);
                      if (next !== null) setForm({ ...form, discountValue: next });
                    }}
                    placeholder={form.discountType === 'percentage' ? '10' : '50'}
                    min={0}
                    max={form.discountType === 'percentage' ? 100 : undefined}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-purple-400 outline-none transition"
                  />
                </div>
              </div>

              {/* Max Discount + Min Order */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Max Discount (₹)
                    <span className="text-gray-400 font-normal ml-1">optional</span>
                  </label>
                  <input
                    type="number"
                    value={form.maxDiscountAmount ?? ''}
                    onChange={(e) => {
                      // Optional field — empty stays undefined
                      const stripped = stripLeadingZeros(e.target.value);
                      if (stripped !== e.target.value) e.target.value = stripped;
                      setForm({
                        ...form,
                        maxDiscountAmount: stripped === '' ? undefined : Number(stripped),
                      });
                    }}
                    placeholder="e.g. 200"
                    min={0}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-purple-400 outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Min Order Amount (₹)</label>
                  <input
                    type="number"
                    value={form.minOrderAmount}
                    onChange={(e) => {
                      const next = handleNumberInputChange(e);
                      if (next !== null) setForm({ ...form, minOrderAmount: next });
                    }}
                    placeholder="0"
                    min={0}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-purple-400 outline-none transition"
                  />
                </div>
              </div>

              {/* Max Uses */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Max Uses
                  <span className="text-gray-400 font-normal ml-1">optional — leave blank for unlimited</span>
                </label>
                <input
                  type="number"
                  value={form.maxUses ?? ''}
                  onChange={(e) => {
                    // Optional field — empty stays undefined (= "unlimited")
                    const stripped = stripLeadingZeros(e.target.value);
                    if (stripped !== e.target.value) e.target.value = stripped;
                    setForm({
                      ...form,
                      maxUses: stripped === '' ? undefined : Number(stripped),
                    });
                  }}
                  placeholder="Unlimited"
                  min={1}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-purple-400 outline-none transition"
                />
              </div>

              {/* Valid From + Valid Until */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Valid From <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={form.validFrom?.slice(0, 10) ?? ''}
                    onChange={(e) => setForm({ ...form, validFrom: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-purple-400 outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Valid Until
                    <span className="text-gray-400 font-normal ml-1">optional</span>
                  </label>
                  <input
                    type="date"
                    value={form.validUntil?.slice(0, 10) ?? ''}
                    onChange={(e) => setForm({ ...form, validUntil: e.target.value || undefined })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-purple-400 outline-none transition"
                  />
                </div>
              </div>

              {/* City — only superadmin can choose */}
              {isSuperAdmin ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">City Scope</label>
                  <select
                    value={form.cityId ?? ''}
                    onChange={(e) => setForm({ ...form, cityId: e.target.value ? Number(e.target.value) : null })}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-purple-400 outline-none transition bg-white"
                  >
                    <option value="">Global (all cities)</option>
                    {cities.map((d: any) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-400 mt-1">
                    Global promos apply to all cities. City-specific promos apply only to that city's bookings.
                  </p>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">City</label>
                  <div className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-600">
                    {getCityName(adminUser?.cityId)}
                    <p className="text-xs text-gray-400 mt-0.5">
                      Promo codes you create are automatically scoped to your city.
                    </p>
                  </div>
                </div>
              )}

              {/* Toggles */}
              <div className="flex flex-col gap-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <div
                    onClick={() => setForm({ ...form, isActive: !form.isActive })}
                    className={`relative w-11 h-6 rounded-full transition-colors ${form.isActive ? 'bg-green-500' : 'bg-gray-300'}`}
                  >
                    <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.isActive ? 'translate-x-5' : 'translate-x-0'}`} />
                  </div>
                  <span className="text-sm text-gray-700">
                    {form.isActive ? 'Active — customers can apply this code' : 'Inactive — code is disabled'}
                  </span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <div
                    onClick={() => setForm({ ...form, isFirstRideOnly: !form.isFirstRideOnly })}
                    className={`relative w-11 h-6 rounded-full transition-colors ${form.isFirstRideOnly ? 'bg-orange-400' : 'bg-gray-300'}`}
                  >
                    <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.isFirstRideOnly ? 'translate-x-5' : 'translate-x-0'}`} />
                  </div>
                  <span className="text-sm text-gray-700">First ride only</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <div
                    onClick={() => setForm({ ...form, showOnHomepage: !form.showOnHomepage })}
                    className={`relative w-11 h-6 rounded-full transition-colors ${form.showOnHomepage ? 'bg-amber-500' : 'bg-gray-300'}`}
                  >
                    <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.showOnHomepage ? 'translate-x-5' : 'translate-x-0'}`} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm text-gray-700">Show on Homepage</span>
                    <span className="text-xs text-gray-400">Display this coupon in city selector banner (only one can be active)</span>
                  </div>
                </label>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-3 px-6 pb-6 sticky bottom-0 bg-white border-t border-gray-100 pt-4">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2 px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {isSaving ? 'Saving...' : editingPromo ? 'Save Changes' : 'Create Promo Code'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PromoCodesPage;