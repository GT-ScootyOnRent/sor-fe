import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from './baseQueryWithReauth';

export interface VehiclePackageDto {
  id: number;
  name: string;
  pricePerHour: number;
  freeHoursPerDay: number;
  selectedDurations: number[];
  priceOverrides: Record<string, number>;
  createdBy?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateVehiclePackageDto {
  name: string;
  pricePerHour: number;
  freeHoursPerDay: number;
  selectedDurations: number[];
  priceOverrides?: Record<string, number>;
}

export interface UpdateVehiclePackageDto {
  name: string;
  pricePerHour: number;
  freeHoursPerDay: number;
  selectedDurations: number[];
  priceOverrides?: Record<string, number>;
}

export interface PackageUsageDto {
  packageId: number;
  vehicleCount: number;
}

// Standard duration options
export const DURATION_OPTIONS = [
  { hours: 8, label: '8 Hours' },
  { hours: 12, label: '12 Hours' },
  { hours: 24, label: '24 Hours' },
  { hours: 36, label: '36 Hours' },
  { hours: 48, label: '2 Days' },
  { hours: 72, label: '3 Days' },
  { hours: 120, label: '5 Days' },
  { hours: 168, label: '7 Days' },
  { hours: 360, label: '15 Days' },
  { hours: 720, label: '1 Month' },
];

// Calculate price for a given duration (used for package display)
export function calculateDurationPrice(hours: number, pricePerHour: number, freeHoursPerDay: number = 6): number {
  if (hours < 24) {
    return hours * pricePerHour;
  }
  const days = Math.floor(hours / 24);
  const extraHours = hours % 24;
  // Configurable free hours per day (charge 24 - freeHoursPerDay hours per day)
  const chargeableHoursPerDay = 24 - freeHoursPerDay;
  return (days * chargeableHoursPerDay + extraHours) * pricePerHour;
}

/**
 * Calculate booking price based on package tiers:
 * - If hours <= min package hours → min package price
 * - If hours exactly matches a package → that package price
 * - If hours between packages → previous package price + (extra hours × pricePerHour)
 * 
 * Example: packages [8h=₹80, 24h=₹180, 36h=₹300], rate=₹10/hr
 * - 5h → ₹80 (min package)
 * - 8h → ₹80 (exact match)
 * - 10h → ₹80 + 2*10 = ₹100
 * - 24h → ₹180 (exact match)
 * - 25h → ₹180 + 1*10 = ₹190
 */
export function calculatePackageBasedPrice(
  bookingHours: number,
  selectedDurations: number[],
  priceOverrides: Record<string, number>,
  pricePerHour: number,
  freeHoursPerDay: number = 6
): number {
  if (selectedDurations.length === 0) {
    // Fallback to simple hourly calculation if no packages
    return calculateDurationPrice(bookingHours, pricePerHour, freeHoursPerDay);
  }

  // Build sorted package list with their prices
  const packages = selectedDurations
    .map(hours => {
      const override = priceOverrides?.[hours.toString()];
      const price = override && override > 0
        ? override
        : calculateDurationPrice(hours, pricePerHour, freeHoursPerDay);
      return { hours, price };
    })
    .sort((a, b) => a.hours - b.hours);

  const minPackage = packages[0];

  // Case 1: Booking hours <= minimum package hours → return minimum package price
  if (bookingHours <= minPackage.hours) {
    return minPackage.price;
  }

  // Case 2 & 3: Find the applicable package
  // Find the largest package where hours <= bookingHours
  let applicablePackage = minPackage;
  for (const pkg of packages) {
    if (bookingHours >= pkg.hours) {
      applicablePackage = pkg;
    } else {
      break; // packages are sorted, no need to continue
    }
  }

  // If exact match, return package price
  if (bookingHours === applicablePackage.hours) {
    return applicablePackage.price;
  }

  // Otherwise, calculate: applicable package price + extra hours × pricePerHour
  const extraHours = bookingHours - applicablePackage.hours;
  return applicablePackage.price + (extraHours * pricePerHour);
}

// Legacy function - kept for backward compatibility
export function calculateBookingPrice(
  bookingHours: number,
  pricePerHour: number,
  minPackageHours: number,
  minPackagePrice: number,
  freeHoursPerDay: number = 6
): number {
  // Zone 1: Below minimum → pay minimum
  if (bookingHours <= minPackageHours) {
    return minPackagePrice;
  }

  // Zone 2: Between minimum and 24h → full hourly rate
  if (bookingHours < 24) {
    return bookingHours * pricePerHour;
  }

  // Zone 3: 24h+ → configurable free hours per day
  const days = Math.floor(bookingHours / 24);
  const extraHours = bookingHours % 24;
  const chargeableHoursPerDay = 24 - freeHoursPerDay;
  return (days * chargeableHoursPerDay + extraHours) * pricePerHour;
}

export const vehiclePackageApi = createApi({
  reducerPath: 'vehiclePackageApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['VehiclePackage'],
  endpoints: (builder) => ({
    // Get all packages
    getVehiclePackages: builder.query<VehiclePackageDto[], void>({
      query: () => '/vehicle-packages',
      providesTags: ['VehiclePackage'],
    }),

    // Get single package by ID
    getVehiclePackageById: builder.query<VehiclePackageDto, number>({
      query: (id) => `/vehicle-packages/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'VehiclePackage', id }],
    }),

    // Get package usage count
    getPackageUsage: builder.query<PackageUsageDto, number>({
      query: (id) => `/vehicle-packages/${id}/usage`,
    }),

    // Create package
    createVehiclePackage: builder.mutation<VehiclePackageDto, CreateVehiclePackageDto>({
      query: (body) => ({
        url: '/vehicle-packages',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['VehiclePackage'],
    }),

    // Update package
    updateVehiclePackage: builder.mutation<void, { id: number; data: UpdateVehiclePackageDto }>({
      query: ({ id, data }) => ({
        url: `/vehicle-packages/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['VehiclePackage'],
    }),

    // Delete package (soft delete)
    deleteVehiclePackage: builder.mutation<void, number>({
      query: (id) => ({
        url: `/vehicle-packages/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['VehiclePackage'],
    }),
  }),
});

export const {
  useGetVehiclePackagesQuery,
  useGetVehiclePackageByIdQuery,
  useGetPackageUsageQuery,
  useCreateVehiclePackageMutation,
  useUpdateVehiclePackageMutation,
  useDeleteVehiclePackageMutation,
} = vehiclePackageApi;
