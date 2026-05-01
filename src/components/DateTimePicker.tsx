import { useState, useEffect } from 'react';
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
  const [pickupTime, setPickupTime] = useState('10:00'); // Auto-filled
  const [returnDate, setReturnDate] = useState('');
  const [returnTime, setReturnTime] = useState('20:00'); // Auto-filled (8 PM)
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Auto-fill times when dates are selected
  useEffect(() => {
    if (pickupDate && !touched.pickupTime) {
      setPickupTime('10:00');
    }
  }, [pickupDate, touched.pickupTime]);

  useEffect(() => {
    if (returnDate && !touched.returnTime) {
      setReturnTime('20:00');
    }
  }, [returnDate, touched.returnTime]);

  // Real-time validation
  useEffect(() => {
    const newErrors: Record<string, string> = {};

    if (touched.pickupDate && !pickupDate) {
      newErrors.pickupDate = 'Pickup date is required';
    }

    if (touched.pickupTime && !pickupTime) {
      newErrors.pickupTime = 'Pickup time is required';
    }

    if (touched.returnDate && !returnDate) {
      newErrors.returnDate = 'Return date is required';
    }

    if (touched.returnTime && !returnTime) {
      newErrors.returnTime = 'Return time is required';
    }

    // Validate return is after pickup
    if (pickupDate && pickupTime && returnDate && returnTime) {
      const pickup = new Date(`${pickupDate}T${pickupTime}`);
      const returnD = new Date(`${returnDate}T${returnTime}`);
      
      if (returnD <= pickup) {
        newErrors.returnDate = 'Return must be after pickup';
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
    
    // Auto-update return date to next day if not set
    if (!returnDate && value) {
      const sameDay = new Date(value);
      setReturnDate(sameDay.toISOString().split('T')[0]);
    }
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
    `flex-1 px-5 py-3 transition-colors ${
      hasError ? 'bg-red-50' : 'hover:bg-gray-50'
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
                setPickupTime(e.target.value);
                setTouched((prev) => ({ ...prev, pickupTime: true }));
              }}
              onBlur={() => handleBlur('pickupTime')}
              className={inputClass}
            />
          </div>

          {/* Return Date */}
          <div className={fieldClass(!!(errors.returnDate && touched.returnDate))}>
            <label htmlFor="return-date" className={`${labelClass} cursor-pointer`}>
              <Calendar className="w-3.5 h-3.5 text-indigo-600" />
              Return Date
            </label>
            <input
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
                setReturnTime(e.target.value);
                setTouched((prev) => ({ ...prev, returnTime: true }));
              }}
              onBlur={() => handleBlur('returnTime')}
              className={inputClass}
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