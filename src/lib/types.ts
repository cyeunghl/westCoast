export interface RoutePoint {
  lat: number;
  lon: number;
  ele: number;
  time: string;
  hr?: number;
  power?: number;
  speed: number;
  distance: number;
  gradient: number;
}

export interface RideStats {
  hr?: number;
  power?: number;
  speed: number;
  elevation: number;
  distance: number;
}

export interface Photo {
  filename: string;
  timestamp: string;
  location: { lat: number; lon: number } | null;
  routeIndex: number;
  stats: RideStats;
}

export interface Ride {
  id: string;
  date: string;
  name: string;
  route: RoutePoint[];
  photos: Photo[];
  summary: {
    distance: number;
    elevationGain: number;
    duration: number;
    avgSpeed: number;
    avgHr?: number;
    avgPower?: number;
    maxElevation: number;
  };
}

export type MetricType = 'speed' | 'hr' | 'power' | 'elevation';
