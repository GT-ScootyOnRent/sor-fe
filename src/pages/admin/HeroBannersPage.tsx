import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  Maximize2,
  ZoomIn,
  ZoomOut,
  RefreshCw,
  Move,
  UploadCloud,
  Globe,
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
import { useGetCitiesQuery } from '../../store/api/cityApi';
import { useGetAdminProfileQuery } from '../../store/api/adminApi';
import { generateCroppedImage } from '../../utils/cropImage';
import { stripLeadingZeros } from '../../utils/numberInput';

// ── Types ────────────────────────────────────────────────────────────────────

type ObjectPosition = { x: number; y: number }; // 0–100 percentages

type FormState = {
  file: File | null;
  displayOrder: number;
  durationSec: number;
  title: string;
  subtitle: string;
  isActive: boolean;
  objectPosition: ObjectPosition;
  cityIds: number[]; // specific cities selected
  useAllCitiesMode: boolean; // true = "All Cities" checked, false = individual cities
};

const DEFAULT_POSITION: ObjectPosition = { x: 50, y: 50 };

const EMPTY_FORM: FormState = {
  file: null,
  displayOrder: 1,
  durationSec: 5,
  title: '',
  subtitle: '',
  isActive: true,
  objectPosition: DEFAULT_POSITION,
  cityIds: [],
  useAllCitiesMode: true, // default to "All" mode
};

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_FILE_BYTES = 10 * 1024 * 1024;

// ── CropPositioner ────────────────────────────────────────────────────────────
// The interactive 3:1 crop canvas. Drag the image to reposition it.

interface CropPositionerProps {
  imageUrl: string | null;
  title: string;
  subtitle: string;
  position: ObjectPosition;
  onPositionChange: (pos: ObjectPosition) => void;
  onOpenLightbox: () => void;
  onFileSelect: (file: File) => void;
}

const CropPositioner: React.FC<CropPositionerProps> = ({
  imageUrl,
  title,
  subtitle,
  position,
  onPositionChange,
  onOpenLightbox,
  onFileSelect,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const dragState = useRef<{
    active: boolean;
    startX: number;
    startY: number;
    startPos: ObjectPosition;
  }>({ active: false, startX: 0, startY: 0, startPos: DEFAULT_POSITION });

  const hasText = !!(title || subtitle);

  // ── File drop handlers (work whether or not an image is loaded) ─────────

  const onContainerDragOver = (e: React.DragEvent) => {
    if (!e.dataTransfer.types.includes('Files')) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setIsDraggingFile(true);
  };

  const onContainerDragLeave = (e: React.DragEvent) => {
    // Only clear when leaving the actual container (not its children)
    if (e.currentTarget === e.target) setIsDraggingFile(false);
  };

  const onContainerDrop = (e: React.DragEvent) => {
    if (!e.dataTransfer.files?.length) return;
    e.preventDefault();
    setIsDraggingFile(false);
    const file = e.dataTransfer.files[0];
    onFileSelect(file);
  };

  const triggerFileBrowser = () => fileInputRef.current?.click();

  // ── Pointer drag ────────────────────────────────────────────────────────

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!imageUrl) return;
      e.preventDefault();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      dragState.current = {
        active: true,
        startX: e.clientX,
        startY: e.clientY,
        startPos: { ...position },
      };
    },
    [imageUrl, position],
  );

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragState.current.active || !containerRef.current) return;
    e.preventDefault();

    const rect = containerRef.current.getBoundingClientRect();
    const dx = e.clientX - dragState.current.startX;
    const dy = e.clientY - dragState.current.startY;

    // Convert pixel delta → percentage shift (drag right = image moves right = position x decreases)
    const pctX = (dx / rect.width) * 100;
    const pctY = (dy / rect.height) * 100;

    const newX = Math.min(100, Math.max(0, dragState.current.startPos.x - pctX));
    const newY = Math.min(100, Math.max(0, dragState.current.startPos.y - pctY));

    onPositionChange({ x: Math.round(newX * 10) / 10, y: Math.round(newY * 10) / 10 });
  }, [onPositionChange]);

  const onPointerUp = useCallback(() => {
    dragState.current.active = false;
  }, []);

  const objectPositionCSS = `${position.x}% ${position.y}%`;

  return (
    <div className="flex flex-col h-full">
      {/* Hidden file input — opened by the "Choose file" button or click-to-browse */}
      <input
        ref={fileInputRef}
        type="file"
        accept={ALLOWED_TYPES.join(',')}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFileSelect(f);
          // Reset so re-selecting the same file fires onChange again
          e.target.value = '';
        }}
      />

      {/* Outer drop zone — fills the entire column height all the way down */}
      <div
        onDragOver={onContainerDragOver}
        onDragLeave={onContainerDragLeave}
        onDrop={onContainerDrop}
        onClick={!imageUrl ? triggerFileBrowser : undefined}
        className={`relative w-full flex-1 min-h-[480px] rounded-xl overflow-visible shadow-sm select-none transition-colors ${isDraggingFile
            ? 'bg-primary-50 border-2 border-dashed border-primary-500'
            : imageUrl
              ? 'bg-white border-2 border-dashed'
              : 'bg-gray-50 border-2 border-dashed border-gray-300 hover:bg-gray-100 hover:border-gray-400 cursor-pointer'
          }`}
        style={{ borderColor: !isDraggingFile && imageUrl ? 'rgb(99 102 241 / 0.5)' : undefined }}
      >
        {imageUrl ? (
          <>
            {/* Image fills the WHOLE drop zone — no more empty space below */}
            <div
              ref={containerRef}
              className="absolute inset-0 overflow-hidden rounded-[10px]"
            >
              <img
                src={imageUrl}
                alt="Hero crop"
                className="absolute inset-0 w-full h-full object-cover transition-none"
                style={{ objectPosition: objectPositionCSS, cursor: 'grab' }}
                draggable={false}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerLeave={onPointerUp}
              />

              {/* Text overlay — covers the whole image */}
              {hasText && (
                <>
                  <div className="absolute inset-0 bg-black/35 pointer-events-none" />
                  <div className="absolute inset-0 flex items-center justify-center px-4 text-center pointer-events-none">
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
            </div>

            {/* Drag hint badge — sits on top-left of the filled image */}
            <div className="absolute top-2 left-2 inline-flex items-center gap-1 px-2 py-1 rounded-full bg-black/60 text-white text-[11px] pointer-events-none z-10">
              <Move className="w-3 h-3" />
              Drag to reposition
            </div>

            {/* Open full-image preview in lightbox */}
            <button
              type="button"
              onClick={onOpenLightbox}
              className="absolute top-2 right-2 inline-flex items-center gap-1 px-2 py-1 rounded-full bg-black/60 text-white text-[11px] hover:bg-black/80 transition-colors z-10"
            >
              <Maximize2 className="w-3 h-3" />
              Preview
            </button>

            {/* Homepage booking/search section preview — half on image, half below border (matches user side) */}
            <div className="absolute left-1/2 -translate-x-1/2 -bottom-4 w-[78%] z-20 pointer-events-none">
              <div className="overflow-hidden rounded-[20px] bg-white shadow-xl border border-gray-200">
                <div className="grid grid-cols-5 divide-x divide-gray-200">
                  <div className="px-2 py-1.5 bg-white">
                    <p className="text-[7px] font-semibold uppercase tracking-wide text-gray-400 leading-none">Location</p>
                    <p className="mt-1 text-[9px] font-semibold text-gray-900 truncate leading-none">Udaipur</p>
                  </div>
                  <div className="px-2 py-1.5 bg-white">
                    <p className="text-[7px] font-semibold uppercase tracking-wide text-gray-400 leading-none">Pickup</p>
                    <p className="mt-1 text-[9px] font-semibold text-gray-700 leading-none">dd-mm</p>
                  </div>
                  <div className="px-2 py-1.5 bg-white">
                    <p className="text-[7px] font-semibold uppercase tracking-wide text-gray-400 leading-none">Time</p>
                    <p className="mt-1 text-[9px] font-semibold text-gray-700 leading-none">10:00</p>
                  </div>
                  <div className="px-2 py-1.5 bg-white">
                    <p className="text-[7px] font-semibold uppercase tracking-wide text-gray-400 leading-none">Return</p>
                    <p className="mt-1 text-[9px] font-semibold text-gray-700 leading-none">dd-mm</p>
                  </div>
                  <div className="bg-gradient-to-r from-primary-500 to-primary-600 flex items-center justify-center px-2">
                    <span className="w-full h-full flex items-center justify-center py-1.5 text-white font-semibold text-[9px] tracking-wide">
                      Ride Now
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          /* Empty state — fills the FULL outer drop zone (not just the 3:1 area) */
          <div
            className={`absolute inset-0 flex flex-col items-center justify-center px-6 text-center transition-colors ${isDraggingFile ? 'text-primary-700' : 'text-gray-500'
              }`}
          >
            <UploadCloud
              className={`w-14 h-14 mb-3 ${isDraggingFile ? 'text-primary-600' : 'text-gray-400'}`}
            />
            <p className="text-base font-semibold">
              {isDraggingFile ? 'Drop image to upload' : 'Drag & drop image here'}
            </p>
            {!isDraggingFile && (
              <>
                <p className="text-xs text-gray-400 my-2">or</p>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    triggerFileBrowser();
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium transition-colors"
                >
                  Choose file
                </button>
                <p className="text-[11px] text-gray-400 mt-4">
                  JPG, PNG, GIF or WebP &middot; Max 10 MB &middot; 1920×1080 (16:9) recommended
                </p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ── SlidePreview ─────────────────────────────────────────────────────────────

interface SlidePreviewProps {
  imageUrl: string | null;
  title: string;
  subtitle: string;
  position: ObjectPosition;
  onPositionChange: (pos: ObjectPosition) => void;
  onFileSelect: (file: File) => void;
}

type LightboxMode = 'crop';

const SlidePreview: React.FC<SlidePreviewProps> = ({
  imageUrl,
  title,
  subtitle,
  position,
  onPositionChange,
  onFileSelect,
}) => {
  const [lightbox, setLightbox] = useState<LightboxMode | null>(null);

  return (
    <div className="space-y-4">
      {/* Crop canvas with drag-to-reposition AND drag-and-drop upload */}
      <div>
        <p className="text-[11px] uppercase tracking-wide text-gray-500 mb-1.5 font-semibold">
          What users see (desktop hero crop)
        </p>
        <CropPositioner
          imageUrl={imageUrl}
          title={title}
          subtitle={subtitle}
          position={position}
          onPositionChange={onPositionChange}
          onOpenLightbox={() => imageUrl && setLightbox('crop')}
          onFileSelect={onFileSelect}
        />
      </div>

      {lightbox && imageUrl && (
        <ImageLightbox
          imageUrl={imageUrl}
          mode={lightbox}
          title={title}
          subtitle={subtitle}
          onClose={() => setLightbox(null)}
        />
      )}
    </div>
  );
};

// ── Lightbox ────────────────────────────────────────────────────────────────

interface ImageLightboxProps {
  imageUrl: string;
  mode: LightboxMode;
  title: string;
  subtitle: string;
  onClose: () => void;
}

const ZOOM_STEPS = [1, 1.5, 2, 3] as const;

const ImageLightbox: React.FC<ImageLightboxProps> = ({
  imageUrl,
  title,
  subtitle,
  onClose,
}) => {
  const [zoomIdx, setZoomIdx] = useState(0);
  const scale = ZOOM_STEPS[zoomIdx];
  const hasText = !!(title || subtitle);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === '+' || e.key === '=') setZoomIdx((i) => Math.min(i + 1, ZOOM_STEPS.length - 1));
      if (e.key === '-') setZoomIdx((i) => Math.max(i - 1, 0));
      if (e.key === '0') setZoomIdx(0);
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  const cycleZoom = () => setZoomIdx((i) => (i + 1) % ZOOM_STEPS.length);
  const zoomIn = () => setZoomIdx((i) => Math.min(i + 1, ZOOM_STEPS.length - 1));
  const zoomOut = () => setZoomIdx((i) => Math.max(i - 1, 0));
  const resetZoom = () => setZoomIdx(0);

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/85 flex flex-col"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="flex items-center justify-between gap-3 px-4 py-3 text-white border-b border-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="text-sm font-medium uppercase tracking-wide opacity-90">
          Image preview · {Math.round(scale * 100)}%
        </span>
        <div className="flex items-center gap-1">
          <IconButton onClick={zoomOut} disabled={zoomIdx === 0} title="Zoom out (−)">
            <ZoomOut className="w-4 h-4" />
          </IconButton>
          <IconButton onClick={zoomIn} disabled={zoomIdx === ZOOM_STEPS.length - 1} title="Zoom in (+)">
            <ZoomIn className="w-4 h-4" />
          </IconButton>
          <IconButton onClick={resetZoom} disabled={zoomIdx === 0} title="Reset (0)">
            <RefreshCw className="w-4 h-4" />
          </IconButton>
          <IconButton onClick={onClose} title="Close (Esc)">
            <X className="w-5 h-5" />
          </IconButton>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6" onClick={onClose}>
        <div
          className="mx-auto"
          style={{
            width: 'fit-content',
            transform: `scale(${scale})`,
            transformOrigin: 'top center',
            transition: 'transform 200ms ease-out',
          }}
          onClick={(e) => { e.stopPropagation(); cycleZoom(); }}
        >
          <div
            className="relative inline-block bg-black"
            style={{
              cursor: scale === ZOOM_STEPS[ZOOM_STEPS.length - 1] ? 'zoom-out' : 'zoom-in',
            }}
          >
            {/* Full image — fits naturally in viewport, no aspect-ratio cropping */}
            <img
              src={imageUrl}
              alt="Uploaded banner"
              className="block max-w-[min(90vw,1280px)] max-h-[78vh] w-auto h-auto select-none"
              draggable={false}
            />
            {hasText && (
              <>
                <div className="absolute inset-0 bg-black/35" />
                <div className="absolute inset-0 flex items-center justify-center px-6 text-center">
                  <div className="max-w-3xl">
                    {title && (
                      <h2 className="text-3xl md:text-5xl font-bold text-white mb-3 leading-tight drop-shadow-lg">
                        {title}
                      </h2>
                    )}
                    {subtitle && (
                      <p className="text-base md:text-xl text-white/95 drop-shadow-md">{subtitle}</p>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div
        className="px-4 py-2 text-center text-xs text-white/60 border-t border-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        Click image to cycle zoom · Esc / click outside to close · + / − / 0 keys also work
      </div>
    </div>
  );
};

const IconButton: React.FC<{
  onClick: () => void;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}> = ({ onClick, disabled, title, children }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    title={title}
    className="p-2 rounded-lg text-white/90 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
  >
    {children}
  </button>
);

// ── Page ────────────────────────────────────────────────────────────────────

const HeroBannersPage: React.FC = () => {
  const { data: banners = [], isLoading, isError, refetch } = useGetAdminHeroBannersQuery();
  const { data: allCities = [], isLoading: citiesLoading } = useGetCitiesQuery({ page: 1, size: 100 });
  const { data: adminProfile } = useGetAdminProfileQuery();
  const [createBanner, { isLoading: isCreating }] = useCreateHeroBannerMutation();
  const [updateBanner, { isLoading: isUpdating }] = useUpdateHeroBannerMutation();
  const [reorderBanner] = useReorderHeroBannerMutation();
  const [deleteBanner, { isLoading: isDeleting }] = useDeleteHeroBannerMutation();

  // Filter cities based on admin's access - SuperAdmin (role=2) can see all
  const isSuperAdmin = adminProfile?.role === 2;
  const adminCityIds = adminProfile?.cityIds ?? [];
  const cities = useMemo(() => {
    if (isSuperAdmin) return allCities;
    if (adminCityIds.length === 0) return allCities; // No restriction = show all
    return allCities.filter(city => adminCityIds.includes(city.id));
  }, [allCities, adminCityIds, isSuperAdmin]);

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<HeroBanner | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [reorderingId, setReorderingId] = useState<number | null>(null);

  const isSaving = isCreating || isUpdating;

  const isEditDirty = useMemo(() => {
    if (!editing) return true; // create mode: allow save (validation still applies)
    const durationMs = form.durationSec * 1000;

    // Check if city selection changed
    const originalIsAllMode = isSuperAdmin
      ? editing.cityIds.length === 0
      : editing.cityIds.length === 0 || (editing.cityIds.length === cities.length && cities.every(c => editing.cityIds.includes(c.id)));
    const cityChanged = form.useAllCitiesMode !== originalIsAllMode ||
      (!form.useAllCitiesMode && (
        form.cityIds.length !== editing.cityIds.length ||
        !form.cityIds.every(id => editing.cityIds.includes(id))
      ));

    return (
      !!form.file ||
      form.displayOrder !== editing.displayOrder ||
      durationMs !== editing.durationMs ||
      form.title !== (editing.title ?? '') ||
      form.subtitle !== (editing.subtitle ?? '') ||
      form.isActive !== editing.isActive ||
      cityChanged
    );
  }, [editing, form, isSuperAdmin, cities]);

  // Sort banners by displayOrder for reliable up/down behavior
  // Filter to show only banners the admin has access to (SuperAdmin sees all)
  const sortedBanners = useMemo(() => {
    let filtered = banners;
    if (!isSuperAdmin && adminCityIds.length > 0) {
      // Admin can see: global banners (cityIds empty) OR banners for their cities
      filtered = banners.filter(b => b.cityIds.length === 0 || b.cityIds.some(id => adminCityIds.includes(id)));
    }
    return [...filtered].sort((a, b) => a.displayOrder - b.displayOrder);
  }, [banners, isSuperAdmin, adminCityIds]);

  // ── Modal lifecycle ──────────────────────────────────────────────────────

  const openCreate = () => {
    setEditing(null);
    setForm({
      ...EMPTY_FORM,
      displayOrder: (sortedBanners[sortedBanners.length - 1]?.displayOrder ?? 0) + 1,
      cityIds: [],
      useAllCitiesMode: true, // Start with "All" mode
    });
    setPreviewUrl(null);
    setErrors({});
    setShowModal(true);
  };

  const openEdit = (banner: HeroBanner) => {
    setEditing(banner);
    // Determine if this was saved in "All" mode:
    // - SuperAdmin: cityIds = [] means global
    // - Admin: cityIds = [] OR cityIds contains all their cities = "All My Cities"
    const isAllMode = isSuperAdmin
      ? banner.cityIds.length === 0
      : banner.cityIds.length === 0 || (banner.cityIds.length === cities.length && cities.every(c => banner.cityIds.includes(c.id)));

    setForm({
      file: null,
      displayOrder: banner.displayOrder,
      durationSec: Math.round(banner.durationMs / 1000),
      title: banner.title ?? '',
      subtitle: banner.subtitle ?? '',
      isActive: banner.isActive,
      objectPosition: DEFAULT_POSITION,
      cityIds: isAllMode ? [] : banner.cityIds,
      useAllCitiesMode: isAllMode,
    });
    setPreviewUrl(banner.imageUrl);
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
    setForm((f) => ({ ...f, file, objectPosition: DEFAULT_POSITION }));
    setPreviewUrl(URL.createObjectURL(file));
    setErrors((e) => ({ ...e, file: undefined }));
  };

  // ── Validation ───────────────────────────────────────────────────────────

  const findOrderConflict = (displayOrder: number) =>
    sortedBanners.find((b) => b.displayOrder === displayOrder && b.id !== editing?.id);

  const validate = (): boolean => {
    const next: Partial<Record<keyof FormState, string>> = {};
    if (!editing && !form.file) next.file = 'Image is required';
    if (form.durationSec < 1 || form.durationSec > 60)
      next.durationSec = 'Duration must be between 1 and 60 seconds';
    if (form.displayOrder < 0) next.displayOrder = 'Display order must be ≥ 0';
    if (!next.displayOrder) {
      const conflict = findOrderConflict(form.displayOrder);
      if (conflict) {
        next.displayOrder = `Order ${form.displayOrder} is already used. Please choose a unique order.`;
      }
    }
    if (form.title.length > 200) next.title = 'Title must be ≤ 200 characters';
    if (form.subtitle.length > 500) next.subtitle = 'Subtitle must be ≤ 500 characters';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  // ── Submit ───────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (editing && !isEditDirty) return;
    if (!validate()) return;

    const fd = new FormData();
    if (form.file) {
      const croppedFile =
        await generateCroppedImage(
          form.file,
          form.objectPosition
        );

      fd.append('file', croppedFile);
    }
    fd.append('displayOrder', String(form.displayOrder));
    fd.append('durationMs', String(form.durationSec * 1000));
    fd.append('title', form.title);
    fd.append('subtitle', form.subtitle);
    fd.append('isActive', String(form.isActive));

    // Determine cityIds to send:
    // - SuperAdmin with "All Cities": empty string (global)
    // - Admin with "All My Cities": all their assigned city IDs
    // - Otherwise: selected city IDs
    let cityIdsToSend: number[];
    if (form.useAllCitiesMode) {
      cityIdsToSend = isSuperAdmin ? [] : cities.map(c => c.id);
    } else {
      cityIdsToSend = form.cityIds;
    }
    fd.append('cityIds', cityIdsToSend.join(','));

    try {
      if (editing) {
        // If the admin changed displayOrder to an already-used value, swap orders first
        // to preserve uniqueness and avoid backend unique-constraint failures.
        const conflict = findOrderConflict(form.displayOrder);
        if (conflict && conflict.displayOrder !== editing.displayOrder) {
          await reorderBanner({ id: conflict.id, displayOrder: editing.displayOrder }).unwrap();
        }
        await updateBanner({ id: editing.id, formData: fd }).unwrap();
        toast.success('Banner updated');
      } else {
        await createBanner(fd).unwrap();
        toast.success('Banner created');
      }
      closeModal();
    } catch (err: any) {
      const msg =
        err?.data?.error ?? err?.data?.errors?.[0]?.message ?? 'Failed to save banner';
      toast.error(msg);
    }
  };

  // ── Reorder ──────────────────────────────────────────────────────────────

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
          <button onClick={() => refetch()} className="ml-auto underline">
            Retry
          </button>
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
                  <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                    <Globe className="w-3 h-3" />
                    {banner.cityIds.length > 0 ? banner.cityNames.join(', ') : 'All Cities'}
                  </span>
                </div>
                <h3 className="text-base font-semibold text-gray-900 truncate">
                  {banner.title || <span className="italic text-gray-400">No title</span>}
                </h3>
                {banner.subtitle && (
                  <p className="text-sm text-gray-600 line-clamp-2">{banner.subtitle}</p>
                )}
              </div>

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
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <h2 className="text-xl font-bold text-gray-900">
                {editing ? 'Edit banner' : 'New banner'}
              </h2>
              <button
                onClick={closeModal}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
              {/* Live preview */}
              <div>
                <div className="flex items-center gap-2 mb-3 text-sm font-semibold text-gray-700">
                  <Eye className="w-4 h-4" /> Live preview (matches user side)
                </div>
                <SlidePreview
                  imageUrl={previewUrl}
                  title={form.title}
                  subtitle={form.subtitle}
                  position={form.objectPosition}
                  onPositionChange={(pos) => setForm((f) => ({ ...f, objectPosition: pos }))}
                  onFileSelect={(f) => handleFileChange(f)}
                />

                {/* File status + Remove — sits right under the preview where it's visible */}
                {(form.file || editing) && (
                  <div className="mt-3 flex items-center gap-2 text-xs px-3 py-2 rounded-lg bg-gray-50 border border-gray-200">
                    <ImageIcon className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                    <span className="text-gray-700 truncate flex-1">
                      {form.file
                        ? `${form.file.name} · ${(form.file.size / 1024 / 1024).toFixed(1)} MB`
                        : 'Existing image (drag a new file onto the preview to replace)'}
                    </span>
                    {form.file && (
                      <button
                        type="button"
                        onClick={() => handleFileChange(null)}
                        className="text-red-600 hover:text-red-700 hover:underline font-semibold shrink-0"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                )}

                <p className="text-xs text-gray-500 mt-3">
                  {previewUrl
                    ? 'Drag the image in the preview to set the focal point. Click "Preview 3:1" to see exactly how the homepage hero will crop it.'
                    : 'Drag a file onto the area above, or click it to browse.'}
                </p>
                {errors.file && (
                  <p className="text-xs text-red-600 mt-2 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {errors.file}
                  </p>
                )}
              </div>

              {/* Form */}
              <div className="space-y-4">

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
                      onChange={(e) => {
                        const stripped = stripLeadingZeros(e.target.value);
                        if (stripped !== e.target.value) e.target.value = stripped;
                        setForm((f) => ({
                          ...f,
                          displayOrder: stripped === '' ? 0 : Number(stripped),
                        }));
                      }}
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
                      onChange={(e) => {
                        const stripped = stripLeadingZeros(e.target.value);
                        if (stripped !== e.target.value) e.target.value = stripped;
                        setForm((f) => ({
                          ...f,
                          durationSec: stripped === '' ? 0 : Number(stripped),
                        }));
                      }}
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

                {/* City Selection - Multi-select checkboxes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Target Cities
                  </label>
                  <div className="border border-gray-300 rounded-lg p-3 max-h-48 overflow-y-auto space-y-2">
                    {citiesLoading ? (
                      <div className="flex items-center gap-2 text-gray-500 text-sm p-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Loading cities...
                      </div>
                    ) : cities.length === 0 ? (
                      <div className="text-gray-500 text-sm p-2">
                        No cities available
                      </div>
                    ) : (
                      <>
                        {/* "All" option - SuperAdmin: All Cities (Global), Admin: All My Cities */}
                        {(isSuperAdmin || cities.length > 1) && (
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
                        {cities.map((city) => {
                          const isOnlyCity = !isSuperAdmin && cities.length === 1;

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
                      ? 'Select "All Cities" for a global banner, or pick specific cities.'
                      : cities.length === 1
                        ? 'This banner will be shown in your assigned city.'
                        : 'Select "All My Cities" or pick specific cities from your assigned locations.'}
                  </p>
                  {/* Show selected city tags only when specific cities are selected (not "All" mode) */}
                  {!form.useAllCitiesMode && form.cityIds.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {form.cityIds.map((id) => {
                        const city = cities.find((c) => c.id === id);
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
              </div>
            </div>

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
                disabled={isSaving || (editing ? !isEditDirty : false)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white font-medium disabled:opacity-50"
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
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
                {isDeleting ? (
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
};

export default HeroBannersPage;