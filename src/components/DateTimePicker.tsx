import { useState, useEffect } from 'react';
import { Calendar, Clock, AlertCircle, Search } from 'lucide-react';
import { Button } from './ui/button';
import { useNavigate } from 'react-router-dom';

export default function DateTimePicker() {
  const navigate = useNavigate();
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

  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-gray-200">
      <div className="flex items-center gap-3 mb-6">
        {/* <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-indigo-600 rounded-xl flex items-center justify-center">
          <Search className="w-6 h-6 text-white" />
        </div> */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Book Your Ride</h2>
          {/* <p className="text-sm text-gray-600">Choose your dates and find available vehicles</p> */}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pickup Date & Time */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <Calendar className="inline w-4 h-4 mr-1.5 text-primary-600" />
              Pickup Date
            </label>
            <input
              type="date"
              value={pickupDate}
              onChange={(e) => handlePickupDateChange(e.target.value)}
              onBlur={() => handleBlur('pickupDate')}
              min={new Date().toISOString().split('T')[0]}
              className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all ${
                errors.pickupDate && touched.pickupDate
                  ? 'border-red-300 bg-red-50'
                  : 'border-gray-300 hover:border-primary-300'
              }`}
            />
            {errors.pickupDate && touched.pickupDate && (
              <p className="text-xs text-red-600 mt-1 flex items-center">
                <AlertCircle className="w-3 h-3 mr-1" />
                {errors.pickupDate}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <Clock className="inline w-4 h-4 mr-1.5 text-primary-600" />
              Pickup Time
            </label>
            <input
              type="time"
              value={pickupTime}
              onChange={(e) => {
                setPickupTime(e.target.value);
                setTouched(prev => ({ ...prev, pickupTime: true }));
              }}
              onBlur={() => handleBlur('pickupTime')}
              className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all ${
                errors.pickupTime && touched.pickupTime
                  ? 'border-red-300 bg-red-50'
                  : 'border-gray-300 hover:border-primary-300'
              }`}
            />
            {errors.pickupTime && touched.pickupTime && (
              <p className="text-xs text-red-600 mt-1 flex items-center">
                <AlertCircle className="w-3 h-3 mr-1" />
                {errors.pickupTime}
              </p>
            )}
            {!errors.pickupTime && pickupDate && (
              <p className="text-xs text-gray-500 mt-1">Default: 10:00 AM</p>
            )}
          </div>
        </div>

        {/* Return Date & Time */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <Calendar className="inline w-4 h-4 mr-1.5 text-indigo-600" />
              Return Date
            </label>
            <input
              type="date"
              value={returnDate}
              onChange={(e) => {
                setReturnDate(e.target.value);
                setTouched(prev => ({ ...prev, returnDate: true }));
              }}
              onBlur={() => handleBlur('returnDate')}
              min={pickupDate || new Date().toISOString().split('T')[0]}
              className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all ${
                errors.returnDate && touched.returnDate
                  ? 'border-red-300 bg-red-50'
                  : 'border-gray-300 hover:border-indigo-300'
              }`}
            />
            {errors.returnDate && touched.returnDate && (
              <p className="text-xs text-red-600 mt-1 flex items-center">
                <AlertCircle className="w-3 h-3 mr-1" />
                {errors.returnDate}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <Clock className="inline w-4 h-4 mr-1.5 text-indigo-600" />
              Return Time
            </label>
            <input
              type="time"
              value={returnTime}
              onChange={(e) => {
                setReturnTime(e.target.value);
                setTouched(prev => ({ ...prev, returnTime: true }));
              }}
              onBlur={() => handleBlur('returnTime')}
              className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all ${
                errors.returnTime && touched.returnTime
                  ? 'border-red-300 bg-red-50'
                  : 'border-gray-300 hover:border-indigo-300'
              }`}
            />
            {errors.returnTime && touched.returnTime && (
              <p className="text-xs text-red-600 mt-1 flex items-center">
                <AlertCircle className="w-3 h-3 mr-1" />
                {errors.returnTime}
              </p>
            )}
            {!errors.returnTime && returnDate && (
              <p className="text-xs text-gray-500 mt-1">Default: 8:00 PM</p>
            )}
          </div>
        </div>
      </div>

      <Button
        onClick={handleSearch}
        disabled={hasErrors || !pickupDate || !pickupTime || !returnDate || !returnTime}
        className="w-full mt-6 bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-700 hover:to-indigo-700 text-white py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
      >
        <Search className="w-5 h-5 mr-2 inline" />
        Search Available Vehicles
      </Button>
    </div>
  );
}