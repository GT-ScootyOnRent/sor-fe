import { useState } from 'react';
import { Slider } from './ui/slider';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';
import { ChevronDown, SlidersHorizontal, RotateCcw } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';

interface FilterState {
  vehicleTypes: string[];
  fuelTypes: string[];
  companies: string[];
  priceRange: number[];
  minRating: number;
}

interface VehicleFiltersProps {
  onFilterChange: (filters: FilterState) => void;
}

const VEHICLE_TYPES = ['Scooter', 'Bike', 'Sports'];
const FUEL_TYPES = ['Petrol', 'Electric'];
const COMPANY_LIST = ['Honda', 'TVS', 'Royal Enfield', 'Bajaj', 'Hero', 'Yamaha', 'Ather', 'KTM'];
const PRICE_MIN = 0;
const PRICE_MAX = 1500;

const DEFAULT_FILTERS: FilterState = {
  vehicleTypes: [],
  fuelTypes: [],
  companies: [],
  priceRange: [PRICE_MIN, PRICE_MAX],
  minRating: 0,
};

export default function VehicleFilters({ onFilterChange }: VehicleFiltersProps) {
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [isCompanyOpen, setIsCompanyOpen] = useState(false);

  const updateFilters = (partial: Partial<FilterState>) => {
    const updated = { ...filters, ...partial };
    setFilters(updated);
    onFilterChange(updated);
  };

  const toggleArrayItem = (key: 'vehicleTypes' | 'fuelTypes' | 'companies', value: string, checked: boolean) => {
    const current = filters[key];
    const updated = checked ? [...current, value] : current.filter((v) => v !== value);
    updateFilters({ [key]: updated });
  };

  const resetFilters = () => {
    setFilters(DEFAULT_FILTERS);
    onFilterChange(DEFAULT_FILTERS);
  };

  const activeFilterCount = [
    filters.vehicleTypes.length,
    filters.fuelTypes.length,
    filters.companies.length,
    filters.priceRange[0] > PRICE_MIN || filters.priceRange[1] < PRICE_MAX ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden sticky top-24">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-5 h-5 text-primary-500" />
          <span className="font-bold text-gray-900">Filters</span>
          {activeFilterCount > 0 && (
            <span className="w-5 h-5 bg-primary-500 text-white rounded-full text-xs font-bold flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </div>
        {activeFilterCount > 0 && (
          <button
            onClick={resetFilters}
            className="flex items-center gap-1 text-sm text-primary-500 hover:text-primary-600 transition-colors font-medium"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>
        )}
      </div>

      <div className="p-5 space-y-6">
        {/* ── Price Range ── */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wide">Price Range</h4>
            <span className="text-sm font-semibold text-primary-600">
              ₹{filters.priceRange[0]} – ₹{filters.priceRange[1]}
            </span>
          </div>

          {/* Single draggable slider (range) */}
          <div className="px-1">
            <Slider
              min={PRICE_MIN}
              max={PRICE_MAX}
              step={50}
              value={filters.priceRange}
              onValueChange={(value) => updateFilters({ priceRange: value })}
              className="mb-3"
            />
          </div>

          {/* Min / Max labels */}
          <div className="flex justify-between text-xs text-gray-400 px-1">
            <span>₹{PRICE_MIN}</span>
            <span>₹{PRICE_MAX}</span>
          </div>

          {/* Visual range indicator pills */}
          <div className="mt-3 flex gap-2">
            <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-center">
              <p className="text-xs text-gray-400 leading-none mb-0.5">Min</p>
              <p className="text-sm font-bold text-gray-900">₹{filters.priceRange[0]}</p>
            </div>
            <div className="flex items-center text-gray-300 text-lg">—</div>
            <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-center">
              <p className="text-xs text-gray-400 leading-none mb-0.5">Max</p>
              <p className="text-sm font-bold text-gray-900">₹{filters.priceRange[1]}</p>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-100" />

        {/* ── Vehicle Type ── */}
        <div>
          <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wide mb-3">Vehicle Type</h4>
          <div className="space-y-2.5">
            {VEHICLE_TYPES.map((type) => (
              <div key={type} className="flex items-center gap-2.5">
                <Checkbox
                  id={`type-${type}`}
                  checked={filters.vehicleTypes.includes(type)}
                  onCheckedChange={(checked) => toggleArrayItem('vehicleTypes', type, !!checked)}
                  className="border-gray-300 data-[state=checked]:bg-primary-500 data-[state=checked]:border-primary-500"
                />
                <Label
                  htmlFor={`type-${type}`}
                  className="cursor-pointer text-sm text-gray-700 font-medium select-none"
                >
                  {type}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-gray-100" />

        {/* ── Fuel Type ── */}
        <div>
          <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wide mb-3">Fuel Type</h4>
          <div className="space-y-2.5">
            {FUEL_TYPES.map((type) => (
              <div key={type} className="flex items-center gap-2.5">
                <Checkbox
                  id={`fuel-${type}`}
                  checked={filters.fuelTypes.includes(type)}
                  onCheckedChange={(checked) => toggleArrayItem('fuelTypes', type, !!checked)}
                  className="border-gray-300 data-[state=checked]:bg-primary-500 data-[state=checked]:border-primary-500"
                />
                <Label
                  htmlFor={`fuel-${type}`}
                  className="cursor-pointer text-sm text-gray-700 font-medium select-none"
                >
                  {type === 'Electric' ? '⚡ Electric' : '⛽ Petrol'}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-gray-100" />

        {/* ── Company ── */}
        <div>
          <Collapsible open={isCompanyOpen} onOpenChange={setIsCompanyOpen}>
            <CollapsibleTrigger className="w-full">
              <div className="flex items-center justify-between w-full">
                <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wide">
                  Brand
                  {filters.companies.length > 0 && (
                    <span className="ml-2 text-primary-500 normal-case font-semibold">
                      ({filters.companies.length})
                    </span>
                  )}
                </h4>
                <ChevronDown
                  className={`w-4 h-4 text-gray-500 transition-transform ${isCompanyOpen ? 'rotate-180' : ''}`}
                />
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-3">
              <div className="space-y-2.5 max-h-44 overflow-y-auto pr-1">
                {COMPANY_LIST.map((company) => (
                  <div key={company} className="flex items-center gap-2.5">
                    <Checkbox
                      id={`company-${company}`}
                      checked={filters.companies.includes(company)}
                      onCheckedChange={(checked) => toggleArrayItem('companies', company, !!checked)}
                      className="border-gray-300 data-[state=checked]:bg-primary-500 data-[state=checked]:border-primary-500"
                    />
                    <Label
                      htmlFor={`company-${company}`}
                      className="cursor-pointer text-sm text-gray-700 font-medium select-none"
                    >
                      {company}
                    </Label>
                  </div>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </div>
    </div>
  );
}
