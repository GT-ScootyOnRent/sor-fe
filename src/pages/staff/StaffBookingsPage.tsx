import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Search,
    Calendar,
    Eye,
    Upload,
    FileText,
    Video,
    Camera,
    X,
    Loader2,
    ArrowLeft,
    Download,
    Info,
    ShieldAlert,
} from 'lucide-react';
import { toast } from 'sonner';
import {
    useGetStaffBookingsQuery,
    useGetStaffBookingByIdQuery,
    useGetBookingDocumentsQuery,
    useGetBookingMediaQuery,
    useUploadBookingDocumentMutation,
    useUploadBookingMediaMutation,
} from '../../store/api/staffApi';

const StaffBookingsPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    if (id) {
        return <BookingDetail bookingId={parseInt(id)} onBack={() => navigate('/bookings')} />;
    }

    return <BookingsList />;
};

// ── Bookings List ──────────────────────────────────────────────────────────

// Format a Date as 'YYYY-MM-DD' in the user's local timezone — what HTML5
// <input type="date"> emits and consumes.
const toYmd = (d: Date): string => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const BookingsList: React.FC = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const navigate = useNavigate();

    // Staff is restricted to bookings starting within the last 7 days (incl. today).
    // Compute the window once per render — cheap and stays correct across midnight.
    const { todayYmd, minYmd } = useMemo(() => {
        const today = new Date();
        const min = new Date();
        min.setDate(today.getDate() - 6); // 6 days ago + today = 7 days
        return { todayYmd: toYmd(today), minYmd: toYmd(min) };
    }, []);

    const [startDate, setStartDate] = useState(minYmd);
    const [endDate, setEndDate] = useState(todayYmd);

    const { data: bookings = [], isLoading } = useGetStaffBookingsQuery({});

    const filteredBookings = bookings.filter((b) => {
        const matchesSearch =
            b.vehicleName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            b.vehicleNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            b.userName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            b.userPhone?.includes(searchQuery) ||
            b.friendFamilyContactNumber?.includes(searchQuery) ||
            b.id.toString().includes(searchQuery);
        const matchesStatus = statusFilter === 'all' || b.status === statusFilter;
        // Date filter on b.startDate (booking start). YYYY-MM-DD strings sort
        // lexicographically, so direct string comparison is safe.
        const bookingYmd = b.startDate ? b.startDate.slice(0, 10) : '';
        const matchesDate =
            (!startDate || bookingYmd >= startDate) &&
            (!endDate || bookingYmd <= endDate);
        return matchesSearch && matchesStatus && matchesDate;
    });

    const formatDate = (iso: string) =>
        new Date(iso).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });

    return (
        <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-3">Bookings</h1>

            {/* 7-day restriction banner */}
            <div className="flex items-start gap-2 mb-4 lg:mb-5 px-3 lg:px-4 py-2 lg:py-3 rounded-lg bg-primary-50 border border-primary-100 text-xs lg:text-sm text-primary-700">
                <Info className="w-4 h-4 mt-0.5 shrink-0" />
                <span>
                    Showing bookings from the last 7 days only. Contact an administrator
                    if you need access to older bookings.
                </span>
            </div>

            {/* Filters */}
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end mb-2">
                {/* Search */}
                <div className="flex flex-col flex-1 min-w-0 sm:min-w-[220px] sm:max-w-md">
                    <label className="text-xs text-gray-500 mb-1">Search</label>
                    <div className="relative">
                        <Search className="w-4 h-4 lg:w-5 lg:h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Vehicle, customer, phone..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 lg:pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm"
                        />
                    </div>
                </div>

                {/* Status */}
                <div className="flex flex-col w-full sm:w-auto">
                    <label className="text-xs text-gray-500 mb-1">Status</label>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-3 lg:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm bg-white"
                    >
                        <option value="all">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="active">Active</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                </div>

                {/* Date range — wrapped so From/To stay together */}
                <div className="flex flex-wrap gap-3">
                    <div className="flex flex-col flex-1 min-w-[140px]">
                        <label className="text-xs text-gray-500 mb-1">From</label>
                        <input
                            type="date"
                            value={startDate}
                            min={minYmd}
                            max={endDate || todayYmd}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="px-2 lg:px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm"
                        />
                    </div>
                    <div className="flex flex-col flex-1 min-w-[140px]">
                        <label className="text-xs text-gray-500 mb-1">To</label>
                        <input
                            type="date"
                            value={endDate}
                            min={startDate || minYmd}
                            max={todayYmd}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="px-2 lg:px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm"
                        />
                    </div>
                </div>
            </div>

            <p className="text-xs text-gray-500 mb-4 lg:mb-6">
                Date range is restricted to the last 7 days ({minYmd} → {todayYmd}).
            </p>

            {/* Bookings Table */}
            {isLoading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
                </div>
            ) : filteredBookings.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 lg:py-20 text-gray-500">
                    <Calendar className="w-10 h-10 lg:w-12 lg:h-12 mb-3 text-gray-400" />
                    <p className="text-base lg:text-lg font-medium">No bookings found</p>
                    <p className="text-xs lg:text-sm">Bookings from your city will appear here.</p>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm min-w-[700px]">
                            <thead>
                                <tr className="bg-gray-50 text-gray-600 uppercase text-xs">
                                    <th className="px-3 lg:px-5 py-3 text-left">Booking ID</th>
                                    <th className="px-3 lg:px-5 py-3 text-left">Vehicle</th>
                                    <th className="px-3 lg:px-5 py-3 text-left">Customer</th>
                                    <th className="px-3 lg:px-5 py-3 text-left">Dates</th>
                                    <th className="px-3 lg:px-5 py-3 text-left">Amount</th>
                                    <th className="px-3 lg:px-5 py-3 text-left">Status</th>
                                    <th className="px-3 lg:px-5 py-3 text-left">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredBookings.map((booking) => (
                                    <tr key={booking.id} className="hover:bg-gray-50 transition">
                                        <td className="px-3 lg:px-5 py-3 lg:py-4">
                                            <div className="flex flex-col gap-1">
                                                <p className="font-medium text-gray-900">#{booking.id}</p>
                                                {booking.isOfflineBooking && (
                                                    <span className="inline-flex w-fit rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                                                        Offline
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-3 lg:px-5 py-3 lg:py-4">
                                            <p className="font-medium text-gray-900">{booking.vehicleName || 'N/A'}</p>
                                            <p className="text-xs text-gray-500">{booking.vehicleNumber}</p>
                                        </td>
                                        <td className="px-3 lg:px-5 py-3 lg:py-4">
                                            <p className="text-gray-900">{booking.userName || 'Customer'}</p>
                                            <p className="text-xs text-gray-500">{booking.userPhone}</p>
                                            {booking.friendFamilyContactNumber && (
                                                <p className="text-xs text-gray-500 mt-0.5">
                                                    <span className="font-medium text-gray-400">F&amp;F:</span>{' '}
                                                    {booking.friendFamilyContactNumber}
                                                </p>
                                            )}
                                        </td>
                                        <td className="px-3 lg:px-5 py-3 lg:py-4 text-gray-600">
                                            <p>{formatDate(booking.startDate)}</p>
                                            <p className="text-xs text-gray-400">to {formatDate(booking.endDate)}</p>
                                        </td>
                                        <td className="px-3 lg:px-5 py-3 lg:py-4 font-medium text-gray-900">₹{booking.totalAmount}</td>
                                        <td className="px-3 lg:px-5 py-3 lg:py-4">
                                            <span
                                                className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${booking.status === 'confirmed'
                                                    ? 'bg-green-100 text-green-700'
                                                    : booking.status === 'pending'
                                                        ? 'bg-yellow-100 text-yellow-700'
                                                        : booking.status === 'active'
                                                            ? 'bg-blue-100 text-blue-700'
                                                            : booking.status === 'completed'
                                                                ? 'bg-gray-100 text-gray-700'
                                                                : 'bg-red-100 text-red-700'
                                                    }`}
                                            >
                                                {booking.status}
                                            </span>
                                        </td>
                                        <td className="px-3 lg:px-5 py-3 lg:py-4">
                                            <button
                                                onClick={() => navigate(`/bookings/${booking.id}`)}
                                                className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition"
                                                title="View Details"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

// ── Booking Detail ─────────────────────────────────────────────────────────

interface BookingDetailProps {
    bookingId: number;
    onBack: () => void;
}

type UploadInputMode = 'upload' | 'camera';

const BookingDetail: React.FC<BookingDetailProps> = ({ bookingId, onBack }) => {
    const { data: booking, isLoading: bookingLoading, error: bookingError } =
        useGetStaffBookingByIdQuery(bookingId);
    const { data: documents = [], refetch: refetchDocs } = useGetBookingDocumentsQuery(bookingId);
    const { data: media = [], refetch: refetchMedia } = useGetBookingMediaQuery(bookingId);
    const [uploadDocument, { isLoading: uploadingDoc }] = useUploadBookingDocumentMutation();
    const [uploadMedia, { isLoading: uploadingMedia }] = useUploadBookingMediaMutation();

    const [showUploadModal, setShowUploadModal] = useState<'document' | 'media' | null>(null);
    const [uploadType, setUploadType] = useState<string>('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploadInputMode, setUploadInputMode] = useState<UploadInputMode>('upload');
    const [cameraError, setCameraError] = useState<string | null>(null);
    const [isCameraStarting, setIsCameraStarting] = useState(false);
    const [isRecordingVideo, setIsRecordingVideo] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const videoPreviewRef = useRef<HTMLVideoElement>(null);
    const cameraStreamRef = useRef<MediaStream | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const recordedChunksRef = useRef<Blob[]>([]);

    const isVideoUploadType = uploadType === 'video_before' || uploadType === 'video_after';
    const isCameraCaptureMode = Boolean(showUploadModal) && uploadInputMode === 'camera';

    const resetUploadModal = () => {
        setShowUploadModal(null);
        setSelectedFile(null);
        setUploadType('');
        setUploadInputMode('upload');
        setCameraError(null);
        setIsCameraStarting(false);
        setIsRecordingVideo(false);
        recordedChunksRef.current = [];
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const stopCameraStream = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
        }
        mediaRecorderRef.current = null;
        recordedChunksRef.current = [];
        setIsRecordingVideo(false);

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
        if (!isCameraCaptureMode) {
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
                audio: isVideoUploadType,
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

        const file = new File([blob], `${uploadType || 'capture'}-${Date.now()}.jpg`, { type: 'image/jpeg' });
        setSelectedFile(file);
        stopCameraStream();
        setUploadInputMode('upload');
    };

    const startVideoRecording = () => {
        if (!cameraStreamRef.current) {
            toast.error('Camera is not ready yet. Please try again.');
            return;
        }

        if (typeof MediaRecorder === 'undefined') {
            toast.error('Video recording is not supported on this device/browser.');
            return;
        }

        try {
            recordedChunksRef.current = [];
            const preferredMimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')
                ? 'video/webm;codecs=vp8,opus'
                : 'video/webm';
            const recorder = new MediaRecorder(cameraStreamRef.current, { mimeType: preferredMimeType });

            recorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    recordedChunksRef.current.push(event.data);
                }
            };

            recorder.onstop = () => {
                const blob = new Blob(recordedChunksRef.current, { type: recorder.mimeType || 'video/webm' });
                const file = new File([blob], `${uploadType || 'capture'}-${Date.now()}.webm`, {
                    type: blob.type || 'video/webm',
                });

                setSelectedFile(file);
                stopCameraStream();
                setUploadInputMode('upload');
            };

            recorder.start();
            mediaRecorderRef.current = recorder;
            setIsRecordingVideo(true);
        } catch {
            toast.error('Unable to start video recording.');
        }
    };

    const stopVideoRecording = () => {
        if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') {
            return;
        }

        mediaRecorderRef.current.stop();
    };

    useEffect(() => {
        if (isCameraCaptureMode) {
            void startCameraStream();
            return;
        }

        stopCameraStream();
    }, [isCameraCaptureMode, isVideoUploadType]);

    useEffect(() => () => {
        stopCameraStream();
    }, []);

    const handleUpload = async () => {
        if (!selectedFile || !uploadType) {
            toast.error('Please select a file and type');
            return;
        }

        const formData = new FormData();
        formData.append('file', selectedFile);

        try {
            if (showUploadModal === 'document') {
                formData.append('documentType', uploadType);
                await uploadDocument({ bookingId, formData }).unwrap();
                refetchDocs();
                toast.success('Document uploaded successfully');
            } else {
                formData.append('mediaType', uploadType);
                await uploadMedia({ bookingId, formData }).unwrap();
                refetchMedia();
                toast.success('Media uploaded successfully');
            }
            resetUploadModal();
        } catch (err: any) {
            toast.error(err?.data?.error || 'Upload failed');
        }
    };

    const formatDate = (iso: string) =>
        new Date(iso).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });

    if (bookingLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
            </div>
        );
    }

    // Backend returns 403 when the booking is older than the staff 7-day window.
    // RTK Query's FetchBaseQueryError carries `status` as a number (or a string
    // for transport errors), so a numeric === 403 is the right discriminator.
    if (bookingError && 'status' in bookingError && bookingError.status === 403) {
        return (
            <div className="max-w-lg mx-auto bg-white rounded-xl shadow-md p-8 text-center mt-10">
                <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-amber-100 flex items-center justify-center">
                    <ShieldAlert className="w-7 h-7 text-amber-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Access Restricted</h2>
                <p className="text-gray-600 mb-6">
                    This booking is older than 7 days and cannot be accessed.
                    Please contact an administrator if you need this information.
                </p>
                <button
                    onClick={onBack}
                    className="inline-flex items-center bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Bookings
                </button>
            </div>
        );
    }

    if (!booking) {
        return (
            <div className="text-center py-20">
                <p className="text-gray-500">Booking not found</p>
                <button onClick={onBack} className="text-primary-600 mt-4">
                    Go back
                </button>
            </div>
        );
    }

    return (
        <div>
            <button
                onClick={onBack}
                className="flex items-center text-gray-600 hover:text-gray-900 mb-6 transition"
            >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to Bookings
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Booking Info */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-xl shadow-md p-6">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Booking #{booking.id}</h2>
                                {booking.isOfflineBooking && (
                                    <span className="mt-2 inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                                        Offline Booking
                                    </span>
                                )}
                            </div>
                            <span
                                className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${booking.status === 'confirmed'
                                    ? 'bg-green-100 text-green-700'
                                    : booking.status === 'pending'
                                        ? 'bg-yellow-100 text-yellow-700'
                                        : booking.status === 'active'
                                            ? 'bg-blue-100 text-blue-700'
                                            : 'bg-gray-100 text-gray-700'
                                    }`}
                            >
                                {booking.status}
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-gray-500">Vehicle</p>
                                <p className="font-medium">{booking.vehicleName}</p>
                                <p className="text-sm text-gray-500">{booking.vehicleNumber}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Customer</p>
                                <p className="font-medium">{booking.userName || 'N/A'}</p>
                                <p className="text-sm text-gray-500">{booking.userPhone}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">F&amp;F Contact</p>
                                <p className="font-medium">
                                    {booking.friendFamilyContactNumber || 'N/A'}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Start Date</p>
                                <p className="font-medium">{formatDate(booking.startDate)}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">End Date</p>
                                <p className="font-medium">{formatDate(booking.endDate)}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Pickup Location</p>
                                <p className="font-medium">{booking.pickupLocationName || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Total Amount</p>
                                <p className="font-medium text-lg">₹{booking.totalAmount}</p>
                            </div>
                        </div>
                    </div>

                    {/* Documents */}
                    <div className="bg-white rounded-xl shadow-md p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-gray-900">Documents</h3>
                            <button
                                onClick={() => setShowUploadModal('document')}
                                className="flex items-center text-sm bg-primary-600 text-white px-3 py-1.5 rounded-lg hover:bg-primary-700 transition"
                            >
                                <Upload className="w-4 h-4 mr-1" />
                                Upload
                            </button>
                        </div>

                        {documents.length === 0 ? (
                            <p className="text-gray-500 text-center py-6">No documents uploaded yet</p>
                        ) : (
                            <div className="space-y-3">
                                {documents.map((doc) => (
                                    <div
                                        key={doc.id}
                                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                                    >
                                        <div className="flex items-center gap-3">
                                            <FileText className="w-5 h-5 text-primary-600" />
                                            <div>
                                                <p className="font-medium text-gray-900 capitalize">
                                                    {doc.documentType.replace('_', ' ')}
                                                </p>
                                                <p className="text-xs text-gray-500">{formatDate(doc.uploadedAt)}</p>
                                            </div>
                                        </div>
                                        <a
                                            href={doc.documentUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition"
                                        >
                                            <Download className="w-4 h-4" />
                                        </a>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Media */}
                    <div className="bg-white rounded-xl shadow-md p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-gray-900">Media (Photos & Videos)</h3>
                            <button
                                onClick={() => setShowUploadModal('media')}
                                className="flex items-center text-sm bg-primary-600 text-white px-3 py-1.5 rounded-lg hover:bg-primary-700 transition"
                            >
                                <Upload className="w-4 h-4 mr-1" />
                                Upload
                            </button>
                        </div>

                        {media.length === 0 ? (
                            <p className="text-gray-500 text-center py-6">No media uploaded yet</p>
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {media.map((m) => (
                                    <a
                                        key={m.id}
                                        href={m.mediaUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="relative group"
                                    >
                                        {m.mediaType.includes('video') ? (
                                            <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                                                <Video className="w-8 h-8 text-gray-400" />
                                            </div>
                                        ) : (
                                            <img
                                                src={m.mediaUrl}
                                                alt={m.mediaType}
                                                className="aspect-video object-cover rounded-lg"
                                            />
                                        )}
                                        <span className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded capitalize">
                                            {m.mediaType.replace('_', ' ')}
                                        </span>
                                    </a>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="space-y-6">
                    <div className="bg-white rounded-xl shadow-md p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Upload</h3>
                        <div className="space-y-3">
                            <button
                                onClick={() => {
                                    setUploadType('driving_license');
                                    setUploadInputMode('upload');
                                    setShowUploadModal('document');
                                }}
                                className="w-full flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                            >
                                <FileText className="w-5 h-5 text-primary-600 mr-3" />
                                <span>Upload Driving License</span>
                            </button>
                            <button
                                onClick={() => {
                                    setUploadType('aadhar_card');
                                    setUploadInputMode('upload');
                                    setShowUploadModal('document');
                                }}
                                className="w-full flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                            >
                                <FileText className="w-5 h-5 text-primary-600 mr-3" />
                                <span>Upload Aadhar Card</span>
                            </button>
                            <button
                                onClick={() => {
                                    setUploadType('video_before');
                                    setUploadInputMode('upload');
                                    setShowUploadModal('media');
                                }}
                                className="w-full flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                            >
                                <Video className="w-5 h-5 text-green-600 mr-3" />
                                <span>Video Before Pickup</span>
                            </button>
                            <button
                                onClick={() => {
                                    setUploadType('video_after');
                                    setUploadInputMode('upload');
                                    setShowUploadModal('media');
                                }}
                                className="w-full flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                            >
                                <Video className="w-5 h-5 text-blue-600 mr-3" />
                                <span>Video After Return</span>
                            </button>
                            <button
                                onClick={() => {
                                    setUploadType('photo_before');
                                    setUploadInputMode('upload');
                                    setShowUploadModal('media');
                                }}
                                className="w-full flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                            >
                                <Camera className="w-5 h-5 text-green-600 mr-3" />
                                <span>Photo Before Pickup</span>
                            </button>
                            <button
                                onClick={() => {
                                    setUploadType('photo_after');
                                    setUploadInputMode('upload');
                                    setShowUploadModal('media');
                                }}
                                className="w-full flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                            >
                                <Camera className="w-5 h-5 text-blue-600 mr-3" />
                                <span>Photo After Return</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Upload Modal */}
            {showUploadModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-gray-900">
                                Upload {showUploadModal === 'document' ? 'Document' : 'Media'}
                            </h3>
                            <button
                                onClick={resetUploadModal}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                                <select
                                    value={uploadType}
                                    onChange={(e) => {
                                        setUploadType(e.target.value);
                                        setSelectedFile(null);
                                        setCameraError(null);
                                    }}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                                >
                                    <option value="">Select type</option>
                                    {showUploadModal === 'document' ? (
                                        <>
                                            <option value="driving_license">Driving License</option>
                                            <option value="aadhar_card">Aadhar Card</option>
                                        </>
                                    ) : (
                                        <>
                                            <option value="video_before">Video Before Pickup</option>
                                            <option value="video_after">Video After Return</option>
                                            <option value="photo_before">Photo Before Pickup</option>
                                            <option value="photo_after">Photo After Return</option>
                                        </>
                                    )}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">File</label>
                                <div className="grid grid-cols-2 gap-2 mb-3">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setUploadInputMode('upload');
                                            setCameraError(null);
                                        }}
                                        className={`px-3 py-2 rounded-lg border text-sm font-medium transition ${uploadInputMode === 'upload'
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
                                            setUploadInputMode('camera');
                                        }}
                                        disabled={!uploadType}
                                        className={`px-3 py-2 rounded-lg border text-sm font-medium transition ${uploadInputMode === 'camera'
                                            ? 'border-primary-600 bg-primary-50 text-primary-700'
                                            : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                                    >
                                        Live Capture
                                    </button>
                                </div>

                                {uploadInputMode === 'camera' ? (
                                    <div className="space-y-3 rounded-lg border border-gray-200 p-3">
                                        <div className="overflow-hidden rounded-lg bg-gray-900 aspect-[4/3] flex items-center justify-center">
                                            {cameraError ? (
                                                <p className="px-4 text-center text-sm text-white/85">{cameraError}</p>
                                            ) : isCameraStarting ? (
                                                <div className="flex items-center text-sm text-white/85">
                                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                    Starting camera...
                                                </div>
                                            ) : (
                                                <video
                                                    ref={videoPreviewRef}
                                                    autoPlay
                                                    playsInline
                                                    muted
                                                    className="h-full w-full object-cover"
                                                />
                                            )}
                                        </div>
                                        <div className="flex gap-2 flex-wrap">
                                            {isVideoUploadType ? (
                                                <button
                                                    type="button"
                                                    onClick={isRecordingVideo ? stopVideoRecording : startVideoRecording}
                                                    disabled={Boolean(cameraError) || isCameraStarting}
                                                    className="flex-1 min-w-[140px] px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    {isRecordingVideo ? 'Stop Recording' : 'Record Video'}
                                                </button>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={capturePhoto}
                                                    disabled={Boolean(cameraError) || isCameraStarting}
                                                    className="flex-1 min-w-[140px] px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    Capture Photo
                                                </button>
                                            )}
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setUploadInputMode('upload');
                                                    setCameraError(null);
                                                }}
                                                className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                                            >
                                                Use Upload
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept={showUploadModal === 'document' ? 'image/*,.pdf' : isVideoUploadType ? 'video/*' : 'image/*'}
                                        onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                                    />
                                )}
                                {selectedFile && (
                                    <p className="text-sm text-gray-500 mt-1">
                                        Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                                    </p>
                                )}
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={resetUploadModal}
                                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleUpload}
                                    disabled={!selectedFile || !uploadType || uploadingDoc || uploadingMedia}
                                    className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                                >
                                    {(uploadingDoc || uploadingMedia) && (
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    )}
                                    Upload
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StaffBookingsPage;
