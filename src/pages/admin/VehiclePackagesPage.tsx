import React, { useState, useMemo, useEffect } from 'react';
import {
  Plus, Pencil, Trash2, Loader2, AlertCircle, Search, Package, X, Save, FileText, ChevronDown,
} from 'lucide-react';
import {
  useGetVehiclePackagesQuery,
  useCreateVehiclePackageMutation,
  useUpdateVehiclePackageMutation,
  useDeleteVehiclePackageMutation,
  useGetPackageUsageQuery,
  type VehiclePackageDto,
  type CreateVehiclePackageDto,
  DURATION_OPTIONS,
  calculateDurationPrice,
} from '../../store/api/vehiclePackageApi';
import { useGetAdminProfileQuery } from '../../store/api/adminApi';
import { useAppSelector } from '../../store/hooks';
import { handleNumberInputChange } from '../../utils/numberInput';
import { toast } from 'sonner';

interface PackageDraft {
  id: string;
  label: string;
  data: CreateVehiclePackageDto;
  savedAt: string;
}

const PACKAGE_DRAFTS_KEY = 'package_drafts';

const EMPTY_FORM: CreateVehiclePackageDto = {
  name: '',
  pricePerHour: 0,
  freeHoursPerDay: 6,
  selectedDurations: [],
  priceOverrides: {},
};

const VehiclePackagesPage: React.FC = () => {
  const adminUser = useAppSelector((state) => state.auth.user);
  const { data: adminProfile } = useGetAdminProfileQuery();
  const isSuperAdmin = adminUser?.userType === 'superadmin';
  const canManagePackages = isSuperAdmin || adminProfile?.canManagePackages;

  const { data: packages = [], isLoading, isError, refetch } = useGetVehiclePackagesQuery();
  const [createPackage, { isLoading: isCreating }] = useCreateVehiclePackageMutation();
  const [updatePackage, { isLoading: isUpdating }] = useUpdateVehiclePackageMutation();
  const [deletePackage] = useDeleteVehiclePackageMutation();

  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingPackage, setEditingPackage] = useState<VehiclePackageDto | null>(null);
  const [form, setForm] = useState<CreateVehiclePackageDto>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  // Draft state
  const [drafts, setDrafts] = useState<PackageDraft[]>([]);
  const [showDraftDropdown, setShowDraftDropdown] = useState(false);
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(null);
  const [originalDraftData, setOriginalDraftData] = useState<string | null>(null);

  const isSaving = isCreating || isUpdating;

  // Load drafts from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(PACKAGE_DRAFTS_KEY);
    if (stored) {
      try {
        setDrafts(JSON.parse(stored));
      } catch {
        setDrafts([]);
      }
    }
  }, []);

  // Package usage query for delete confirmation
  const { data: usageData } = useGetPackageUsageQuery(confirmDeleteId ?? 0, {
    skip: !confirmDeleteId,
  });

  // Calculate auto prices based on pricePerHour and freeHoursPerDay
  const calculatedPrices = useMemo(() => {
    const prices: Record<string, number> = {};
    DURATION_OPTIONS.forEach(opt => {
      prices[opt.hours.toString()] = calculateDurationPrice(opt.hours, form.pricePerHour, form.freeHoursPerDay);
    });
    return prices;
  }, [form.pricePerHour, form.freeHoursPerDay]);

  // Get effective price (override or calculated)
  const getEffectivePrice = (hours: number): number => {
    const override = form.priceOverrides?.[hours.toString()];
    if (override !== undefined && override !== null && override > 0) {
      return override;
    }
    return calculatedPrices[hours.toString()] || 0;
  };

  // Draft functions
  const saveDraft = (silent = false) => {
    const label = form.name || 'Untitled Package';
    const now = new Date().toISOString();

    let updated: PackageDraft[];
    if (currentDraftId) {
      // Update existing draft
      updated = drafts.map(d =>
        d.id === currentDraftId
          ? { ...d, label, data: form, savedAt: now }
          : d
      );
    } else {
      // Create new draft
      const newDraft: PackageDraft = { id: Date.now().toString(), label, data: form, savedAt: now };
      updated = [newDraft, ...drafts];
    }

    setDrafts(updated);
    localStorage.setItem(PACKAGE_DRAFTS_KEY, JSON.stringify(updated));
    if (!silent) {
      toast.success(currentDraftId ? 'Draft updated' : 'Saved as draft');
      setShowModal(false);
      setCurrentDraftId(null);
      setOriginalDraftData(null);
    }
  };

  const deleteDraft = (draftId: string) => {
    const updated = drafts.filter(d => d.id !== draftId);
    setDrafts(updated);
    localStorage.setItem(PACKAGE_DRAFTS_KEY, JSON.stringify(updated));
    toast.success('Draft deleted');
  };

  const deleteAllDrafts = () => {
    setDrafts([]);
    localStorage.removeItem(PACKAGE_DRAFTS_KEY);
    setShowDraftDropdown(false);
    toast.success('All drafts deleted');
  };

  const handleCloseModal = () => {
    // Auto-save draft if new package has any data
    if (!editingPackage && (form.name || form.pricePerHour > 0 || form.selectedDurations.length > 0)) {
      const currentData = JSON.stringify(form);
      // Only save if data changed from original (or no original = new draft)
      if (!originalDraftData || currentData !== originalDraftData) {
        saveDraft(true);
        toast.success(currentDraftId ? 'Draft updated' : 'Draft auto-saved');
      }
    }
    setShowModal(false);
    setCurrentDraftId(null);
    setOriginalDraftData(null);
  };

  const handleOpenAdd = (draft?: PackageDraft) => {
    if (!canManagePackages) {
      toast.error('You do not have permission to manage packages');
      return;
    }
    setEditingPackage(null);
    setFormError(null);
    if (draft) {
      setForm(draft.data);
      setCurrentDraftId(draft.id);
      setOriginalDraftData(JSON.stringify(draft.data));
    } else {
      setForm(EMPTY_FORM);
      setCurrentDraftId(null);
      setOriginalDraftData(null);
    }
    setShowDraftDropdown(false);
    setShowModal(true);
  };

  const handleOpenEdit = (pkg: VehiclePackageDto) => {
    if (!canManagePackages) {
      toast.error('You do not have permission to manage packages');
      return;
    }
    setEditingPackage(pkg);
    setFormError(null);
    setCurrentDraftId(null);
    setOriginalDraftData(null);
    setForm({
      name: pkg.name,
      pricePerHour: pkg.pricePerHour,
      freeHoursPerDay: pkg.freeHoursPerDay || 6,
      selectedDurations: [...pkg.selectedDurations],
      priceOverrides: { ...pkg.priceOverrides },
    });
    setShowModal(true);
  };

  const handleDurationToggle = (hours: number) => {
    setForm(prev => {
      const isSelected = prev.selectedDurations.includes(hours);
      let newDurations: number[];

      if (isSelected) {
        newDurations = prev.selectedDurations.filter(h => h !== hours);
      } else {
        newDurations = [...prev.selectedDurations, hours].sort((a, b) => a - b);
      }

      return { ...prev, selectedDurations: newDurations };
    });
  };

  const handlePriceOverrideChange = (hours: number, value: string) => {
    const numValue = parseFloat(value) || 0;
    setForm(prev => {
      const newOverrides = { ...prev.priceOverrides };
      if (numValue > 0) {
        newOverrides[hours.toString()] = numValue;
      } else {
        delete newOverrides[hours.toString()];
      }
      return { ...prev, priceOverrides: newOverrides };
    });
  };

  const clearOverride = (hours: number) => {
    setForm(prev => {
      const newOverrides = { ...prev.priceOverrides };
      delete newOverrides[hours.toString()];
      return { ...prev, priceOverrides: newOverrides };
    });
  };

  const handleSave = async () => {
    setFormError(null);

    if (!form.name.trim()) {
      toast.error('Package name is required');
      return;
    }
    if (form.pricePerHour <= 0) {
      toast.error('Price per hour must be greater than 0');
      return;
    }
    if (form.selectedDurations.length !== 4 && form.selectedDurations.length !== 6) {
      toast.error('You must select exactly 4 or 6 duration options');
      return;
    }

    // Clean up priceOverrides - remove empty/zero values
    const cleanOverrides: Record<string, number> = {};
    Object.entries(form.priceOverrides || {}).forEach(([key, val]) => {
      if (val && val > 0) {
        cleanOverrides[key] = val;
      }
    });

    const payload: CreateVehiclePackageDto = {
      name: form.name.trim(),
      pricePerHour: form.pricePerHour,
      freeHoursPerDay: form.freeHoursPerDay,
      selectedDurations: form.selectedDurations,
      priceOverrides: cleanOverrides,
    };

    try {
      if (editingPackage) {
        await updatePackage({ id: editingPackage.id, data: payload }).unwrap();
        toast.success('Package updated successfully');
      } else {
        await createPackage(payload).unwrap();
        toast.success('Package created successfully');
        // Delete draft if this was created from a draft
        if (currentDraftId) {
          const updatedDrafts = drafts.filter(d => d.id !== currentDraftId);
          setDrafts(updatedDrafts);
          localStorage.setItem(PACKAGE_DRAFTS_KEY, JSON.stringify(updatedDrafts));
          setCurrentDraftId(null);
          setOriginalDraftData(null);
        }
      }
      setShowModal(false);
      refetch();
    } catch (err: any) {
      setFormError(err?.data?.error ?? err?.data?.message ?? 'Failed to save package. Please try again.');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deletePackage(id).unwrap();
      toast.success('Package deleted');
      setConfirmDeleteId(null);
    } catch (err: any) {
      toast.error(err?.data?.error ?? 'Failed to delete package');
    }
  };

  const filtered = packages.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  // Format duration display
  const formatDuration = (hours: number): string => {
    const opt = DURATION_OPTIONS.find(o => o.hours === hours);
    return opt?.label ?? `${hours}h`;
  };

  // Note: All admins can VIEW packages, but only those with permission can create/edit/delete

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">Vehicle Packages</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {packages.length} package{packages.length !== 1 ? 's' : ''} total
          </p>
        </div>
        {canManagePackages && (
          <div className="flex items-center gap-2">
            {/* Drafts Dropdown */}
            {drafts.length > 0 && (
              <div className="relative">
                <button
                  onClick={() => setShowDraftDropdown(!showDraftDropdown)}
                  className="flex items-center gap-2 px-4 py-2 border border-amber-300 rounded-xl text-amber-700 hover:bg-amber-50 transition text-sm font-medium"
                >
                  <FileText className="w-4 h-4" />
                  Drafts ({drafts.length})
                  <ChevronDown className={`w-4 h-4 transition-transform ${showDraftDropdown ? 'rotate-180' : ''}`} />
                </button>
                {showDraftDropdown && (
                  <div className="absolute right-0 top-full mt-1 w-64 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
                    <div className="max-h-60 overflow-y-auto">
                      {drafts.map((draft) => (
                        <div key={draft.id} className="flex items-center justify-between px-3 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-b-0">
                          <button
                            onClick={() => { handleOpenAdd(draft); setShowDraftDropdown(false); }}
                            className="flex-1 text-left text-sm text-gray-700 truncate"
                          >
                            <span className="font-medium">{draft.label}</span>
                            <span className="text-xs text-gray-400 block">
                              {new Date(draft.savedAt).toLocaleDateString()}
                            </span>
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); deleteDraft(draft.id); }}
                            className="p-1 text-red-500 hover:bg-red-50 rounded"
                            title="Delete draft"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={deleteAllDrafts}
                      className="w-full px-3 py-2 text-xs text-red-600 hover:bg-red-50 border-t border-gray-200 font-medium"
                    >
                      Delete All Drafts
                    </button>
                  </div>
                )}
              </div>
            )}
            <button
              onClick={() => handleOpenAdd()}
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition"
            >
              <Plus className="w-4 h-4" />
              Add Package
            </button>
          </div>
        )}
      </div>

      {/* View-only notice for admins without permission */}
      {!canManagePackages && (
        <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
          <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
          <p className="text-sm text-amber-700">
            You can view packages but don't have permission to create, edit, or delete them.
          </p>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search packages..."
          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-400 focus:border-transparent outline-none transition"
        />
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
          <span className="ml-2 text-sm text-gray-500">Loading packages...</span>
        </div>
      )}

      {/* Error */}
      {isError && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700">Failed to load packages.</p>
          <button onClick={() => refetch()} className="ml-auto text-sm text-red-600 underline">Retry</button>
        </div>
      )}

      {/* Table */}
      {!isLoading && !isError && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                  <th className="px-4 py-3 text-left font-semibold">Name</th>
                  <th className="px-4 py-3 text-left font-semibold">Price/Hour</th>
                  <th className="px-4 py-3 text-left font-semibold">Durations</th>
                  <th className="px-4 py-3 text-left font-semibold">Created</th>
                  {canManagePackages && (
                    <th className="px-4 py-3 text-right font-semibold">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={canManagePackages ? 5 : 4} className="px-4 py-16 text-center">
                      <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500 font-medium">
                        {search ? 'No packages matching your search' : 'No packages yet'}
                      </p>
                      {!search && canManagePackages && (
                        <p className="text-gray-400 text-sm mt-1">
                          Click "Add Package" to create your first package
                        </p>
                      )}
                      {!search && !canManagePackages && (
                        <p className="text-gray-400 text-sm mt-1">
                          Contact a SuperAdmin to create packages
                        </p>
                      )}
                    </td>
                  </tr>
                ) : (
                  filtered.map((pkg) => (
                    <tr key={pkg.id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-purple-400 flex-shrink-0" />
                          <p className="font-semibold text-gray-800">{pkg.name}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-semibold text-purple-700">₹{pkg.pricePerHour}/hr</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {pkg.selectedDurations.map(h => (
                            <span
                              key={h}
                              className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs font-medium"
                            >
                              {formatDuration(h)}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {new Date(pkg.createdAt).toLocaleDateString('en-IN')}
                      </td>
                      {canManagePackages && (
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenEdit(pkg)}
                              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                              aria-label="Edit package"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(pkg.id)}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                              aria-label="Delete package"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800">
                {editingPackage ? 'Edit Package' : 'Create Package'}
              </h3>
              <button
                onClick={handleCloseModal}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {formError && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {formError}
                </div>
              )}

              {/* Package Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Package Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g., Budget Scooter, Premium Bike"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-400 focus:border-transparent outline-none transition"
                />
              </div>

              {/* Price Per Hour & Free Hours Per Day */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Price Per Hour (₹) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={form.pricePerHour || ''}
                    onChange={(e) => setForm({ ...form, pricePerHour: parseFloat(e.target.value) || 0 })}
                    placeholder="e.g., 50"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-400 focus:border-transparent outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Free Hours/Day
                    <span className="text-xs font-normal text-gray-500 ml-1">(24h+ discount)</span>
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={12}
                    value={form.freeHoursPerDay}
                    onChange={(e) => {
                      const val = handleNumberInputChange(e);
                      if (val !== null) {
                        setForm({ ...form, freeHoursPerDay: Math.min(12, Math.max(0, val)) });
                      }
                    }}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-400 focus:border-transparent outline-none transition"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Charged {24 - form.freeHoursPerDay}h/day for 24h+ bookings
                  </p>
                </div>
              </div>

              {/* Duration Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Select Durations <span className="text-red-500">*</span>
                  <span className="text-xs font-normal text-gray-500 ml-2">
                    (Select exactly 4 or 6 options)
                  </span>
                </label>
                <p className="text-xs text-gray-500 mb-3">
                  Currently selected: <span className={`font-semibold ${form.selectedDurations.length === 4 || form.selectedDurations.length === 6
                    ? 'text-green-600'
                    : 'text-orange-600'
                    }`}>{form.selectedDurations.length}</span>
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                  {DURATION_OPTIONS.map(opt => {
                    const isSelected = form.selectedDurations.includes(opt.hours);
                    return (
                      <button
                        key={opt.hours}
                        type="button"
                        onClick={() => handleDurationToggle(opt.hours)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium border transition ${isSelected
                          ? 'bg-purple-600 text-white border-purple-600'
                          : 'bg-white text-gray-700 border-gray-200 hover:border-purple-300'
                          }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Price Preview & Overrides */}
              {form.selectedDurations.length > 0 && form.pricePerHour > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Pricing Preview
                    <span className="text-xs font-normal text-gray-500 ml-2">
                      (Override auto-calculated prices if needed)
                    </span>
                  </label>
                  <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                    {form.selectedDurations.map(hours => {
                      const autoPrice = calculatedPrices[hours.toString()] || 0;
                      const override = form.priceOverrides?.[hours.toString()];
                      const hasOverride = override !== undefined && override !== null && override > 0;
                      const effectivePrice = getEffectivePrice(hours);

                      return (
                        <div key={hours} className="flex items-center gap-3">
                          <span className="w-24 text-sm font-medium text-gray-700">
                            {formatDuration(hours)}
                          </span>
                          <span className="text-sm text-gray-500 w-28">
                            Auto: ₹{autoPrice.toFixed(0)}
                          </span>
                          <div className="flex items-center gap-2 flex-1">
                            <input
                              type="text"
                              value={hasOverride ? override : ''}
                              onChange={(e) => handlePriceOverrideChange(hours, e.target.value)}
                              placeholder="Override"
                              className="w-28 px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-400 focus:border-transparent outline-none transition"
                            />
                            {hasOverride && (
                              <button
                                type="button"
                                onClick={() => clearOverride(hours)}
                                className="p-1 text-gray-400 hover:text-red-500 transition"
                                title="Clear override"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                          <span className={`text-sm font-semibold w-24 text-right ${hasOverride ? 'text-orange-600' : 'text-green-600'
                            }`}>
                            ₹{effectivePrice.toFixed(0)}
                            {hasOverride && <span className="text-xs ml-1">(custom)</span>}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
              {/* Left side - Draft button (only for new packages) */}
              <div>
                {!editingPackage && (
                  <button
                    onClick={() => saveDraft()}
                    className="flex items-center gap-2 px-4 py-2 border border-amber-300 rounded-lg text-amber-700 hover:bg-amber-50 transition text-sm font-medium"
                  >
                    <FileText className="w-4 h-4" />Save Draft
                  </button>
                )}
              </div>
              {/* Right side - Cancel and Save */}
              <div className="flex items-center gap-3">
                <button
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {editingPackage ? 'Update' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-red-100 rounded-full">
                  <Trash2 className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">Delete Package</h3>
                  <p className="text-sm text-gray-500">This action cannot be undone.</p>
                </div>
              </div>

              {usageData && usageData.vehicleCount > 0 ? (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                  <p className="text-sm text-yellow-700">
                    <strong>Cannot delete:</strong> This package is currently assigned to {usageData.vehicleCount} vehicle{usageData.vehicleCount > 1 ? 's' : ''}.
                    Please reassign those vehicles to a different package first.
                  </p>
                </div>
              ) : (
                <p className="text-sm text-gray-600">
                  Are you sure you want to delete this package? All pricing data will be lost.
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition"
              >
                Cancel
              </button>
              {(!usageData || usageData.vehicleCount === 0) && (
                <button
                  onClick={() => handleDelete(confirmDeleteId)}
                  className="flex items-center gap-2 px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold transition"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VehiclePackagesPage;
