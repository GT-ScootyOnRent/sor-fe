import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { User, Phone, MapPin, Building, IdCard, Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/button';
import Header from '../components/Header';
import { useAppSelector } from '../store/hooks';
import { useGetBookingByIdQuery } from '../store/api/bookingApi';
import {
    useGetBookingCustomerDetailsQuery,
    useUpsertBookingCustomerDetailsMutation,
} from '../store/api/bookingCustomerDetailsApi';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { toast } from 'sonner';
import FormSubmittedModal from '../components/FormSubmittedModal';

interface FormData {
    address: string;
    hotelName: string;
    hotelAddress: string;
    drivingLicenseNo: string;
    friendFamilyContactNumber: string;
}

interface FormErrors {
    address?: string;
    drivingLicenseNo?: string;
}

export default function BookingFormPage() {
    const navigate = useNavigate();
    const { bookingId } = useParams<{ bookingId: string }>();
    const user = useAppSelector((state) => state.auth.user);

    const bookingIdNum = parseInt(bookingId || '0');

    const { data: booking, isLoading: isLoadingBooking } = useGetBookingByIdQuery(bookingIdNum, {
        skip: !bookingIdNum,
    });

    const { data: existingDetails, isLoading: isLoadingDetails } = useGetBookingCustomerDetailsQuery(
        bookingIdNum,
        { skip: !bookingIdNum }
    );

    const [upsertDetails, { isLoading: isSubmitting }] = useUpsertBookingCustomerDetailsMutation();

    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [formData, setFormData] = useState<FormData>({
        address: '',
        hotelName: '',
        hotelAddress: '',
        drivingLicenseNo: '',
        friendFamilyContactNumber: '',
    });
    const [errors, setErrors] = useState<FormErrors>({});

    // Pre-fill form with existing details
    useEffect(() => {
        if (existingDetails) {
            setFormData({
                address: existingDetails.guestAddress || '',
                hotelName: existingDetails.hotelName || '',
                hotelAddress: existingDetails.hotelAddress || '',
                drivingLicenseNo: existingDetails.drivingLicenseNo || '',
                friendFamilyContactNumber: existingDetails.friendFamilyContactNumber || '',
            });
        }
    }, [existingDetails]);

    const validateForm = (): boolean => {
        const newErrors: FormErrors = {};

        if (!formData.address.trim()) {
            newErrors.address = 'Address is required';
        }

        if (!formData.drivingLicenseNo.trim()) {
            newErrors.drivingLicenseNo = 'Driving license number is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            toast.error('Please fill all required fields correctly');
            return;
        }

        try {
            await upsertDetails({
                bookingId: bookingIdNum,
                data: {
                    address: formData.address.trim(),
                    hotelName: formData.hotelName.trim() || null,
                    hotelAddress: formData.hotelAddress.trim() || null,
                    drivingLicenseNo: formData.drivingLicenseNo.trim(),
                    friendFamilyContactNumber: formData.friendFamilyContactNumber.trim() || null,
                },
            }).unwrap();

            setShowSuccessModal(true);
        } catch (error: any) {
            const errorMessage =
                error?.data?.error || error?.data?.message || 'Failed to submit booking details';
            toast.error('Submission Failed', { description: errorMessage });
        }
    };

    const handleInputChange = (field: keyof FormData, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        // Clear error when user starts typing
        if (errors[field as keyof FormErrors]) {
            setErrors((prev) => ({ ...prev, [field]: undefined }));
        }
    };

    if (isLoadingBooking || isLoadingDetails) {
        return <LoadingSpinner fullScreen message="Loading booking details..." />;
    }

    if (!booking) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Header />
                <div className="container mx-auto px-4 py-12 max-w-2xl text-center">
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">Booking Not Found</h1>
                    <p className="text-gray-600 mb-6">
                        The booking you're looking for doesn't exist or you don't have access to it.
                    </p>
                    <Button
                        onClick={() => navigate('/profile')}
                        className="bg-primary-500 hover:bg-primary-600"
                    >
                        Go to My Bookings
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-green-50">
            <Header />

            <div className="container mx-auto px-4 py-8 max-w-2xl">
                {/* Back Button */}
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                    <span>Back</span>
                </button>

                {/* Page Header */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-6">
                    <div className="text-center">
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">📝 Booking Details Form</h1>
                        {((booking as any)?.vehicleRegistrationNumber || (booking as any)?.vehicleName) && (
                            <p className="text-primary-600 font-medium">
                                Vehicle: {(booking as any).vehicleRegistrationNumber || 'N/A'}
                                {(booking as any)?.vehicleName && ` (${(booking as any).vehicleName})`}
                            </p>
                        )}
                    </div>
                </div>

                {/* Form Card */}
                <form
                    onSubmit={handleSubmit}
                    className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden"
                >
                    <div className="bg-gradient-to-r from-primary-500 to-primary-600 px-6 py-4 text-white">
                        <h2 className="text-lg font-bold">Customer Details</h2>
                        <p className="text-sm text-primary-100">Fields marked with * are required</p>
                    </div>

                    <div className="p-6 space-y-5">
                        {/* User Info (Read-only display) */}
                        <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-xl">
                            <div>
                                <label className="flex items-center gap-2 text-xs font-medium text-gray-500 mb-1">
                                    <User className="w-3 h-3" />
                                    Name
                                </label>
                                <p className="font-semibold text-gray-900">{user?.name || 'N/A'}</p>
                            </div>
                            <div>
                                <label className="flex items-center gap-2 text-xs font-medium text-gray-500 mb-1">
                                    <Phone className="w-3 h-3" />
                                    Phone
                                </label>
                                <p className="font-semibold text-gray-900">{user?.phone || 'N/A'}</p>
                            </div>
                        </div>

                        {/* Address */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                <MapPin className="w-4 h-4 text-gray-500" />
                                Address *
                            </label>
                            <textarea
                                value={formData.address}
                                onChange={(e) => handleInputChange('address', e.target.value)}
                                placeholder="Enter your complete address"
                                rows={3}
                                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none ${errors.address ? 'border-red-500 bg-red-50' : 'border-gray-200'
                                    }`}
                            />
                            {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address}</p>}
                        </div>

                        {/* Driving License */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                <IdCard className="w-4 h-4 text-gray-500" />
                                Driving License Number *
                            </label>
                            <input
                                type="text"
                                value={formData.drivingLicenseNo}
                                onChange={(e) => handleInputChange('drivingLicenseNo', e.target.value.toUpperCase())}
                                placeholder="e.g., DL-0420110012345"
                                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all uppercase ${errors.drivingLicenseNo ? 'border-red-500 bg-red-50' : 'border-gray-200'
                                    }`}
                            />
                            {errors.drivingLicenseNo && (
                                <p className="text-red-500 text-sm mt-1">{errors.drivingLicenseNo}</p>
                            )}
                        </div>

                        {/* Divider */}
                        <div className="border-t border-gray-200 pt-5">
                            <p className="text-sm text-gray-500 mb-4">
                                If you're staying at a hotel, please provide the details below (optional)
                            </p>
                        </div>

                        {/* Hotel Name */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                <Building className="w-4 h-4 text-gray-500" />
                                Hotel Name
                            </label>
                            <input
                                type="text"
                                value={formData.hotelName}
                                onChange={(e) => handleInputChange('hotelName', e.target.value)}
                                placeholder="Enter hotel name (optional)"
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                            />
                        </div>

                        {/* Hotel Address */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                <MapPin className="w-4 h-4 text-gray-500" />
                                Hotel Address
                            </label>
                            <textarea
                                value={formData.hotelAddress}
                                onChange={(e) => handleInputChange('hotelAddress', e.target.value)}
                                placeholder="Enter hotel address (optional)"
                                rows={2}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none"
                            />
                        </div>

                        {/* Emergency Contact */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                <Phone className="w-4 h-4 text-gray-500" />
                                Emergency Contact (Friend/Family)
                            </label>
                            <input
                                type="tel"
                                value={formData.friendFamilyContactNumber}
                                onChange={(e) => handleInputChange('friendFamilyContactNumber', e.target.value)}
                                placeholder="Enter emergency contact number (optional)"
                                maxLength={10}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                            />
                        </div>

                        {/* Note about documents */}
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
                            <p className="font-semibold mb-1">⚠️ Note:</p>
                            <p>
                                We will collect hard-copy documents at the time of pickup (DL, ID Proof, ₹2,000
                                Security Deposit)
                            </p>
                        </div>

                        {/* Submit Button */}
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full bg-primary-500 hover:bg-primary-600 text-white py-4 rounded-xl font-semibold text-lg"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                    Submitting...
                                </>
                            ) : existingDetails ? (
                                'Update Details'
                            ) : (
                                'Submit Details'
                            )}
                        </Button>
                    </div>
                </form>
            </div>

            {/* Success Modal */}
            <FormSubmittedModal isOpen={showSuccessModal} onClose={() => setShowSuccessModal(false)} />
        </div>
    );
}
