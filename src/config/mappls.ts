const API_BASE = import.meta.env.VITE_API_BASEURL;

// Raw shape returned by InTouch devices API (single device from data array)
export interface MapplsDeviceData {
  // Identity
  entityId: number;
  name: string;
  registrationNumber: string;

  // Location
  latitude: number;
  longitude: number;
  speedKph: number;
  heading: number;
  address: string;

  // Status (status code: 1=Moving, 2=Idle, 3=Stopped/Parked)
  status: number;
  statusStr: string;

  // Ignition (0=off, 1=on)
  ignition: number;
  ignitionStatusStr: string;

  // Battery
  internalBatteryLevel: number;
  mainPower: number; // in mV e.g. 13070

  // GPS/GPRS
  gpsSignal: number;
  gpsStateStr: string;
  gprsStateStr: string;

  // Timestamps (Unix epoch seconds)
  gpsTime: number;
  gprsTime: number;
  gpsTimeStr: string;
  gprsTimeStr: string;

  // Today's drive
  todayKms: number;
  todayMovementTime: number;
  todayIdleTime: number;
  todayDriveCount: number;
}

// Maps the raw InTouch API device object to MapplsDeviceData
function mapDevice(raw: any): MapplsDeviceData {
  const loc = raw.location ?? {};
  const details = raw.deviceDetails ?? {};
  const can = raw.canInfo ?? {};
  const today = raw.todaysDrive ?? {};

  const status: number = raw.status ?? 3;
  const statusStr =
    status === 1 ? "Moving" : status === 2 ? "Idle" : "Stopped";

  const ignition: number = can.ignition ?? 0;
  const ignitionStatusStr = ignition === 1 ? "Ignition On" : "Ignition Off";

  const gpsSignal: number = loc.gpsSignal ?? 0;
  const gpsStateStr = gpsSignal > 0 ? "Active" : "No Signal";
  const gprsStateStr = loc.gprsTime ? "Connected" : "Disconnected";

  const toDateStr = (epoch: number | undefined) => {
    if (!epoch) return "N/A";
    return new Date(epoch * 1000).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  return {
    entityId: raw.id ?? 0,
    name: details.name ?? "",
    registrationNumber: details.registrationNumber ?? "",

    latitude: loc.latitude ?? 0,
    longitude: loc.longitude ?? 0,
    speedKph: loc.speedKph ?? 0,
    heading: loc.heading ?? 0,
    address: loc.address ?? "",

    status,
    statusStr,

    ignition,
    ignitionStatusStr,

    internalBatteryLevel: details.internalBatteryLevel ?? 0,
    mainPower: raw.vehicleBattery ?? 0,

    gpsSignal,
    gpsStateStr,
    gprsStateStr,

    gpsTime: loc.gpsTime ?? 0,
    gprsTime: loc.gprsTime ?? 0,
    gpsTimeStr: toDateStr(loc.gpsTime),
    gprsTimeStr: toDateStr(loc.gprsTime),

    todayKms: today.todayKms ?? 0,
    todayMovementTime: today.todayMovementTime ?? 0,
    todayIdleTime: today.todayIdleTime ?? 0,
    todayDriveCount: today.todayDriveCount ?? 0,
  };
}

// Get live device data via .NET backend
export async function getLiveData(
  deviceId: string
): Promise<MapplsDeviceData | null> {
  try {
    const res = await fetch(`${API_BASE}/mappls/livedata`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deviceId }),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const json = await res.json();

    // InTouch response: { "data": [ { ...device... } ] }
    const devices: any[] = json?.data;
    if (!devices || devices.length === 0) return null;

    return mapDevice(devices[0]);
  } catch (err) {
    console.error("getLiveData error:", err);
    return null;
  }
}