import { useEffect, useState } from 'react';
import { MapPin, Navigation, Loader2, AlertCircle } from 'lucide-react';
import { GoogleMap, Marker, LoadScript } from '@react-google-maps/api';
import { useGetActivePickupLocationsByCityQuery } from '../store/api/pickupLocationApi';
import { toast } from 'sonner';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_KEY;

interface Location {
  id: number;
  name: string;
  cityId: number;
  latitude?: number;
  longitude?: number;
}

interface MapWithLocationsProps {
  cityId?: number;
  onLocationSelect?: (location: Location) => void;
  selectedLocationId?: number;
}

const containerStyle = {
  width: '100%',
  height: '400px',
};

const defaultCenter = {
  lat: 24.5854, // Udaipur, Rajasthan
  lng: 73.7125,
};

export default function MapWithLocations({
  cityId = 1,
  onLocationSelect,
  selectedLocationId
}: MapWithLocationsProps) {
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [mapZoom, setMapZoom] = useState(12);

  // Fetch locations from API
  const { data: locations, isLoading, error } = useGetActivePickupLocationsByCityQuery(cityId);

  // Get user's current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  }, []);

  // Update selected location when selectedLocationId changes
  useEffect(() => {
    if (selectedLocationId && locations) {
      const location = locations.find(loc => loc.id === selectedLocationId);
      if (location) {
        setSelectedLocation(location);

        // Center map on selected location if it has coordinates
        if (location.latitude && location.longitude) {
          setMapCenter({
            lat: Number(location.latitude),
            lng: Number(location.longitude)
          });
          setMapZoom(14);
        }
      }
    }
  }, [selectedLocationId, locations]);

  const handleLocationClick = (location: Location) => {
    setSelectedLocation(location);

    // Center map on clicked location
    if (location.latitude && location.longitude) {
      setMapCenter({
        lat: Number(location.latitude),
        lng: Number(location.longitude)
      });
      setMapZoom(14);
    }

    if (onLocationSelect) {
      onLocationSelect(location);
    }
  };

  const openGoogleMapsDirections = (location: Location) => {
    if (!location.latitude || !location.longitude) {
      toast.error('Location coordinates not available');
      return;
    }

    let mapsUrl = '';

    if (userLocation) {
      // Directions from current location to pickup point
      mapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${userLocation.lat},${userLocation.lng}&destination=${location.latitude},${location.longitude}&travelmode=driving`;
    } else {
      // Just show the destination
      mapsUrl = `https://www.google.com/maps/search/?api=1&query=${location.latitude},${location.longitude}`;
    }

    window.open(mapsUrl, '_blank');
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin mr-3" />
        <span className="text-gray-600">Loading pickup locations...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg border border-red-200 p-8">
        <div className="flex items-center justify-center text-red-600">
          <AlertCircle className="w-8 h-8 mr-3" />
          <span>Failed to load pickup locations</span>
        </div>
      </div>
    );
  }

  // Filter locations that have coordinates for map display
  const locationsWithCoords = locations?.filter(loc => loc.latitude && loc.longitude) || [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Google Map */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {GOOGLE_MAPS_API_KEY ? (
          <LoadScript googleMapsApiKey={GOOGLE_MAPS_API_KEY}>
            <GoogleMap
              mapContainerStyle={containerStyle}
              center={mapCenter}
              zoom={mapZoom}
            >
              {/* User location marker */}
              {userLocation && (
                <Marker
                  position={userLocation}
                  icon={{
                    url: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png'
                  }}
                  title="Your Location"
                />
              )}

              {/* Location markers */}
              {locationsWithCoords.map((location) => (
                <Marker
                  key={location.id}
                  position={{
                    lat: Number(location.latitude),
                    lng: Number(location.longitude)
                  }}
                  onClick={() => handleLocationClick(location)}
                  icon={
                    selectedLocation?.id === location.id
                      ? 'http://maps.google.com/mapfiles/ms/icons/red-dot.png'
                      : 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png'
                  }
                  title={location.name}
                />
              ))}
            </GoogleMap>
          </LoadScript>
        ) : (
          <div className="h-[400px] flex items-center justify-center bg-gray-100">
            <div className="text-center text-gray-500">
              <MapPin className="w-12 h-12 mx-auto mb-2" />
              <p className="text-sm">Google Maps API key not configured</p>
            </div>
          </div>
        )}
      </div>

      {/* Location List */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-primary-600 to-indigo-600 text-white p-4">
          <h3 className="text-lg font-semibold flex items-center">
            <MapPin className="w-5 h-5 mr-2" />
            Pickup Locations
          </h3>
          <p className="text-sm text-primary-100 mt-1">
            Click on a location to view directions
          </p>
        </div>

        <div className="h-[350px] overflow-y-auto p-4">
          {locations && locations.length > 0 ? (
            <div className="space-y-3">
              {locations.map((location) => (
                <button
                  key={location.id}
                  onClick={() => handleLocationClick(location)}
                  className={`w-full text-left p-4 rounded-lg border transition-all ${selectedLocation?.id === location.id
                      ? 'border-primary-500 bg-primary-50 shadow-md'
                      : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'
                    }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start flex-1">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${selectedLocation?.id === location.id
                          ? 'bg-primary-500'
                          : 'bg-gray-200'
                        }`}>
                        <MapPin className={`w-5 h-5 ${selectedLocation?.id === location.id ? 'text-white' : 'text-gray-600'
                          }`} />
                      </div>
                      <div className="ml-3 flex-1">
                        <h4 className="font-semibold text-gray-900">{location.name}</h4>
                        {location.latitude && location.longitude && (
                          <p className="text-xs text-gray-500 mt-1">
                            {Number(location.latitude).toFixed(6)}, {Number(location.longitude).toFixed(6)}
                          </p>
                        )}
                      </div>
                    </div>

                    {location.latitude && location.longitude && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openGoogleMapsDirections(location);
                        }}
                        className={`ml-2 px-3 py-1.5 rounded-lg text-sm font-medium flex items-center transition-colors ${selectedLocation?.id === location.id
                            ? 'bg-primary-500 text-white hover:bg-primary-600'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                      >
                        <Navigation className="w-4 h-4 mr-1" />
                        Directions
                      </button>
                    )}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <MapPin className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p>No pickup locations available for this city</p>
            </div>
          )}
        </div>

        {/* Selected Location Summary */}
        {selectedLocation && (
          <div className="border-t border-gray-200 bg-primary-50 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Selected Pickup Point:</p>
                <p className="font-semibold text-gray-900">{selectedLocation.name}</p>
              </div>
              {selectedLocation.latitude && selectedLocation.longitude && (
                <button
                  onClick={() => openGoogleMapsDirections(selectedLocation)}
                  className="bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors flex items-center text-sm font-medium"
                >
                  <Navigation className="w-4 h-4 mr-2" />
                  Get Directions
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}