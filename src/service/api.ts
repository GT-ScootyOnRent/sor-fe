const API_BASE_URL = import.meta.env.VITE_API_BASEURL || 'https://app.scootyonrent.com/api';

export interface VehiclePackages {
  fourHours: number;
  oneDay: number;
  threeDays: number;
  sevenDays: number;
  fifteenDays: number;
  monthly: number;
}

export interface VehicleSpecs {
  mileage: string;
  engineCapacity: string;
  topSpeed: string;
  weight: string;
}

export interface VehicleImage {
  id: number;
  vehicleId: number;
  imageUrl: string;
  isPrimary: boolean;
  displayOrder: number;
}

export interface Vehicle {
  id: number;
  name: string;
  make: string;
  model: string;
  pricePerHour: number;
  pricePerDay: number;
  kmLimit: number;
  rating: number;
  fuelType: 'Petrol' | 'Electric';
  vehicleType: 'Scooter' | 'Bike' | 'Sports';
  featured: boolean;
  excessKmCharge: number;
  lateReturnCharge: number;
  packages: VehiclePackages;
  specs: VehicleSpecs;
  images: VehicleImage[];
  primaryImageUrl?: string;
  availableCount?: number;
}

class VehicleAPI {
  async getFeaturedVehicles(): Promise<Vehicle[]> {
    const response = await fetch(`${API_BASE_URL}/vehicles/featured`, { credentials: 'include' });
    if (!response.ok) throw new Error('Failed to fetch featured vehicles');
    return response.json();
  }

  async getAvailableVehicles(cityId?: number): Promise<Vehicle[]> {
    const url = cityId
      ? `${API_BASE_URL}/vehicles/available?cityId=${cityId}`
      : `${API_BASE_URL}/vehicles/available`;
    const response = await fetch(url, { credentials: 'include' });
    if (!response.ok) throw new Error('Failed to fetch available vehicles');
    return response.json();
  }

  async getVehicleById(id: number): Promise<Vehicle> {
    const response = await fetch(`${API_BASE_URL}/vehicles/${id}`, { credentials: 'include' });
    if (!response.ok) throw new Error('Failed to fetch vehicle');
    return response.json();
  }

  async filterVehicles(filters: {
    vehicleType?: string;
    fuelType?: string;
    maxPricePerDay?: number;
    cityId?: number;
  }): Promise<Vehicle[]> {
    const params = new URLSearchParams();
    if (filters.vehicleType) params.append('vehicleType', filters.vehicleType);
    if (filters.fuelType) params.append('fuelType', filters.fuelType);
    if (filters.maxPricePerDay) params.append('maxPricePerDay', filters.maxPricePerDay.toString());
    if (filters.cityId) params.append('cityId', filters.cityId.toString());

    const response = await fetch(`${API_BASE_URL}/vehicles/filter?${params}`, { credentials: 'include' });
    if (!response.ok) throw new Error('Failed to filter vehicles');
    return response.json();
  }
}

export const vehicleAPI = new VehicleAPI();