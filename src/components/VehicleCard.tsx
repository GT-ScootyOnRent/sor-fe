
import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Fuel, Gauge, Package } from 'lucide-react';
import { Button } from './ui/button';
import type { VehicleWithImagesDto } from '../store/api/vehicleApi';

interface VehicleCardProps {
  vehicle: VehicleWithImagesDto;
}

export default function VehicleCard({ vehicle }: VehicleCardProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [isFlipped, setIsFlipped] = useState(false);

const packageList = vehicle.packages
  ? [
      { label: '4 Hours', price: vehicle.packages.fourHours },
      { label: '1 Day', price: vehicle.packages.oneDay },
      { label: '3 Days', price: vehicle.packages.threeDays },
      { label: '7 Days', price: vehicle.packages.sevenDays },
      { label: '15 Days', price: vehicle.packages.fifteenDays },
      { label: 'Monthly', price: vehicle.packages.monthly },
    ].filter((item) => item.price > 0)
  : [];

const hasPackages = packageList.length > 0;

  const handleBookNow = () => {
    const startDate = searchParams.get('startDate');
    const startTime = searchParams.get('startTime');
    const endDate = searchParams.get('endDate');
    const endTime = searchParams.get('endTime');

    const cityIdValue = vehicle.cityId ?? 1;

    const params = new URLSearchParams({
      cityId: cityIdValue.toString(),
    });

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
    <div className="perspective-[1200px] w-full">
      <div
        className={`relative h-[560px] md:h-[600px] w-full transition-transform duration-500 [transform-style:preserve-3d] ${
          isFlipped ? 'rotate-y-180' : ''
        }`}
      >
        {/* FRONT SIDE */}
        <div className="absolute inset-0 bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-xl [backface-visibility:hidden]">
          {/* IMAGE */}
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
                  target.src =
                    'https://via.placeholder.com/400x300?text=Vehicle+Image';
                }
              }}
            />

            {!isAvailable && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <span className="bg-red-500 text-white px-4 py-2 rounded-lg font-semibold">
                  Not Available
                </span>
              </div>
            )}
          </div>

          {/* PACKAGE BUTTON DIVIDER */}
          {hasPackages && (
            <div className="px-5 pt-4">
              <button
                type="button"
                onClick={() => setIsFlipped(true)}
                className="w-full flex items-center gap-3 group"
              >
                <div className="flex-1 h-px bg-gray-300 group-hover:bg-primary-500 transition-colors" />

                <span className="px-4 py-1.5 rounded-full border border-primary-500 text-primary-600 text-sm font-semibold hover:bg-primary-50 transition">
                  Package
                </span>

                <div className="flex-1 h-px bg-gray-300 group-hover:bg-primary-500 transition-colors" />
              </button>
            </div>
          )}

          {/* DETAILS */}
          <div className="p-5 md:p-6">
            <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
              {vehicle.name}
            </h3>

            <p className="text-base text-gray-600 mb-4">
              {vehicle.make} {vehicle.model}
            </p>

            {/* SPECS */}
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

            {/* PRICE */}
            <div className="mb-5">
              <span className="text-3xl font-bold text-primary-600">
                ₹{vehicle.pricePerHour || 0}
              </span>
              <span className="text-base text-gray-600">/hour</span>
            </div>

            {/* BOOK */}
            <Button
              onClick={handleBookNow}
              disabled={!isAvailable}
              className="w-full bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-700 hover:to-indigo-700 text-white disabled:bg-gray-300"
            >
              {isAvailable ? 'Book Now' : 'Unavailable'}
            </Button>
          </div>
        </div>

        {/* BACK SIDE */}
        <div className="absolute inset-0 bg-white rounded-2xl border border-gray-200 overflow-hidden rotate-y-180 [backface-visibility:hidden] [transform:rotateY(180deg)]">
          <div className="p-5 md:p-6 h-full flex flex-col">
            {/* HEADER */}
            <div className="flex items-center gap-2 mb-5">
              <Package className="w-5 h-5 text-primary-600" />
              <h3 className="text-xl font-bold text-gray-900">Packages</h3>
            </div>

            {/* PACKAGE LIST */}
            <div className="space-y-4 flex-1 overflow-y-auto">
  {packageList.length > 0 ? (
    packageList.map((pkg, index) => (
      <div
        key={index}
        className="rounded-2xl border border-gray-200 bg-white px-4 py-4 flex justify-between items-center transition-all hover:shadow-md hover:-translate-y-0.5"
      >
        <span className="font-medium text-gray-700">
          {pkg.label}
        </span>

        <span className="font-bold text-primary-600">
          ₹{pkg.price}
        </span>
      </div>
    ))
  ) : (
    <div className="text-sm text-gray-500">
      No packages available
    </div>
  )}
</div>

            {/* DETAILS BUTTON */}
            <button
              type="button"
              onClick={() => setIsFlipped(false)}
              className="w-full flex items-center gap-3 mt-5 mb-4"
            >
              <div className="flex-1 h-px bg-gray-300" />

              <span className="px-4 py-1.5 rounded-full border border-gray-400 text-gray-700 text-sm font-semibold">
                Details
              </span>

              <div className="flex-1 h-px bg-gray-300" />
            </button>

            {/* BOOK NOW */}
            <Button
              onClick={handleBookNow}
              disabled={!isAvailable}
              className="w-full bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-700 hover:to-indigo-700 text-white disabled:bg-gray-300"
            >
              {isAvailable ? 'Book Now' : 'Unavailable'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}