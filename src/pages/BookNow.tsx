import { useState, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Calendar, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import Header from '../components/Header';
import BackgroundSlideshow from '../components/BackgroundSlideshow';
import PaymentModal from '../components/PaymentModal';
import PriceCalculator from '../components/PriceCalculator';
import PickupLocationCard from '../components/PickupLocationCard';
import PickupLocationModal from '../components/PickupLocationModal';
import LoginModal from '../components/LoginModal';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorMessage } from '../components/ErrorMessage';
import { useGetVehicleByIdQuery } from '../store/api/vehicleApi';
import { useCreateBookingMutation } from '../store/api/bookingApi';
import { useGetPickupLocationByIdQuery } from '../store/api/pickupLocationApi';
import type { PickupLocationDto } from '../store/api/pickupLocationApi';
import { useAppSelector } from '../store/hooks';
import { calculateTotalPrice, calculateDuration } from '../utils/vehicleUtils';
import { toast } from 'sonner';

export default function BookNow() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAppSelector((state) => state.auth);
  const selectedCity = useAppSelector((state) => state.city.selectedCity);

  // Pre-fill from URL search params (passed from VehicleListingPage)
  const startDateParam = searchParams.get('startDate');
  const startTimeParam = searchParams.get('startTime');
  const endDateParam = searchParams.get('endDate');
  const endTimeParam = searchParams.get('endTime');
  const packagePriceParam = searchParams.get('packagePrice');
  const packageLabelParam = searchParams.get('packageLabel');
  const pickupLocationIdParam = searchParams.get('pickupLocationId');
  const cityIdParam = searchParams.get('cityId');

  // Refs for auto-focus
  const returnDateRef = useRef<HTMLInputElement>(null);
  const returnTimeRef = useRef<HTMLInputElement>(null);

  // Helper to get default pickup time (current time + 1 hour)
  const getDefaultPickupTime = () => {
    const now = new Date();
    now.setHours(now.getHours() + 1);
    return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  };

  // Default dates: if no URL params, pre-fill pickup with today + 1 hour buffer
  const defaultStartDate = startDateParam || new Date().toISOString().split('T')[0];
  const defaultStartTime = startTimeParam || getDefaultPickupTime();
  const defaultEndDate = endDateParam || ''; // Let user fill return date
  const defaultEndTime = endTimeParam || '23:30'; // Default 11:30 PM

  const [bookingDates, setBookingDates] = useState({
    startDate: defaultStartDate,
    startTime: defaultStartTime,
    endDate: defaultEndDate,
    endTime: defaultEndTime,
  });

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [createdBookingId, setCreatedBookingId] = useState<number | null>(null);
  const [finalBookingAmount, setFinalBookingAmount] = useState<number>(0);
  const [selectedPickup, setSelectedPickup] = useState<string>(pickupLocationIdParam || '');
  const [includeSecondHelmet, setIncludeSecondHelmet] = useState(false);
  const [showPickupModal, setShowPickupModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [pendingBookingAmount, setPendingBookingAmount] = useState<number | null>(null);

  // Package pricing state - reset when user changes dates
  const [activePackagePrice, setActivePackagePrice] = useState<number | null>(
    packagePriceParam ? parseInt(packagePriceParam) : null
  );
  const [activePackageLabel, setActivePackageLabel] = useState<string | null>(
    packageLabelParam || null
  );

  // Helper to get minimum allowed time (current time + 1 hour buffer)
  const getMinTimeForToday = () => {
    const now = new Date();
    now.setHours(now.getHours() + 1);
    return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  };

  const getTodayDate = () => new Date().toISOString().split('T')[0];

  // Handler to clear package pricing when user changes dates
  const handleDateChange = (newDates: typeof bookingDates, fieldChanged?: string) => {
    const today = getTodayDate();
    const minTimeToday = getMinTimeForToday();

    // Validate and auto-correct start time if it's today and time is in the past
    if (newDates.startDate === today && newDates.startTime && newDates.startTime < minTimeToday) {
      newDates.startTime = minTimeToday;
    }

    // Validate and auto-correct end time if it's today
    if (newDates.endDate === today && newDates.endTime) {
      // If same day as start, end time must be after start time
      if (newDates.startDate === newDates.endDate && newDates.startTime) {
        const minEndTime = newDates.startTime > minTimeToday ? newDates.startTime : minTimeToday;
        if (newDates.endTime < minEndTime) {
          newDates.endTime = minEndTime;
        }
      } else if (newDates.endTime < minTimeToday) {
        newDates.endTime = minTimeToday;
      }
    }

    // Auto-focus: pickup date → return date, pickup time → return time
    if (fieldChanged === 'startDate' && newDates.startDate) {
      setTimeout(() => {
        returnDateRef.current?.showPicker?.();
        returnDateRef.current?.focus();
      }, 100);
    } else if (fieldChanged === 'startTime' && newDates.startTime) {
      setTimeout(() => {
        returnTimeRef.current?.showPicker?.();
        returnTimeRef.current?.focus();
      }, 100);
    }

    // If dates are different from original URL params, clear package pricing
    if (
      newDates.startDate !== startDateParam ||
      newDates.endDate !== endDateParam ||
      newDates.startTime !== startTimeParam ||
      newDates.endTime !== endTimeParam
    ) {
      setActivePackagePrice(null);
      setActivePackageLabel(null);
    }
    setBookingDates(newDates);
  };

  const { data: vehicleData, isLoading: vehicleLoading, error: vehicleError } =
    useGetVehicleByIdQuery(parseInt(id || '0'));

  // Fetch pickup location details if we have a pickupLocationId
  const { data: pickupLocationData, isLoading: pickupLocationLoading } = useGetPickupLocationByIdQuery(
    parseInt(selectedPickup || '0'),
    { skip: !selectedPickup }
  );

  const [createBooking, { isLoading: bookingLoading }] = useCreateBookingMutation();

  // Handle pickup location change from modal
  const handlePickupLocationChange = (location: PickupLocationDto) => {
    setSelectedPickup(location.id.toString());
    // Update URL with new pickupLocationId
    const newParams = new URLSearchParams(searchParams);
    newParams.set('pickupLocationId', location.id.toString());
    setSearchParams(newParams, { replace: true });
    setShowPickupModal(false);
  };

  const calculateTotalHours = () => {
    if (
      !bookingDates.startDate ||
      !bookingDates.startTime ||
      !bookingDates.endDate ||
      !bookingDates.endTime
    )
      return 0;
    return calculateDuration(
      bookingDates.startDate,
      bookingDates.startTime,
      bookingDates.endDate,
      bookingDates.endTime
    );
  };

  const calculateTotal = () => {
    if (
      !vehicleData ||
      !bookingDates.startDate ||
      !bookingDates.startTime ||
      !bookingDates.endDate ||
      !bookingDates.endTime
    )
      return 0;
    return calculateTotalPrice(
      vehicleData.pricePerHour,
      bookingDates.startDate,
      bookingDates.startTime,
      bookingDates.endDate,
      bookingDates.endTime
    );
  };

  // Called by PriceCalculator with the final discounted+GST amount
  const handleBooking = async (finalAmount?: number) => {
    // If not logged in — save booking intent then redirect to login
    if (!user) {
      // Save the pending amount and show login modal
      setPendingBookingAmount(finalAmount ?? null);
      setShowLoginModal(true);
      return;
    }


    if (!vehicleData) return;

    // Validate fields
    if (!bookingDates.startDate || !bookingDates.startTime || !bookingDates.endDate || !bookingDates.endTime) {
      toast.error('Please fill all date and time fields');
      return;
    }

    const duration = calculateTotalHours();
    if (duration < vehicleData.minBookingHours) {
      toast.error(`Minimum booking duration is ${vehicleData.minBookingHours} hours`);
      return;
    }

    if (!selectedPickup) {
      toast.error('Please select a pickup location');
      return;
    }

    try {
      // Use the discounted final amount if provided, otherwise fall back to base calculated total
      const amountToCharge = finalAmount ?? calculateTotal();

      const bookingRequest = {
        vehicleId: vehicleData.id,
        userId: user.id,
        pickupLocationId: parseInt(selectedPickup),
        bookingStartDate: bookingDates.startDate,
        bookingEndDate: bookingDates.endDate,
        startTime: bookingDates.startTime,
        endTime: bookingDates.endTime,
        totalAmount: amountToCharge,
        includeSecondHelmet,
      };

      const result = await createBooking(bookingRequest).unwrap();

      // Store the final amount and booking ID, then open payment modal
      setFinalBookingAmount(amountToCharge);
      setCreatedBookingId(result.id!);
      setShowPaymentModal(true);
    } catch (error: any) {
      console.error('Booking error:', error);
      toast.error('Booking Failed', {
        description: error?.data?.error || error?.data?.message || 'Failed to create booking. Please try again.',
      });
    }
  };

  const handlePaymentSuccess = () => {
    setShowPaymentModal(false);
    toast.success('Booking Confirmed!', { description: 'Your payment was successful' });
    // Navigate to dynamic booking success page with all details
    navigate(`/booking-success?bookingId=${createdBookingId}&amount=${finalBookingAmount}`);
  };

  const handlePaymentFailure = (error: string) => {
    setShowPaymentModal(false);
    toast.error('Payment Failed', { description: error });
  };

  // Handle successful login - continue the booking process
  const handleLoginSuccess = () => {
    setShowLoginModal(false);
    // Re-trigger booking with the pending amount
    if (pendingBookingAmount !== null) {
      handleBooking(pendingBookingAmount);
    } else {
      handleBooking();
    }
    setPendingBookingAmount(null);
  };

  if (vehicleLoading) return <LoadingSpinner fullScreen message="Loading vehicle details..." />;
  if (vehicleError || !vehicleData)
    return <ErrorMessage fullScreen message="Failed to load vehicle details" onRetry={() => navigate(-1)} />;

  const totalHours = calculateTotalHours();

  return (
    <div className="min-h-screen bg-white relative">
      <BackgroundSlideshow />
      <div className="relative z-10">
        <Header />

        <div className="container mx-auto px-4 py-6 sm:py-8">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-4 text-primary-500 hover:text-primary-600"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl text-black mb-6 sm:mb-8">Complete Your Booking</h1>

          <div className="max-w-3xl mx-auto space-y-6">

            {/* Pickup Location Card */}
            {pickupLocationData ? (
              <div>
                <h3 className="text-xl text-black mb-4">Pickup Location</h3>
                <PickupLocationCard
                  location={pickupLocationData}
                  onChangeLocation={() => setShowPickupModal(true)}
                />
              </div>
            ) : pickupLocationLoading ? (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <p className="text-gray-500">Loading pickup location...</p>
              </div>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-yellow-600" />
                  <p className="text-yellow-800 font-medium">No pickup location selected</p>
                </div>
                <p className="text-yellow-700 text-sm mt-1">Please go back and select a pickup location.</p>
                <Button
                  variant="outline"
                  onClick={() => navigate(-1)}
                  className="mt-3"
                >
                  Go Back
                </Button>
              </div>
            )}

            {/* Vehicle Details Card */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex gap-4">
                <img
                  src={vehicleData.primaryImageUrl || vehicleData.images?.[0]?.imageUrl || '/placeholder.jpg'}
                  alt={vehicleData.name}
                  className="w-32 h-32 object-cover rounded-lg"
                />
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{vehicleData.name}</h3>
                  <p className="text-gray-600 mb-3">{vehicleData.make} {vehicleData.model}</p>
                  <div className="flex gap-4 text-sm">
                    <span className="text-primary-600 font-bold text-xl">₹{vehicleData.pricePerHour}/hr</span>
                    <span className="text-gray-500 self-end">Min: {vehicleData.minBookingHours}h</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Rental Period */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-xl text-black mb-4">Rental Period</h3>

              {/* Pre-filled dates notice */}
              {startDateParam && startTimeParam && endDateParam && endTimeParam && (
                <div className="bg-primary-50 border border-primary-200 rounded-lg p-3 mb-4 flex items-start">
                  <CheckCircle className="w-5 h-5 text-primary-600 mr-2 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-blue-800">
                    Booking dates and times have been pre-filled from your search. You can modify them if needed.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Start Date & Time */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="inline w-4 h-4 mr-1" />
                    Pickup Date & Time
                  </label>
                  <div className="space-y-2">
                    <input
                      type="date"
                      value={bookingDates.startDate}
                      onChange={(e) =>
                        handleDateChange({ ...bookingDates, startDate: e.target.value }, 'startDate')
                      }
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                    />
                    <input
                      type="time"
                      value={bookingDates.startTime}
                      onChange={(e) =>
                        handleDateChange({ ...bookingDates, startTime: e.target.value }, 'startTime')
                      }
                      min={bookingDates.startDate === new Date().toISOString().split('T')[0] ? (() => { const now = new Date(); now.setHours(now.getHours() + 1); return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`; })() : '06:00'}
                      max="23:30"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                    />
                  </div>
                </div>

                {/* End Date & Time */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="inline w-4 h-4 mr-1" />
                    Return Date & Time
                  </label>
                  <div className="space-y-2">
                    <input
                      ref={returnDateRef}
                      type="date"
                      value={bookingDates.endDate}
                      onChange={(e) =>
                        handleDateChange({ ...bookingDates, endDate: e.target.value }, 'endDate')
                      }
                      min={bookingDates.startDate || new Date().toISOString().split('T')[0]}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                    />
                    <input
                      ref={returnTimeRef}
                      type="time"
                      value={bookingDates.endTime}
                      onChange={(e) =>
                        handleDateChange({ ...bookingDates, endTime: e.target.value }, 'endTime')
                      }
                      min={(() => {
                        const today = new Date().toISOString().split('T')[0];
                        const getMinForToday = () => { const now = new Date(); now.setHours(now.getHours() + 1); return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`; };
                        if (bookingDates.startDate === bookingDates.endDate && bookingDates.startTime) {
                          if (bookingDates.endDate === today) {
                            const minForToday = getMinForToday();
                            return bookingDates.startTime > minForToday ? bookingDates.startTime : minForToday;
                          }
                          return bookingDates.startTime;
                        }
                        if (bookingDates.endDate === today) return getMinForToday();
                        return '06:00';
                      })()}
                      max="23:30"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Duration Display */}
              {totalHours > 0 && (
                <div className="mt-4 p-3 bg-primary-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    Total Duration: <strong>{totalHours} hours</strong>
                    {vehicleData.minBookingHours && totalHours < vehicleData.minBookingHours && (
                      <span className="text-red-600 ml-2">
                        (Minimum {vehicleData.minBookingHours}h required)
                      </span>
                    )}
                  </p>
                </div>
              )}
            </div>

            {/* Booking Summary - Price Calculator */}
            <PriceCalculator
              basePrice={vehicleData.pricePerHour}
              hours={totalHours}
              vehicleName={vehicleData.name}
              onProceedToPayment={handleBooking}
              isLoading={bookingLoading}
              isLoggedIn={!!user}
              minBookingHours={vehicleData.minBookingHours}
              includeSecondHelmet={includeSecondHelmet}
              onSecondHelmetChange={setIncludeSecondHelmet}
              cityId={vehicleData.cityId}
              userId={user?.id}
              packagePrice={activePackagePrice}
              packageLabel={activePackageLabel}
            />
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && createdBookingId && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          amount={finalBookingAmount}
          bookingId={createdBookingId}
          onSuccess={handlePaymentSuccess}
          onFailure={handlePaymentFailure}
        />
      )}

      {/* Pickup Location Modal */}
      <PickupLocationModal
        isOpen={showPickupModal}
        onClose={() => setShowPickupModal(false)}
        cityId={vehicleData?.cityId ?? parseInt(cityIdParam || '0') ?? selectedCity?.id ?? 1}
        cityName={selectedCity?.name ?? 'City'}
        onContinue={handlePickupLocationChange}
      />

      {/* Login Modal */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => {
          setShowLoginModal(false);
          setPendingBookingAmount(null);
        }}
        onSuccess={handleLoginSuccess}
      />
    </div>
  );
}
