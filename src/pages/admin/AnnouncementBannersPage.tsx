import React, { useState } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  AlertCircle,
  X,
  Save,
  ArrowUp,
  ArrowDown,
  CheckCircle2,
  XCircle,
  Globe,
  Megaphone,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  useGetAdminAnnouncementBannersQuery,
  useCreateAnnouncementBannerMutation,
  useUpdateAnnouncementBannerMutation,
  useReorderAnnouncementBannerMutation,
  useDeleteAnnouncementBannerMutation,
  type AnnouncementBanner,
} from '../../store/api/announcementBannerApi';
import { useGetCitiesQuery } from '../../store/api/cityApi';
import { useGetAdminProfileQuery } from '../../store/api/adminApi';

// ── Types ────────────────────────────────────────────────────────────────────

type FormState = {
  text: string;
  displayOrder: number;
  isActive: boolean;
  cityIds: number[];
  useAllCitiesMode: boolean;
};

const EMPTY_FORM: FormState = {
  text: '',
  displayOrder: 1,
  isActive: true,
  cityIds: [],
  useAllCitiesMode: true,
};

const MAX_TEXT_LENGTH = 200;

// ── Component ────────────────────────────────────────────────────────────────

export default function AnnouncementBannersPage() {
  const { data: banners, isLoading, error, refetch } = useGetAdminAnnouncementBannersQuery();
  const { data: allCities = [], isLoading: citiesLoading } = useGetCitiesQuery({ page: 1, size: 100 });
  const { data: adminProfile } = useGetAdminProfileQuery();

  const [createBanner, { isLoading: creating }] = useCreateAnnouncementBannerMutation();
  const [updateBanner, { isLoading: updating }] = useUpdateAnnouncementBannerMutation();
  const [reorderBanner] = useReorderAnnouncementBannerMutation();
  const [deleteBanner, { isLoading: deleting }] = useDeleteAnnouncementBannerMutation();

  const [showModal, setShowModal] = useState(false);
  const [editingBanner, setEditingBanner] = useState<AnnouncementBanner | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  const isSuperAdmin = adminProfile?.role === 2;
  const adminCityIds = adminProfile?.cityIds ?? [];
  const canManageAnnouncements = isSuperAdmin || adminProfile?.canManageAnnouncements;

  // Get available cities for selection (super admin sees all, admin sees only assigned)
  const availableCities = isSuperAdmin
    ? allCities
    : allCities.filter((c) => adminCityIds.includes(c.id));

  const openCreateModal = () => {
    setEditingBanner(null);
    const nextOrder = (banners?.length ?? 0) + 1;
    // Default to "All" mode, which will be global for SuperAdmin or all assigned cities for Admin
    setForm({ ...EMPTY_FORM, displayOrder: nextOrder, useAllCitiesMode: true, cityIds: [] });
    setShowModal(true);
  };

  const openEditModal = (banner: AnnouncementBanner) => {
    setEditingBanner(banner);
    // Determine if this was saved in "All" mode:
    // - SuperAdmin: cityIds = [] means global
    // - Admin: cityIds = [] OR cityIds contains all their cities = "All My Cities"
    const isAllMode = isSuperAdmin
      ? banner.cityIds.length === 0
      : banner.cityIds.length === 0 || (banner.cityIds.length === availableCities.length && availableCities.every(c => banner.cityIds.includes(c.id)));

    setForm({
      text: banner.text,
      displayOrder: banner.displayOrder,
      isActive: banner.isActive,
      cityIds: isAllMode ? [] : banner.cityIds,
      useAllCitiesMode: isAllMode,
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingBanner(null);
    setForm(EMPTY_FORM);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.text.trim()) {
      toast.error('Announcement text is required');
      return;
    }

    if (form.text.length > MAX_TEXT_LENGTH) {
      toast.error(`Text cannot exceed ${MAX_TEXT_LENGTH} characters`);
      return;
    }

    // Determine final cityIds to send:
    // - SuperAdmin with "All" mode: send [] for global
    // - Admin with "All My Cities" mode: send all their assigned cityIds
    // - Specific cities selected: send those cityIds
    let finalCityIds: number[];
    if (form.useAllCitiesMode) {
      if (isSuperAdmin) {
        finalCityIds = []; // Global announcement
      } else {
        finalCityIds = adminCityIds; // All admin's assigned cities
      }
    } else {
      finalCityIds = form.cityIds;
    }

    // Validate admin has at least one city selected
    if (!isSuperAdmin && finalCityIds.length === 0) {
      toast.error('Please select at least one city');
      return;
    }

    const payload = {
      text: form.text.trim(),
      displayOrder: form.displayOrder,
      isActive: form.isActive,
      cityIds: finalCityIds,
    };

    try {
      if (editingBanner) {
        await updateBanner({ id: editingBanner.id, body: payload }).unwrap();
        toast.success('Announcement updated');
      } else {
        await createBanner(payload).unwrap();
        toast.success('Announcement created');
      }
      closeModal();
    } catch (err: any) {
      toast.error(err?.data?.error || 'Failed to save announcement');
    }
  };

  const handleReorder = async (id: number, direction: 'up' | 'down') => {
    if (!banners) return;
    const idx = banners.findIndex((b) => b.id === id);
    if (idx === -1) return;
    const newOrder = direction === 'up' ? idx : idx + 2;
    try {
      await reorderBanner({ id, displayOrder: newOrder }).unwrap();
      refetch();
    } catch {
      toast.error('Failed to reorder');
    }
  };

  const handleDelete = async () => {
    if (deleteConfirmId === null) return;
    try {
      await deleteBanner(deleteConfirmId).unwrap();
      toast.success('Announcement deleted');
      setDeleteConfirmId(null);
    } catch {
      toast.error('Failed to delete announcement');
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-red-600">
        <AlertCircle className="w-12 h-12 mb-2" />
        <p>Failed to load announcements</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Megaphone className="w-8 h-8 text-primary-600" />
          <h1 className="text-2xl font-bold text-gray-800">Announcement Banners</h1>
        </div>
        {canManageAnnouncements && (
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Announcement
          </button>
        )}
      </div>

      {/* Info Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <p className="text-sm text-blue-800">
          Announcements appear as a scrolling marquee banner below the header.
          Active announcements for the selected city (or global) will rotate together.
          {!isSuperAdmin && canManageAnnouncements && (
            <span className="block mt-1 font-medium">
              You can only create announcements for your assigned cities.
            </span>
          )}
        </p>
      </div>

      {/* No Permission Banner */}
      {!canManageAnnouncements && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-amber-800 font-medium">
            You have view-only access to announcements. Contact a SuperAdmin if you need permission to create or edit announcements.
          </p>
        </div>
      )}

      {/* Banners List */}
      {!banners || banners.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <Megaphone className="w-12 h-12 mx-auto text-gray-400 mb-3" />
          <p className="text-gray-500">No announcements yet</p>
          {canManageAnnouncements && (
            <button
              onClick={openCreateModal}
              className="mt-4 text-primary-600 hover:underline font-medium"
            >
              Create your first announcement
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {banners.map((banner, idx) => (
            <div
              key={banner.id}
              className={`bg-white border rounded-lg p-4 shadow-sm ${!banner.isActive ? 'opacity-60' : ''
                }`}
            >
              <div className="flex items-start gap-4">
                {/* Reorder Buttons */}
                {canManageAnnouncements && (
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => handleReorder(banner.id, 'up')}
                      disabled={idx === 0}
                      className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleReorder(banner.id, 'down')}
                      disabled={idx === banners.length - 1}
                      className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-gray-800 font-medium mb-2 line-clamp-2">{banner.text}</p>
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    {/* Status Badge */}
                    {banner.isActive ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs">
                        <CheckCircle2 className="w-3 h-3" />
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">
                        <XCircle className="w-3 h-3" />
                        Inactive
                      </span>
                    )}

                    {/* Cities Badge */}
                    {banner.cityIds.length === 0 ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs">
                        <Globe className="w-3 h-3" />
                        All Cities
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs">
                        {banner.cityNames.join(', ')}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                {canManageAnnouncements && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEditModal(banner)}
                      className="p-2 text-gray-500 hover:text-primary-600 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Pencil className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(banner.id)}
                      className="p-2 text-gray-500 hover:text-red-600 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold">
                {editingBanner ? 'Edit Announcement' : 'New Announcement'}
              </h2>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Text Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Announcement Text *
                </label>
                <textarea
                  value={form.text}
                  onChange={(e) => setForm({ ...form, text: e.target.value })}
                  placeholder="Enter your announcement message..."
                  rows={3}
                  maxLength={MAX_TEXT_LENGTH}
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                />
                <p className="text-xs text-gray-500 mt-1 text-right">
                  {form.text.length}/{MAX_TEXT_LENGTH}
                </p>
              </div>

              {/* Display Order */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Display Order
                </label>
                <input
                  type="number"
                  value={form.displayOrder}
                  onChange={(e) =>
                    setForm({ ...form, displayOrder: parseInt(e.target.value) || 1 })
                  }
                  min={1}
                  className="w-24 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              {/* Active Toggle */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  className="w-5 h-5 rounded text-primary-600 focus:ring-primary-500"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                  Active (visible on website)
                </label>
              </div>

              {/* City Selection - Multi-select checkboxes (same as Hero Banners) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target Cities
                </label>
                <div className="border border-gray-300 rounded-lg p-3 max-h-48 overflow-y-auto space-y-2">
                  {citiesLoading ? (
                    <div className="flex items-center gap-2 text-gray-500 text-sm p-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Loading cities...
                    </div>
                  ) : availableCities.length === 0 ? (
                    <div className="text-gray-500 text-sm p-2">
                      No cities available
                    </div>
                  ) : (
                    <>
                      {/* "All" option - SuperAdmin: All Cities (Global), Admin: All My Cities */}
                      {(isSuperAdmin || availableCities.length > 1) && (
                        <label className="flex items-center gap-2 p-2 rounded hover:bg-gray-50 cursor-pointer border-b border-gray-100 pb-2 mb-1">
                          <input
                            type="checkbox"
                            checked={form.useAllCitiesMode}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setForm((f) => ({ ...f, useAllCitiesMode: true, cityIds: [] }));
                              }
                            }}
                            className="w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                          />
                          <Globe className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-700 font-medium">
                            {isSuperAdmin ? 'All Cities (Global)' : 'All My Cities'}
                          </span>
                        </label>
                      )}
                      {/* Individual city checkboxes */}
                      {availableCities.map((city) => {
                        const isOnlyCity = !isSuperAdmin && availableCities.length === 1;

                        return (
                          <label
                            key={city.id}
                            className={`flex items-center gap-2 p-2 rounded hover:bg-gray-50 ${isOnlyCity ? 'cursor-default' : 'cursor-pointer'}`}
                          >
                            <input
                              type="checkbox"
                              checked={isOnlyCity || (!form.useAllCitiesMode && form.cityIds.includes(city.id))}
                              disabled={isOnlyCity}
                              onChange={(e) => {
                                if (isOnlyCity) return;

                                setForm((f) => {
                                  if (e.target.checked) {
                                    // Checking a city - turn off "All" mode, add to selection
                                    return {
                                      ...f,
                                      useAllCitiesMode: false,
                                      cityIds: [...f.cityIds, city.id],
                                    };
                                  } else {
                                    // Unchecking a city
                                    const newCityIds = f.cityIds.filter((id) => id !== city.id);
                                    // If no cities left, revert to "All" mode
                                    if (newCityIds.length === 0) {
                                      return { ...f, useAllCitiesMode: true, cityIds: [] };
                                    }
                                    return { ...f, cityIds: newCityIds };
                                  }
                                });
                              }}
                              className="w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500 disabled:opacity-60"
                            />
                            <span className={`text-sm ${isOnlyCity ? 'text-gray-500' : 'text-gray-700'}`}>{city.name}</span>
                          </label>
                        );
                      })}
                    </>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {isSuperAdmin
                    ? 'Select "All Cities" for a global announcement, or pick specific cities.'
                    : availableCities.length === 1
                      ? 'This announcement will be shown in your assigned city.'
                      : 'Select "All My Cities" or pick specific cities from your assigned locations.'}
                </p>
                {/* Show selected city tags only when specific cities are selected (not "All" mode) */}
                {!form.useAllCitiesMode && form.cityIds.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {form.cityIds.map((id) => {
                      const city = availableCities.find((c) => c.id === id);
                      return (
                        <span
                          key={id}
                          className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-primary-50 text-primary-700"
                        >
                          {city?.name ?? `City #${id}`}
                          <button
                            type="button"
                            onClick={() => {
                              setForm((f) => {
                                const newCityIds = f.cityIds.filter((cid) => cid !== id);
                                // If no cities left, revert to "All" mode
                                if (newCityIds.length === 0) {
                                  return { ...f, useAllCitiesMode: true, cityIds: [] };
                                }
                                return { ...f, cityIds: newCityIds };
                              });
                            }}
                            className="hover:text-primary-900"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Submit */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating || updating}
                  className="flex items-center gap-2 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
                >
                  {(creating || updating) && <Loader2 className="w-4 h-4 animate-spin" />}
                  <Save className="w-4 h-4" />
                  {editingBanner ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {deleteConfirmId !== null && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Delete announcement?</h3>
                <p className="text-sm text-gray-600 mt-1">
                  This will remove the announcement from the website immediately. This action cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                disabled={deleting}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium disabled:opacity-50"
              >
                {deleting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
