import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import Header from '../components/Header';
import VehicleCard from '../components/VehicleCard';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorMessage } from '../components/ErrorMessage';
import { useSearchAvailableVehiclesQuery } from '../store/api/vehicleApi';
import { useGetCitiesQuery } from '../store/api/cityApi';
import { useAppSelector } from '../store/hooks';
import BackgroundSlideshow from '../components/BackgroundSlideshow';
import { Slider } from '../components/ui/slider';
import {
  AlertCircle,
  Filter,
  X,
  SlidersHorizontal,
  MapPin,
  Search,
  Calendar,
  ArrowUpDown,
  ChevronDown,
} from 'lucide-react';
import { Button } from '../components/ui/button';

// ─── Sort options ────────────────────────────────────────────────────────────
type SortOption = 'price_asc' | 'price_desc' | 'name_asc' | 'name_desc';

const SORT_LABELS: Record<SortOption, string> = {
  price_asc: 'Price: Low to High',
  price_desc: 'Price: High to Low',
  name_asc: 'Name: A → Z',
  name_desc: 'Name: Z → A',
};

// ─── Debounce hook ───────────────────────────────────────────────────────────
function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

// ─── Format date for display ─────────────────────────────────────────────────
function formatDateShort(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  } catch {
    return dateStr;
  }
}

// ─── Component ───────────────────────────────────────────────────────────────
const VehicleListingPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const selectedCity = useAppSelector((state) => state.city.selectedCity);
  const { data: cities = [] } = useGetCitiesQuery({ page: 1, size: 100 });

  // URL search params
  const startDate = searchParams.get('startDate');
  const startTime = searchParams.get('startTime');
  const endDate = searchParams.get('endDate');
  const endTime = searchParams.get('endTime');
  const hasDateFilter = !!(startDate && endDate);

  // const hasDateFilter = !!(startDate && startTime && endDate && endTime);

  // ── Top-bar state ──
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCityId, setSelectedCityId] = useState<number | undefined>(undefined);
  const [sortBy, setSortBy] = useState<SortOption>('price_asc');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showCityMenu, setShowCityMenu] = useState(false);

  // ── Sidebar filter state ──
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedFuel, setSelectedFuel] = useState<string>('');
  const [priceRange, setPriceRange] = useState<number[]>([0, 500]);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Debounced search for performance
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Initialise city from global state
  useEffect(() => {
    if (selectedCity && selectedCityId === undefined) {
      setSelectedCityId(selectedCity.id);
    }
  }, [selectedCity, selectedCityId]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = () => {
      setShowSortMenu(false);
      setShowCityMenu(false);
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  // ── API fetch ──
  const { data: vehicles, isLoading, error } = useSearchAvailableVehiclesQuery({
    startDate: startDate || undefined,
    startTime: startTime || undefined,
    endDate: endDate || undefined,
    endTime: endTime || undefined,
    cityId: selectedCityId,
  });

  // ── Filter + sort pipeline ──
  const filteredVehicles = useMemo(() => {
    if (!vehicles) return [];

    let result = vehicles.filter((v) => {
      // Text search: name, model, brand
      if (debouncedSearch) {
        const q = debouncedSearch.toLowerCase();
        const matchName = v.name?.toLowerCase().includes(q);
        const matchModel = v.model?.toLowerCase().includes(q);
        if (!matchName && !matchModel) return false;
      }
      if (selectedType && v.vehicleType !== selectedType) return false;
      if (selectedFuel && v.fuelType !== selectedFuel) return false;
      if (v.pricePerHour < priceRange[0] || v.pricePerHour > priceRange[1]) return false;
      return true;
    });

    // Sort
    result = [...result].sort((a, b) => {
      switch (sortBy) {
        case 'price_asc':  return a.pricePerHour - b.pricePerHour;
        case 'price_desc': return b.pricePerHour - a.pricePerHour;
        case 'name_asc':   return (a.name || '').localeCompare(b.name || '');
        case 'name_desc':  return (b.name || '').localeCompare(a.name || '');
        default:           return 0;
      }
    });

    return result;
  }, [vehicles, debouncedSearch, selectedType, selectedFuel, priceRange, sortBy]);

  // ── Active filter tracking ──
  const hasActiveSidebarFilters =
    !!selectedType ||
    !!selectedFuel ||
    priceRange[0] > 0 ||
    priceRange[1] < 500;

  const sidebarFilterCount = [
    selectedType,
    selectedFuel,
    priceRange[0] > 0 || priceRange[1] < 500,
  ].filter(Boolean).length;

  const clearFilters = useCallback(() => {
    setSelectedType('');
    setSelectedFuel('');
    setPriceRange([0, 500]);
    setSearchQuery('');
    setSortBy('price_asc');
    setSelectedCityId(selectedCity?.id);
  }, [selectedCity]);

  // ── Selected city label ──
  const selectedCityLabel = useMemo(() => {
    if (!selectedCityId) return 'All Cities';
    return cities.find((c) => c.id === selectedCityId)?.name ?? 'All Cities';
  }, [cities, selectedCityId]);

  if (isLoading) return <LoadingSpinner fullScreen message="Loading available vehicles..." />;
  if (error) return <ErrorMessage fullScreen message="Failed to load vehicles" />;

  const activeCities = cities.filter((c) => c.isActive && !c.isComingSoon);

  return (
    <div className="min-h-screen bg-white relative">
      <BackgroundSlideshow />

      <div className="relative z-10">
        <Header />

        <div className="container mx-auto px-4 py-8">

          {/* ── Page heading ── */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-black mb-1">Available Vehicles</h1>
              <p className="text-gray-500 text-sm">Explore our complete fleet of two-wheelers</p>
            </div>

            {/* Mobile sidebar toggle */}
            <Button
              onClick={() => setShowMobileFilters(!showMobileFilters)}
              variant="outline"
              className="lg:hidden flex items-center gap-2 border-primary-500 text-primary-500"
            >
              <SlidersHorizontal className="w-4 h-4" />
              {showMobileFilters ? 'Hide Filters' : 'Show Filters'}
            </Button>
          </div>

          {/* ══════════════════════════════════════════════════════════════
              TOP FILTER BAR
          ══════════════════════════════════════════════════════════════ */}
          <div className="mb-6 bg-white border border-gray-200 rounded-2xl shadow-sm">
            <div className="flex flex-wrap items-stretch divide-x divide-gray-200">

              {/* 1. Search input */}
              <div className="flex items-center gap-3 flex-1 min-w-0 px-4 py-3">
                <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search vehicles by name, model or brand…"
                  className="flex-1 min-w-0 bg-transparent outline-none text-sm text-gray-700 placeholder-gray-400"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* 2. City dropdown */}
              <div className="relative flex-shrink-0">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowCityMenu((v) => !v);
                    setShowSortMenu(false);
                  }}
                  className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors h-full whitespace-nowrap"
                >
                  <MapPin className="w-4 h-4 text-primary-500 flex-shrink-0" />
                  <span>{selectedCityLabel}</span>
                  <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${showCityMenu ? 'rotate-180' : ''}`} />
                </button>

                {showCityMenu && (
                  <div
                    className="absolute top-full left-0 mt-1 z-50 bg-white border border-gray-200 rounded-xl shadow-lg min-w-[160px] py-1 overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => { setSelectedCityId(undefined); setShowCityMenu(false); }}
                      className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors ${!selectedCityId ? 'text-primary-600 font-semibold' : 'text-gray-700'}`}
                    >
                      All Cities
                    </button>
                    {activeCities.map((city) => (
                      <button
                        key={city.id}
                        onClick={() => { setSelectedCityId(city.id); setShowCityMenu(false); }}
                        className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors ${selectedCityId === city.id ? 'text-primary-600 font-semibold' : 'text-gray-700'}`}
                      >
                        {city.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* 3. Date display — only when dates came from home page */}
              {hasDateFilter && (
                <div className="flex items-center gap-2 px-4 py-3 flex-shrink-0">
                  <Calendar className="w-4 h-4 text-primary-500 flex-shrink-0" />
                  <span className="text-sm text-gray-700 font-medium whitespace-nowrap">
                    {formatDateShort(startDate!)}
                    <span className="mx-1.5 text-gray-400">–</span>
                    {formatDateShort(endDate!)}
                  </span>
                </div>
              )}

              {/* 4. Sort dropdown */}
              <div className="relative flex-shrink-0">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowSortMenu((v) => !v);
                    setShowCityMenu(false);
                  }}
                  className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors h-full whitespace-nowrap"
                >
                  <ArrowUpDown className="w-4 h-4 text-primary-500 flex-shrink-0" />
                  <span className="hidden sm:inline">Sort</span>
                  <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${showSortMenu ? 'rotate-180' : ''}`} />
                </button>

                {showSortMenu && (
                  <div
                    className="absolute top-full right-0 mt-1 z-50 bg-white border border-gray-200 rounded-xl shadow-lg min-w-[200px] py-1 overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {(Object.entries(SORT_LABELS) as [SortOption, string][]).map(([key, label]) => (
                      <button
                        key={key}
                        onClick={() => { setSortBy(key); setShowSortMenu(false); }}
                        className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors flex items-center justify-between ${sortBy === key ? 'text-primary-600 font-semibold bg-primary-50' : 'text-gray-700'}`}
                      >
                        {label}
                        {sortBy === key && (
                          <span className="w-1.5 h-1.5 rounded-full bg-primary-500 flex-shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </div>

          {/* ── Results count ── */}
          <p className="text-sm text-gray-500 mb-5">
            Showing{' '}
            <span className="font-semibold text-gray-900">{filteredVehicles.length}</span>{' '}
            available vehicle{filteredVehicles.length !== 1 ? 's' : ''}
            {(hasActiveSidebarFilters || searchQuery) && (
              <span className="text-primary-500 ml-1">(filtered)</span>
            )}
          </p>

          {/* ══════════════════════════════════════════════════════════════
              MAIN LAYOUT: Sidebar + Grid
          ══════════════════════════════════════════════════════════════ */}
          <div className="flex gap-8 items-start">

            {/* ── LEFT: Filter Sidebar (City removed) ── */}
            <aside className={`w-64 flex-shrink-0 ${showMobileFilters ? 'block' : 'hidden'} lg:block`}>
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden sticky top-24">

                {/* Sidebar header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-primary-500" />
                    <span className="font-bold text-gray-900">Filters</span>
                    {sidebarFilterCount > 0 && (
                      <span className="w-5 h-5 bg-primary-500 text-white rounded-full text-xs font-bold flex items-center justify-center">
                        {sidebarFilterCount}
                      </span>
                    )}
                  </div>
                  {hasActiveSidebarFilters && (
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

                  {/* Price Range Slider */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wide">
                        Price / Hour
                      </h4>
                      <span className="text-sm font-bold text-primary-600">
                        ₹{priceRange[0]} – ₹{priceRange[1]}
                      </span>
                    </div>
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
                    <div className="flex justify-between text-xs text-gray-400 px-1">
                      <span>₹0</span>
                      <span>₹500</span>
                    </div>
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

                  {/* Vehicle Type */}
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

                  {/* Fuel Type */}
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

                  {/* City is intentionally removed from sidebar — moved to top bar */}

                </div>
              </div>
            </aside>

            {/* ── RIGHT: Vehicle Grid ── */}
            <main className="flex-1 min-w-0">
              {filteredVehicles.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-gray-50 rounded-2xl text-center">
                  <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-xl text-gray-600 mb-2">No vehicles found</p>
                  <p className="text-gray-500 mb-4">
                    Try adjusting your search criteria or filters
                  </p>
                  {(hasActiveSidebarFilters || searchQuery) && (
                    <Button onClick={clearFilters} variant="outline">
                      Clear All Filters
                    </Button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredVehicles.map((vehicle) => (
                    <VehicleCard key={vehicle.id} vehicle={vehicle} />
                  ))}
                </div>
              )}
            </main>

          </div>
        </div>
      </div>
    </div>
  );
};

export default VehicleListingPage;