// src/config/mappls.ts

const API_BASE = import.meta.env.VITE_API_BASEURL;

// ── Live data response types ───────────────────────────────────────────────
export interface MapplsDeviceData {
  entityId: number;
  latitude: number;
  longitude: number;
  speedKph: number;
  heading: number;
  address: string;
  ignition: number;
  ignitionStatusStr: string;
  statusStr: string;
  status: number;
  internalBatteryLevel: number;
  mainPower: number;
  todayKms: number;
  gprsStateStr: string;
  gpsStateStr: string;
  gpsTimeStr: string;
  gprsTimeStr: string;
  name: string;
  registrationNumber: string;
}

// ── Get live device data via .NET backend ──────────────────────────────────
export async function getLiveData(deviceId: string): Promise<MapplsDeviceData | null> {
  try {
    const res = await fetch(`${API_BASE}/mappls/livedata`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deviceId }),
    });

    if (!res.ok) throw new Error('Failed to fetch live data');

    const json = await res.json();
    const devices = json?.data?.mydevices;
    if (!devices || devices.length === 0) return null;
    return devices[0] as MapplsDeviceData;
  } catch (err) {
    console.error('getLiveData error:', err);
    return null;
  }
}
