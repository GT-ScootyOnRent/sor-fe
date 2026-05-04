import { useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Calendar, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import Header from '../components/Header';
import MapWithLocations from '../components/MapWithLocations';
import BackgroundSlideshow from '../components/BackgroundSlideshow';
import PaymentModal from '../components/PaymentModal';
import PriceCalculator from '../components/PriceCalculator';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorMessage } from '../components/ErrorMessage';
import { useGetVehicleByIdQuery } from '../store/api/vehicleApi';
import { useCreateBookingMutation } from '../store/api/bookingApi';
import { useAppSelector } from '../store/hooks';
import { calculateTotalPrice, calculateDuration } from '../utils/vehicleUtils';
import { toast } from 'sonner';

export default function BookNow() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAppSelector((state) => state.auth);

  // Pre-fill from URL search params (passed from VehicleListingPage)
  const startDateParam = searchParams.get('startDate');
  const startTimeParam = searchParams.get('startTime');
  const endDateParam = searchParams.get('endDate');
  const endTimeParam = searchParams.get('endTime');

  const [bookingDates, setBookingDates] = useState({
    startDate: startDateParam || '',
    startTime: startTimeParam || '10:00',
    endDate: endDateParam || '',
    endTime: endTimeParam || '20:00',
  });

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [createdBookingId, setCreatedBookingId] = useState<number | null>(null);
  const [finalBookingAmount, setFinalBookingAmount] = useState<number>(0);
  const [selectedPickup, setSelectedPickup] = useState<string>('');
  const [bookingError, setBookingError] = useState<string>('');

  const { data: vehicleData, isLoading: vehicleLoading, error: vehicleError } =
    useGetVehicleByIdQuery(parseInt(id || '0'));

  const [createBooking, { isLoading: bookingLoading }] = useCreateBookingMutation();

  const handleMapLocationSelect = (location: any) => {
    setSelectedPickup(location.id.toString());
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
    setBookingError('');

    // If not logged in — save booking intent then redirect to login
    if (!user) {
      // Save booking intent so Login.tsx can restore it after OTP
      sessionStorage.setItem('bookingIntent', JSON.stringify({
        vehicleId: vehicleData?.id,
        startDate: bookingDates.startDate,
        startTime: bookingDates.startTime,
        endDate: bookingDates.endDate,
        endTime: bookingDates.endTime,
      }));
      navigate('/login');
      return;
    }


    if (!vehicleData) return;

    // Validate fields
    if (!bookingDates.startDate || !bookingDates.startTime || !bookingDates.endDate || !bookingDates.endTime) {
      setBookingError('Please fill all date and time fields');
      return;
    }

    const duration = calculateTotalHours();
    if (duration < vehicleData.minBookingHours) {
      setBookingError(`Minimum booking duration is ${vehicleData.minBookingHours} hours`);
      return;
    }

    if (!selectedPickup) {
      setBookingError('Please select a pickup location');
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
      };

      const result = await createBooking(bookingRequest).unwrap();

      // Store the final amount and booking ID, then open payment modal
      setFinalBookingAmount(amountToCharge);
      setCreatedBookingId(result.id!);
      setShowPaymentModal(true);
    } catch (error: any) {
      console.error('Booking error:', error);
      setBookingError(error?.data?.message || 'Failed to create booking. Please try again.');
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

  if (vehicleLoading) return <LoadingSpinner fullScreen message="Loading vehicle details..." />;
  if (vehicleError || !vehicleData)
    return <ErrorMessage fullScreen message="Failed to load vehicle details" onRetry={() => navigate(-1)} />;

  const totalHours = calculateTotalHours();

  return (
    <div className="min-h-screen bg-white relative">
      <BackgroundSlideshow />
      <div className="relative z-10">
        <Header />

        <div className="container mx-auto px-4 py-8">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-4 text-primary-500 hover:text-primary-600"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <h1 className="text-4xl text-black mb-8">Complete Your Booking</h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Map and Booking Details */}
            <div className="lg:col-span-2 space-y-8">

              {/* Map and Pickup Locations */}
              <div>
                <h3 className="text-xl text-black mb-4">Select Pickup Location</h3>
                <MapWithLocations
                  cityId={vehicleData.cityId}
                  onLocationSelect={handleMapLocationSelect}
                  selectedLocationId={selectedPickup ? parseInt(selectedPickup) : undefined}
                />
              </div>

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

                {/* Error Message */}
                {bookingError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 flex items-start">
                    <AlertCircle className="w-5 h-5 text-red-600 mr-2 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-red-800">{bookingError}</p>
                  </div>
                )}

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
                          setBookingDates({ ...bookingDates, startDate: e.target.value })
                        }
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                      />
                      <input
                        type="time"
                        value={bookingDates.startTime}
                        onChange={(e) =>
                          setBookingDates({ ...bookingDates, startTime: e.target.value })
                        }
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
                        type="date"
                        value={bookingDates.endDate}
                        onChange={(e) =>
                          setBookingDates({ ...bookingDates, endDate: e.target.value })
                        }
                        min={bookingDates.startDate || new Date().toISOString().split('T')[0]}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                      />
                      <input
                        type="time"
                        value={bookingDates.endTime}
                        onChange={(e) =>
                          setBookingDates({ ...bookingDates, endTime: e.target.value })
                        }
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
            </div>

            {/* Right Column - Price Calculator */}
            <div>
              <PriceCalculator
                basePrice={vehicleData.pricePerHour}
                hours={totalHours}
                vehicleName={vehicleData.name}
                onProceedToPayment={handleBooking}
                isLoading={bookingLoading}
                isLoggedIn={!!user}
                minBookingHours={vehicleData.minBookingHours}
              />

              {/* Login notice shown below PriceCalculator when not logged in */}
              {/* {!user && (
                <div className="mt-4 p-4 bg-primary-50 rounded-lg border border-primary-200 text-center">
                  <p className="text-sm text-gray-700 mb-3">
                    You'll be asked to login before completing payment
                  </p>
                  <Button
                    onClick={() => {
                      const intent = {
                        vehicleId: id,
                        startDate: bookingDates.startDate,
                        startTime: bookingDates.startTime,
                        endDate: bookingDates.endDate,
                        endTime: bookingDates.endTime,
                        pickupLocationId: selectedPickup,
                      };
                      sessionStorage.setItem('bookingIntent', JSON.stringify(intent));
                      navigate(`/auth?redirect=/book/${id}`);
                    }}
                    className="bg-primary-500 hover:bg-primary-600 text-white"
                  >
                    Login to Continue
                  </Button>
                </div>
              )} */}
            </div>
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
    </div>
  );
}
