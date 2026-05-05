import React, { useMemo, useState, useRef } from 'react';
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
            <h1 className="text-3xl font-bold text-gray-900 mb-3">Bookings</h1>

            {/* 7-day restriction banner */}
            <div className="flex items-start gap-2 mb-5 px-4 py-3 rounded-lg bg-primary-50 border border-primary-100 text-sm text-primary-700">
                <Info className="w-4 h-4 mt-0.5 shrink-0" />
                <span>
                    Showing bookings from the last 7 days only. Contact an administrator
                    if you need access to older bookings.
                </span>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3 mb-6 items-end">
                <div className="flex-1 min-w-[260px] relative max-w-md">
                    <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by vehicle, customer, phone, or booking ID..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                    />
                </div>
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                </select>
                <div className="flex flex-col">
                    <label className="text-xs text-gray-500 mb-1">From</label>
                    <input
                        type="date"
                        value={startDate}
                        min={minYmd}
                        max={endDate || todayYmd}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                    />
                </div>
                <div className="flex flex-col">
                    <label className="text-xs text-gray-500 mb-1">To</label>
                    <input
                        type="date"
                        value={endDate}
                        min={startDate || minYmd}
                        max={todayYmd}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                    />
                </div>
                <p className="w-full text-xs text-gray-500 mt-1">
                    Date range is restricted to the last 7 days
                    ({minYmd} → {todayYmd}).
                </p>
            </div>

            {/* Bookings Table */}
            {isLoading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
                </div>
            ) : filteredBookings.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                    <Calendar className="w-12 h-12 mb-3 text-gray-400" />
                    <p className="text-lg font-medium">No bookings found</p>
                    <p className="text-sm">Bookings from your city will appear here.</p>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-md overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-gray-50 text-gray-600 uppercase text-xs">
                                <th className="px-5 py-3 text-left">Booking ID</th>
                                <th className="px-5 py-3 text-left">Vehicle</th>
                                <th className="px-5 py-3 text-left">Customer</th>
                                <th className="px-5 py-3 text-left">Dates</th>
                                <th className="px-5 py-3 text-left">Amount</th>
                                <th className="px-5 py-3 text-left">Status</th>
                                <th className="px-5 py-3 text-left">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredBookings.map((booking) => (
                                <tr key={booking.id} className="hover:bg-gray-50 transition">
                                    <td className="px-5 py-4">
                                        <div className="flex flex-col gap-1">
                                            <p className="font-medium text-gray-900">#{booking.id}</p>
                                            {booking.isOfflineBooking && (
                                                <span className="inline-flex w-fit rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                                                    Offline Booking
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-5 py-4">
                                        <p className="font-medium text-gray-900">{booking.vehicleName || 'N/A'}</p>
                                        <p className="text-xs text-gray-500">{booking.vehicleNumber}</p>
                                    </td>
                                    <td className="px-5 py-4">
                                        <p className="text-gray-900">{booking.userName || 'Customer'}</p>
                                        <p className="text-xs text-gray-500">{booking.userPhone}</p>
                                        {booking.friendFamilyContactNumber && (
                                            <p className="text-xs text-gray-500 mt-0.5">
                                                <span className="font-medium text-gray-400">F&amp;F:</span>{' '}
                                                {booking.friendFamilyContactNumber}
                                            </p>
                                        )}
                                    </td>
                                    <td className="px-5 py-4 text-gray-600">
                                        <p>{formatDate(booking.startDate)}</p>
                                        <p className="text-xs text-gray-400">to {formatDate(booking.endDate)}</p>
                                    </td>
                                    <td className="px-5 py-4 font-medium text-gray-900">₹{booking.totalAmount}</td>
                                    <td className="px-5 py-4">
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
                                    <td className="px-5 py-4">
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
            )}
        </div>
    );
};

// ── Booking Detail ─────────────────────────────────────────────────────────

interface BookingDetailProps {
    bookingId: number;
    onBack: () => void;
}

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
    const fileInputRef = useRef<HTMLInputElement>(null);

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
            setShowUploadModal(null);
            setSelectedFile(null);
            setUploadType('');
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
                                onClick={() => {
                                    setShowUploadModal(null);
                                    setSelectedFile(null);
                                    setUploadType('');
                                }}
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
                                    onChange={(e) => setUploadType(e.target.value)}
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
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept={showUploadModal === 'document' ? 'image/*,.pdf' : 'image/*,video/*'}
                                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                                />
                                {selectedFile && (
                                    <p className="text-sm text-gray-500 mt-1">
                                        Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                                    </p>
                                )}
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowUploadModal(null);
                                        setSelectedFile(null);
                                        setUploadType('');
                                    }}
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
