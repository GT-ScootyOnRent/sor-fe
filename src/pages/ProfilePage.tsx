import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User, Calendar, Clock,
  Edit2, Save, X, Loader2, Bike, CheckCircle, XCircle,
  AlertCircle, RefreshCw, ChevronLeft, ChevronRight, LogOut,
  FileText, Eye, HelpCircle, RotateCcw, CreditCard,
  Shield, AlertTriangle, Timer, MapPin, Building, IdCard, Phone,
  Video, Upload, Trash2, Play
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { setCredentials } from '../store/slices/authSlice';
import { logout } from '../store/slices/authSlice';
import { useGetBookingsByUserIdQuery, useCancelBookingMutation } from '../store/api/bookingApi';
import type { BookingDto } from '../store/api/bookingApi';
import {
  useDeleteMyDocumentMutation,
  useGetMyDocumentsQuery,
  useLogoutMutation,
  useSendPhoneChangeOtpMutation,
  useUpdateProfileMutation,
  useUploadMyDocumentMutation,
  useVerifyPhoneChangeOtpMutation,
  type UserDocumentDto,
} from '../store/api/authApi';
import { useGetBookingCustomerDetailsQuery } from '../store/api/bookingCustomerDetailsApi';
import { useGetBookingMediaQuery, useUploadBookingVideoMutation, useDeleteBookingMediaMutation } from '../store/api/bookingMediaApi';
import type { BookingMediaDto } from '../store/api/bookingMediaApi';
import { toast } from 'sonner';
import Header from '../components/Header';
import PaymentModal from '../components/PaymentModal';

// Pending booking timeout (must match backend PendingBookingCleanupService)
const PENDING_BOOKING_TIMEOUT_HOURS = 2;

const BOOKINGS_PER_PAGE = 4;

type ProfileDocumentType = 'driving_license' | 'aadhaar';

const PROFILE_DOCUMENT_LABELS: Record<ProfileDocumentType, string> = {
  driving_license: 'Driving License',
  aadhaar: 'Aadhaar Card',
};

const BOOKING_STATUS_MAP: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  'pending': { label: 'Pending', color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: <AlertCircle className="w-3.5 h-3.5" /> },
  'confirmed': { label: 'Confirmed', color: 'bg-green-100 text-green-800 border-green-200', icon: <CheckCircle className="w-3.5 h-3.5" /> },
  'upcoming': { label: 'Upcoming', color: 'bg-blue-100 text-blue-800 border-blue-200', icon: <Clock className="w-3.5 h-3.5" /> },
  'active': { label: 'Active', color: 'bg-emerald-100 text-emerald-800 border-emerald-200', icon: <Bike className="w-3.5 h-3.5" /> },
  'completed': { label: 'Completed', color: 'bg-gray-100 text-gray-600 border-gray-200', icon: <CheckCircle className="w-3.5 h-3.5" /> },
  'cancelled': { label: 'Cancelled', color: 'bg-red-100 text-red-800 border-red-200', icon: <XCircle className="w-3.5 h-3.5" /> },
};

// Helper to get display status based on backend status and dates
function getDisplayStatus(booking: BookingDto): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const startDate = new Date(booking.bookingStartDate);
  startDate.setHours(0, 0, 0, 0);
  
  const endDate = new Date(booking.bookingEndDate);
  endDate.setHours(23, 59, 59, 999);
  
  // Backend status: 0=Pending, 1=Confirmed, 2=Completed, 3=Cancelled
  if (booking.status === 3) return 'cancelled';
  if (booking.status === 2) return 'completed';
  if (booking.status === 0) return 'pending';
  
  // For Confirmed (status=1), check dates
  if (booking.status === 1) {
    if (endDate < today) return 'completed'; // Past booking
    if (startDate > today) return 'upcoming'; // Future booking
    return 'active'; // Ongoing booking
  }
  
  return 'pending';
}

// Helper to get vehicle display name
function getVehicleDisplayName(booking: BookingDto): string {
  if (booking.vehicleName) return booking.vehicleName;
  if (booking.vehicleMake && booking.vehicleModel) return `${booking.vehicleMake} ${booking.vehicleModel}`;
  if (booking.vehicleMake) return booking.vehicleMake;
  return `Vehicle #${booking.vehicleId}`;
}

// Helper to get time remaining for pending booking
function getPendingTimeRemaining(createdAt?: string): { expired: boolean; text: string; minutes: number } {
  if (!createdAt) return { expired: false, text: '', minutes: 999 };
  
  const created = new Date(createdAt);
  const expiresAt = new Date(created.getTime() + PENDING_BOOKING_TIMEOUT_HOURS * 60 * 60 * 1000);
  const now = new Date();
  const diffMs = expiresAt.getTime() - now.getTime();
  
  if (diffMs <= 0) {
    return { expired: true, text: 'Expired', minutes: 0 };
  }
  
  const diffMins = Math.floor(diffMs / 60000);
  const hours = Math.floor(diffMins / 60);
  const mins = diffMins % 60;
  
  if (hours > 0) {
    return { expired: false, text: `${hours}h ${mins}m left`, minutes: diffMins };
  }
  return { expired: false, text: `${mins}m left`, minutes: diffMins };
}

function StatusBadge({ status }: { status: string }) {
  const s = BOOKING_STATUS_MAP[status] ?? { label: 'Unknown', color: 'bg-gray-100 text-gray-700 border-gray-200', icon: null };
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${s.color}`}>
      {s.icon} {s.label}
    </span>
  );
}

function PaymentStatusBadge({ status, securityDepositMode }: { status?: string | null; securityDepositMode?: string }) {
  if (status === 'paid') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600">
        <CreditCard className="w-3 h-3" /> Paid Online
      </span>
    );
  }
  if (status === 'pending' || (!status && securityDepositMode === 'online')) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600">
        <AlertTriangle className="w-3 h-3" /> Payment Pending
      </span>
    );
  }
  if (securityDepositMode === 'pickup') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-500">
        <CreditCard className="w-3 h-3" /> Pay at Pickup
      </span>
    );
  }
  return null;
}

function getLatestProfileDocument(documents: UserDocumentDto[], documentType: ProfileDocumentType) {
  return documents.find((doc) => doc.documentType === documentType);
}

function formatDateInput(dateStr?: string | null) {
  if (!dateStr) {
    return '';
  }

  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toISOString().slice(0, 10);
}

function ProfileDocumentUploadModal({
  documentType,
  onClose,
}: {
  documentType: ProfileDocumentType | null;
  onClose: () => void;
}) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [inputMode, setInputMode] = useState<'upload' | 'camera'>('upload');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCameraStarting, setIsCameraStarting] = useState(false);
  const [uploadMyDocument, { isLoading: isUploading }] = useUploadMyDocumentMutation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const nativeCameraInputRef = useRef<HTMLInputElement>(null);
  const videoPreviewRef = useRef<HTMLVideoElement>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);

  // Live preview (getUserMedia) only works in a secure context (HTTPS/localhost) and full
  // browsers. On http://, in-app webviews, or unsupported browsers we fall back to the native
  // device camera via <input capture>.
  const canUseLiveCamera =
    typeof navigator !== 'undefined' &&
    !!navigator.mediaDevices?.getUserMedia &&
    typeof window !== 'undefined' &&
    window.isSecureContext;

  const openNativeCamera = () => {
    nativeCameraInputRef.current?.click();
  };

  const stopCameraStream = () => {
    if (!cameraStreamRef.current) {
      return;
    }

    cameraStreamRef.current.getTracks().forEach((track) => track.stop());
    cameraStreamRef.current = null;

    if (videoPreviewRef.current) {
      videoPreviewRef.current.srcObject = null;
    }
  };

  const startCameraStream = async () => {
    if (!documentType || inputMode !== 'camera') {
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError('Live capture is not supported on this device/browser.');
      return;
    }

    try {
      setIsCameraStarting(true);
      setCameraError(null);
      stopCameraStream();

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      });

      cameraStreamRef.current = stream;
      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = stream;
        await videoPreviewRef.current.play();
      }
    } catch {
      setCameraError('Camera access failed. Please allow camera permission or use Upload File.');
    } finally {
      setIsCameraStarting(false);
    }
  };

  const capturePhoto = async () => {
    if (!documentType) {
      return;
    }

    const video = videoPreviewRef.current;
    if (!video) {
      return;
    }

    const width = video.videoWidth;
    const height = video.videoHeight;
    if (!width || !height) {
      toast.error('Camera is not ready yet. Please try again.');
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext('2d');
    if (!context) {
      toast.error('Unable to capture photo.');
      return;
    }

    context.drawImage(video, 0, 0, width, height);
    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, 'image/jpeg', 0.92);
    });

    if (!blob) {
      toast.error('Unable to capture photo.');
      return;
    }

    setSelectedFile(new File([blob], `${documentType}-${Date.now()}.jpg`, { type: 'image/jpeg' }));
    stopCameraStream();
    setInputMode('upload');
  };

  useEffect(() => {
    if (documentType && inputMode === 'camera') {
      void startCameraStream();
      return;
    }

    stopCameraStream();
  }, [documentType, inputMode]);

  useEffect(() => () => {
    stopCameraStream();
  }, []);

  if (!documentType) {
    return null;
  }

  const handleClose = () => {
    setSelectedFile(null);
    setInputMode('upload');
    setCameraError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    stopCameraStream();
    onClose();
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Please select a file first');
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('documentType', documentType);

    try {
      await uploadMyDocument(formData).unwrap();
      toast.success(`${PROFILE_DOCUMENT_LABELS[documentType]} uploaded successfully`);
      handleClose();
    } catch (err: any) {
      toast.error(err?.data?.error || 'Document upload failed');
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={handleClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Upload {PROFILE_DOCUMENT_LABELS[documentType]}</h3>
            <p className="text-sm text-gray-500">Choose upload or live capture</p>
          </div>
          <button onClick={handleClose} className="p-2 hover:bg-gray-100 rounded-lg transition">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setInputMode('upload');
                setCameraError(null);
              }}
              className={`px-3 py-2 rounded-lg border text-sm font-medium transition ${inputMode === 'upload'
                ? 'border-primary-600 bg-primary-50 text-primary-700'
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
            >
              Upload File
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedFile(null);
                setCameraError(null);
                if (canUseLiveCamera) {
                  setInputMode('camera');
                } else {
                  openNativeCamera();
                }
              }}
              className={`px-3 py-2 rounded-lg border text-sm font-medium transition ${inputMode === 'camera'
                ? 'border-primary-600 bg-primary-50 text-primary-700'
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
            >
              Live Capture
            </button>
          </div>

          <input
            ref={nativeCameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0] || null;
              if (file) {
                setSelectedFile(file);
                setInputMode('upload');
              }
              if (nativeCameraInputRef.current) {
                nativeCameraInputRef.current.value = '';
              }
            }}
          />

          {inputMode === 'camera' ? (
            <div className="space-y-3 rounded-xl border border-gray-200 p-3">
              <div className="relative overflow-hidden rounded-lg bg-gray-900 aspect-[4/3] flex items-center justify-center">
                <video
                  ref={videoPreviewRef}
                  autoPlay
                  playsInline
                  muted
                  className="h-full w-full object-cover"
                />
                {cameraError ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-900 px-4 text-center">
                    <div className="space-y-2">
                      <p className="text-sm text-white/85">{cameraError}</p>
                      <button
                        type="button"
                        onClick={openNativeCamera}
                        className="px-3 py-1.5 bg-white/15 text-white text-sm rounded-lg hover:bg-white/25 transition"
                      >
                        Use device camera
                      </button>
                    </div>
                  </div>
                ) : isCameraStarting ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-900 text-sm text-white/85">
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Starting camera...
                  </div>
                ) : null}
              </div>
              <div className="flex gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={capturePhoto}
                  disabled={Boolean(cameraError) || isCameraStarting}
                  className="flex-1 min-w-[140px] px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Capture Photo
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setInputMode('upload');
                    setCameraError(null);
                  }}
                  className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  Use Upload
                </button>
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">File</label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          )}

          {selectedFile && (
            <p className="text-sm text-gray-500">
              Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
            </p>
          )}
        </div>

        <div className="border-t border-gray-200 p-4 flex gap-3">
          <Button variant="outline" className="flex-1" onClick={handleClose} disabled={isUploading}>
            Cancel
          </Button>
          <Button
            className="flex-1 bg-primary-500 hover:bg-primary-600 text-white"
            onClick={handleUpload}
            disabled={isUploading || !selectedFile}
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Upload
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

// Customer Details Section Component
function CustomerDetailsSection({ bookingId }: { bookingId: number }) {
  const { data: customerDetails, isLoading } = useGetBookingCustomerDetailsQuery(bookingId);

  if (isLoading) {
    return (
      <div className="bg-gray-50 rounded-xl p-4">
        <div className="flex items-center gap-2 text-gray-500 text-sm">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading customer details...
        </div>
      </div>
    );
  }

  if (!customerDetails) {
    return null; // No customer details submitted yet
  }

  const hasAnyDetails = customerDetails.guestAddress || 
    customerDetails.drivingLicenseNo || 
    customerDetails.hotelName || 
    customerDetails.friendFamilyContactNumber;

  if (!hasAnyDetails) {
    return null;
  }

  return (
    <div className="bg-blue-50 rounded-xl p-4 space-y-3 border border-blue-100">
      <h4 className="text-sm font-semibold text-blue-800 flex items-center gap-2">
        <FileText className="w-4 h-4" /> Customer Details
      </h4>
      
      {customerDetails.guestAddress && (
        <div className="flex items-start gap-2">
          <MapPin className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <span className="text-xs text-blue-600 font-medium">Address</span>
            <p className="text-sm text-gray-700">{customerDetails.guestAddress}</p>
          </div>
        </div>
      )}
      
      {customerDetails.drivingLicenseNo && (
        <div className="flex items-start gap-2">
          <IdCard className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <span className="text-xs text-blue-600 font-medium">Driving License</span>
            <p className="text-sm text-gray-700">{customerDetails.drivingLicenseNo}</p>
          </div>
        </div>
      )}
      
      {(customerDetails.hotelName || customerDetails.hotelAddress) && (
        <div className="flex items-start gap-2">
          <Building className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <span className="text-xs text-blue-600 font-medium">Hotel</span>
            <p className="text-sm text-gray-700">
              {customerDetails.hotelName}
              {customerDetails.hotelAddress && (
                <span className="text-gray-500"> - {customerDetails.hotelAddress}</span>
              )}
            </p>
          </div>
        </div>
      )}
      
      {customerDetails.friendFamilyContactNumber && (
        <div className="flex items-start gap-2">
          <Phone className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <span className="text-xs text-blue-600 font-medium">Emergency Contact</span>
            <p className="text-sm text-gray-700">{customerDetails.friendFamilyContactNumber}</p>
          </div>
        </div>
      )}
    </div>
  );
}

// Booking Video Section Component
function BookingVideoSection({ bookingId, booking }: { bookingId: number; booking: BookingDto }) {
  const [uploadingType, setUploadingType] = useState<'video_before' | 'video_after' | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<BookingMediaDto | null>(null);
  
  const { data: mediaList, isLoading, refetch } = useGetBookingMediaQuery(bookingId);
  const [uploadVideo, { isLoading: isUploading }] = useUploadBookingVideoMutation();
  const [deleteMedia, { isLoading: isDeleting }] = useDeleteBookingMediaMutation();

  // Check if user can upload videos based on booking timing
  const canUploadPickupVideo = () => {
    const displayStatus = getDisplayStatus(booking);
    // Can upload pickup video for upcoming or active bookings
    return displayStatus === 'upcoming' || displayStatus === 'active' || displayStatus === 'confirmed';
  };

  const canUploadReturnVideo = () => {
    const displayStatus = getDisplayStatus(booking);
    // Can upload return video for active or recently completed bookings
    return displayStatus === 'active' || displayStatus === 'completed';
  };

  const pickupVideos = mediaList?.filter(m => m.mediaType === 'video_before' && m.uploaderType === 'user') || [];
  const returnVideos = mediaList?.filter(m => m.mediaType === 'video_after' && m.uploaderType === 'user') || [];
  const staffVideos = mediaList?.filter(m => m.uploaderType === 'staff' || m.uploaderType === 'admin') || [];

  const handleFileSelect = async (type: 'video_before' | 'video_after', file: File) => {
    // Validate file size (50MB max)
    if (file.size > 50 * 1024 * 1024) {
      toast.error('Video file size must be less than 50MB');
      return;
    }

    // Validate file type
    const allowedTypes = ['video/mp4', 'video/quicktime', 'video/webm', 'video/3gpp', 'video/x-msvideo'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Only video files (MP4, MOV, WebM, 3GP, AVI) are allowed');
      return;
    }

    setUploadingType(type);
    try {
      await uploadVideo({ bookingId, file, mediaType: type }).unwrap();
      toast.success(type === 'video_before' ? 'Pickup video uploaded!' : 'Return video uploaded!');
      refetch();
    } catch (error: any) {
      const message = error?.data?.error || 'Failed to upload video';
      toast.error(message);
    } finally {
      setUploadingType(null);
    }
  };

  const handleDelete = async (mediaId: number) => {
    if (!confirm('Are you sure you want to delete this video?')) return;
    
    try {
      await deleteMedia({ bookingId, mediaId }).unwrap();
      toast.success('Video deleted');
      refetch();
    } catch (error: any) {
      const message = error?.data?.error || 'Failed to delete video';
      toast.error(message);
    }
  };

  const formatBytes = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatUploadTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('en-IN', { 
      day: 'numeric', 
      month: 'short', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (isLoading) {
    return (
      <div className="bg-gray-50 rounded-xl p-4">
        <div className="flex items-center gap-2 text-gray-500 text-sm">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading videos...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Video Section Header */}
      <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
        <Video className="w-4 h-4 text-primary-600" />
        Vehicle Condition Videos
      </div>

      {/* Pickup Video Section */}
      <div className="bg-green-50 rounded-xl p-3 border border-green-100">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-green-800">📹 Pickup Video</span>
          {canUploadPickupVideo() && (
            <label className="cursor-pointer">
              <input
                type="file"
                accept="video/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelect('video_before', file);
                  e.target.value = '';
                }}
                disabled={isUploading}
              />
              <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md ${
                uploadingType === 'video_before'
                  ? 'bg-green-200 text-green-700'
                  : 'bg-green-600 text-white hover:bg-green-700'
              } transition`}>
                {uploadingType === 'video_before' ? (
                  <><Loader2 className="w-3 h-3 animate-spin" /> Uploading...</>
                ) : (
                  <><Upload className="w-3 h-3" /> Upload</>
                )}
              </span>
            </label>
          )}
        </div>
        
        {pickupVideos.length > 0 ? (
          <div className="space-y-2">
            {pickupVideos.map((video) => (
              <div key={video.id} className="flex items-center justify-between bg-white rounded-lg p-2 shadow-sm">
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setSelectedVideo(video)}
                    className="p-1.5 bg-green-100 rounded-full hover:bg-green-200 transition"
                  >
                    <Play className="w-3 h-3 text-green-700" />
                  </button>
                  <div>
                    <p className="text-xs font-medium text-gray-700 truncate max-w-[150px]">
                      {video.fileName || 'Video'}
                    </p>
                    <p className="text-[10px] text-gray-500">
                      {formatBytes(video.fileSizeBytes)} • {formatUploadTime(video.createdAt)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(video.id)}
                  disabled={isDeleting}
                  className="p-1 text-red-500 hover:bg-red-50 rounded transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-green-600">
            {canUploadPickupVideo() 
              ? 'Upload a video of the vehicle before your ride' 
              : 'No pickup video uploaded'}
          </p>
        )}
      </div>

      {/* Return Video Section */}
      <div className="bg-orange-50 rounded-xl p-3 border border-orange-100">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-orange-800">📹 Return Video</span>
          {canUploadReturnVideo() && (
            <label className="cursor-pointer">
              <input
                type="file"
                accept="video/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelect('video_after', file);
                  e.target.value = '';
                }}
                disabled={isUploading}
              />
              <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md ${
                uploadingType === 'video_after'
                  ? 'bg-orange-200 text-orange-700'
                  : 'bg-orange-600 text-white hover:bg-orange-700'
              } transition`}>
                {uploadingType === 'video_after' ? (
                  <><Loader2 className="w-3 h-3 animate-spin" /> Uploading...</>
                ) : (
                  <><Upload className="w-3 h-3" /> Upload</>
                )}
              </span>
            </label>
          )}
        </div>
        
        {returnVideos.length > 0 ? (
          <div className="space-y-2">
            {returnVideos.map((video) => (
              <div key={video.id} className="flex items-center justify-between bg-white rounded-lg p-2 shadow-sm">
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setSelectedVideo(video)}
                    className="p-1.5 bg-orange-100 rounded-full hover:bg-orange-200 transition"
                  >
                    <Play className="w-3 h-3 text-orange-700" />
                  </button>
                  <div>
                    <p className="text-xs font-medium text-gray-700 truncate max-w-[150px]">
                      {video.fileName || 'Video'}
                    </p>
                    <p className="text-[10px] text-gray-500">
                      {formatBytes(video.fileSizeBytes)} • {formatUploadTime(video.createdAt)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(video.id)}
                  disabled={isDeleting}
                  className="p-1 text-red-500 hover:bg-red-50 rounded transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-orange-600">
            {canUploadReturnVideo() 
              ? 'Upload a video of the vehicle after your ride' 
              : 'No return video uploaded'}
          </p>
        )}
      </div>

      {/* Staff/Admin Videos (if any) */}
      {staffVideos.length > 0 && (
        <div className="bg-gray-50 rounded-xl p-3 border border-gray-200">
          <span className="text-sm font-medium text-gray-700 block mb-2">🔍 Inspection Videos</span>
          <div className="space-y-2">
            {staffVideos.map((video) => (
              <div key={video.id} className="flex items-center justify-between bg-white rounded-lg p-2 shadow-sm">
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setSelectedVideo(video)}
                    className="p-1.5 bg-gray-200 rounded-full hover:bg-gray-300 transition"
                  >
                    <Play className="w-3 h-3 text-gray-700" />
                  </button>
                  <div>
                    <p className="text-xs font-medium text-gray-700">
                      {video.mediaType === 'video_before' ? 'Pickup' : 'Return'} by {video.uploaderType}
                    </p>
                    <p className="text-[10px] text-gray-500">
                      {video.uploadedByName || 'Staff'} • {formatUploadTime(video.createdAt)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedVideo(video)}
                  className="p-1 text-blue-500 hover:bg-blue-50 rounded transition"
                >
                  <Eye className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Video Player Modal */}
      {selectedVideo && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/70">
          <div className="relative bg-black rounded-xl overflow-hidden max-w-2xl w-full">
            <button
              onClick={() => setSelectedVideo(null)}
              className="absolute top-2 right-2 z-10 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
            <video
              src={selectedVideo.fileUrl}
              controls
              autoPlay
              className="w-full max-h-[70vh]"
            />
            <div className="p-3 bg-gray-900 text-white text-sm">
              <p className="font-medium">{selectedVideo.fileName || 'Video'}</p>
              <p className="text-xs text-gray-400">
                {selectedVideo.mediaType === 'video_before' ? 'Pickup Video' : 'Return Video'} • 
                Uploaded by {selectedVideo.uploadedByName || selectedVideo.uploaderType || 'User'} • 
                {formatUploadTime(selectedVideo.createdAt)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Booking Details Modal
function BookingDetailsModal({ 
  booking, 
  onClose,
  onBookAgain,
  onCompletePayment
}: { 
  booking: BookingDto; 
  onClose: () => void;
  onBookAgain: () => void;
  onCompletePayment: (booking: BookingDto) => void;
}) {
  const timeRemaining = getDisplayStatus(booking) === 'pending' ? getPendingTimeRemaining(booking.createdAt) : null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-500 to-blue-600 text-white p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-100">Booking #{booking.id}</p>
              <h2 className="text-xl font-bold">{getVehicleDisplayName(booking)}</h2>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 overflow-y-auto max-h-[60vh]">
          {/* Vehicle Image */}
          <div className="w-full h-40 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center overflow-hidden">
            {booking.vehiclePrimaryImageUrl ? (
              <img 
                src={booking.vehiclePrimaryImageUrl} 
                alt={booking.vehicleName || 'Vehicle'} 
                className="w-full h-full object-cover"
              />
            ) : (
              <Bike className="w-16 h-16 text-gray-400" />
            )}
          </div>

          {/* Status & Payment */}
          <div className="flex items-center justify-between">
            <StatusBadge status={getDisplayStatus(booking)} />
            <PaymentStatusBadge status={booking.paymentStatus} securityDepositMode={booking.securityDepositMode} />
          </div>

          {/* Details Grid */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-500 text-sm">Pickup Location</span>
              <span className="text-gray-900 text-sm font-medium">
                {booking.pickupLocationName || `Location #${booking.pickupLocationId || 'N/A'}`}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500 text-sm">Start Date</span>
              <span className="text-gray-900 text-sm font-medium">{formatDate(booking.bookingStartDate)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500 text-sm">End Date</span>
              <span className="text-gray-900 text-sm font-medium">{formatDate(booking.bookingEndDate)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500 text-sm">Time</span>
              <span className="text-gray-900 text-sm font-medium">
                {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
              </span>
            </div>
            {booking.vehicleRegistrationNumber && (
              <div className="flex items-center justify-between">
                <span className="text-gray-500 text-sm">Reg. Number</span>
                <span className="text-gray-900 text-sm font-medium">{booking.vehicleRegistrationNumber}</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-gray-500 text-sm">Second Helmet</span>
              <span className="text-gray-900 text-sm font-medium">{booking.includeSecondHelmet ? 'Yes' : 'No'}</span>
            </div>
          </div>

          {/* Customer Details Section */}
          <CustomerDetailsSection bookingId={booking.id!} />

          {/* Video Upload Section */}
          <BookingVideoSection bookingId={booking.id!} booking={booking} />

          {/* Total Amount */}
          <div className="flex items-center justify-between p-4 bg-primary-50 rounded-xl border border-primary-100">
            <span className="text-primary-700 font-medium">Total Amount</span>
            <span className="text-2xl font-bold text-primary-700">₹{Number(booking.totalAmount).toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="border-t border-gray-200 p-4 flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => window.open(`https://wa.me/919876543210?text=Help with booking #${booking.id}`, '_blank')}
          >
            <HelpCircle className="w-4 h-4 mr-2" /> Get Help
          </Button>
          {getDisplayStatus(booking) === 'completed' && (
            <Button
              className="flex-1 bg-green-600 hover:bg-green-700"
              onClick={onBookAgain}
            >
              <RotateCcw className="w-4 h-4 mr-2" /> Book Again
            </Button>
          )}
          {getDisplayStatus(booking) === 'pending' && (
            <>
              {timeRemaining && (
                <div className={`flex items-center gap-2 p-3 rounded-lg ${timeRemaining.expired ? 'bg-red-50 border border-red-200' : timeRemaining.minutes < 30 ? 'bg-amber-50 border border-amber-200' : 'bg-blue-50 border border-blue-200'}`}>
                  <Timer className={`w-4 h-4 ${timeRemaining.expired ? 'text-red-500' : timeRemaining.minutes < 30 ? 'text-amber-500' : 'text-blue-500'}`} />
                  <span className={`text-sm font-medium ${timeRemaining.expired ? 'text-red-600' : timeRemaining.minutes < 30 ? 'text-amber-600' : 'text-blue-600'}`}>
                    {timeRemaining.expired ? 'Booking expired - will be auto-cancelled' : `Complete payment within ${timeRemaining.text}`}
                  </span>
                </div>
              )}
              <Button
                className="flex-1 bg-amber-500 hover:bg-amber-600"
                onClick={() => onCompletePayment(booking)}
              >
                <CreditCard className="w-4 h-4 mr-2" /> Complete Payment
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Edit Profile Modal
function EditProfileModal({
  user,
  documents,
  onClose,
  onSave,
  isUpdating,
  onPhoneUpdated
}: {
  user: { name?: string; phone?: string; email?: string; id?: number; cityId?: number; dateOfBirth?: string; anniversaryDate?: string };
  documents: UserDocumentDto[];
  onClose: () => void;
  onSave: (profile: { name: string; email: string; dateOfBirth: string | null; anniversaryDate: string | null }) => Promise<void>;
  isUpdating: boolean;
  onPhoneUpdated: (newPhone: string) => void;
}) {
  const [editedName, setEditedName] = useState(user.name ?? '');
  const [editedEmail, setEditedEmail] = useState(user.email ?? '');
  const [editedDateOfBirth, setEditedDateOfBirth] = useState(formatDateInput(user.dateOfBirth));
  const [editedAnniversaryDate, setEditedAnniversaryDate] = useState(formatDateInput(user.anniversaryDate));
  const [activeDocumentType, setActiveDocumentType] = useState<ProfileDocumentType | null>(null);
  const [deleteMyDocument, { isLoading: isDeletingDocument }] = useDeleteMyDocumentMutation();
  
  // Phone change states
  const [isChangingPhone, setIsChangingPhone] = useState(false);
  const [newPhone, setNewPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  
  // Import the mutations - these will be passed as props or use hooks
  const [sendPhoneChangeOtp, { isLoading: isSendingOtp }] = useSendPhoneChangeOtpMutation();
  const [verifyPhoneChangeOtp, { isLoading: isVerifyingOtp }] = useVerifyPhoneChangeOtpMutation();

  const drivingLicenseDocument = getLatestProfileDocument(documents, 'driving_license');
  const aadhaarDocument = getLatestProfileDocument(documents, 'aadhaar');

  const handleSave = async () => {
    await onSave({
      name: editedName,
      email: editedEmail.trim(),
      dateOfBirth: editedDateOfBirth || null,
      anniversaryDate: editedAnniversaryDate || null,
    });
  };

  const handleSendOtp = async () => {
    if (!newPhone || newPhone.length < 10) {
      toast.error('Please enter a valid 10-digit phone number');
      return;
    }
    if (!user.id) return;
    
    try {
      const result = await sendPhoneChangeOtp({
        userId: user.id,
        newPhoneNumber: newPhone,
      }).unwrap();
      
      if (result.success) {
        setOtpSent(true);
        toast.success('OTP sent to your new phone number');
      } else {
        toast.error(result.message || 'Failed to send OTP');
      }
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to send OTP');
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp || otp.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP');
      return;
    }
    if (!user.id) return;
    
    try {
      const result = await verifyPhoneChangeOtp({
        userId: user.id,
        newPhoneNumber: newPhone,
        otp: otp,
      }).unwrap();
      
      if (result.success) {
        toast.success('Phone number updated successfully');
        onPhoneUpdated(result.newPhoneNumber || newPhone);
        setIsChangingPhone(false);
        setOtpSent(false);
        setNewPhone('');
        setOtp('');
      } else {
        toast.error(result.message || 'Invalid OTP');
      }
    } catch (err: any) {
      toast.error(err?.data?.message || 'Verification failed');
    }
  };

  const handleCancelPhoneChange = () => {
    setIsChangingPhone(false);
    setOtpSent(false);
    setNewPhone('');
    setOtp('');
  };

  const handleViewDocument = (document: UserDocumentDto) => {
    window.open(document.fileUrl, '_blank', 'noopener,noreferrer');
  };

  const handleDeleteDocument = async (documentType: ProfileDocumentType) => {
    const confirmed = window.confirm(`Delete your ${PROFILE_DOCUMENT_LABELS[documentType]}?`);
    if (!confirmed) {
      return;
    }

    try {
      await deleteMyDocument(documentType).unwrap();
      toast.success(`${PROFILE_DOCUMENT_LABELS[documentType]} deleted`);
    } catch (err: any) {
      toast.error(err?.data?.error || 'Failed to delete document');
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[calc(100vh-2rem)] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-500 to-blue-600 text-white p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-full">
                <User className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold">Edit Profile</h2>
                <p className="text-sm text-blue-100">Update your information</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 overflow-y-auto">
          {/* Avatar */}
          <div className="flex justify-center">
            <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-indigo-600 rounded-full flex items-center justify-center">
              <User className="w-10 h-10 text-white" />
            </div>
          </div>

          {/* Phone */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Phone Number</label>
            {!isChangingPhone ? (
              <div className="flex items-center gap-2 p-3 bg-gray-100 rounded-xl">
                <span className="text-gray-600">+91 {user.phone}</span>
                <span className="text-xs text-green-600 font-medium">✓ Verified</span>
                <button
                  onClick={() => setIsChangingPhone(true)}
                  className="ml-auto text-xs text-primary-600 hover:text-primary-700 font-medium px-2 py-1 bg-primary-50 rounded-lg"
                >
                  Change
                </button>
              </div>
            ) : !otpSent ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">+91</span>
                  <input
                    type="tel"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    className="flex-1 p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Enter new phone number"
                    maxLength={10}
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleCancelPhoneChange}
                    className="flex-1 text-sm text-gray-600 hover:text-gray-700 font-medium py-2 px-3 bg-gray-100 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSendOtp}
                    disabled={isSendingOtp || newPhone.length !== 10}
                    className="flex-1 text-sm text-white font-medium py-2 px-3 bg-primary-500 hover:bg-primary-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isSendingOtp ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      'Send OTP'
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-gray-500">
                  OTP sent to +91 {newPhone}
                </p>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-center tracking-[0.5em] font-mono text-lg"
                  placeholder="Enter OTP"
                  maxLength={6}
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleCancelPhoneChange}
                    className="flex-1 text-sm text-gray-600 hover:text-gray-700 font-medium py-2 px-3 bg-gray-100 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleVerifyOtp}
                    disabled={isVerifyingOtp || otp.length !== 6}
                    className="flex-1 text-sm text-white font-medium py-2 px-3 bg-green-500 hover:bg-green-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isVerifyingOtp ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      'Verify OTP'
                    )}
                  </button>
                </div>
                <button
                  onClick={handleSendOtp}
                  disabled={isSendingOtp}
                  className="w-full text-xs text-primary-600 hover:text-primary-700 font-medium py-1"
                >
                  {isSendingOtp ? 'Sending...' : 'Resend OTP'}
                </button>
              </div>
            )}
          </div>

          {/* Name */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Full Name</label>
            <input
              type="text"
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Enter your name"
              autoFocus
            />
          </div>

          {/* Email (Optional) */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Email (Optional)</label>
            <input
              type="email"
              value={editedEmail}
              onChange={(e) => setEditedEmail(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Enter your email"
              inputMode="email"
              autoCapitalize="none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Date of Birth</label>
            <input
              type="date"
              value={editedDateOfBirth}
              onChange={(e) => setEditedDateOfBirth(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Anniversary Date</label>
            <input
              type="date"
              value={editedAnniversaryDate}
              onChange={(e) => setEditedAnniversaryDate(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          {/* Documents Section */}
          <div className="pt-4 border-t border-gray-200">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-3">
              <Shield className="w-4 h-4 text-primary-500" />
              My Documents
            </h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                    <FileText className="w-4 h-4 text-gray-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Driving License</p>
                    <p className="text-xs text-gray-400">
                      {drivingLicenseDocument ? `Uploaded on ${formatDate(drivingLicenseDocument.createdAt)}` : 'Not uploaded'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {drivingLicenseDocument && (
                    <>
                      <button
                        type="button"
                        className="text-xs text-gray-700 hover:text-gray-900 font-medium px-3 py-1.5 bg-white border border-gray-200 rounded-lg"
                        onClick={() => handleViewDocument(drivingLicenseDocument)}
                      >
                        View
                      </button>
                      <button
                        type="button"
                        className="text-xs text-red-600 hover:text-red-700 font-medium px-3 py-1.5 bg-red-50 rounded-lg disabled:opacity-50"
                        onClick={() => handleDeleteDocument('driving_license')}
                        disabled={isDeletingDocument}
                      >
                        Delete
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    className="text-xs text-primary-600 hover:text-primary-700 font-medium px-3 py-1.5 bg-primary-50 rounded-lg"
                    onClick={() => setActiveDocumentType('driving_license')}
                  >
                    {drivingLicenseDocument ? 'Replace' : 'Upload'}
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                    <FileText className="w-4 h-4 text-gray-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Aadhaar Card</p>
                    <p className="text-xs text-gray-400">
                      {aadhaarDocument ? `Uploaded on ${formatDate(aadhaarDocument.createdAt)}` : 'Not uploaded'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {aadhaarDocument && (
                    <>
                      <button
                        type="button"
                        className="text-xs text-gray-700 hover:text-gray-900 font-medium px-3 py-1.5 bg-white border border-gray-200 rounded-lg"
                        onClick={() => handleViewDocument(aadhaarDocument)}
                      >
                        View
                      </button>
                      <button
                        type="button"
                        className="text-xs text-red-600 hover:text-red-700 font-medium px-3 py-1.5 bg-red-50 rounded-lg disabled:opacity-50"
                        onClick={() => handleDeleteDocument('aadhaar')}
                        disabled={isDeletingDocument}
                      >
                        Delete
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    className="text-xs text-primary-600 hover:text-primary-700 font-medium px-3 py-1.5 bg-primary-50 rounded-lg"
                    onClick={() => setActiveDocumentType('aadhaar')}
                  >
                    {aadhaarDocument ? 'Replace' : 'Upload'}
                  </button>
                </div>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-2 text-center">
              Uploading documents here can speed up booking verification.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onClose}
            disabled={isUpdating}
          >
            Cancel
          </Button>
          <Button
            className="flex-1 bg-primary-500 hover:bg-primary-600 text-white"
            onClick={handleSave}
            disabled={isUpdating || !editedName.trim()}
          >
            {isUpdating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>

      <ProfileDocumentUploadModal
        documentType={activeDocumentType}
        onClose={() => setActiveDocumentType(null)}
      />
    </div>
  );
}

function formatDate(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

function formatTime(timeStr: string) {
  try {
    return new Date(`2000-01-01T${timeStr}`).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return timeStr;
  }
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);

  const [currentPage, setCurrentPage] = useState(1);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [selectedBooking, setSelectedBooking] = useState<BookingDto | null>(null);
  const [paymentBooking, setPaymentBooking] = useState<BookingDto | null>(null);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);

  const [updateProfile, { isLoading: isUpdating }] = useUpdateProfileMutation();
  const [logoutApi] = useLogoutMutation();
  const { data: userDocuments = [] } = useGetMyDocumentsQuery(undefined, { skip: !user });
  const {
    data: bookings,
    isLoading: isLoadingBookings,
    isFetching: isFetchingBookings,
    isError: isBookingsError,
    refetch: refetchBookings,
  } = useGetBookingsByUserIdQuery(user?.id ?? 0, { skip: !user?.id });
  const [cancelBooking, { isLoading: isCancellingBooking }] = useCancelBookingMutation();

  const drivingLicenseDocument = getLatestProfileDocument(userDocuments, 'driving_license');
  const aadhaarDocument = getLatestProfileDocument(userDocuments, 'aadhaar');

  // Sort: most recent first
  const sortedBookings = bookings
    ? [...bookings].sort((a, b) => (b.id ?? 0) - (a.id ?? 0))
    : [];

  // Filter by active status tab
  const filteredBookings = activeFilter === 'all'
    ? sortedBookings
    : sortedBookings.filter((b) => getDisplayStatus(b) === activeFilter);

  const totalPages = Math.ceil(filteredBookings.length / BOOKINGS_PER_PAGE);
  const paginatedBookings = filteredBookings.slice(
    (currentPage - 1) * BOOKINGS_PER_PAGE,
    currentPage * BOOKINGS_PER_PAGE
  );

  // const handleLogout = () => {
  //   dispatch(logout());
  //   toast.success('Logged out successfully');
  //   navigate('/');
  // };

  const handleLogout = async () => {
    try {
      // Clear the HttpOnly auth cookies on the server first so the session
      // can't be silently restored via Auth/refresh.
      await logoutApi().unwrap();
    } catch {
      // Ignore network/server errors and still clear local state.
    }
    dispatch(logout());
    toast.success('Logged out successfully');
    navigate('/');
  };

  const handleSaveProfile = async (profile: { name: string; email: string; dateOfBirth: string | null; anniversaryDate: string | null }) => {
    if (!profile.name.trim()) { toast.error('Name cannot be empty'); return; }
    if (!user?.id) return;
    const token = localStorage.getItem('authToken');
    if (!token) { toast.error('Session expired. Please login again.'); return; }
    try {
      await updateProfile({
        userId: user.id,
        name: profile.name.trim(),
        email: profile.email,
        dateOfBirth: profile.dateOfBirth,
        anniversaryDate: profile.anniversaryDate,
        token,
      }).unwrap();
      const updatedUser = {
        ...user,
        name: profile.name.trim(),
        email: profile.email || undefined,
        dateOfBirth: profile.dateOfBirth ?? undefined,
        anniversaryDate: profile.anniversaryDate ?? undefined,
      };
      dispatch(setCredentials({
        token: localStorage.getItem('authToken')!,
        user: updatedUser,
      }));
      localStorage.setItem('user', JSON.stringify(updatedUser));
      toast.success('Profile updated successfully');
      setShowEditProfileModal(false);
    } catch (err: any) {
      toast.error('Failed to update profile', {
        description: err?.data?.message ?? 'Please try again',
      });
    }
  };

  const handleRetryPayment = (booking: BookingDto) => {
    const timeRemaining = getPendingTimeRemaining(booking.createdAt);

    if (timeRemaining.expired) {
      // Free the vehicle immediately by cancelling the expired pending booking,
      // then send the user to rebook instead of leaving the vehicle blocked.
      void handleCancelPendingBooking(booking, { silent: true }).then(() => {
        toast.error('This booking expired and was released. Please book again.');
      });
      return;
    }

    setSelectedBooking(null);
    setPaymentBooking(booking);
  };

  const handleCancelPendingBooking = async (
    booking: BookingDto,
    opts?: { silent?: boolean }
  ) => {
    if (booking.id == null) return;
    try {
      await cancelBooking(booking.id).unwrap();
      if (selectedBooking?.id === booking.id) {
        setSelectedBooking(null);
      }
      await refetchBookings();
      if (!opts?.silent) {
        toast.success('Booking cancelled. The vehicle is now available to rebook.');
      }
    } catch (err: any) {
      await refetchBookings();
      if (!opts?.silent) {
        toast.error(err?.data?.error ?? 'Could not cancel booking. Please try again.');
      }
    }
  };

  const handlePaymentSuccess = async () => {
    setPaymentBooking(null);
    setSelectedBooking(null);
    await refetchBookings();
    toast.success('Payment completed successfully');
  };

  const handlePaymentFailure = async (error: string) => {
    setPaymentBooking(null);
    await refetchBookings();
    toast.error(error || 'Payment failed');
  };

  if (!user) { navigate('/login'); return null; }

  // Calculate stats based on display status
  const completedCount = sortedBookings.filter(b => getDisplayStatus(b) === 'completed').length;
  const upcomingCount = sortedBookings.filter(b => getDisplayStatus(b) === 'upcoming').length;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-4 py-6 sm:py-8 max-w-6xl">

        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-primary-600 to-blue-700 rounded-2xl p-6 mb-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold mb-1">Welcome back, {user.name?.split(' ')[0] || 'User'}! 👋</h1>
              <p className="text-blue-100">
                {completedCount > 0 
                  ? `You've completed ${completedCount} ride${completedCount > 1 ? 's' : ''} with us. Keep exploring!`
                  : 'Start your journey with us today!'}
              </p>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 border border-gray-200 text-center">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-xl font-bold text-gray-900">{sortedBookings.length}</p>
            <p className="text-xs text-gray-500">Total Bookings</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200 text-center">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-xl font-bold text-gray-900">{completedCount}</p>
            <p className="text-xs text-gray-500">Completed</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200 text-center">
            <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <p className="text-xl font-bold text-gray-900">{upcomingCount}</p>
            <p className="text-xs text-gray-500">Upcoming</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200 text-center">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <Calendar className="w-5 h-5 text-purple-600" />
            </div>
            <p className="text-xl font-bold text-gray-900">Member</p>
            <p className="text-xs text-gray-500">Active User</p>
          </div>
        </div>


        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── LEFT COLUMN ── */}
          <div className="lg:col-span-1 space-y-4">

            {/* Profile Card - Redesigned */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              {/* Cover & Avatar */}
              <div className="bg-gradient-to-r from-primary-500 to-blue-600 h-20 relative">
                <div className="absolute -bottom-10 left-1/2 -translate-x-1/2">
                  <div className="w-20 h-20 bg-white rounded-full border-4 border-white shadow-lg flex items-center justify-center overflow-hidden">
                    <div className="w-full h-full bg-gradient-to-br from-primary-500 to-indigo-600 flex items-center justify-center">
                      <User className="w-10 h-10 text-white" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Profile Info */}
              <div className="pt-14 pb-4 px-6 text-center">
                <h2 className="text-xl font-bold text-gray-900">{user.name || 'User'}</h2>
                <p className="text-gray-500 text-sm">+91 {user.phone}</p>
                <span className="inline-block mt-2 px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full border border-green-200">
                  ✓ Verified Member
                </span>
              </div>

              {/* Details */}
              <div className="border-t border-gray-100 px-6 py-4 space-y-3">
                {/* Name */}
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 text-sm">Full Name</span>
                  <span className="text-gray-900 text-sm font-medium">{user.name || 'Not set'}</span>
                </div>
                
                {/* Email */}
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 text-sm">Email</span>
                  <span className="text-gray-900 text-sm font-medium">{user.email || 'Not provided'}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-500 text-sm">Date of Birth</span>
                  <span className="text-gray-900 text-sm font-medium">{user.dateOfBirth ? formatDate(user.dateOfBirth) : 'Not provided'}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-500 text-sm">Anniversary</span>
                  <span className="text-gray-900 text-sm font-medium">{user.anniversaryDate ? formatDate(user.anniversaryDate) : 'Not provided'}</span>
                </div>
              </div>

              {/* Edit Profile & Logout */}
              <div className="border-t border-gray-100 p-4 space-y-2">
                <Button
                  onClick={() => setShowEditProfileModal(true)}
                  variant="outline"
                  className="w-full border-primary-400 text-primary-600 hover:bg-primary-50"
                >
                  <Edit2 className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
                <Button
                  onClick={handleLogout}
                  variant="outline"
                  className="w-full border-red-400 text-red-500 hover:bg-red-500 hover:text-white"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </div>
            </div>

            {/* My Documents Section - Summary only */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-3">
                <Shield className="w-4 h-4 text-primary-500" />
                My Documents
              </h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                      <FileText className="w-4 h-4 text-gray-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">Driving License</p>
                      <p className="text-xs text-gray-400">
                        {drivingLicenseDocument ? `Uploaded on ${formatDate(drivingLicenseDocument.createdAt)}` : 'Not uploaded'}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                      <FileText className="w-4 h-4 text-gray-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">Aadhaar Card</p>
                      <p className="text-xs text-gray-400">
                        {aadhaarDocument ? `Uploaded on ${formatDate(aadhaarDocument.createdAt)}` : 'Not uploaded'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <Button
                variant="outline"
                className="w-full mt-3 text-sm"
                onClick={() => setShowEditProfileModal(true)}
              >
                Manage Documents
              </Button>
            </div>

          </div>

          {/* ── RIGHT COLUMN: Booking History ── */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">

              {/* Header */}
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-primary-500" />
                    Booking History
                    {filteredBookings.length > 0 && (
                      <span className="text-sm font-normal text-gray-500">
                        ({filteredBookings.length} {activeFilter === 'all' ? 'total' : 'found'})
                      </span>
                    )}
                  </h3>
                  <button
                    onClick={() => { refetchBookings(); setCurrentPage(1); }}
                    disabled={isFetchingBookings}
                    className="p-2 text-gray-400 hover:text-primary-500 hover:bg-primary-50 rounded-lg transition disabled:opacity-50"
                    title="Refresh bookings"
                  >
                    <RefreshCw className={`w-4 h-4 ${isFetchingBookings ? 'animate-spin' : ''}`} />
                  </button>
                </div>

                {/* Filter tabs */}
                <div className="flex items-center gap-2 flex-wrap">
                  {[
                    { label: 'All', value: 'all', activeColor: 'bg-gray-700 text-white', inactiveColor: 'bg-gray-100 text-gray-600 hover:bg-gray-200', count: sortedBookings.length },
                    { label: 'Active', value: 'active', activeColor: 'bg-emerald-600 text-white', inactiveColor: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100', count: sortedBookings.filter(b => getDisplayStatus(b) === 'active').length },
                    { label: 'Upcoming', value: 'upcoming', activeColor: 'bg-blue-600 text-white', inactiveColor: 'bg-blue-50 text-blue-700 hover:bg-blue-100', count: upcomingCount },
                    { label: 'Completed', value: 'completed', activeColor: 'bg-gray-600 text-white', inactiveColor: 'bg-gray-50 text-gray-700 hover:bg-gray-100', count: completedCount },
                    { label: 'Pending', value: 'pending', activeColor: 'bg-yellow-500 text-white', inactiveColor: 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100', count: sortedBookings.filter(b => getDisplayStatus(b) === 'pending').length },
                    { label: 'Cancelled', value: 'cancelled', activeColor: 'bg-red-500 text-white', inactiveColor: 'bg-red-50 text-red-700 hover:bg-red-100', count: sortedBookings.filter(b => getDisplayStatus(b) === 'cancelled').length },
                  ].map(({ label, value, activeColor, inactiveColor, count }) => (
                    <button
                      key={value}
                      onClick={() => { setActiveFilter(value); setCurrentPage(1); }}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${activeFilter === value ? activeColor : inactiveColor
                        }`}
                    >
                      {label}
                      <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${activeFilter === value ? 'bg-white/25' : 'bg-white border border-gray-200 text-gray-600'
                        }`}>
                        {count}
                      </span>
                    </button>
                  ))}
                </div>
              </div>


              {/* Loading */}
              {isLoadingBookings && (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
                  <span className="ml-3 text-gray-500">Loading bookings...</span>
                </div>
              )}

              {/* Error */}
              {isBookingsError && (
                <div className="flex flex-col items-center justify-center py-16 text-center px-6">
                  <AlertCircle className="w-12 h-12 text-red-400 mb-3" />
                  <p className="text-gray-600 mb-4">Failed to load bookings</p>
                  {/* <Button
                    onClick={() => { refetchBookings(); setCurrentPage(1); }}
                    variant="outline"
                    className="border-primary-500 text-primary-500 hover:bg-primary-50"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" /> Try Again
                  </Button> */}
                </div>
              )}

              {/* Empty state */}
              {!isLoadingBookings && !isBookingsError && filteredBookings.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-center px-6">
                  <Bike className="w-16 h-16 text-gray-300 mb-4" />
                  {sortedBookings.length === 0 ? (
                    <>
                      <h4 className="text-lg font-semibold text-gray-600 mb-2">No bookings yet</h4>
                      <p className="text-sm text-gray-400 mb-6">Book your first ride and it will appear here.</p>
                      <Button onClick={() => navigate('/vehicles')} className="bg-primary-500 hover:bg-primary-600 text-white">
                        Browse Vehicles
                      </Button>
                    </>
                  ) : (
                    <>
                      <h4 className="text-lg font-semibold text-gray-600 mb-2">No bookings found</h4>
                      <p className="text-sm text-gray-400 mb-4">No bookings match the selected filter.</p>
                      <button
                        onClick={() => { setActiveFilter('all'); setCurrentPage(1); }}
                        className="text-sm text-primary-500 hover:text-primary-600 font-medium"
                      >
                        Clear filter
                      </button>
                    </>
                  )}
                </div>
              )}

              {/* Bookings list */}
              {!isLoadingBookings && !isBookingsError && filteredBookings.length > 0 && (
                <>
                  <div className="divide-y divide-gray-100">
                    {paginatedBookings.map((booking) => (
                      <div key={booking.id} className="p-4 sm:p-5 hover:bg-gray-50 transition-colors">
                        <div className="flex flex-col sm:flex-row gap-4">
                          {/* Vehicle Image */}
                          <div className="w-full sm:w-28 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
                            {booking.vehiclePrimaryImageUrl ? (
                              <img 
                                src={booking.vehiclePrimaryImageUrl} 
                                alt={booking.vehicleName || 'Vehicle'} 
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Bike className="w-10 h-10 text-gray-400" />
                            )}
                          </div>

                          {/* Booking Details */}
                          <div className="flex-1 min-w-0">
                            {/* Vehicle Name & Status */}
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <h4 className="text-sm font-bold text-gray-900">
                                {getVehicleDisplayName(booking)}
                              </h4>
                              <StatusBadge status={getDisplayStatus(booking)} />
                            </div>
                            
                            {/* Booking ID & Pickup */}
                            <p className="text-xs text-gray-500 mb-2">
                              Booking #{booking.id} • {booking.pickupLocationName || `Pickup #${booking.pickupLocationId || 'N/A'}`}
                            </p>

                            {/* Date & Time */}
                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600">
                              <div className="flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5 text-gray-400" />
                                <span>{formatDate(booking.bookingStartDate)} - {formatDate(booking.bookingEndDate)}</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5 text-gray-400" />
                                <span>{formatTime(booking.startTime)} - {formatTime(booking.endTime)}</span>
                              </div>
                            </div>
                          </div>

                          {/* Price & Payment Status */}
                          <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-1">
                            <p className="text-xl font-bold text-gray-900">
                              ₹{Number(booking.totalAmount).toLocaleString('en-IN')}
                            </p>
                            <PaymentStatusBadge status={booking.paymentStatus} securityDepositMode={booking.securityDepositMode} />
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                          <button
                            onClick={() => setSelectedBooking(booking)}
                            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-lg transition"
                          >
                            <Eye className="w-3.5 h-3.5" /> View Details
                          </button>
                          <button
                            onClick={() => window.open(`https://wa.me/919876543210?text=Help with booking #${booking.id}`, '_blank')}
                            className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
                          >
                            <HelpCircle className="w-3.5 h-3.5" /> Get Help
                          </button>
                          {getDisplayStatus(booking) === 'completed' && (
                            <button
                              onClick={() => navigate('/vehicles')}
                              className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-green-600 bg-green-50 hover:bg-green-100 rounded-lg transition"
                            >
                              <RotateCcw className="w-3.5 h-3.5" /> Book Again
                            </button>
                          )}
                          {getDisplayStatus(booking) === 'pending' && (
                            <>
                              {/* Expiry countdown */}
                              {(() => {
                                const timeRemaining = getPendingTimeRemaining(booking.createdAt);
                                return (
                                  <span className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                                    timeRemaining.expired ? 'bg-red-100 text-red-600' : 
                                    timeRemaining.minutes < 30 ? 'bg-amber-100 text-amber-600' : 
                                    'bg-blue-100 text-blue-600'
                                  }`}>
                                    <Timer className="w-3 h-3" />
                                    {timeRemaining.expired ? 'Expired' : timeRemaining.text}
                                  </span>
                                );
                              })()}
                              <button
                                onClick={() => handleRetryPayment(booking)}
                                className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-amber-600 bg-amber-50 hover:bg-amber-100 rounded-lg transition"
                              >
                                <CreditCard className="w-3.5 h-3.5" /> Pay
                              </button>
                              <button
                                onClick={() => handleCancelPendingBooking(booking)}
                                disabled={isCancellingBooking}
                                className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition disabled:opacity-50"
                              >
                                <XCircle className="w-3.5 h-3.5" /> Cancel
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 sm:px-6 py-4 border-t border-gray-200 bg-gray-50">
                      <p className="text-sm text-gray-500 text-center sm:text-left">
                        Showing{' '}
                        <span className="font-semibold text-gray-700">
                          {(currentPage - 1) * BOOKINGS_PER_PAGE + 1}–{Math.min(currentPage * BOOKINGS_PER_PAGE, filteredBookings.length)}
                        </span>{' '}
                        of <span className="font-semibold text-gray-700">{filteredBookings.length}</span>
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setCurrentPage((p) => p - 1)}
                          disabled={currentPage === 1}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-300 text-sm font-medium text-gray-600 hover:bg-white hover:border-primary-400 hover:text-primary-600 transition disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <ChevronLeft className="w-4 h-4" /> Prev
                        </button>
                        <button
                          onClick={() => setCurrentPage((p) => p + 1)}
                          disabled={currentPage === totalPages}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-300 text-sm font-medium text-gray-600 hover:bg-white hover:border-primary-400 hover:text-primary-600 transition disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          Next <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}

            </div>
          </div>

        </div>
      </div>

      {/* Booking Details Modal */}
      {selectedBooking && (
        <BookingDetailsModal
          booking={selectedBooking}
          onClose={() => setSelectedBooking(null)}
          onBookAgain={() => {
            setSelectedBooking(null);
            navigate('/vehicles');
          }}
          onCompletePayment={handleRetryPayment}
        />
      )}

      {paymentBooking?.id && (
        <PaymentModal
          isOpen={true}
          onClose={() => setPaymentBooking(null)}
          amount={Number(paymentBooking.totalAmount)}
          bookingId={paymentBooking.id}
          onSuccess={handlePaymentSuccess}
          onFailure={handlePaymentFailure}
        />
      )}

      {/* Edit Profile Modal */}
      {showEditProfileModal && (
        <EditProfileModal
          user={user}
          documents={userDocuments}
          onClose={() => setShowEditProfileModal(false)}
          onSave={handleSaveProfile}
          isUpdating={isUpdating}
          onPhoneUpdated={(newPhone) => {
            if (user) {
              const updatedUser = { ...user, phone: newPhone };
              dispatch(setCredentials({
                token: localStorage.getItem('authToken')!,
                user: updatedUser,
              }));
              localStorage.setItem('user', JSON.stringify(updatedUser));
            }
          }}
        />
      )}
    </div>
  );
}
