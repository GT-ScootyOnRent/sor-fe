import { useNavigate, useSearchParams } from 'react-router-dom';
import { Fuel, Gauge } from 'lucide-react';
import { Button } from './ui/button';
import type { VehicleWithImagesDto } from '../store/api/vehicleApi';

interface VehicleCardProps {
  vehicle: VehicleWithImagesDto;
}

export default function VehicleCard({ vehicle }: VehicleCardProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const handleBookNow = () => {
    const startDate = searchParams.get('startDate');
    const startTime = searchParams.get('startTime');
    const endDate = searchParams.get('endDate');
    const endTime = searchParams.get('endTime');

    const cityIdValue = vehicle.cityId ?? 1;

    const params = new URLSearchParams({
      cityId: cityIdValue.toString(),
    });

    // only append datetime params if ALL exist
    if (startDate && startTime && endDate && endTime) {
      params.append('startDate', startDate);
      params.append('startTime', startTime);
      params.append('endDate', endDate);
      params.append('endTime', endTime);
    }

    navigate(`/book/${vehicle.id}?${params.toString()}`);
  };

  const imageUrl =
    (vehicle as any).image ||
    vehicle.primaryImageUrl ||
    vehicle.images?.[0]?.imageUrl ||
    'https://via.placeholder.com/400x300?text=No+Image';

  const isAvailable = vehicle.isAvailable !== false;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]">

      {/* Image */}
      <div className="relative h-56 md:h-64 bg-gray-100">
        <img
          src={imageUrl}
          alt={vehicle.name}
          className="w-full h-full object-cover"
          crossOrigin="anonymous"
          loading="lazy"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            if (!target.src.includes('placeholder')) {
              target.src = 'https://via.placeholder.com/400x300?text=Vehicle+Image';
            }
          }}
        />

        {!isAvailable && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <span className="bg-red-500 text-white px-4 py-2 rounded-lg font-semibold">
              Not Available
            </span>
          </div>
        )}
      </div>

      {/* Details */}
      <div className="p-5 md:p-6">
        <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
          {vehicle.name}
        </h3>

        <p className="text-base text-gray-600 mb-4">
          {vehicle.make} {vehicle.model}
        </p>

        {/* Specs */}
        <div className="flex items-center gap-5 mb-5 text-base text-gray-600">
          <div className="flex items-center gap-1.5">
            <Gauge className="w-5 h-5" />
            <span>{vehicle.kmTravelled?.toLocaleString() || '0'} km</span>
          </div>

          <div className="flex items-center gap-1.5">
            <Fuel className="w-5 h-5" />
            <span>{vehicle.fuelType || 'Petrol'}</span>
          </div>
        </div>

        {/* Pricing */}
        <div className="flex items-baseline justify-between mb-5">
          <div>
            <span className="text-3xl font-bold text-primary-600">
              ₹{vehicle.pricePerHour || 0}
            </span>
            <span className="text-base text-gray-600">/hour</span>
          </div>
        </div>

        {/* Button */}
        <Button
          onClick={handleBookNow}
          disabled={!isAvailable}
          className="w-full bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-700 hover:to-indigo-700 text-white disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {isAvailable ? 'Book Now' : 'Unavailable'}
        </Button>
      </div>
    </div>
  );
}
