import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from './baseQueryWithReauth';

export interface GeoCoordinateDto {
  lat: number;
  lng: number;
}

export interface GeofenceDto {
  id: number;
  name: string;
  description?: string;
  cityId: number;
  cityName?: string;
  fenceType: 'polygon' | 'circle';
  coordinates?: GeoCoordinateDto[];
  centerLat?: number;
  centerLng?: number;
  radiusMeters?: number;
  isActive: boolean;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
  vehicleCount: number;
}

export interface CreateGeofenceDto {
  name: string;
  description?: string;
  cityId: number;
  fenceType: 'polygon' | 'circle';
  coordinates?: GeoCoordinateDto[];
  centerLat?: number;
  centerLng?: number;
  radiusMeters?: number;
  isActive?: boolean;
}

export interface UpdateGeofenceDto extends CreateGeofenceDto {}

export interface VehicleGeofenceDto {
  id: number;
  vehicleId: number;
  geofenceId: number;
  alertOnExit: boolean;
  alertOnEntry: boolean;
  createdAt: string;
  vehicleName?: string;
  geofenceName?: string;
}

export interface AttachGeofenceDto {
  geofenceId: number;
  alertOnExit?: boolean;
  alertOnEntry?: boolean;
}

export interface GeofenceAlertDto {
  id: number;
  vehicleId: number;
  geofenceId: number;
  alertType: 'entry' | 'exit';
  latitude: number;
  longitude: number;
  address?: string;
  isRead: boolean;
  isResolved: boolean;
  resolvedBy?: string;
  resolvedAt?: string;
  resolutionNotes?: string;
  createdAt: string;
  vehicleName?: string;
  geofenceName?: string;
}

export interface ResolveAlertDto {
  resolutionNotes?: string;
}

export const geofenceApi = createApi({
  reducerPath: 'geofenceApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Geofence', 'VehicleGeofence', 'GeofenceAlert'],
  endpoints: (builder) => ({
    // Geofence CRUD
    getGeofences: builder.query<GeofenceDto[], void>({
      query: () => '/Geofences',
      providesTags: ['Geofence'],
    }),

    getGeofencesByCity: builder.query<GeofenceDto[], number>({
      query: (cityId) => `/Geofences/city/${cityId}`,
      providesTags: ['Geofence'],
    }),

    getGeofenceById: builder.query<GeofenceDto, number>({
      query: (id) => `/Geofences/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Geofence', id }],
    }),

    createGeofence: builder.mutation<GeofenceDto, CreateGeofenceDto>({
      query: (geofence) => ({
        url: '/Geofences',
        method: 'POST',
        body: geofence,
      }),
      invalidatesTags: ['Geofence'],
    }),

    updateGeofence: builder.mutation<void, { id: number; geofence: UpdateGeofenceDto }>({
      query: ({ id, geofence }) => ({
        url: `/Geofences/${id}`,
        method: 'PUT',
        body: geofence,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Geofence', id }, 'Geofence'],
    }),

    deleteGeofence: builder.mutation<void, number>({
      query: (id) => ({
        url: `/Geofences/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Geofence'],
    }),

    // Vehicle-Geofence attachment
    getVehicleGeofences: builder.query<VehicleGeofenceDto[], number>({
      query: (vehicleId) => `/Geofences/vehicle/${vehicleId}`,
      providesTags: (_result, _error, vehicleId) => [{ type: 'VehicleGeofence', id: vehicleId }],
    }),

    attachGeofenceToVehicle: builder.mutation<VehicleGeofenceDto, { vehicleId: number; dto: AttachGeofenceDto }>({
      query: ({ vehicleId, dto }) => ({
        url: `/Geofences/vehicle/${vehicleId}/attach`,
        method: 'POST',
        body: dto,
      }),
      invalidatesTags: (_result, _error, { vehicleId }) => [
        { type: 'VehicleGeofence', id: vehicleId },
        'Geofence',
      ],
    }),

    detachGeofenceFromVehicle: builder.mutation<void, { vehicleId: number; geofenceId: number }>({
      query: ({ vehicleId, geofenceId }) => ({
        url: `/Geofences/vehicle/${vehicleId}/detach/${geofenceId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, { vehicleId }) => [
        { type: 'VehicleGeofence', id: vehicleId },
        'Geofence',
      ],
    }),

    // Alerts
    getGeofenceAlerts: builder.query<GeofenceAlertDto[], { page?: number; size?: number }>({
      query: ({ page = 1, size = 50 }) => `/Geofences/alerts?page=${page}&size=${size}`,
      providesTags: ['GeofenceAlert'],
    }),

    getUnresolvedAlerts: builder.query<GeofenceAlertDto[], void>({
      query: () => '/Geofences/alerts/unresolved',
      providesTags: ['GeofenceAlert'],
    }),

    getUnreadAlertCount: builder.query<number, void>({
      query: () => '/Geofences/alerts/unread-count',
      providesTags: ['GeofenceAlert'],
    }),

    markAlertAsRead: builder.mutation<void, number>({
      query: (alertId) => ({
        url: `/Geofences/alerts/${alertId}/read`,
        method: 'PATCH',
      }),
      invalidatesTags: ['GeofenceAlert'],
    }),

    resolveAlert: builder.mutation<void, { alertId: number; dto: ResolveAlertDto }>({
      query: ({ alertId, dto }) => ({
        url: `/Geofences/alerts/${alertId}/resolve`,
        method: 'POST',
        body: dto,
      }),
      invalidatesTags: ['GeofenceAlert'],
    }),

    // Check if point is inside geofence
    checkPointInGeofence: builder.query<{ isInside: boolean }, { id: number; lat: number; lng: number }>({
      query: ({ id, lat, lng }) => `/Geofences/${id}/contains?lat=${lat}&lng=${lng}`,
    }),
  }),
});

export const {
  useGetGeofencesQuery,
  useGetGeofencesByCityQuery,
  useGetGeofenceByIdQuery,
  useCreateGeofenceMutation,
  useUpdateGeofenceMutation,
  useDeleteGeofenceMutation,
  useGetVehicleGeofencesQuery,
  useAttachGeofenceToVehicleMutation,
  useDetachGeofenceFromVehicleMutation,
  useGetGeofenceAlertsQuery,
  useGetUnresolvedAlertsQuery,
  useGetUnreadAlertCountQuery,
  useMarkAlertAsReadMutation,
  useResolveAlertMutation,
  useCheckPointInGeofenceQuery,
} = geofenceApi;
