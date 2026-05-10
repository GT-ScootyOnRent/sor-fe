import React, { useState } from 'react';
import { MapPin, Gauge, Clock, Shield, AlertCircle, ChevronLeft, Fuel, Calendar } from 'lucide-react';
import { useNavigate, useParams, Link, useSearchParams } from 'react-router-dom';
import { useGetVehicleByIdQuery } from '../store/api/vehicleApi';
import { useGetActivePickupLocationsByCityQuery } from '../store/api/pickupLocationApi';
import { useCreateBookingMutation } from '../store/api/bookingApi';
import { useInitiatePaymentMutation } from '../store/api/paymentApi';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorMessage } from '../components/ErrorMessage';
import { calculateTotalPrice, calculateDuration } from '../utils/vehicleUtils';
import { toast } from 'sonner';
import LoginModal from '../components/LoginModal';

const VehicleDetailsPage: React.FC = () => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedPickup, setSelectedPickup] = useState('');
  const [selectedDrop, setSelectedDrop] = useState('');
  const [bookingError] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Get search params from URL
  const cityId = searchParams.get('cityId');
  const startDate = searchParams.get('startDate');
  const startTime = searchParams.get('startTime');
  const endDate = searchParams.get('endDate');
  const endTime = searchParams.get('endTime');

  const [bookingDates, setBookingDates] = useState({
    startDate,
    startTime,
    endDate,
    endTime,
  });

  // Helper to get minimum allowed time (current time + 1 hour buffer)
  const getMinTimeForToday = () => {
    const now = new Date();
    now.setHours(now.getHours() + 1);
    return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  };

  const getTodayDate = () => new Date().toISOString().split('T')[0];

  // Handler with time validation
  const handleDateChange = (newDates: typeof bookingDates) => {
    const today = getTodayDate();
    const minTimeToday = getMinTimeForToday();

    // Validate and auto-correct start time if it's today and time is in the past
    if (newDates.startDate === today && newDates.startTime && newDates.startTime < minTimeToday) {
      newDates.startTime = minTimeToday;
    }

    // Validate and auto-correct end time if it's today
    if (newDates.endDate === today && newDates.endTime) {
      if (newDates.startDate === newDates.endDate && newDates.startTime) {
        const minEndTime = newDates.startTime > minTimeToday ? newDates.startTime : minTimeToday;
        if (newDates.endTime < minEndTime) {
          newDates.endTime = minEndTime;
        }
      } else if (newDates.endTime < minTimeToday) {
        newDates.endTime = minTimeToday;
      }
    }

    setBookingDates(newDates);
  };

  // Fetch vehicle details
  const { data: vehicleData, isLoading: vehicleLoading, error: vehicleError } = useGetVehicleByIdQuery(
    parseInt(id || '0')
  );

  // Fetch locations for the vehicle's city
  const { data: locationsData, isLoading: locationsLoading } = useGetActivePickupLocationsByCityQuery(
    vehicleData?.cityId || parseInt(cityId || '1'),
    { skip: !vehicleData && !cityId }
  );

  const [createBooking] = useCreateBookingMutation();
  const [initiatePayment] = useInitiatePaymentMutation();

  // Get vehicle images
  const vehicleImages = vehicleData?.images || [];
  const primaryImage = vehicleData?.primaryImageUrl || vehicleImages[0]?.imageUrl || 'placeholder-vehicle.jpg';

  const calculateTotal = () => {
    if (!vehicleData || !bookingDates.startDate || !bookingDates.startTime || !bookingDates.endDate || !bookingDates.endTime) {
      return 0;
    }
    return calculateTotalPrice(
      vehicleData.pricePerHour,
      bookingDates.startDate,
      bookingDates.startTime,
      bookingDates.endDate,
      bookingDates.endTime
    );
  };

  const calculateTotalHours = () => {
    if (!bookingDates.startDate || !bookingDates.startTime || !bookingDates.endDate || !bookingDates.endTime) {
      return 0;
    }
    return calculateDuration(
      bookingDates.startDate,
      bookingDates.startTime,
      bookingDates.endDate,
      bookingDates.endTime
    );
  };

  const handleProceedToPayment = async () => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');

    if (!token || !userId) {
      // Show login modal instead of redirecting - preserves state
      setShowLoginModal(true);
      return;
    }

    // Continue with actual payment process
    await proceedWithPayment();
  };

  // Called after successful login or if already logged in
  const proceedWithPayment = async () => {
    const userId = localStorage.getItem('userId');

    // Validate all required fields
    if (!selectedPickup || !selectedDrop) {
      toast.error('Please select pickup and drop locations');
      return;
    }

    if (!bookingDates.startDate || !bookingDates.startTime || !bookingDates.endDate || !bookingDates.endTime) {
      toast.error('Please select booking dates and times');
      return;
    }

    const totalHours = calculateTotalHours();
    if (totalHours <= 0) {
      toast.error('Invalid booking duration');
      return;
    }

    try {
      setBookingLoading(true);

      // Validate vehicleData exists
      if (!vehicleData) {
        throw new Error('Vehicle data not available');
      }

      // Create booking first
      const bookingData = {
        userId: parseInt(userId),
        vehicleId: vehicleData.id,
        pickupLocationId: parseInt(selectedPickup),
        dropLocationId: parseInt(selectedDrop),
        bookingStartDate: bookingDates.startDate,
        startTime: bookingDates.startTime,
        bookingEndDate: bookingDates.endDate,
        endTime: bookingDates.endTime,
        totalAmount: calculateTotal(),
        status: 0, // Pending payment
      };

      const bookingResponse = await createBooking(bookingData).unwrap();

      if (!bookingResponse || !bookingResponse.id) {
        throw new Error('Failed to create booking');
      }

      toast.success('Booking created! Redirecting to payment...');

      // Get user details from localStorage
      const userName = localStorage.getItem('userName') || 'Customer';
      const userEmail = localStorage.getItem('userEmail') || '';
      const userPhone = localStorage.getItem('userPhone') || '';

      // Initiate payment
      const paymentData = {
        bookingId: bookingResponse.id,
        userId: parseInt(userId),
        amount: calculateTotal(),
        userName: userName,
        userEmail: userEmail || `${userPhone}@scootyonrent.com`,
        userPhone: userPhone.replace('+91', ''),
      };

      const paymentResponse = await initiatePayment(paymentData).unwrap();

      if (paymentResponse.success && paymentResponse.paymentUrl) {
        // Redirect to EaseBuzz payment gateway
        window.location.href = paymentResponse.paymentUrl;
      } else {
        throw new Error(paymentResponse.message || 'Failed to initiate payment');
      }
    } catch (error: any) {
      console.error('Payment initiation error:', error);
      toast.error(error?.data?.message || error?.message || 'Failed to proceed with payment');
    } finally {
      setBookingLoading(false);
    }
  };

  // Handle successful login - continue with payment
  const handleLoginSuccess = () => {
    setShowLoginModal(false);
    // Small delay to ensure auth state is fully updated
    setTimeout(() => {
      proceedWithPayment();
    }, 300);
  };

  if (vehicleLoading) return <LoadingSpinner fullScreen message="Loading vehicle details..." />;

  if (vehicleError || !vehicleData) {
    return <ErrorMessage fullScreen message="Failed to load vehicle details" onRetry={() => navigate(-1)} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center">
            <button onClick={() => navigate(-1)} className="text-gray-600 hover:text-primary-600 mr-4 transition">
              <ChevronLeft className="w-6 h-6" />
            </button>
            <Link to="/" className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-indigo-600 bg-clip-text text-transparent">
              scootyonrent
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Images and Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Images */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="relative h-96">
                <img
                  src={vehicleImages[currentImageIndex]?.imageUrl || primaryImage}
                  alt={vehicleData.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                  {(vehicleImages.length > 0 ? vehicleImages : [{ imageUrl: primaryImage }]).map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`w-3 h-3 rounded-full transition ${currentImageIndex === index ? 'bg-white' : 'bg-white/50'
                        }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Vehicle Info */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{vehicleData.name}</h1>
                  <p className="text-lg text-gray-600">{vehicleData.make} {vehicleData.model}</p>
                </div>
              </div>

              <div className="flex items-center text-gray-600 mb-6">
                <MapPin className="w-5 h-5 mr-2 text-primary-600" />
                <span>Available in City {vehicleData.cityId}</span>
              </div>

              {/* Specifications */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <Gauge className="w-6 h-6 mx-auto mb-2 text-primary-600" />
                  <p className="text-sm text-gray-600">Km Travelled</p>
                  <p className="font-semibold text-gray-900">{vehicleData.kmTravelled.toLocaleString()}</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <Clock className="w-6 h-6 mx-auto mb-2 text-primary-600" />
                  <p className="text-sm text-gray-600">Min Booking</p>
                  <p className="font-semibold text-gray-900">{vehicleData.minBookingHours} hours</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <Fuel className="w-6 h-6 mx-auto mb-2 text-primary-600" />
                  <p className="text-sm text-gray-600">Fuel Type</p>
                  <p className="font-semibold text-gray-900">{vehicleData.fuelType}</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <Shield className="w-6 h-6 mx-auto mb-2 text-primary-600" />
                  <p className="text-sm text-gray-600">Type</p>
                  <p className="font-semibold text-gray-900">{vehicleData.vehicleType}</p>
                </div>
              </div>

              {/* Pricing */}
              {vehicleData.packages && (
                <div className="bg-primary-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Package Pricing</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                    <div>
                      <span className="text-gray-600">4 Hours: </span>
                      <span className="font-semibold">₹{vehicleData.packages.fourHours}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">1 Day: </span>
                      <span className="font-semibold">₹{vehicleData.packages.oneDay}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">3 Days: </span>
                      <span className="font-semibold">₹{vehicleData.packages.threeDays}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">7 Days: </span>
                      <span className="font-semibold">₹{vehicleData.packages.sevenDays}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">15 Days: </span>
                      <span className="font-semibold">₹{vehicleData.packages.fifteenDays}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Monthly: </span>
                      <span className="font-semibold">₹{vehicleData.packages.monthly}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Specs */}
              {vehicleData.specs && (
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-600">Mileage: </span>
                    <span className="font-semibold">{vehicleData.specs.mileage}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Engine: </span>
                    <span className="font-semibold">{vehicleData.specs.engineCapacity}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Top Speed: </span>
                    <span className="font-semibold">{vehicleData.specs.topSpeed}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Weight: </span>
                    <span className="font-semibold">{vehicleData.specs.weight}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Important Information */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <h3 className="text-black mb-3">Important Information</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>✓ Valid driving license and ID proof required at pickup</li>
                <li>✓ Security deposit of ₹2000 will be collected at pickup (refundable)</li>
              </ul>
            </div>
          </div>

          {/* Right Column - Booking Form */}
          <div>
            <div className="bg-white rounded-xl shadow-md p-6 sticky top-24">
              <div className="mb-6">
                <div className="flex items-baseline mb-2">
                  <span className="text-4xl font-bold text-primary-600">₹{vehicleData.pricePerHour}</span>
                  <span className="text-gray-600 ml-2">/hour</span>
                </div>
                <p className="text-sm text-gray-500">Minimum {vehicleData.minBookingHours} hours booking required</p>
              </div>

              {/* Error Message */}
              {bookingError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 flex items-start">
                  <AlertCircle className="w-5 h-5 text-red-600 mr-2 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-800">{bookingError}</p>
                </div>
              )}

              {/* Booking Form */}
              <div className="space-y-4">
                {/* Start Date & Time */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="inline w-4 h-4 mr-1" />
                    Start Date & Time
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="date"
                      value={bookingDates.startDate || ''}
                      onChange={(e) => handleDateChange({ ...bookingDates, startDate: e.target.value })}
                      min={new Date().toISOString().split('T')[0]}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                    />
                    <input
                      type="time"
                      value={bookingDates.startTime || ''}
                      onChange={(e) => handleDateChange({ ...bookingDates, startTime: e.target.value })}
                      min={bookingDates.startDate === new Date().toISOString().split('T')[0] ? (() => { const now = new Date(); now.setHours(now.getHours() + 1); return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`; })() : '06:00'}
                      max="23:30"
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                    />
                  </div>
                </div>

                {/* End Date & Time */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="inline w-4 h-4 mr-1" />
                    End Date & Time
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="date"
                      value={bookingDates.endDate || ''}
                      onChange={(e) => handleDateChange({ ...bookingDates, endDate: e.target.value })}
                      min={bookingDates.startDate || new Date().toISOString().split('T')[0]}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                    />
                    <input
                      type="time"
                      value={bookingDates.endTime || ''}
                      onChange={(e) => handleDateChange({ ...bookingDates, endTime: e.target.value })}
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
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                    />
                  </div>
                </div>

                {/* Pickup Location */}
                {!locationsLoading && locationsData && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <MapPin className="inline w-4 h-4 mr-1" />
                      Pickup Location
                    </label>
                    <select
                      value={selectedPickup}
                      onChange={(e) => setSelectedPickup(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                    >
                      <option value="">Select pickup location</option>
                      {locationsData?.map((loc) => (
                        <option key={loc.id} value={loc.id}>
                          {loc.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Drop Location */}
                {!locationsLoading && locationsData && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <MapPin className="inline w-4 h-4 mr-1" />
                      Drop Location
                    </label>
                    <select
                      value={selectedDrop}
                      onChange={(e) => setSelectedDrop(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                    >
                      <option value="">Select drop location</option>
                      {locationsData?.map((loc) => (
                        <option key={loc.id} value={loc.id}>
                          {loc.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Duration Display */}
                {calculateTotalHours() > 0 && (
                  <div className="p-3 bg-primary-50 rounded-lg">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-600">Duration</span>
                      <span className="font-medium text-gray-900">{calculateTotalHours()} hours</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Rate per hour</span>
                      <span className="font-medium text-gray-900">₹{vehicleData.pricePerHour}</span>
                    </div>
                    <div className="border-t border-gray-200 pt-2 mt-2 flex justify-between">
                      <span className="font-semibold text-gray-900">Total Amount</span>
                      <span className="font-bold text-xl text-primary-600">₹{calculateTotal()}</span>
                    </div>
                  </div>
                )}

                {/* Info Alert */}
                <div className="bg-primary-50 border border-primary-200 rounded-lg p-3 flex items-start">
                  <AlertCircle className="w-5 h-5 text-primary-600 mr-2 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-blue-800">
                    Payment will be processed securely through EaseBuzz after booking confirmation.
                  </p>
                </div>

                <button
                  onClick={handleProceedToPayment}
                  disabled={bookingLoading || !selectedPickup || !selectedDrop || !bookingDates.startDate || !bookingDates.endDate}
                  className="w-full bg-gradient-to-r from-primary-600 to-indigo-600 text-white py-3 rounded-lg font-semibold hover:from-primary-700 hover:to-indigo-700 transition transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {bookingLoading ? 'Processing...' : 'Proceed to Payment'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Login Modal */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSuccess={handleLoginSuccess}
      />
    </div>
  );
};

export default VehicleDetailsPage;