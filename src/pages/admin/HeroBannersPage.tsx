import React, { useEffect, useMemo, useState } from 'react';
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
  Image as ImageIcon,
  CheckCircle2,
  XCircle,
  Eye,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  useGetAdminHeroBannersQuery,
  useCreateHeroBannerMutation,
  useUpdateHeroBannerMutation,
  useReorderHeroBannerMutation,
  useDeleteHeroBannerMutation,
  type HeroBanner,
} from '../../store/api/heroBannerApi';

// ── Form state ──────────────────────────────────────────────────────────────

type FormState = {
  file: File | null;
  displayOrder: number;
  durationSec: number; // Seconds in the UI; converted to ms on submit
  title: string;
  subtitle: string;
  isActive: boolean;
};

const EMPTY_FORM: FormState = {
  file: null,
  displayOrder: 1,
  durationSec: 5,
  title: '',
  subtitle: '',
  isActive: true,
};

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_FILE_BYTES = 10 * 1024 * 1024;

// ── Slide preview (mirrors HeroSlideshow rendering) ─────────────────────────

interface SlidePreviewProps {
  imageUrl: string | null;
  title: string;
  subtitle: string;
}

const SlidePreview: React.FC<SlidePreviewProps> = ({ imageUrl, title, subtitle }) => {
  const hasText = !!(title || subtitle);
  return (
    <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-gray-200 border border-gray-300 shadow-sm">
      {imageUrl ? (
        <img src={imageUrl} alt="Preview" className="absolute inset-0 w-full h-full object-cover" />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
          <ImageIcon className="w-12 h-12 mb-2" />
          <p className="text-sm">Upload an image to preview</p>
        </div>
      )}

      {hasText && imageUrl && (
        <>
          <div className="absolute inset-0 bg-black/35" />
          <div className="absolute inset-0 flex items-center justify-center px-4 text-center">
            <div className="max-w-xl">
              {title && (
                <h2 className="text-xl md:text-3xl font-bold text-white mb-1.5 leading-tight drop-shadow-lg">
                  {title}
                </h2>
              )}
              {subtitle && (
                <p className="text-xs md:text-base text-white/95 drop-shadow-md">{subtitle}</p>
              )}
            </div>
          </div>
        </>
      )}

      {/* Fake search bar overlap to show how user side will look */}
      <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-[80%] h-6 rounded-full bg-white/95 shadow-md border border-gray-200 flex items-center justify-center text-[10px] text-gray-400">
        ⤷ Search bar overlaps here
      </div>
    </div>
  );
};

// ── Page ────────────────────────────────────────────────────────────────────

const HeroBannersPage: React.FC = () => {
  const { data: banners = [], isLoading, isError, refetch } = useGetAdminHeroBannersQuery();
  const [createBanner, { isLoading: isCreating }] = useCreateHeroBannerMutation();
  const [updateBanner, { isLoading: isUpdating }] = useUpdateHeroBannerMutation();
  const [reorderBanner] = useReorderHeroBannerMutation();
  const [deleteBanner, { isLoading: isDeleting }] = useDeleteHeroBannerMutation();

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<HeroBanner | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [reorderingId, setReorderingId] = useState<number | null>(null);

  const isSaving = isCreating || isUpdating;

  // Sort banners by displayOrder for reliable up/down behavior
  const sortedBanners = useMemo(
    () => [...banners].sort((a, b) => a.displayOrder - b.displayOrder),
    [banners]
  );

  // ── Modal lifecycle ──────────────────────────────────────────────────────

  const openCreate = () => {
    setEditing(null);
    setForm({
      ...EMPTY_FORM,
      // Suggest the next displayOrder based on existing banners
      displayOrder: (sortedBanners[sortedBanners.length - 1]?.displayOrder ?? 0) + 1,
    });
    setPreviewUrl(null);
    setErrors({});
    setShowModal(true);
  };

  const openEdit = (banner: HeroBanner) => {
    setEditing(banner);
    setForm({
      file: null,
      displayOrder: banner.displayOrder,
      durationSec: Math.round(banner.durationMs / 1000),
      title: banner.title ?? '',
      subtitle: banner.subtitle ?? '',
      isActive: banner.isActive,
    });
    setPreviewUrl(banner.imageUrl); // Existing image as initial preview
    setErrors({});
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditing(null);
    setForm(EMPTY_FORM);
    if (previewUrl && previewUrl.startsWith('blob:')) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setErrors({});
  };

  // Clean up blob URLs when component unmounts or preview changes
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) URL.revokeObjectURL(previewUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── File handling ────────────────────────────────────────────────────────

  const handleFileChange = (file: File | null) => {
    if (!file) {
      setForm((f) => ({ ...f, file: null }));
      setPreviewUrl(editing?.imageUrl ?? null);
      setErrors((e) => ({ ...e, file: undefined }));
      return;
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      setErrors((e) => ({ ...e, file: 'Only JPEG, PNG, GIF, and WebP are allowed' }));
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setErrors((e) => ({ ...e, file: 'Image exceeds 10 MB size limit' }));
      return;
    }

    if (previewUrl && previewUrl.startsWith('blob:')) URL.revokeObjectURL(previewUrl);
    const blobUrl = URL.createObjectURL(file);
    setForm((f) => ({ ...f, file }));
    setPreviewUrl(blobUrl);
    setErrors((e) => ({ ...e, file: undefined }));
  };

  // ── Validation ───────────────────────────────────────────────────────────

  const validate = (): boolean => {
    const next: Partial<Record<keyof FormState, string>> = {};
    if (!editing && !form.file) next.file = 'Image is required';
    if (form.durationSec < 1 || form.durationSec > 60) {
      next.durationSec = 'Duration must be between 1 and 60 seconds';
    }
    if (form.displayOrder < 0) next.displayOrder = 'Display order must be ≥ 0';
    if (form.title.length > 200) next.title = 'Title must be ≤ 200 characters';
    if (form.subtitle.length > 500) next.subtitle = 'Subtitle must be ≤ 500 characters';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  // ── Submit ───────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (!validate()) return;

    const fd = new FormData();
    if (form.file) fd.append('file', form.file);
    fd.append('displayOrder', String(form.displayOrder));
    fd.append('durationMs', String(form.durationSec * 1000));
    fd.append('title', form.title);
    fd.append('subtitle', form.subtitle);
    fd.append('isActive', String(form.isActive));

    try {
      if (editing) {
        await updateBanner({ id: editing.id, formData: fd }).unwrap();
        toast.success('Banner updated');
      } else {
        await createBanner(fd).unwrap();
        toast.success('Banner created');
      }
      closeModal();
    } catch (err: any) {
      const msg =
        err?.data?.error ??
        err?.data?.errors?.[0]?.message ??
        'Failed to save banner';
      toast.error(msg);
    }
  };

  // ── Reorder (swap displayOrder with neighbour) ───────────────────────────

  const swapOrder = async (idx: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= sortedBanners.length) return;

    const current = sortedBanners[idx];
    const neighbour = sortedBanners[targetIdx];

    setReorderingId(current.id);
    try {
      await Promise.all([
        reorderBanner({ id: current.id, displayOrder: neighbour.displayOrder }).unwrap(),
        reorderBanner({ id: neighbour.id, displayOrder: current.displayOrder }).unwrap(),
      ]);
      refetch();
    } catch {
      toast.error('Failed to reorder');
    } finally {
      setReorderingId(null);
    }
  };

  // ── Delete ───────────────────────────────────────────────────────────────

  const handleDelete = async () => {
    if (confirmDeleteId == null) return;
    try {
      await deleteBanner(confirmDeleteId).unwrap();
      toast.success('Banner deleted');
      setConfirmDeleteId(null);
    } catch {
      toast.error('Failed to delete banner');
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Hero Banners</h1>
          <p className="text-sm text-gray-600 mt-1">
            Manage the rotating banners on the homepage hero. Drag-or-arrow to reorder; each banner
            uses its own duration.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          <Plus className="w-4 h-4" /> New banner
        </button>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-gray-500">
          <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading banners…
        </div>
      ) : isError ? (
        <div className="flex items-center gap-2 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700">
          <AlertCircle className="w-5 h-5" /> Failed to load banners.
          <button onClick={() => refetch()} className="ml-auto underline">Retry</button>
        </div>
      ) : sortedBanners.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-gray-300 rounded-xl">
          <ImageIcon className="w-12 h-12 mx-auto text-gray-300 mb-3" />
          <p className="text-gray-600 mb-4">No banners yet.</p>
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium"
          >
            <Plus className="w-4 h-4" /> Create your first banner
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedBanners.map((banner, idx) => (
            <div
              key={banner.id}
              className="flex flex-col md:flex-row gap-4 bg-white rounded-xl border border-gray-200 p-4 shadow-sm"
            >
              {/* Thumbnail */}
              <div className="relative w-full md:w-48 aspect-video rounded-lg overflow-hidden bg-gray-100 shrink-0">
                <img
                  src={banner.imageUrl}
                  alt={banner.title ?? `Banner ${banner.id}`}
                  className="w-full h-full object-cover"
                />
                {!banner.isActive && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <span className="text-white text-xs font-semibold">INACTIVE</span>
                  </div>
                )}
              </div>

              {/* Meta */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Order #{banner.displayOrder}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                    {(banner.durationMs / 1000).toFixed(1)}s
                  </span>
                  {banner.isActive ? (
                    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-700">
                      <CheckCircle2 className="w-3 h-3" /> Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                      <XCircle className="w-3 h-3" /> Inactive
                    </span>
                  )}
                </div>
                <h3 className="text-base font-semibold text-gray-900 truncate">
                  {banner.title || <span className="italic text-gray-400">No title</span>}
                </h3>
                {banner.subtitle && (
                  <p className="text-sm text-gray-600 line-clamp-2">{banner.subtitle}</p>
                )}
              </div>

              {/* Actions */}
              <div className="flex md:flex-col items-center gap-1 shrink-0">
                <button
                  onClick={() => swapOrder(idx, 'up')}
                  disabled={idx === 0 || reorderingId !== null}
                  title="Move up"
                  className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed text-gray-600"
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
                <button
                  onClick={() => swapOrder(idx, 'down')}
                  disabled={idx === sortedBanners.length - 1 || reorderingId !== null}
                  title="Move down"
                  className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed text-gray-600"
                >
                  <ArrowDown className="w-4 h-4" />
                </button>
                <button
                  onClick={() => openEdit(banner)}
                  title="Edit"
                  className="p-2 rounded-lg hover:bg-blue-50 text-blue-600"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setConfirmDeleteId(banner.id)}
                  title="Delete"
                  className="p-2 rounded-lg hover:bg-red-50 text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto">
            {/* Modal header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <h2 className="text-xl font-bold text-gray-900">
                {editing ? 'Edit banner' : 'New banner'}
              </h2>
              <button onClick={closeModal} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
              {/* Live preview */}
              <div>
                <div className="flex items-center gap-2 mb-3 text-sm font-semibold text-gray-700">
                  <Eye className="w-4 h-4" /> Live preview (matches user side)
                </div>
                <SlidePreview imageUrl={previewUrl} title={form.title} subtitle={form.subtitle} />
                <p className="text-xs text-gray-500 mt-3">
                  This preview mirrors how the slide will render in the homepage hero, including the
                  title/subtitle overlay. The "search bar overlaps here" indicator shows where the
                  search bar will visually cut into the bottom of the banner on the live site.
                </p>
              </div>

              {/* Form */}
              <div className="space-y-4">
                {/* File upload */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Image {editing ? '(leave empty to keep existing)' : '*'}
                  </label>
                  <input
                    type="file"
                    accept={ALLOWED_TYPES.join(',')}
                    onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
                    className="block w-full text-sm text-gray-700 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 cursor-pointer"
                  />
                  {errors.file && (
                    <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {errors.file}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    JPEG, PNG, GIF, or WebP — max 10 MB. Recommended ~1920×1080 for full-width display.
                  </p>
                </div>

                {/* Display order + Duration */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Display order
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={form.displayOrder}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, displayOrder: Number(e.target.value) || 0 }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    {errors.displayOrder && (
                      <p className="text-xs text-red-600 mt-1">{errors.displayOrder}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Duration (seconds)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={60}
                      value={form.durationSec}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, durationSec: Number(e.target.value) || 0 }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    {errors.durationSec && (
                      <p className="text-xs text-red-600 mt-1">{errors.durationSec}</p>
                    )}
                  </div>
                </div>

                {/* Title */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Title <span className="font-normal text-gray-400">(optional)</span>
                  </label>
                  <input
                    type="text"
                    maxLength={200}
                    value={form.title}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    placeholder="e.g. Navigate The City On Your Own Terms"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>{errors.title}</span>
                    <span>{form.title.length}/200</span>
                  </div>
                </div>

                {/* Subtitle */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Subtitle <span className="font-normal text-gray-400">(optional)</span>
                  </label>
                  <textarea
                    maxLength={500}
                    rows={2}
                    value={form.subtitle}
                    onChange={(e) => setForm((f) => ({ ...f, subtitle: e.target.value }))}
                    placeholder="e.g. Rent two-wheelers by the hour, day, or week"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>{errors.subtitle}</span>
                    <span>{form.subtitle.length}/500</span>
                  </div>
                </div>

                {/* Active toggle */}
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                    className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700">
                    Active <span className="text-gray-500">(visible on the user homepage)</span>
                  </span>
                </label>
              </div>
            </div>

            {/* Modal footer */}
            <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex items-center justify-end gap-3 rounded-b-2xl">
              <button
                onClick={closeModal}
                disabled={isSaving}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSaving}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white font-medium disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {editing ? 'Save changes' : 'Create banner'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {confirmDeleteId !== null && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Delete banner?</h3>
                <p className="text-sm text-gray-600 mt-1">
                  This will remove the banner from the homepage immediately. This action cannot be
                  undone.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmDeleteId(null)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium disabled:opacity-50"
              >
                {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HeroBannersPage;
