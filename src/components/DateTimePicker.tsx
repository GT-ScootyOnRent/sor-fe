import { useState, useEffect, useRef } from 'react';
import { Calendar, Clock, AlertCircle, Search, MapPin } from 'lucide-react';
import { Button } from './ui/button';
import { useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { openCityModal } from '../store/slices/citySlice';

export default function DateTimePicker() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const selectedCity = useAppSelector((state) => state.city.selectedCity);
  const [pickupDate, setPickupDate] = useState('');
  const [pickupTime, setPickupTime] = useState(''); // Empty until date selected
  const [returnDate, setReturnDate] = useState('');
  const [returnTime, setReturnTime] = useState(''); // Empty until date selected
  const returnDateRef = useRef<HTMLInputElement>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Operating hours: 08:00 AM to 10:00 PM
  const MIN_TIME = '08:00';
  const MAX_TIME = '22:00';
  const DEFAULT_PICKUP_TIME = '08:00'; // 8 AM
  const DEFAULT_RETURN_TIME = '22:00'; // 10 PM

  // Helper to get today's date in YYYY-MM-DD format
  const getTodayDate = () => new Date().toISOString().split('T')[0];

  // Helper to get current time + 1 hour buffer in HH:MM format
  const getMinTimeForToday = () => {
    const now = new Date();
    now.setHours(now.getHours() + 1); // Add 1 hour buffer
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const bufferedTime = `${hours}:${minutes}`;
    // Return the greater of buffered time or MIN_TIME
    return bufferedTime > MIN_TIME ? bufferedTime : MIN_TIME;
  };

  // Get min pickup time - if today, use current time + 1 hour
  const getMinPickupTime = () => {
    if (pickupDate === getTodayDate()) {
      return getMinTimeForToday();
    }
    return MIN_TIME;
  };

  // Helper to validate time is within operating hours
  const isValidTime = (time: string) => {
    if (!time) return true; // Empty is handled separately
    return time >= MIN_TIME && time <= MAX_TIME;
  };

  // Auto-fill times when dates are selected
  useEffect(() => {
    if (pickupDate && !pickupTime && !touched.pickupTime) {
      // If today, use current time + 1 hour, otherwise default
      if (pickupDate === getTodayDate()) {
        setPickupTime(getMinTimeForToday());
      } else {
        setPickupTime(DEFAULT_PICKUP_TIME);
      }
    }
  }, [pickupDate, pickupTime, touched.pickupTime]);

  useEffect(() => {
    if (returnDate && !returnTime && !touched.returnTime) {
      setReturnTime(DEFAULT_RETURN_TIME);
    }
  }, [returnDate, returnTime, touched.returnTime]);

  // Auto-adjust return time if same day and return time is before/equal pickup time
  useEffect(() => {
    if (pickupDate && returnDate && pickupDate === returnDate && pickupTime && returnTime) {
      if (returnTime <= pickupTime) {
        // Set return time to 1 hour after pickup (or max time if that would exceed)
        const [hours, mins] = pickupTime.split(':').map(Number);
        const newHours = Math.min(hours + 1, 22); // Cap at 10 PM
        const newReturnTime = `${String(newHours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
        if (newReturnTime <= MAX_TIME) {
          setReturnTime(newReturnTime);
        }
      }
    }
  }, [pickupDate, returnDate, pickupTime]);

  // Real-time validation
  useEffect(() => {
    const newErrors: Record<string, string> = {};

    if (touched.pickupDate && !pickupDate) {
      newErrors.pickupDate = 'Pickup date is required';
    }

    if (touched.pickupTime && !pickupTime) {
      newErrors.pickupTime = 'Pickup time is required';
    } else if (pickupTime && !isValidTime(pickupTime)) {
      newErrors.pickupTime = 'Time must be between 8 AM and 10 PM';
    }

    if (touched.returnDate && !returnDate) {
      newErrors.returnDate = 'Return date is required';
    }

    if (touched.returnTime && !returnTime) {
      newErrors.returnTime = 'Return time is required';
    } else if (returnTime && !isValidTime(returnTime)) {
      newErrors.returnTime = 'Time must be between 8 AM and 10 PM';
    }

    // Validate return is after pickup
    if (pickupDate && pickupTime && returnDate && returnTime) {
      const pickup = new Date(`${pickupDate}T${pickupTime}`);
      const returnD = new Date(`${returnDate}T${returnTime}`);

      if (returnD <= pickup) {
        if (pickupDate === returnDate) {
          newErrors.returnTime = 'Return time must be after pickup time';
        } else {
          newErrors.returnDate = 'Return must be after pickup';
        }
      }
    }

    setErrors(newErrors);
  }, [pickupDate, pickupTime, returnDate, returnTime, touched]);

  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const handlePickupDateChange = (value: string) => {
    setPickupDate(value);
    setTouched(prev => ({ ...prev, pickupDate: true }));

    // Auto-update return date to same day if not set or if it's before pickup
    if (value) {
      if (!returnDate || returnDate < value) {
        setReturnDate(value);
      }
      // Auto-focus return date input for seamless flow
      setTimeout(() => {
        returnDateRef.current?.showPicker?.();
        returnDateRef.current?.focus();
      }, 100);
    }
  };

  // Calculate min return time when same day or when return date is today
  const getMinReturnTime = () => {
    const today = getTodayDate();

    if (pickupDate && returnDate && pickupDate === returnDate && pickupTime) {
      // Return time must be after pickup time on same day
      // Also consider if it's today, use the greater of pickup time or current time + 1hr
      if (returnDate === today) {
        const minForToday = getMinTimeForToday();
        return pickupTime > minForToday ? pickupTime : minForToday;
      }
      return pickupTime;
    }

    // If return date is today (but pickup was earlier), enforce current time + 1hr
    if (returnDate === today) {
      return getMinTimeForToday();
    }

    return MIN_TIME;
  };

  const handleSearch = () => {
    // Mark all as touched
    setTouched({
      pickupDate: true,
      pickupTime: true,
      returnDate: true,
      returnTime: true,
    });

    // Validate all fields
    if (!pickupDate || !pickupTime || !returnDate || !returnTime) {
      return;
    }

    // Validate return after pickup
    const pickup = new Date(`${pickupDate}T${pickupTime}`);
    const returnD = new Date(`${returnDate}T${returnTime}`);

    if (returnD <= pickup) {
      return;
    }

    // Navigate with params
    const params = new URLSearchParams({
      startDate: pickupDate,
      startTime: pickupTime,
      endDate: returnDate,
      endTime: returnTime,
    });

    navigate(`/vehicles?${params.toString()}`);
  };

  const hasErrors = Object.keys(errors).length > 0;

  const firstError = Object.values(errors).find(Boolean);
  const showErrorBar = !!firstError && Object.values(touched).some(Boolean);

  const fieldClass = (hasError: boolean) =>
    `flex-1 px-5 py-3 transition-colors ${hasError ? 'bg-red-50' : 'hover:bg-gray-50'
    }`;

  const labelClass =
    'flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-gray-500 mb-1';

  const inputClass =
    'w-full text-sm font-semibold text-gray-900 bg-transparent focus:outline-none cursor-pointer';

  return (
    <div>
      {/* Single error bar above the form when any field has an error */}
      {showErrorBar && (
        <div className="mb-3 flex items-start gap-2 px-4 py-2 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{firstError}</span>
        </div>
      )}

      {/* Horizontal search bar */}
      <div className="bg-white/95 backdrop-blur-sm rounded-2xl md:rounded-full shadow-2xl border border-gray-200 overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-stretch divide-y md:divide-y-0 md:divide-x divide-gray-200">
          {/* Location */}
          <button
            type="button"
            onClick={() => dispatch(openCityModal())}
            className="flex-1 text-left px-5 py-3 hover:bg-gray-50 transition-colors"
          >
            <div className={labelClass}>
              <MapPin className="w-3.5 h-3.5 text-primary-600" />
              Location
            </div>
            <div className="text-sm font-semibold text-gray-900 truncate">
              {selectedCity?.name || 'Select city'}
            </div>
          </button>

          {/* Pickup Date */}
          <div className={fieldClass(!!(errors.pickupDate && touched.pickupDate))}>
            <label htmlFor="pickup-date" className={`${labelClass} cursor-pointer`}>
              <Calendar className="w-3.5 h-3.5 text-primary-600" />
              Pickup Date
            </label>
            <input
              id="pickup-date"
              type="date"
              value={pickupDate}
              onChange={(e) => handlePickupDateChange(e.target.value)}
              onBlur={() => handleBlur('pickupDate')}
              min={new Date().toISOString().split('T')[0]}
              className={inputClass}
            />
          </div>

          {/* Pickup Time */}
          <div className={fieldClass(!!(errors.pickupTime && touched.pickupTime))}>
            <label htmlFor="pickup-time" className={`${labelClass} cursor-pointer`}>
              <Clock className="w-3.5 h-3.5 text-primary-600" />
              Pickup Time
            </label>
            <input
              id="pickup-time"
              type="time"
              value={pickupTime}
              onChange={(e) => {
                let newTime = e.target.value;
                // Auto-correct if today and time is in the past
                if (pickupDate === getTodayDate() && newTime < getMinTimeForToday()) {
                  newTime = getMinTimeForToday();
                }
                setPickupTime(newTime);
                setTouched((prev) => ({ ...prev, pickupTime: true }));
              }}
              onBlur={() => handleBlur('pickupTime')}
              min={getMinPickupTime()}
              max={MAX_TIME}
              className={inputClass}
              placeholder="Select time"
            />
          </div>

          {/* Return Date */}
          <div className={fieldClass(!!(errors.returnDate && touched.returnDate))}>
            <label htmlFor="return-date" className={`${labelClass} cursor-pointer`}>
              <Calendar className="w-3.5 h-3.5 text-indigo-600" />
              Return Date
            </label>
            <input
              ref={returnDateRef}
              id="return-date"
              type="date"
              value={returnDate}
              onChange={(e) => {
                setReturnDate(e.target.value);
                setTouched((prev) => ({ ...prev, returnDate: true }));
              }}
              onBlur={() => handleBlur('returnDate')}
              min={pickupDate || new Date().toISOString().split('T')[0]}
              className={inputClass}
            />
          </div>

          {/* Return Time */}
          <div className={fieldClass(!!(errors.returnTime && touched.returnTime))}>
            <label htmlFor="return-time" className={`${labelClass} cursor-pointer`}>
              <Clock className="w-3.5 h-3.5 text-indigo-600" />
              Return Time
            </label>
            <input
              id="return-time"
              type="time"
              value={returnTime}
              onChange={(e) => {
                let newTime = e.target.value;
                const minReturn = getMinReturnTime();
                // Auto-correct if time is before minimum
                if (newTime < minReturn) {
                  newTime = minReturn;
                }
                setReturnTime(newTime);
                setTouched((prev) => ({ ...prev, returnTime: true }));
              }}
              onBlur={() => handleBlur('returnTime')}
              min={getMinReturnTime()}
              max={MAX_TIME}
              className={inputClass}
              placeholder="Select time"
            />
          </div>

          {/* CTA Button — fills the right semicircle edge-to-edge on desktop */}
          <Button
            onClick={handleSearch}
            disabled={hasErrors || !pickupDate || !pickupTime || !returnDate || !returnTime}
            className="w-full md:w-auto md:self-stretch md:!border-l-0 px-6 py-4 md:px-10 md:py-0 md:h-auto rounded-xl md:rounded-l-none md:rounded-r-full bg-orange-500 hover:bg-orange-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center"
          >
            <Search className="w-5 h-5 mr-2" />
            Ride Now
          </Button>
        </div>
      </div>
    </div>
  );
}