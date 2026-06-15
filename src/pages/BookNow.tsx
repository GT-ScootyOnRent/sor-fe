import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Calendar, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import Header from '../components/Header';
import BackgroundSlideshow from '../components/BackgroundSlideshow';
import PaymentModal from '../components/PaymentModal';
import PriceCalculator from '../components/PriceCalculator';
import PickupLocationMap from '../components/PickupLocationMap';
import PickupLocationModal from '../components/PickupLocationModal';
import LoginModal from '../components/LoginModal';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorMessage } from '../components/ErrorMessage';
import { useGetVehicleByIdQuery } from '../store/api/vehicleApi';
import { useCreateBookingMutation } from '../store/api/bookingApi';
import { useRecordAgentUsageMutation } from '../store/api/agentApi';
import { useGetPickupLocationByIdQuery } from '../store/api/pickupLocationApi';
import type { PickupLocationDto } from '../store/api/pickupLocationApi';
import { useAppSelector } from '../store/hooks';
import { calculateDuration } from '../utils/vehicleUtils';
import { calculateDurationPrice } from '../store/api/vehiclePackageApi';
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
  const pickupLocationIdParam = searchParams.get('pickupLocationId');
  const cityIdParam = searchParams.get('cityId');

  // Refs for auto-focus (date pickers only - time is now dropdown)
  const startDateRef = useRef<HTMLInputElement>(null);
  const returnDateRef = useRef<HTMLInputElement>(null);

  // Business hours: 6:00 AM to 11:30 PM
  const MIN_BUSINESS_TIME = '06:00';
  const MAX_BUSINESS_TIME = '23:30';

  // Generate 30-minute time slots within business hours
  const TIME_SLOTS: string[] = [];
  for (let h = 6; h <= 23; h++) {
    TIME_SLOTS.push(`${h.toString().padStart(2, '0')}:00`);
    if (h < 23 || (h === 23 && true)) {
      TIME_SLOTS.push(`${h.toString().padStart(2, '0')}:30`);
    }
  }
  // TIME_SLOTS = ['06:00', '06:30', '07:00', ..., '23:00', '23:30']

  // Round time up to next 30-minute slot
  const roundToNext30Min = (time: string): string => {
    const [hours, minutes] = time.split(':').map(Number);
    let newMinutes = minutes <= 0 ? 0 : minutes <= 30 ? 30 : 0;
    let newHours = minutes > 30 ? hours + 1 : hours;
    
    // If after max business time, return min business time (caller handles date change)
    if (newHours > 23 || (newHours === 23 && newMinutes > 30)) {
      return MIN_BUSINESS_TIME;
    }
    if (newHours < 6) {
      return MIN_BUSINESS_TIME;
    }
    
    return `${newHours.toString().padStart(2, '0')}:${newMinutes.toString().padStart(2, '0')}`;
  };

  // Format time for display (e.g., "06:00" -> "06:00 AM")
  const formatTimeDisplay = (time: string): string => {
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    return `${displayHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  // Helper to clamp time to business hours
  const clampToBusinessHours = (time: string): string => {
    if (time < MIN_BUSINESS_TIME) return MIN_BUSINESS_TIME;
    if (time > MAX_BUSINESS_TIME) return MAX_BUSINESS_TIME;
    return time;
  };

  // Get today's date (local time)
  const getTodayDate = () => {
    const d = new Date();
    return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
  };

  // Get tomorrow's date (local time)
  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return `${tomorrow.getFullYear()}-${(tomorrow.getMonth() + 1).toString().padStart(2, '0')}-${tomorrow.getDate().toString().padStart(2, '0')}`;
  };

  // Helper to get default pickup date and time
  const getDefaultPickupDateTime = () => {
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const today = getTodayDate();

    // If before business hours (e.g., 3:59 AM), default to today 6 AM
    if (currentTime < MIN_BUSINESS_TIME) {
      return { date: today, time: MIN_BUSINESS_TIME };
    }

    // Calculate time + 1 hour
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
    // Use local date (not UTC) for comparison
    const oneHourLaterDate = `${oneHourLater.getFullYear()}-${(oneHourLater.getMonth() + 1).toString().padStart(2, '0')}-${oneHourLater.getDate().toString().padStart(2, '0')}`;
    
    // If adding 1 hour pushes to next day (local time), use tomorrow 6 AM
    if (oneHourLaterDate !== today) {
      return { date: getTomorrowDate(), time: MIN_BUSINESS_TIME };
    }

    const oneHourLaterTime = `${oneHourLater.getHours().toString().padStart(2, '0')}:${oneHourLater.getMinutes().toString().padStart(2, '0')}`;
    
    // If current time + 1 hour is after business hours, use tomorrow 6 AM
    if (oneHourLaterTime > MAX_BUSINESS_TIME) {
      return { date: getTomorrowDate(), time: MIN_BUSINESS_TIME };
    }

    // Within business hours - set to current time + 1 hour (rounded)
    const roundedTime = roundToNext30Min(oneHourLaterTime);
    
    // If rounding pushed past business hours, use tomorrow
    if (roundedTime > MAX_BUSINESS_TIME) {
      return { date: getTomorrowDate(), time: MIN_BUSINESS_TIME };
    }

    return { date: today, time: roundedTime };
  };

  // Get default values
  const defaultPickup = getDefaultPickupDateTime();
  const today = getTodayDate();

  // Validate URL params - reject past dates
  const isStartDateValid = startDateParam && startDateParam >= today;
  const isEndDateValid = endDateParam && endDateParam >= today;
  const hadPastDatesInUrl = (startDateParam && startDateParam < today) || (endDateParam && endDateParam < today);

  const defaultStartDate = isStartDateValid ? startDateParam : defaultPickup.date;
  const defaultStartTime = startTimeParam && isStartDateValid ? roundToNext30Min(clampToBusinessHours(startTimeParam)) : defaultPickup.time;
  // Default end date is start date + 1 day (consistent with home page), end time is 11:30 PM
  const getNextDay = (dateStr: string) => {
    const d = new Date(dateStr);
    d.setDate(d.getDate() + 1);
    return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
  };
  const defaultEndDate = isEndDateValid ? endDateParam : getNextDay(defaultStartDate);
  // Default to a 24-hour cycle: same time as pickup, next day
  const defaultEndTime = endTimeParam && isEndDateValid ? roundToNext30Min(clampToBusinessHours(endTimeParam)) : defaultStartTime;

  const [bookingDates, setBookingDates] = useState({
    startDate: defaultStartDate,
    startTime: defaultStartTime,
    endDate: defaultEndDate,
    endTime: defaultEndTime,
  });

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [createdBookingId, setCreatedBookingId] = useState<number | null>(null);
  const [finalBookingAmount, setFinalBookingAmount] = useState<number>(0);
  // Agent referral code applied at checkout (recorded as used once payment succeeds)
  const [appliedAgentCode, setAppliedAgentCode] = useState<{ code: string; orderAmount: number } | null>(null);
  const [recordAgentUsage] = useRecordAgentUsageMutation();
  const [selectedPickup, setSelectedPickup] = useState<string>(pickupLocationIdParam || '');
  const [includeSecondHelmet, setIncludeSecondHelmet] = useState(false);
  const [paySecurityAtPickup, setPaySecurityAtPickup] = useState(false); // false = pay online (default)
  const [showPickupModal, setShowPickupModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [pendingBookingAmount, setPendingBookingAmount] = useState<number | null>(null);

  // Show toast if past dates were in URL params
  useEffect(() => {
    if (hadPastDatesInUrl) {
      toast.warning('Selected dates have passed, showing updated times');
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Validate and correct dates on mount (handles stale state from browser cache/tabs)
  useEffect(() => {
    const today = getTodayDate();
    const defaultPickup = getDefaultPickupDateTime();
    
    // If start date is in the past, reset to valid defaults (24-hour cycle)
    if (bookingDates.startDate < today) {
      setBookingDates({
        startDate: defaultPickup.date,
        startTime: defaultPickup.time,
        endDate: getNextDay(defaultPickup.date),
        endTime: defaultPickup.time,
      });
      toast.info('Booking dates have been updated to today');
    }
    // If start date is today, validate the time
    else if (bookingDates.startDate === today && bookingDates.startTime) {
      const minTime = getMinTimeForToday();
      
      // If today is no longer bookable (too late), push to tomorrow (24-hour cycle)
      if (minTime === null) {
        setBookingDates({
          startDate: defaultPickup.date,
          startTime: defaultPickup.time,
          endDate: getNextDay(defaultPickup.date),
          endTime: defaultPickup.time,
        });
        toast.info('Booking dates have been updated - too late to book for today');
      }
      // If time has passed, correct the time
      else if (bookingDates.startTime < minTime) {
        setBookingDates(prev => ({
          ...prev,
          startTime: minTime,
        }));
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Helper to get minimum allowed time (current time + 1 hour buffer, rounded to next 30-min slot)
  // Returns null if today is no longer bookable (too late in the day)
  const getMinTimeForToday = (): string | null => {
    const now = new Date();
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
    const today = getTodayDate();
    // Use local date (not UTC) for comparison
    const oneHourLaterDate = `${oneHourLater.getFullYear()}-${(oneHourLater.getMonth() + 1).toString().padStart(2, '0')}-${oneHourLater.getDate().toString().padStart(2, '0')}`;
    
    // If adding 1 hour pushes to next day, today is not bookable
    if (oneHourLaterDate !== today) {
      return null;
    }
    
    const time = `${oneHourLater.getHours().toString().padStart(2, '0')}:${oneHourLater.getMinutes().toString().padStart(2, '0')}`;
    
    // If time is after business hours, today is not bookable
    if (time > MAX_BUSINESS_TIME) {
      return null;
    }
    
    return roundToNext30Min(clampToBusinessHours(time));
  };

  // Check if today is still bookable
  const isTodayBookable = (): boolean => {
    return getMinTimeForToday() !== null;
  };

  // Get available time slots for a given date (filters out past times if today)
  const getAvailableTimeSlots = (date: string, isStartTime: boolean = true, startTime?: string) => {
    const isToday = date === getTodayDate();
    
    // If it's today but too late to book, return empty array
    if (isToday) {
      const minTime = getMinTimeForToday();
      if (minTime === null) {
        return []; // No slots available for today
      }
      
      return TIME_SLOTS.filter(slot => {
        // Filter out times before minimum
        if (slot < minTime) return false;
        
        // For return time on same day as start, filter out times <= start time
        if (!isStartTime && startTime && date === bookingDates.startDate && slot <= startTime) {
          return false;
        }
        
        return true;
      });
    }
    
    // For future dates, all slots are available
    return TIME_SLOTS.filter(slot => {
      // For return time on same day as start, filter out times <= start time
      if (!isStartTime && startTime && date === bookingDates.startDate && slot <= startTime) {
        return false;
      }
      return true;
    });
  };

  // Handler to clear package pricing when user changes dates
  const handleDateChange = (newDates: typeof bookingDates) => {
    const today = getTodayDate();
    const minTimeToday = getMinTimeForToday();

    // Always round times to 30-min slots and clamp to business hours
    if (newDates.startTime) {
      newDates.startTime = roundToNext30Min(clampToBusinessHours(newDates.startTime));
    }
    if (newDates.endTime) {
      newDates.endTime = roundToNext30Min(clampToBusinessHours(newDates.endTime));
    }

    // Ensure start date is not in the past
    if (newDates.startDate < today) {
      newDates.startDate = today;
    }

    // If today is selected but no longer bookable, push to tomorrow
    if (newDates.startDate === today && minTimeToday === null) {
      const defaultPickup = getDefaultPickupDateTime();
      newDates.startDate = defaultPickup.date;
      newDates.startTime = defaultPickup.time;
      if (newDates.endDate < newDates.startDate) {
        newDates.endDate = newDates.startDate;
      }
    }

    // Ensure end date is not before start date
    if (newDates.endDate && newDates.startDate && newDates.endDate < newDates.startDate) {
      newDates.endDate = newDates.startDate;
    }

    // Validate and auto-correct start time if it's today and time is in the past
    if (newDates.startDate === today && minTimeToday !== null && newDates.startTime && newDates.startTime < minTimeToday) {
      newDates.startTime = minTimeToday;
    }

    // Validate and auto-correct end time
    if (newDates.startDate === newDates.endDate && newDates.startTime && newDates.endTime) {
      // Same day: end time must be after start time
      if (newDates.endTime <= newDates.startTime) {
        // Set end time to start time + 30 mins (rounded to next slot)
        const [h, m] = newDates.startTime.split(':').map(Number);
        const newMinutes = m === 0 ? 30 : 0;
        const newHours = m === 0 ? h : h + 1;
        const candidateEndTime = `${newHours.toString().padStart(2, '0')}:${newMinutes.toString().padStart(2, '0')}`;
        
        // If would exceed business hours, push to next day
        if (candidateEndTime > MAX_BUSINESS_TIME) {
          newDates.endDate = getTomorrowDate();
          newDates.endTime = MIN_BUSINESS_TIME;
        } else {
          newDates.endTime = candidateEndTime;
        }
      }
    }

    // If end date is today, apply minTimeForToday constraint
    if (newDates.endDate === today && newDates.endTime && minTimeToday && newDates.endTime < minTimeToday) {
      newDates.endTime = minTimeToday;
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

    const hours = calculateDuration(
      bookingDates.startDate,
      bookingDates.startTime,
      bookingDates.endDate,
      bookingDates.endTime
    );

    // Use linkedPackage pricing if available
    const pricePerHour = vehicleData.linkedPackage?.pricePerHour || vehicleData.pricePerHour;
    const freeHoursPerDay = vehicleData.linkedPackage?.freeHoursPerDay ?? 6;

    return calculateDurationPrice(hours, pricePerHour, freeHoursPerDay);
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
        securityDepositMode: (paySecurityAtPickup ? 'pickup' : 'online') as 'pickup' | 'online',
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

    // If an agent referral code was applied, mark it as used now that payment succeeded.
    if (appliedAgentCode && user) {
      recordAgentUsage({
        code: appliedAgentCode.code,
        userId: user.id,
        bookingId: createdBookingId ?? undefined,
        orderAmount: appliedAgentCode.orderAmount,
      })
        .unwrap()
        .catch(() => { /* non-blocking: booking already confirmed */ });
    }

    // Navigate to dynamic booking success page with all details
    const securityMode = paySecurityAtPickup ? 'pickup' : 'online';
    navigate(`/booking-success?bookingId=${createdBookingId}&amount=${finalBookingAmount}&securityMode=${securityMode}`);
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

          {/* Two Column Layout */}
          <div className="lg:grid lg:grid-cols-5 lg:gap-8 max-w-6xl mx-auto items-start">
            {/* Left Column - Map + Vehicle + Rental Period */}
            <div className="lg:col-span-3 space-y-6">

              {/* Pickup Location with Map (no title - starts from map) */}
              {pickupLocationData ? (
                <PickupLocationMap
                  location={pickupLocationData}
                  onChangeLocation={() => setShowPickupModal(true)}
                />
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
                <div className="w-32 h-24 bg-gray-50 rounded-lg flex items-center justify-center p-2">
                  <img
                    src={vehicleData.primaryImageUrl || vehicleData.images?.[0]?.imageUrl || '/placeholder.jpg'}
                    alt={vehicleData.name}
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{vehicleData.name}</h3>
                  <p className="text-gray-600 mb-3">{vehicleData.make} {vehicleData.model}</p>
                  {vehicleData.linkedPackage ? (
                    <span className="text-primary-600 font-bold text-xl">
                      ₹{calculateDurationPrice(
                        vehicleData.linkedPackage.selectedDurations[0],
                        vehicleData.linkedPackage.pricePerHour,
                        vehicleData.linkedPackage.freeHoursPerDay
                      )}/-
                    </span>
                  ) : (
                    <span className="text-primary-600 font-bold text-xl">
                      ₹{vehicleData.pricePerHour * (vehicleData.minBookingHours || 4)}/-
                    </span>
                  )}
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
                      ref={startDateRef}
                      type="date"
                      value={bookingDates.startDate}
                      onChange={(e) =>
                        handleDateChange({ ...bookingDates, startDate: e.target.value })
                      }
                      onClick={() => startDateRef.current?.showPicker?.()}
                      min={isTodayBookable() ? getTodayDate() : getTomorrowDate()}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none cursor-pointer"
                    />
                    <select
                      value={bookingDates.startTime}
                      onChange={(e) =>
                        handleDateChange({ ...bookingDates, startTime: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none cursor-pointer"
                    >
                      {getAvailableTimeSlots(bookingDates.startDate, true).map((slot) => (
                        <option key={slot} value={slot}>
                          {formatTimeDisplay(slot)}
                        </option>
                      ))}
                    </select>
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
                        handleDateChange({ ...bookingDates, endDate: e.target.value })
                      }
                      onClick={() => returnDateRef.current?.showPicker?.()}
                      min={bookingDates.startDate || (isTodayBookable() ? getTodayDate() : getTomorrowDate())}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none cursor-pointer"
                    />
                    <select
                      value={bookingDates.endTime}
                      onChange={(e) =>
                        handleDateChange({ ...bookingDates, endTime: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none cursor-pointer"
                    >
                      {getAvailableTimeSlots(bookingDates.endDate, false, bookingDates.startTime).map((slot) => (
                        <option key={slot} value={slot}>
                          {formatTimeDisplay(slot)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
            </div>

            {/* Right Column - Booking Summary / Price Calculator (Sticky) */}
            <div className="lg:col-span-2 mt-6 lg:mt-0 lg:sticky lg:top-24">
                <PriceCalculator
                hours={totalHours}
                vehicleName={vehicleData.name}
                onProceedToPayment={handleBooking}
                isLoading={bookingLoading}
                isLoggedIn={!!user}
                minBookingHours={vehicleData.linkedPackage?.selectedDurations?.[0] || vehicleData.minBookingHours}
                includeSecondHelmet={includeSecondHelmet}
                onSecondHelmetChange={setIncludeSecondHelmet}
                paySecurityAtPickup={paySecurityAtPickup}
                onSecurityDepositModeChange={setPaySecurityAtPickup}
                cityId={vehicleData.cityId}
                userId={user?.id}
                onAgentApplied={setAppliedAgentCode}
                selectedDurations={vehicleData.linkedPackage?.selectedDurations || []}
                priceOverrides={vehicleData.linkedPackage?.priceOverrides || {}}
                pricePerHour={vehicleData.linkedPackage?.pricePerHour || vehicleData.pricePerHour}
                freeHoursPerDay={vehicleData.linkedPackage?.freeHoursPerDay}
              />
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
