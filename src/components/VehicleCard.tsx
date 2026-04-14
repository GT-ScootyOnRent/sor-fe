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
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]">

      {/* Image */}
      <div className="relative h-48 bg-gray-100">
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
      <div className="p-4">
        <h3 className="text-lg font-bold text-gray-900 mb-1">
          {vehicle.name}
        </h3>

        <p className="text-sm text-gray-600 mb-3">
          {vehicle.make} {vehicle.model}
        </p>

        {/* Specs */}
        <div className="flex items-center gap-4 mb-4 text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <Gauge className="w-4 h-4" />
            <span>{vehicle.kmTravelled?.toLocaleString() || '0'} km</span>
          </div>

          <div className="flex items-center gap-1">
            <Fuel className="w-4 h-4" />
            <span>{vehicle.fuelType || 'Petrol'}</span>
          </div>
        </div>

        {/* Pricing */}
        <div className="flex items-baseline justify-between mb-4">
          <div>
            <span className="text-2xl font-bold text-primary-600">
              ₹{vehicle.pricePerHour || 0}
            </span>
            <span className="text-sm text-gray-600">/hour</span>
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
