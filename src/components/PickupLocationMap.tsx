import { MapPin, Navigation, Loader2 } from 'lucide-react';
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';
import type { PickupLocationDto } from '../store/api/pickupLocationApi';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_KEY as string;

const mapContainerStyle = {
  width: '100%',
  height: '200px',
};

interface PickupLocationMapProps {
  location: PickupLocationDto;
  onChangeLocation?: () => void;
}

export default function PickupLocationMap({ location, onChangeLocation }: PickupLocationMapProps) {
  const hasCoordinates = location.latitude && location.longitude;

  // Use same loader ID as other map components
  const { isLoaded } = useJsApiLoader({
    id: 'google-maps-script',
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
  });

  const center = hasCoordinates
    ? { lat: Number(location.latitude), lng: Number(location.longitude) }
    : { lat: 24.5854, lng: 73.7125 }; // Default: Udaipur

  const openInMaps = () => {
    if (hasCoordinates) {
      window.open(
        `https://www.google.com/maps/search/?api=1&query=${location.latitude},${location.longitude}`,
        '_blank'
      );
    }
  };

  const openDirections = () => {
    if (hasCoordinates) {
      window.open(
        `https://www.google.com/maps/dir/?api=1&destination=${location.latitude},${location.longitude}`,
        '_blank'
      );
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
      {/* Map Section - Interactive Google Map */}
      <div className="relative">
        {isLoaded && hasCoordinates ? (
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={center}
            zoom={15}
            options={{
              disableDefaultUI: true,
              zoomControl: true,
              gestureHandling: 'cooperative',
            }}
          >
            <Marker position={center} title={location.name} />
          </GoogleMap>
        ) : hasCoordinates ? (
          <div className="h-[200px] bg-gray-100 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin" />
              <p className="text-sm">Loading map...</p>
            </div>
          </div>
        ) : (
          <div className="h-[200px] bg-gray-100 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <MapPin className="w-8 h-8 mx-auto mb-2" />
              <p className="text-sm">No location coordinates</p>
            </div>
          </div>
        )}
      </div>

      {/* Location Details */}
      <div className="p-4">
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
                Change
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
