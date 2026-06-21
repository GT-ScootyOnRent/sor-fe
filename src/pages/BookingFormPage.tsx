import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useJsApiLoader } from '@react-google-maps/api';
import { User, Phone, MapPin, Building, IdCard, Loader2, ArrowLeft, Search } from 'lucide-react';
import { Button } from '../components/ui/button';
import Header from '../components/Header';
import { useAppSelector } from '../store/hooks';
import { useGetBookingByIdQuery } from '../store/api/bookingApi';
import { API_CONFIG } from '../config/api.config';
import {
    useGetBookingCustomerDetailsQuery,
    useUpsertBookingCustomerDetailsMutation,
} from '../store/api/bookingCustomerDetailsApi';
import { useGetCityByIdQuery } from '../store/api/cityApi';
import { useGetPickupLocationByIdQuery } from '../store/api/pickupLocationApi';
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

interface HotelSuggestion {
    id: string;
    label: string;
    supportingText: string;
    placePrediction: GooglePlacePrediction;
}

type GoogleAutocompleteSessionTokenConstructor = new () => unknown;

type GoogleAutocompleteSuggestionFetcher = {
    fetchAutocompleteSuggestions: (request: {
        input: string;
        includedRegionCodes?: string[];
        includedPrimaryTypes?: string[];
        locationRestriction?: google.maps.LatLngBoundsLiteral;
        sessionToken?: unknown;
    }) => Promise<{
        suggestions: Array<{
            placePrediction?: GooglePlacePrediction;
        }>;
    }>;
};

type GooglePlacePrediction = {
    placeId?: string;
    text?: { toString: () => string };
    mainText?: { toString: () => string };
    secondaryText?: { toString: () => string };
    toPlace: () => {
        displayName?: string;
        formattedAddress?: string;
        location?: google.maps.LatLng | google.maps.LatLngLiteral;
        fetchFields: (options: { fields: string[] }) => Promise<void>;
    };
};

const HOTEL_PRIMARY_TYPES = ['hotel', 'lodging', 'resort_hotel', 'inn', 'guest_house'] as const;
const AUTOCOMPLETE_DEBOUNCE_MS = 250;

export default function BookingFormPage() {
    const navigate = useNavigate();
    const { bookingId } = useParams<{ bookingId: string }>();
    const user = useAppSelector((state) => state.auth.user);
    const selectedCity = useAppSelector((state) => state.city.selectedCity);
    const hotelSearchSessionTokenRef = useRef<unknown | null>(null);
    const hotelSearchBoundsRef = useRef<google.maps.LatLngBoundsLiteral | null>(null);
    const hotelRequestCounterRef = useRef(0);
    const hotelSearchDebounceRef = useRef<number | null>(null);
    const hotelSuggestionsWrapperRef = useRef<HTMLDivElement | null>(null);

    const bookingIdNum = parseInt(bookingId || '0');

    const { data: booking, isLoading: isLoadingBooking } = useGetBookingByIdQuery(bookingIdNum, {
        skip: !bookingIdNum,
    });

    const { data: existingDetails, isLoading: isLoadingDetails } = useGetBookingCustomerDetailsQuery(
        bookingIdNum,
        { skip: !bookingIdNum }
    );

    const { data: pickupLocation } = useGetPickupLocationByIdQuery(booking?.pickupLocationId ?? 0, {
        skip: !booking?.pickupLocationId,
    });

    const { data: bookingCity } = useGetCityByIdQuery(pickupLocation?.cityId ?? 0, {
        skip: !pickupLocation?.cityId,
    });

    const [upsertDetails, { isLoading: isSubmitting }] = useUpsertBookingCustomerDetailsMutation();

    const { isLoaded: isGooglePlacesLoaded, loadError: googlePlacesLoadError } = useJsApiLoader({
        id: 'google-maps-script',
        googleMapsApiKey: API_CONFIG.GOOGLE_MAPS_KEY,
    });

    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [formData, setFormData] = useState<FormData>({
        address: '',
        hotelName: '',
        hotelAddress: '',
        drivingLicenseNo: '',
        friendFamilyContactNumber: '',
    });
    const [errors, setErrors] = useState<FormErrors>({});
    const [hasGoogleAuthFailure, setHasGoogleAuthFailure] = useState(false);
    const [hotelSearchInput, setHotelSearchInput] = useState('');
    const [hotelSuggestions, setHotelSuggestions] = useState<HotelSuggestion[]>([]);
    const [isHotelSuggestionsOpen, setIsHotelSuggestionsOpen] = useState(false);
    const [isLoadingHotelSuggestions, setIsLoadingHotelSuggestions] = useState(false);
    const [hasHotelSearchCompleted, setHasHotelSearchCompleted] = useState(false);
    const hotelSearchCity = bookingCity?.name || selectedCity?.name || '';
    const isHotelAutocompleteAvailable =
        Boolean(API_CONFIG.GOOGLE_MAPS_KEY) &&
        isGooglePlacesLoaded &&
        !googlePlacesLoadError &&
        !hasGoogleAuthFailure;

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
            setHotelSearchInput(existingDetails.hotelName || '');
        }
    }, [existingDetails]);

    useEffect(() => {
        const googleWindow = window as Window & { gm_authFailure?: () => void };
        const previousAuthFailureHandler = googleWindow.gm_authFailure;

        googleWindow.gm_authFailure = () => {
            setHasGoogleAuthFailure(true);
            previousAuthFailureHandler?.();
        };

        return () => {
            googleWindow.gm_authFailure = previousAuthFailureHandler;
        };
    }, []);

    useEffect(() => {
        if (!isHotelAutocompleteAvailable || !hotelSearchCity) {
            return;
        }

        const geocoder = new google.maps.Geocoder();

        geocoder.geocode({ address: `${hotelSearchCity}, India` }, (results, status) => {
            if (status !== google.maps.GeocoderStatus.OK || !results?.[0]) {
                return;
            }

            const viewport = results[0].geometry.viewport;
            if (viewport) {
                hotelSearchBoundsRef.current = {
                    east: viewport.getNorthEast().lng(),
                    west: viewport.getSouthWest().lng(),
                    north: viewport.getNorthEast().lat(),
                    south: viewport.getSouthWest().lat(),
                };
            }
        });
    }, [hotelSearchCity, isHotelAutocompleteAvailable]);

    useEffect(() => {
        if (!isHotelAutocompleteAvailable) {
            return;
        }

        let isCancelled = false;

        const initializeSessionToken = async () => {
            const placesLibrary = await google.maps.importLibrary('places');
            if (isCancelled) {
                return;
            }

            const { AutocompleteSessionToken } = placesLibrary as unknown as {
                AutocompleteSessionToken: GoogleAutocompleteSessionTokenConstructor;
            };

            hotelSearchSessionTokenRef.current = new AutocompleteSessionToken();
        };

        initializeSessionToken().catch(() => {
            if (!isCancelled) {
                setHasGoogleAuthFailure(true);
            }
        });

        return () => {
            isCancelled = true;
            hotelSearchSessionTokenRef.current = null;
        };
    }, [isHotelAutocompleteAvailable]);

    useEffect(() => {
        const currentInput = hotelSearchInput.trim();

        if (!isHotelAutocompleteAvailable || currentInput.length < 2) {
            setHotelSuggestions([]);
            setIsHotelSuggestionsOpen(false);
            setIsLoadingHotelSuggestions(false);
            setHasHotelSearchCompleted(false);
            return;
        }

        if (hotelSearchDebounceRef.current) {
            window.clearTimeout(hotelSearchDebounceRef.current);
        }

        hotelSearchDebounceRef.current = window.setTimeout(() => {
            const requestId = ++hotelRequestCounterRef.current;
            setIsLoadingHotelSuggestions(true);

            const fetchSuggestions = async () => {
                const placesLibrary = await google.maps.importLibrary('places');
                const { AutocompleteSuggestion, AutocompleteSessionToken } = placesLibrary as unknown as {
                    AutocompleteSuggestion: GoogleAutocompleteSuggestionFetcher;
                    AutocompleteSessionToken: GoogleAutocompleteSessionTokenConstructor;
                };

                if (!hotelSearchSessionTokenRef.current) {
                    hotelSearchSessionTokenRef.current = new AutocompleteSessionToken();
                }

                const searchQuery = hotelSearchCity
                    ? `${currentInput} ${hotelSearchCity}`
                    : currentInput;

                const { suggestions } = await AutocompleteSuggestion.fetchAutocompleteSuggestions({
                    input: searchQuery,
                    includedRegionCodes: ['in'],
                    includedPrimaryTypes: [...HOTEL_PRIMARY_TYPES],
                    locationRestriction: hotelSearchBoundsRef.current ?? undefined,
                    sessionToken: hotelSearchSessionTokenRef.current,
                });

                if (requestId !== hotelRequestCounterRef.current) {
                    return;
                }

                const nextSuggestions = suggestions
                    .map((suggestion) => suggestion.placePrediction)
                    .filter((prediction): prediction is GooglePlacePrediction => Boolean(prediction))
                    .map((prediction) => {
                        const label = prediction.mainText?.toString() || prediction.text?.toString() || '';
                        const supportingText = prediction.secondaryText?.toString() || '';
                        return {
                            id: prediction.placeId || `${label}-${supportingText}`,
                            label,
                            supportingText,
                            placePrediction: prediction,
                        } satisfies HotelSuggestion;
                    })
                    .slice(0, 6);

                setHotelSuggestions(nextSuggestions);
                setHasHotelSearchCompleted(true);
                setIsHotelSuggestionsOpen(true);
            };

            fetchSuggestions()
                .catch(() => {
                    if (requestId === hotelRequestCounterRef.current) {
                        setHasGoogleAuthFailure(true);
                        setHotelSuggestions([]);
                        setIsHotelSuggestionsOpen(false);
                        setHasHotelSearchCompleted(false);
                    }
                })
                .finally(() => {
                    if (requestId === hotelRequestCounterRef.current) {
                        setIsLoadingHotelSuggestions(false);
                    }
                });
        }, AUTOCOMPLETE_DEBOUNCE_MS);

        return () => {
            if (hotelSearchDebounceRef.current) {
                window.clearTimeout(hotelSearchDebounceRef.current);
                hotelSearchDebounceRef.current = null;
            }
        };
    }, [hotelSearchInput, hotelSearchCity, isHotelAutocompleteAvailable]);

    useEffect(() => {
        const handlePointerDown = (event: MouseEvent) => {
            if (!hotelSuggestionsWrapperRef.current?.contains(event.target as Node)) {
                setIsHotelSuggestionsOpen(false);
            }
        };

        document.addEventListener('mousedown', handlePointerDown);
        return () => document.removeEventListener('mousedown', handlePointerDown);
    }, []);

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

    const resetHotelSessionToken = async () => {
        const placesLibrary = await google.maps.importLibrary('places');
        const { AutocompleteSessionToken } = placesLibrary as unknown as {
            AutocompleteSessionToken: GoogleAutocompleteSessionTokenConstructor;
        };

        hotelSearchSessionTokenRef.current = new AutocompleteSessionToken();
    };

    const handleHotelSearchChange = (value: string) => {
        setHotelSearchInput(value);
        handleInputChange('hotelName', value);

        if (!value.trim()) {
            handleInputChange('hotelAddress', '');
            setHotelSuggestions([]);
            setIsHotelSuggestionsOpen(false);
            setHasHotelSearchCompleted(false);
            void resetHotelSessionToken();
        }
    };

    const handleHotelSuggestionSelect = async (suggestion: HotelSuggestion) => {
        try {
            const place = suggestion.placePrediction.toPlace();
            await place.fetchFields({ fields: ['displayName', 'formattedAddress'] });

            const selectedHotelName = place.displayName || suggestion.label;
            const selectedHotelAddress = place.formattedAddress || suggestion.supportingText;

            setHotelSearchInput(selectedHotelName);
            handleInputChange('hotelName', selectedHotelName);
            handleInputChange('hotelAddress', selectedHotelAddress);
            setHotelSuggestions([]);
            setIsHotelSuggestionsOpen(false);
            setHasHotelSearchCompleted(false);
            await resetHotelSessionToken();
        } catch {
            toast.error('Could not load hotel details. You can still enter them manually.');
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

            <div className="container mx-auto max-w-2xl px-4 py-6 sm:py-8">
                {/* Back Button */}
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                    <span>Back</span>
                </button>

                {/* Page Header */}
                <div className="mb-6 rounded-2xl border border-gray-100 bg-white p-5 shadow-lg sm:p-6">
                    <div className="text-center">
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">📝 Booking Details Form</h1>
                        {(booking as any)?.vehicleName && (
                            <p className="text-primary-600 font-medium">
                                Vehicle: {(booking as any).vehicleName}
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

                    <div className="space-y-5 p-5 sm:p-6">
                        {/* User Info (Read-only display) */}
                        <div className="grid grid-cols-1 gap-4 rounded-xl bg-gray-50 p-4 sm:grid-cols-2">
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
                            <div ref={hotelSuggestionsWrapperRef} className="relative">
                                <div className="relative">
                                    <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        value={hotelSearchInput}
                                        onChange={(e) => handleHotelSearchChange(e.target.value)}
                                        onFocus={() => {
                                            if (hotelSuggestions.length > 0) {
                                                setIsHotelSuggestionsOpen(true);
                                            }
                                        }}
                                        placeholder={
                                            isHotelAutocompleteAvailable
                                                ? `Search hotels in ${hotelSearchCity || 'your booking city'}`
                                                : 'Enter hotel name (optional)'
                                        }
                                        autoComplete="off"
                                        className="w-full rounded-xl border border-gray-200 py-3 pr-4 pl-11 text-base transition-all focus:border-transparent focus:ring-2 focus:ring-primary-500"
                                    />
                                    {isLoadingHotelSuggestions && (
                                        <Loader2 className="absolute top-1/2 right-4 h-4 w-4 -translate-y-1/2 animate-spin text-primary-500" />
                                    )}
                                </div>

                                {isHotelAutocompleteAvailable && isHotelSuggestionsOpen && (
                                    <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
                                        {hotelSuggestions.length > 0 ? (
                                            <div className="py-1 sm:py-2">
                                                {hotelSuggestions.map((suggestion) => (
                                                    <button
                                                        key={suggestion.id}
                                                        type="button"
                                                        onClick={() => void handleHotelSuggestionSelect(suggestion)}
                                                        className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50 sm:py-3"
                                                    >
                                                        <Building className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                                                        <span className="min-w-0">
                                                            <span className="block text-sm font-medium text-gray-900">
                                                                {suggestion.label}
                                                            </span>
                                                            <span className="block text-xs leading-5 text-gray-500">
                                                                {suggestion.supportingText}
                                                            </span>
                                                        </span>
                                                    </button>
                                                ))}
                                            </div>
                                        ) : hasHotelSearchCompleted && !isLoadingHotelSuggestions ? (
                                            <div className="px-4 py-3 text-sm text-gray-500">
                                                No hotels found in {hotelSearchCity || 'the selected city'} yet. You can continue typing manually.
                                            </div>
                                        ) : null}
                                    </div>
                                )}
                            </div>
                            {isHotelAutocompleteAvailable && (
                                <p className="mt-2 text-xs text-gray-500">
                                    Suggestions use Google autocomplete data and are filtered for hotels in {hotelSearchCity || 'the selected city'}.
                                </p>
                            )}
                            {!API_CONFIG.GOOGLE_MAPS_KEY && (
                                <p className="mt-2 text-xs text-amber-700">
                                    Hotel suggestions are unavailable until a Google Maps key is configured. Manual entry still works.
                                </p>
                            )}
                            {googlePlacesLoadError && (
                                <p className="mt-2 text-xs text-amber-700">
                                    Google Places failed to load, so hotel details need to be entered manually.
                                </p>
                            )}
                            {hasGoogleAuthFailure && (
                                <p className="mt-2 text-xs text-amber-700">
                                    Google rejected the configured Maps key for this site. Hotel suggestions are disabled until billing, API access, and allowed referrers are fixed.
                                </p>
                            )}
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
                                We will collect hard-copy documents at the time of pickup (DL, ID Proof
                                {booking?.securityDepositMode === 'pickup' ? ', ₹2,000 Security Deposit' : ''})
                            </p>
                            {booking?.securityDepositMode === 'online' && (
                                <p className="text-green-700 mt-1">✓ Security deposit already paid online</p>
                            )}
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
            <FormSubmittedModal 
                isOpen={showSuccessModal} 
                onClose={() => setShowSuccessModal(false)}
                securityDepositMode={booking?.securityDepositMode as 'online' | 'pickup' | undefined}
            />
        </div>
    );
}
