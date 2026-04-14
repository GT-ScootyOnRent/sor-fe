import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import VehicleCard from '../components/VehicleCard';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorMessage } from '../components/ErrorMessage';
import { useSearchAvailableVehiclesQuery } from '../store/api/vehicleApi';
import { useGetCitiesQuery } from '../store/api/cityApi';
import { useAppSelector } from '../store/hooks';
import BackgroundSlideshow from '../components/BackgroundSlideshow';
import { Slider } from '../components/ui/slider';
import { AlertCircle, Filter, X, SlidersHorizontal, MapPin } from 'lucide-react';
import { Button } from '../components/ui/button';

const VehicleListingPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const selectedCity = useAppSelector((state) => state.city.selectedCity);
  const { data: cities = [] } = useGetCitiesQuery({ page: 1, size: 100 });

  // Get search params from URL
  const startDate = searchParams.get('startDate');
  const startTime = searchParams.get('startTime');
  const endDate = searchParams.get('endDate');
  const endTime = searchParams.get('endTime');

  // Filter states
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedFuel, setSelectedFuel] = useState<string>('');
  const [priceRange, setPriceRange] = useState<number[]>([0, 500]);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [selectedCityId, setSelectedCityId] = useState<number | undefined>(undefined);

  // Initialize city filter from selected city
  useEffect(() => {
    if (selectedCity && !selectedCityId) {
      setSelectedCityId(selectedCity.id);
    }
  }, [selectedCity, selectedCityId]);

  // Fetch vehicles based on search params + city filter
  const { data: vehicles, isLoading, error } = useSearchAvailableVehiclesQuery({
    startDate: startDate || undefined,
    startTime: startTime || undefined,
    endDate: endDate || undefined,
    endTime: endTime || undefined,
    cityId: selectedCityId,
  });

  // Apply client-side filters
  const filteredVehicles = vehicles?.filter((v) => {
    if (selectedType && v.vehicleType !== selectedType) return false;
    if (selectedFuel && v.fuelType !== selectedFuel) return false;
    if (v.pricePerHour < priceRange[0] || v.pricePerHour > priceRange[1]) return false;
    return true;
  });

  const clearFilters = () => {
    setSelectedType('');
    setSelectedFuel('');
    setPriceRange([0, 500]);
    setSelectedCityId(selectedCity?.id);
  };

  const hasActiveFilters = !!selectedType || !!selectedFuel || priceRange[0] > 0 || priceRange[1] < 500 || selectedCityId !== selectedCity?.id;

  if (isLoading) return <LoadingSpinner fullScreen message="Loading available vehicles..." />;
  if (error) return <ErrorMessage fullScreen message="Failed to load vehicles" />;

  return (
    <div className="min-h-screen bg-white relative">
      <BackgroundSlideshow />
      <div className="relative z-10">
        <Header />

        <div className="container mx-auto px-4 py-8">

          {/* Page Header */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-black mb-2">Available Vehicles</h1>
              <p className="text-gray-600">Explore our complete fleet of two-wheelers</p>
            </div>
            {/* Mobile filter toggle */}
            <Button
              onClick={() => setShowMobileFilters(!showMobileFilters)}
              variant="outline"
              className="lg:hidden flex items-center gap-2 border-primary-500 text-primary-500"
            >
              <SlidersHorizontal className="w-4 h-4" />
              {showMobileFilters ? 'Hide Filters' : 'Show Filters'}
            </Button>
          </div>

          {/* Search criteria banner */}
          {/* {startDate && startTime && endDate && endTime && (
            <div className="mb-6 bg-primary-50 border border-primary-200 rounded-xl p-6">
              <div className="flex items-start">
                <Calendar className="w-6 h-6 text-primary-600 mr-3 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-blue-900 mb-3">Your Search Criteria</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-blue-800">
                    {startDate && startTime && (
                      <div>
                        <span className="font-medium">Pickup: </span>
                        {startDate} at {startTime}
                      </div>
                    )}
                    {endDate && endTime && (
                      <div>
                        <span className="font-medium">Return: </span>
                        {endDate} at {endTime}
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-primary-700 mt-2">
                    These dates will be pre-filled when you click Book Now
                  </p>
                </div>
              </div>
            </div>
          )} */}

          {/* Main Layout: Left Filters + Right Grid */}
          <div className="flex gap-8 items-start">

            {/* ── LEFT: Filter Sidebar ── */}
            <aside
              className={`w-64 flex-shrink-0 ${showMobileFilters ? 'block' : 'hidden'} lg:block`}
            >
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden sticky top-24">
                {/* Sidebar Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-primary-500" />
                    <span className="font-bold text-gray-900">Filters</span>
                    {hasActiveFilters && (
                      <span className="w-5 h-5 bg-primary-500 text-white rounded-full text-xs font-bold flex items-center justify-center">
                        {[selectedType, selectedFuel, priceRange[0] > 0 || priceRange[1] < 500].filter(Boolean).length}
                      </span>
                    )}
                  </div>
                  {hasActiveFilters && (
                    <button
                      onClick={clearFilters}
                      className="flex items-center gap-1 text-sm text-red-500 hover:text-red-600 transition-colors font-medium"
                    >
                      <X className="w-3.5 h-3.5" />
                      Clear
                    </button>
                  )}
                </div>

                <div className="p-5 space-y-6">

                  {/* ── Price Range Slider ── */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wide">
                        Price / Hour
                      </h4>
                      <span className="text-sm font-bold text-primary-600">
                        ₹{priceRange[0]} – ₹{priceRange[1]}
                      </span>
                    </div>

                    {/* Draggable Range Slider */}
                    <div className="px-1">
                      <Slider
                        min={0}
                        max={500}
                        step={10}
                        value={priceRange}
                        onValueChange={(value) => setPriceRange(value)}
                        className="mb-3"
                      />
                    </div>

                    {/* Min / Max labels under the track */}
                    <div className="flex justify-between text-xs text-gray-400 px-1">
                      <span>₹0</span>
                      <span>₹500</span>
                    </div>

                    {/* Visual min/max pills */}
                    <div className="mt-3 flex gap-2">
                      <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-center">
                        <p className="text-xs text-gray-400 leading-none mb-0.5">Min</p>
                        <p className="text-sm font-bold text-gray-900">₹{priceRange[0]}</p>
                      </div>
                      <div className="flex items-center text-gray-300 text-lg">—</div>
                      <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-center">
                        <p className="text-xs text-gray-400 leading-none mb-0.5">Max</p>
                        <p className="text-sm font-bold text-gray-900">₹{priceRange[1]}</p>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-gray-100" />

                  {/* ── Vehicle Type ── */}
                  <div>
                    <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wide mb-3">
                      Vehicle Type
                    </h4>
                    <select
                      value={selectedType}
                      onChange={(e) => setSelectedType(e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm text-gray-700"
                    >
                      <option value="">All Types</option>
                      <option value="Scooter">🛵 Scooter</option>
                      <option value="Bike">🏍️ Bike</option>
                      <option value="Sports">🏎️ Sports</option>
                    </select>
                  </div>

                  <div className="border-t border-gray-100" />

                  {/* ── Fuel Type ── */}
                  <div>
                    <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wide mb-3">
                      Fuel Type
                    </h4>
                    <select
                      value={selectedFuel}
                      onChange={(e) => setSelectedFuel(e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm text-gray-700"
                    >
                      <option value="">All Fuel Types</option>
                      <option value="Petrol">⛽ Petrol</option>
                      <option value="Electric">⚡ Electric</option>
                    </select>
                  </div>

                  <div className="border-t border-gray-100" />

                  {/* ── City ── */}
                  <div>
                    <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wide mb-3 flex items-center gap-1">
                      <MapPin className="w-4 h-4 text-primary-500" />
                      City
                    </h4>
                    <select
                      value={selectedCityId || ''}
                      onChange={(e) => setSelectedCityId(e.target.value ? Number(e.target.value) : undefined)}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm text-gray-700"
                    >
                      <option value="">All Cities</option>
                      {cities.filter(d => d.isActive && !d.isComingSoon).map((city) => (
                        <option key={city.id} value={city.id}>
                          {city.name}
                        </option>
                      ))}
                    </select>
                  </div>

                </div>
              </div>
            </aside>

            {/* ── RIGHT: Vehicle Grid ── */}
            <main className="flex-1 min-w-0">
              {/* Results count */}
              {filteredVehicles && (
                <p className="text-sm text-gray-500 mb-4">
                  Showing{' '}
                  <span className="font-semibold text-gray-900">{filteredVehicles.length}</span>{' '}
                  available vehicle{filteredVehicles.length !== 1 ? 's' : ''}
                  {hasActiveFilters && (
                    <span className="text-primary-500 ml-1">(filtered)</span>
                  )}
                </p>
              )}

              {/* No results */}
              {filteredVehicles?.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-gray-50 rounded-2xl text-center">
                  <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-xl text-gray-600 mb-2">No vehicles found</p>
                  <p className="text-gray-500 mb-4">
                    Try adjusting your search criteria or filters
                  </p>
                  {hasActiveFilters && (
                    <Button onClick={clearFilters} variant="outline">
                      Clear Filters
                    </Button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredVehicles?.map((vehicle) => (
                    <VehicleCard key={vehicle.id} vehicle={vehicle} />
                  ))}
                </div>
              )}
            </main>

          </div>
        </div>

        <Footer />
      </div>
    </div>
  );
};

export default VehicleListingPage;
