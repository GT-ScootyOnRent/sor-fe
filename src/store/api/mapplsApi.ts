import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { API_CONFIG } from '../../config/api.config'
import type { RootState } from '../store'

export interface DeviceLocation {
  gpsTime: number
  gprsTime: number
  latitude: number
  longitude: number
  heading: number
  speedKph: number
  address: string
  odometer: number
  gpsSignal: number
}

export interface DeviceDetails {
  name: string
  registrationNumber: string
  deviceType: string
  trackingCode: string
  internalBatteryLevel: number
}

export interface DeviceCanInfo {
  canTimestamp: number
  chargingStatus: number
  ignition: number
}

export interface DeviceTodaysDrive {
  todayKms: number
  todayMovementTime: number
  todayIdleTime: number
  todayDriveCount: number
}

export interface DeviceLinks {
  embedUrl: string
}

export interface DeviceData {
  id: number
  active: boolean
  status: number
  vehicleBattery: number
  location?: DeviceLocation
  deviceDetails?: DeviceDetails
  canInfo?: DeviceCanInfo
  todaysDrive?: DeviceTodaysDrive
  links?: DeviceLinks
}

export interface DeviceResponseDto {
  success: boolean
  device?: DeviceData
  message?: string
}

export const mapplsApi = createApi({
  reducerPath: 'mapplsApi',
  baseQuery: fetchBaseQuery({
    baseUrl: API_CONFIG.BASE_URL,
    credentials: 'include',
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.token
        ?? localStorage.getItem('adminToken')
        ?? localStorage.getItem('token')
      if (token) headers.set('Authorization', `Bearer ${token}`)
      headers.set('Content-Type', 'application/json')
      return headers
    },
  }),
  tagTypes: ['DeviceData'],
  endpoints: (builder) => ({
    getDeviceData: builder.query<DeviceResponseDto, string>({
      query: (deviceId) => `Mappls/device/${deviceId}`,
      providesTags: (_result, _err, deviceId) => [{ type: 'DeviceData', id: deviceId }],
    }),
  }),
})

export const { useGetDeviceDataQuery } = mapplsApi