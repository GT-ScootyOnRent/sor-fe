import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { API_CONFIG } from '../../config/api.config';
import type { RootState } from '../store';

export interface VehiclePackagesDto {
  fourHours: number;
  oneDay: number;
  threeDays: number;
  sevenDays: number;
  fifteenDays: number;
  monthly: number;
}

export interface VehicleSpecsDto {
  mileage: string;
  engineCapacity: string;
  topSpeed: string;
  weight: string;
}

export interface VehicleDto {
  id: number;
  name: string;
  make: string;
  model: string;
  cityId: number;
  isAvailable: boolean;
  featured: boolean;
  pricePerHour: number;
  pricePerDay: number;
  minBookingHours: number;
  kmLimit: number;
  excessKmCharge: number;
  lateReturnCharge: number;
  rating: number;
  fuelType: string;
  vehicleType: string;
  lastServiceTime?: string;
  nextServiceTime?: string;
  insuranceExpiryDate?: string;
  insuranceDetails?: string;
  kmTravelled: number;
  gpsDeviceId?: string;
  packages?: VehiclePackagesDto;
  specs?: VehicleSpecsDto;
}

export interface VehicleImageDto {
  id: number;
  vehicleId: number;
  imageUrl: string;
  isPrimary: boolean;
  displayOrder: number;
}

export interface VehicleWithImagesDto extends VehicleDto {
  images: VehicleImageDto[];
  primaryImageUrl?: string;
  availableCount?: number;
}

export interface VehicleSearchParams {
  startDate?: string;
  startTime?: string;
  endDate?: string;
  endTime?: string;
  cityId?: number;
}

export interface VehicleFilterParams {
  vehicleType?: string;
  fuelType?: string;
  minPrice?: number;
  maxPrice?: number;
  cityId?: number;
}

export const vehicleApi = createApi({
  reducerPath: 'vehicleApi',
  baseQuery: fetchBaseQuery({
    baseUrl: API_CONFIG.BASE_URL,
    credentials: 'include',
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.token;
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      headers.set('Content-Type', 'application/json');
      return headers;
    },
  }),
  tagTypes: ['Vehicle'],
  endpoints: (builder) => ({
    getVehicles: builder.query<VehicleDto[], void>({
      query: () => '/Vehicles',
      providesTags: ['Vehicle'],
    }),

    getVehicleById: builder.query<VehicleWithImagesDto, number>({
      query: (id) => `/Vehicles/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Vehicle', id }],
    }),

    getFeaturedVehicles: builder.query<VehicleWithImagesDto[], { cityId?: number } | void>({
      query: (params) => {
        const cityId = params && 'cityId' in params ? params.cityId : undefined;
        if (cityId) {
          return `/Vehicles/featured?cityId=${cityId}`;
        }
        return '/Vehicles/featured';
      },
      providesTags: ['Vehicle'],
    }),

    searchAvailableVehicles: builder.query<VehicleWithImagesDto[], VehicleSearchParams>({
      query: (params) => {
        const queryParams = new URLSearchParams();
        if (params.startDate) queryParams.append('startDate', params.startDate);
        if (params.startTime) queryParams.append('startTime', params.startTime);
        if (params.endDate) queryParams.append('endDate', params.endDate);
        if (params.endTime) queryParams.append('endTime', params.endTime);
        if (params.cityId) queryParams.append('cityId', params.cityId.toString());

        return `/Vehicles/search?${queryParams.toString()}`;
      },
      providesTags: ['Vehicle'],
    }),

    filterVehicles: builder.query<VehicleWithImagesDto[], VehicleFilterParams>({
      query: (params) => {
        const queryParams = new URLSearchParams();
        if (params.vehicleType) queryParams.append('vehicleType', params.vehicleType);
        if (params.fuelType) queryParams.append('fuelType', params.fuelType);
        if (params.minPrice) queryParams.append('minPrice', params.minPrice.toString());
        if (params.maxPrice) queryParams.append('maxPrice', params.maxPrice.toString());
        if (params.cityId) queryParams.append('cityId', params.cityId.toString());

        return `/Vehicles/filter?${queryParams.toString()}`;
      },
      providesTags: ['Vehicle'],
    }),

    createVehicle: builder.mutation<VehicleDto, Omit<VehicleDto, 'id'>>({
      query: (vehicle) => ({
        url: '/Vehicles',
        method: 'POST',
        body: vehicle,
      }),
      invalidatesTags: ['Vehicle'],
    }),

    updateVehicle: builder.mutation<void, { id: number; vehicle: VehicleDto }>({
      query: ({ id, vehicle }) => ({
        url: `/Vehicles/${id}`,
        method: 'PUT',
        body: vehicle,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Vehicle', id }, 'Vehicle'],
    }),

    deleteVehicle: builder.mutation<void, number>({
      query: (id) => ({
        url: `/Vehicles/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Vehicle'],
    }),
  }),
});

export const {
  useGetVehiclesQuery,
  useGetVehicleByIdQuery,
  useGetFeaturedVehiclesQuery,
  useSearchAvailableVehiclesQuery,
  useFilterVehiclesQuery,
  useCreateVehicleMutation,
  useUpdateVehicleMutation,
  useDeleteVehicleMutation,
} = vehicleApi;