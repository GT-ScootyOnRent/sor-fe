
import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Fuel, Check } from 'lucide-react';
import { Button } from './ui/button';
import type { VehicleWithImagesDto } from '../store/api/vehicleApi';
import { useAppSelector } from '../store/hooks';
import PickupLocationModal from './PickupLocationModal';
import LoginModal from './LoginModal';
import type { PickupLocationDto } from '../store/api/pickupLocationApi';

interface VehicleCardProps {
  vehicle: VehicleWithImagesDto;
}

interface PackageOption {
  label: string;
  price: number;
  days: number;
  color: string;
  hoverColor: string;
}

function formatNextAvailableFrom(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;

  const date = d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const time = d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  return `${date} (${time})`;
}

export default function VehicleCard({ vehicle }: VehicleCardProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const selectedCity = useAppSelector((state) => state.city.selectedCity);

  const [isFlipped, setIsFlipped] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<number | null>(null);
  const [showPickupModal, setShowPickupModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [pendingLocation, setPendingLocation] = useState<PickupLocationDto | null>(null);

  // Build package options for 2x2 grid (3 days, 7 days, 15 days, 1 month)
  const packageOptions: PackageOption[] = vehicle.packages
    ? [
      {
        label: '3 Days',
        price: vehicle.packages.threeDays,
        days: 3,
        color: 'from-white to-white',
        hoverColor: 'hover:from-primary-50 hover:to-primary-100',
      },
      {
        label: '7 Days',
        price: vehicle.packages.sevenDays,
        days: 7,
        color: 'from-white to-white',
        hoverColor: 'hover:from-primary-50 hover:to-primary-100',
      },
      {
        label: '15 Days',
        price: vehicle.packages.fifteenDays,
        days: 15,
        color: 'from-white to-white',
        hoverColor: 'hover:from-primary-50 hover:to-primary-100',
      },
      {
        label: '1 Month',
        price: vehicle.packages.monthly,
        days: 30,
        color: 'from-white to-white',
        hoverColor: 'hover:from-primary-50 hover:to-primary-100',
      },
    ].filter((item) => item.price > 0)
    : [];

  const hasPackages = packageOptions.length > 0;

  // Build URL params for booking
  const buildBookingParams = (pickupLocationId: number) => {
    let startDate = searchParams.get('startDate');
    let startTime = searchParams.get('startTime');
    let endDate = searchParams.get('endDate');
    let endTime = searchParams.get('endTime');

    const cityIdValue = vehicle.cityId ?? selectedCity?.id ?? 1;

    const params = new URLSearchParams({
      cityId: cityIdValue.toString(),
      pickupLocationId: pickupLocationId.toString(),
    });

    // If a package is selected, calculate dates
    if (selectedPackage !== null) {
      const selectedPkg = packageOptions[selectedPackage];
      if (selectedPkg) {
        // If no start date from search, use today
        if (!startDate) {
          const today = new Date();
          startDate = today.toISOString().split('T')[0];

          // Use current time + 1 hour buffer for pickup time
          const pickupTime = new Date(today.getTime() + 60 * 60 * 1000);
          const hours = pickupTime.getHours().toString().padStart(2, '0');
          const minutes = pickupTime.getMinutes().toString().padStart(2, '0');
          startTime = `${hours}:${minutes}`;
        }

        // Calculate end date based on package days
        const start = new Date(startDate);
        start.setDate(start.getDate() + selectedPkg.days);
        endDate = start.toISOString().split('T')[0];

        // If no end time, use default return time 11:30 PM
        if (!endTime) {
          endTime = '23:30';
        }

        // If no start time set, use default 6:00 AM
        if (!startTime) {
          startTime = '06:00';
        }

        // Pass package price and label
        params.append('packagePrice', selectedPkg.price.toString());
        params.append('packageLabel', selectedPkg.label);
      }
    }

    if (startDate && startTime && endDate && endTime) {
      params.append('startDate', startDate);
      params.append('startTime', startTime);
      params.append('endDate', endDate);
      params.append('endTime', endTime);
    }

    return params;
  };

  // Navigate to booking page
  const navigateToBooking = (pickupLocationId: number) => {
    const params = buildBookingParams(pickupLocationId);
    navigate(`/book/${vehicle.id}?${params.toString()}`);
  };

  // Handle "Book Now" button click - opens pickup location modal
  const handleBookNow = () => {
    setShowPickupModal(true);
  };

  // Handle pickup location selection
  const handlePickupLocationSelected = (location: PickupLocationDto) => {
    setShowPickupModal(false);

    if (isAuthenticated) {
      // User is logged in, go directly to booking
      navigateToBooking(location.id);
    } else {
      // User not logged in, show login modal
      setPendingLocation(location);
      setShowLoginModal(true);
    }
  };

  // Handle successful login
  const handleLoginSuccess = () => {
    setShowLoginModal(false);
    if (pendingLocation) {
      navigateToBooking(pendingLocation.id);
      setPendingLocation(null);
    }
  };

  const imageUrl =
    (vehicle as any).image ||
    vehicle.primaryImageUrl ||
    vehicle.images?.[0]?.imageUrl ||
    'https://via.placeholder.com/400x300?text=No+Image';

  const isAvailable = vehicle.isAvailable !== false;
  const showAvailabilityBadge = !isAvailable && !!vehicle.nextAvailableFrom;
  const availableFromLabel = showAvailabilityBadge
    ? `Available from ${formatNextAvailableFrom(vehicle.nextAvailableFrom!)}`
    : null;
  const unavailableTitle = !isAvailable
    ? availableFromLabel ?? 'Vehicle is currently unavailable'
    : undefined;

  return (
    <div className="w-full bg-white rounded-2xl border border-gray-200 overflow-visible hover:shadow-xl transition-shadow">
      {/* IMAGE - Fixed, doesn't flip */}
      <div className="relative h-56 md:h-64 bg-gray-100">
        <img
          src={imageUrl}
          alt={vehicle.name}
          className="w-full h-full object-cover rounded-t-2xl"
          crossOrigin="anonymous"
          loading="lazy"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            if (!target.src.includes('placeholder')) {
              target.src = 'https://via.placeholder.com/400x300?text=Vehicle+Image';
            }
          }}
        />

        {showAvailabilityBadge && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full bg-blue-600 text-white text-xs sm:text-sm font-semibold shadow-md backdrop-blur-sm max-w-[92%] truncate cursor-default transition-all duration-300 hover:shadow-[0_0_20px_rgba(59,130,246,0.6)] hover:bg-blue-500">
            {availableFromLabel}
          </div>
        )}

        {!isAvailable && !showAvailabilityBadge && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full bg-black/60 text-white text-xs sm:text-sm font-semibold shadow-md backdrop-blur-sm max-w-[92%] truncate">
            Unavailable
          </div>
        )}

        {/* PACKAGE/BACK TOGGLE BUTTON - Hexagon with Border Glow */}
        {hasPackages && (
          <button
            type="button"
            onClick={() => {
              setIsFlipped(!isFlipped);
              if (isFlipped) setSelectedPackage(null);
            }}
            className="absolute -bottom-[18px] left-0 right-0 z-10 flex items-center justify-center group"
          >
            <div className="h-px flex-1 bg-gray-400 mr-[-1px]" />
            <div className="relative w-[120px] h-[36px] hover:drop-shadow-[0_0_8px_rgba(1,124,238,0.6)] transition-all duration-300">
              <svg viewBox="0 0 120 36" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                <path
                  d="M12 1 L108 1 L119 18 L108 35 L12 35 L1 18 Z"
                  fill="white"
                  stroke="black"
                  strokeWidth="1"
                  className="group-hover:stroke-primary-500 group-hover:stroke-2 transition-all duration-300"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-gray-700 text-sm font-medium group-hover:text-primary-600 transition-colors duration-300">
                {isFlipped ? 'Back' : 'Package'}
              </span>
            </div>
            <div className="h-px flex-1 bg-gray-400 ml-[-1px]" />
          </button>
        )}
      </div>

      {/* FLIP CONTAINER - Only bottom part flips */}
      <div className="relative pt-6" style={{ perspective: '1000px' }}>
        <div
          className={`relative transition-transform duration-500`}
          style={{
            transformStyle: 'preserve-3d',
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            minHeight: hasPackages ? '280px' : 'auto',
          }}
        >
          {/* FRONT - Vehicle Details */}
          <div
            className="p-5 md:p-6"
            style={{
              backfaceVisibility: 'hidden',
            }}
          >
            <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
              {vehicle.name}
            </h3>

            <p className="text-base text-gray-600 mb-4">
              {vehicle.make} {vehicle.model}
            </p>

            {/* SPECS */}
            <div className="flex items-center gap-5 mb-5 text-base text-gray-600">
              <div className="flex items-center gap-1.5">
                <Fuel className="w-5 h-5" />
                <span>{vehicle.fuelType || 'Petrol'}</span>
              </div>
            </div>

            {/* PRICE */}
            <div className="mb-5">
              <span className="text-3xl font-bold text-primary-600">
                ₹{vehicle.pricePerHour || 0}
              </span>
              <span className="text-base text-gray-600">/hour</span>
            </div>

            {/* BOOK */}
            <span className="block" title={unavailableTitle}>
              <Button
                onClick={handleBookNow}
                disabled={!isAvailable}
                className="w-full bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-700 hover:to-indigo-700 text-white disabled:bg-gray-300"
              >
                {isAvailable ? 'Book Now' : 'Unavailable'}
              </Button>
            </span>
          </div>

          {/* BACK - Package Options (2x2 Grid) */}
          <div
            className="absolute inset-0 p-5 md:p-6 bg-white"
            style={{
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
            }}
          >
            <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-3">
              Select Package
            </p>

            {/* 2x2 GRID */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              {packageOptions.map((pkg, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setSelectedPackage(index)}
                  className={`relative bg-gradient-to-br ${pkg.color} ${pkg.hoverColor} border-2 rounded-xl p-3 cursor-pointer text-center transition-all shadow-sm ${selectedPackage === index
                    ? 'border-primary-500 ring-2 ring-primary-200'
                    : 'border-gray-200 hover:border-primary-300'
                    }`}
                >
                  {/* Checkmark */}
                  {selectedPackage === index && (
                    <div className="absolute top-1 right-1 w-5 h-5 bg-primary-500 rounded-full flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" strokeWidth={3} />
                    </div>
                  )}

                  <p className="text-lg font-bold text-primary-600">₹{pkg.price}</p>
                  <p className="text-xs text-primary-500">{pkg.label}</p>
                </button>
              ))}
            </div>

            {/* BOOK NOW */}
            <span className="block" title={unavailableTitle}>
              <Button
                onClick={handleBookNow}
                disabled={!isAvailable}
                className="w-full bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-700 hover:to-indigo-700 text-white disabled:bg-gray-300"
              >
                {isAvailable ? 'Book Now' : 'Unavailable'}
              </Button>
            </span>
          </div>
        </div>
      </div>

      {/* Pickup Location Modal */}
      <PickupLocationModal
        isOpen={showPickupModal}
        onClose={() => setShowPickupModal(false)}
        cityId={vehicle.cityId ?? selectedCity?.id ?? 1}
        cityName={selectedCity?.name ?? 'City'}
        onContinue={handlePickupLocationSelected}
      />

      {/* Login Modal */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => {
          setShowLoginModal(false);
          setPendingLocation(null);
        }}
        onSuccess={handleLoginSuccess}
      />
    </div>
  );
}