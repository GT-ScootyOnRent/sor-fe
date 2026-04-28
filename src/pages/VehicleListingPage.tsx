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
import {
  AlertCircle,
  Filter,
  X,
  SlidersHorizontal,
  MapPin,
} from 'lucide-react';
import { Button } from '../components/ui/button';

const PRICE_MIN = 0;
const PRICE_MAX = 500;
const PRICE_STEP = 10;

const VehicleListingPage: React.FC = () => {
  const [searchParams] = useSearchParams();

  const selectedCity = useAppSelector(
    (state) => state.city.selectedCity
  );

  const { data: cities = [] } =
    useGetCitiesQuery({
      page: 1,
      size: 100,
    });

  // URL params
  const startDate =
    searchParams.get(
      'startDate'
    );

  const startTime =
    searchParams.get(
      'startTime'
    );

  const endDate =
    searchParams.get(
      'endDate'
    );

  const endTime =
    searchParams.get(
      'endTime'
    );

  // Filters
  const [
    selectedType,
    setSelectedType,
  ] = useState('');

  const [
    selectedFuel,
    setSelectedFuel,
  ] = useState('');

  const [
    priceRange,
    setPriceRange,
  ] = useState<
    number[]
  >([
    PRICE_MIN,
    PRICE_MAX,
  ]);

  const [
    minInput,
    setMinInput,
  ] = useState(
    String(PRICE_MIN)
  );

  const [
    maxInput,
    setMaxInput,
  ] = useState(
    String(PRICE_MAX)
  );

  const [
    showMobileFilters,
    setShowMobileFilters,
  ] = useState(false);

  const [
    selectedCityId,
    setSelectedCityId,
  ] = useState<
    number | undefined
  >(undefined);

  useEffect(() => {
    if (
      selectedCity &&
      !selectedCityId
    ) {
      setSelectedCityId(
        selectedCity.id
      );
    }
  }, [
    selectedCity,
    selectedCityId,
  ]);

  const {
    data: vehicles,
    isLoading,
    error,
  } =
    useSearchAvailableVehiclesQuery(
      {
        startDate:
          startDate ||
          undefined,
        startTime:
          startTime ||
          undefined,
        endDate:
          endDate ||
          undefined,
        endTime:
          endTime ||
          undefined,
        cityId:
          selectedCityId,
      }
    );

  // Filter vehicles
  const filteredVehicles =
    vehicles?.filter(
      (v) => {
        if (
          selectedType &&
          v.vehicleType !==
            selectedType
        )
          return false;

        if (
          selectedFuel &&
          v.fuelType !==
            selectedFuel
        )
          return false;

        if (
          v.pricePerHour <
            priceRange[0] ||
          v.pricePerHour >
            priceRange[1]
        )
          return false;

        return true;
      }
    );

  const clearFilters =
    () => {
      setSelectedType('');
      setSelectedFuel('');
      setPriceRange([
        PRICE_MIN,
        PRICE_MAX,
      ]);
      setMinInput(
        String(
          PRICE_MIN
        )
      );
      setMaxInput(
        String(
          PRICE_MAX
        )
      );
      setSelectedCityId(
        selectedCity?.id
      );
    };

  const hasActiveFilters =
    !!selectedType ||
    !!selectedFuel ||
    priceRange[0] >
      PRICE_MIN ||
    priceRange[1] <
      PRICE_MAX ||
    selectedCityId !==
      selectedCity?.id;

  // ---- PRICE INPUTS ----

  const handleMinChange = (
    value: string
  ) => {
    const clean =
      value.replace(
        /\D/g,
        ''
      );

    setMinInput(clean);

    if (clean === '')
      return;

    let min =
      Number(clean);

    if (
      isNaN(min)
    )
      return;

    min = Math.max(
      PRICE_MIN,
      Math.min(
        min,
        PRICE_MAX
      )
    );

    let max =
      priceRange[1];

    if (min > max)
      max = min;

    setPriceRange([
      min,
      max,
    ]);
    setMaxInput(
      String(max)
    );
  };

  const handleMaxChange = (
    value: string
  ) => {
    const clean =
      value.replace(
        /\D/g,
        ''
      );

    setMaxInput(clean);

    if (clean === '')
      return;

    let max =
      Number(clean);

    if (
      isNaN(max)
    )
      return;

    max = Math.max(
      PRICE_MIN,
      Math.min(
        max,
        PRICE_MAX
      )
    );

    let min =
      priceRange[0];

    if (max < min)
      min = max;

    setPriceRange([
      min,
      max,
    ]);
    setMinInput(
      String(min)
    );
  };

  const validateMin =
    () => {
      let min =
        minInput.trim() ===
        ''
          ? PRICE_MIN
          : Number(
              minInput
            );

      if (
        isNaN(min)
      )
        min =
          PRICE_MIN;

      let max =
        priceRange[1];

      min = Math.max(
        PRICE_MIN,
        Math.min(
          min,
          PRICE_MAX
        )
      );

      if (min > max)
        [
          min,
          max,
        ] = [
          max,
          min,
        ];

      setPriceRange([
        min,
        max,
      ]);

      setMinInput(
        String(min)
      );
      setMaxInput(
        String(max)
      );
    };

  const validateMax =
    () => {
      let max =
        maxInput.trim() ===
        ''
          ? PRICE_MAX
          : Number(
              maxInput
            );

      if (
        isNaN(max)
      )
        max =
          PRICE_MAX;

      let min =
        priceRange[0];

      max = Math.max(
        PRICE_MIN,
        Math.min(
          max,
          PRICE_MAX
        )
      );

      if (min > max)
        [
          min,
          max,
        ] = [
          max,
          min,
        ];

      setPriceRange([
        min,
        max,
      ]);

      setMinInput(
        String(min)
      );
      setMaxInput(
        String(max)
      );
    };

  if (isLoading)
    return (
      <LoadingSpinner
        fullScreen
        message="Loading available vehicles..."
      />
    );

  if (error)
    return (
      <ErrorMessage
        fullScreen
        message="Failed to load vehicles"
      />
    );

  return (
    <div className="min-h-screen bg-white relative">
      <BackgroundSlideshow />

      <div className="relative z-10">
        <Header />

        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-black mb-2">
                Available
                Vehicles
              </h1>

              <p className="text-gray-600">
                Explore our
                complete fleet
                of
                two-wheelers
              </p>
            </div>

            <Button
              onClick={() =>
                setShowMobileFilters(
                  !showMobileFilters
                )
              }
              variant="outline"
              className="lg:hidden flex items-center gap-2 border-primary-500 text-primary-500"
            >
              <SlidersHorizontal className="w-4 h-4" />

              {showMobileFilters
                ? 'Hide Filters'
                : 'Show Filters'}
            </Button>
          </div>

          <div className="flex gap-8 items-start">
            {/* Sidebar */}
            <aside
              className={`w-64 flex-shrink-0 ${
                showMobileFilters
                  ? 'block'
                  : 'hidden'
              } lg:block`}
            >
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm sticky top-24">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-primary-500" />

                    <span className="font-bold text-gray-900">
                      Filters
                    </span>

                    {hasActiveFilters && (
                      <span className="w-5 h-5 bg-primary-500 text-white rounded-full text-xs font-bold flex items-center justify-center">
                        {
                          [
                            selectedType,
                            selectedFuel,
                            priceRange[0] >
                              PRICE_MIN ||
                            priceRange[1] <
                              PRICE_MAX,
                          ].filter(
                            Boolean
                          ).length
                        }
                      </span>
                    )}
                  </div>

                  {hasActiveFilters && (
                    <button
                      onClick={
                        clearFilters
                      }
                      className="flex items-center gap-1 text-sm text-red-500 hover:text-red-600"
                    >
                      <X className="w-3.5 h-3.5" />
                      Clear
                    </button>
                  )}
                </div>

                <div className="p-5 space-y-6">
                  {/* PRICE */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wide">
                        Price /
                        Hour
                      </h4>

                      <span className="text-sm font-bold text-primary-600">
                        ₹
                        {
                          priceRange[0]
                        }{' '}
                        – ₹
                        {
                          priceRange[1]
                        }
                      </span>
                    </div>

                    {/* Slider */}
                    <div className="px-1 mb-4">
                      <Slider
                        min={
                          PRICE_MIN
                        }
                        max={
                          PRICE_MAX
                        }
                        step={
                          PRICE_STEP
                        }
                        value={
                          priceRange
                        }
                        onValueChange={(
                          value
                        ) => {
                          setPriceRange(
                            value
                          );

                          setMinInput(
                            String(
                              value[0]
                            )
                          );

                          setMaxInput(
                            String(
                              value[1]
                            )
                          );
                        }}
                      />
                    </div>

                    <div className="flex justify-between text-xs text-gray-400 px-1">
                      <span>
                        ₹0
                      </span>
                      <span>
                        ₹500
                      </span>
                    </div>

                    {/* Editable Inputs */}
                    <div className="mt-3 flex gap-2">
                      {/* MIN */}
                      <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                        <p className="text-xs text-gray-400 mb-1">
                          Min
                        </p>

                        <input
                          type="text"
                          inputMode="numeric"
                          value={
                            minInput
                          }
                          onChange={(
                            e
                          ) =>
                            handleMinChange(
                              e
                                .target
                                .value
                            )
                          }
                          onBlur={
                            validateMin
                          }
                          className="w-full bg-transparent outline-none text-sm font-bold text-gray-900"
                        />
                      </div>

                      <div className="flex items-center text-gray-300 text-lg">
                        —
                      </div>

                      {/* MAX */}
                      <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                        <p className="text-xs text-gray-400 mb-1">
                          Max
                        </p>

                        <input
                          type="text"
                          inputMode="numeric"
                          value={
                            maxInput
                          }
                          onChange={(
                            e
                          ) =>
                            handleMaxChange(
                              e
                                .target
                                .value
                            )
                          }
                          onBlur={
                            validateMax
                          }
                          className="w-full bg-transparent outline-none text-sm font-bold text-gray-900"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-gray-100" />

                  {/* Vehicle Type */}
                  <div>
                    <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wide mb-3">
                      Vehicle
                      Type
                    </h4>

                    <select
                      value={
                        selectedType
                      }
                      onChange={(
                        e
                      ) =>
                        setSelectedType(
                          e
                            .target
                            .value
                        )
                      }
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg outline-none text-sm"
                    >
                      <option value="">
                        All
                        Types
                      </option>
                      <option value="Scooter">
                        🛵
                        Scooter
                      </option>
                      <option value="Bike">
                        🏍️
                        Bike
                      </option>
                      <option value="Sports">
                        🏎️
                        Sports
                      </option>
                    </select>
                  </div>

                  <div className="border-t border-gray-100" />

                  {/* Fuel */}
                  <div>
                    <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wide mb-3">
                      Fuel
                      Type
                    </h4>

                    <select
                      value={
                        selectedFuel
                      }
                      onChange={(
                        e
                      ) =>
                        setSelectedFuel(
                          e
                            .target
                            .value
                        )
                      }
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg outline-none text-sm"
                    >
                      <option value="">
                        All
                        Fuel
                        Types
                      </option>
                      <option value="Petrol">
                        ⛽
                        Petrol
                      </option>
                      <option value="Electric">
                        ⚡
                        Electric
                      </option>
                    </select>
                  </div>

                  <div className="border-t border-gray-100" />

                  {/* City */}
                  <div>
                    <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wide mb-3 flex items-center gap-1">
                      <MapPin className="w-4 h-4 text-primary-500" />
                      City
                    </h4>

                    <select
                      value={
                        selectedCityId ||
                        ''
                      }
                      onChange={(
                        e
                      ) =>
                        setSelectedCityId(
                          e
                            .target
                            .value
                            ? Number(
                                e
                                  .target
                                  .value
                              )
                            : undefined
                        )
                      }
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg outline-none text-sm"
                    >
                      <option value="">
                        All
                        Cities
                      </option>

                      {cities
                        .filter(
                          (
                            d
                          ) =>
                            d.isActive &&
                            !d.isComingSoon
                        )
                        .map(
                          (
                            city
                          ) => (
                            <option
                              key={
                                city.id
                              }
                              value={
                                city.id
                              }
                            >
                              {
                                city.name
                              }
                            </option>
                          )
                        )}
                    </select>
                  </div>
                </div>
              </div>
            </aside>

            {/* Grid */}
            <main className="flex-1 min-w-0">
              {filteredVehicles && (
                <p className="text-sm text-gray-500 mb-4">
                  Showing{' '}
                  <span className="font-semibold text-gray-900">
                    {
                      filteredVehicles.length
                    }
                  </span>{' '}
                  available
                  vehicle
                  {filteredVehicles.length !==
                  1
                    ? 's'
                    : ''}
                </p>
              )}

              {filteredVehicles?.length ===
              0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-gray-50 rounded-2xl text-center">
                  <AlertCircle className="w-16 h-16 text-gray-400 mb-4" />

                  <p className="text-xl text-gray-600 mb-2">
                    No
                    vehicles
                    found
                  </p>

                  <p className="text-gray-500 mb-4">
                    Try
                    adjusting
                    filters
                  </p>

                  <Button
                    onClick={
                      clearFilters
                    }
                    variant="outline"
                  >
                    Clear
                    Filters
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredVehicles?.map(
                    (
                      vehicle
                    ) => (
                      <VehicleCard
                        key={
                          vehicle.id
                        }
                        vehicle={
                          vehicle
                        }
                      />
                    )
                  )}
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