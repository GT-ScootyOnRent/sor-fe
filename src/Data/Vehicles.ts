// Keep interface for type safety, but fetch data from API
export interface Vehicle {
  id: string;
  name: string;
  company: string; // maps to 'make' in backend
  model: string;
  image: string; // primary image URL
  pricePerHour: number;
  pricePerDay: number;
  kmLimit: number;
  rating: number;
  fuelType: 'Petrol' | 'Electric';
  type: 'Scooter' | 'Bike' | 'Sports'; // maps to 'vehicleType' in backend
  featured: boolean;
  packages: {
    fourHours: number;
    oneDay: number;
    threeDays: number;
    sevenDays: number;
    fifteenDays: number;
    monthly: number;
  };
  specs: {
    mileage: string;
    engineCapacity: string;
    topSpeed: string;
    weight: string;
  };
  excessKmCharge: number;
  lateReturnCharge: number;
}

// Helper to convert backend Vehicle to frontend Vehicle
export function mapBackendVehicle(backendVehicle: any): Vehicle {
  return {
    id: backendVehicle.id.toString(),
    name: backendVehicle.name,
    company: backendVehicle.make,
    model: backendVehicle.model,
    image: backendVehicle.primaryImageUrl || '',
    pricePerHour: backendVehicle.pricePerHour,
    pricePerDay: backendVehicle.pricePerDay,
    kmLimit: backendVehicle.kmLimit,
    rating: backendVehicle.rating,
    fuelType: backendVehicle.fuelType,
    type: backendVehicle.vehicleType,
    featured: backendVehicle.featured,
    packages: backendVehicle.packages,
    specs: backendVehicle.specs,
    excessKmCharge: backendVehicle.excessKmCharge,
    lateReturnCharge: backendVehicle.lateReturnCharge,
  };
}

// Remove static vehicles array - will be fetched from API
export const vehicles: Vehicle[] = [];