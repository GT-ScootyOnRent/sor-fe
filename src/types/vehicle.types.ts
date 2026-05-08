export interface VehicleDto {
  id: number;
  name: string;
  make: string;
  model: string;
  registrationNumber?: string;
  cityId: number;
  hourlyRate: number;
  minBookingHours: number;
  isAvailable: boolean;
  nextAvailableFrom?: string;
  lastServiceTime?: string;
  nextServiceTime?: string;
  insuranceExpiryDate?: string;
  insuranceDetails?: string;
  kmTravelled: number;
  gpsDeviceId?: string;
}

export interface VehicleSearchParams {
  cityId?: number;
  startDate?: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  page?: number;
  size?: number;
}

export interface VehicleFilters {
  priceMin?: number;
  priceMax?: number;
  make?: string;
  sortBy?: 'recommended' | 'price-low' | 'price-high' | 'rating';
}

export interface VehicleDisplay extends VehicleDto {
  image: string;
  cityName?: string;
}