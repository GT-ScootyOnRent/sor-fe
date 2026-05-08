import { MapPin, Navigation, Edit2 } from 'lucide-react';
import type { PickupLocationDto } from '../store/api/pickupLocationApi';

interface PickupLocationCardProps {
    location: PickupLocationDto;
    onChangeLocation?: () => void;
}

export default function PickupLocationCard({ location, onChangeLocation }: PickupLocationCardProps) {
    const openDirections = () => {
        if (location.latitude && location.longitude) {
            window.open(
                `https://www.google.com/maps/dir/?api=1&destination=${location.latitude},${location.longitude}`,
                '_blank'
            );
        }
    };

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="flex-shrink-0 w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                        <MapPin className="w-5 h-5 text-primary-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Pickup Location</p>
                        <p className="font-semibold text-gray-900 mt-0.5">{location.name}</p>
                        {location.address && (
                            <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{location.address}</p>
                        )}
                    </div>
                </div>

                <div className="flex flex-col gap-2">
                    {location.latitude && location.longitude && (
                        <button
                            onClick={openDirections}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors"
                        >
                            <Navigation className="w-3.5 h-3.5" />
                            Directions
                        </button>
                    )}
                    {onChangeLocation && (
                        <button
                            onClick={onChangeLocation}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                        >
                            <Edit2 className="w-3.5 h-3.5" />
                            Change
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
