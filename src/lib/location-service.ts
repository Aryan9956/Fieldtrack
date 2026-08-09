import { Geolocation } from '@capacitor/geolocation';

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: number;
}

const OFFLINE_QUEUE_KEY = 'fieldtrack_offline_location_queue';
const MAX_QUEUE_SIZE = 500; // Bound queue to max 500 points

export class OfflineLocationQueue {
  static enqueue(location: LocationData): void {
    if (typeof window === 'undefined') return;
    try {
      const queue = this.getQueue();
      if (queue.length >= MAX_QUEUE_SIZE) {
        queue.shift(); // Drop oldest point if queue exceeds bound
      }
      queue.push(location);
      localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
      console.log(`[OfflineQueue] Location point queued locally. Total queued: ${queue.length}`);
    } catch (e) {
      console.warn('[OfflineQueue] Failed to save offline location point:', e);
    }
  }

  static getQueue(): LocationData[] {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  static clearQueue(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(OFFLINE_QUEUE_KEY);
  }

  static async flushQueue(uploadBatchFn: (points: LocationData[]) => Promise<boolean>): Promise<void> {
    const queue = this.getQueue();
    if (queue.length === 0) return;

    console.log(`[OfflineQueue] Flushing ${queue.length} offline GPS points to server...`);
    const success = await uploadBatchFn(queue);
    if (success) {
      this.clearQueue();
      console.log('[OfflineQueue] Offline GPS points successfully synchronized!');
    }
  }
}

export abstract class LocationService {
  abstract startTracking(onUpdate: (loc: LocationData) => void, onError: (err: string) => void): void;
  abstract stopTracking(): void;
  abstract getCurrentPosition(): Promise<LocationData>;
}

export class HybridLocationService extends LocationService {
  private watchId: string | number | null = null;
  private intervalTimer: NodeJS.Timeout | null = null;

  constructor() {
    super();
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        console.log('[LocationService] Internet connection restored. Triggering offline queue sync...');
        this.syncOfflineQueue();
      });
    }
  }

  async getCurrentPosition(): Promise<LocationData> {
    // 1. Try Capacitor Native Geolocation Plugin
    try {
      const permStatus = await Geolocation.checkPermissions();
      if (permStatus.location !== 'granted') {
        const reqResult = await Geolocation.requestPermissions();
        if (reqResult.location !== 'granted') {
          throw new Error('PERMISSION_DENIED');
        }
      }

      const pos = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 5000,
      });

      return {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        accuracy: pos.coords.accuracy || undefined,
        timestamp: pos.timestamp,
      };
    } catch (capacitorErr: any) {
      // 2. Fallback to Standard Web Geolocation API
      return new Promise((resolve, reject) => {
        if (typeof window === 'undefined' || !navigator.geolocation) {
          reject('Geolocation is not supported by your device or browser.');
          return;
        }

        navigator.geolocation.getCurrentPosition(
          (pos) => {
            resolve({
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
              accuracy: pos.coords.accuracy,
              timestamp: pos.timestamp,
            });
          },
          (err) => {
            reject(this.getErrorMessage(err));
          },
          {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 5000,
          }
        );
      });
    }
  }

  startTracking(onUpdate: (loc: LocationData) => void, onError: (err: string) => void): void {
    this.stopTracking();

    // Check and sync any previously queued offline points
    this.syncOfflineQueue();

    // Initial position fetch
    this.getCurrentPosition()
      .then((loc) => {
        onUpdate(loc);
      })
      .catch(onError);

    // Capacitor Native Watch Position
    try {
      Geolocation.watchPosition(
        {
          enableHighAccuracy: true,
          timeout: 20000,
          maximumAge: 10000,
        },
        (pos, err) => {
          if (err) {
            console.warn('[LocationService] Native watch error:', err);
            return;
          }
          if (pos && pos.coords) {
            if (pos.coords.accuracy && pos.coords.accuracy > 150) {
              return;
            }
            const locData: LocationData = {
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
              accuracy: pos.coords.accuracy || undefined,
              timestamp: pos.timestamp,
            };
            onUpdate(locData);
          }
        }
      ).then((id) => {
        this.watchId = id;
      }).catch(() => {
        this.fallbackWebWatch(onUpdate, onError);
      });
    } catch (e) {
      this.fallbackWebWatch(onUpdate, onError);
    }
  }

  private fallbackWebWatch(onUpdate: (loc: LocationData) => void, onError: (err: string) => void) {
    if (typeof window === 'undefined' || !navigator.geolocation) return;

    this.watchId = navigator.geolocation.watchPosition(
      (pos) => {
        if (pos.coords.accuracy && pos.coords.accuracy > 150) return;
        const locData: LocationData = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          timestamp: pos.timestamp,
        };
        onUpdate(locData);
      },
      (err) => onError(this.getErrorMessage(err)),
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 10000 }
    );
  }

  stopTracking(): void {
    if (this.watchId !== null) {
      if (typeof this.watchId === 'string') {
        Geolocation.clearWatch({ id: this.watchId }).catch(() => {});
      } else if (typeof window !== 'undefined' && navigator.geolocation) {
        navigator.geolocation.clearWatch(this.watchId as number);
      }
      this.watchId = null;
    }
    if (this.intervalTimer) {
      clearInterval(this.intervalTimer);
      this.intervalTimer = null;
    }
  }

  async syncOfflineQueue(): Promise<void> {
    await OfflineLocationQueue.flushQueue(async (points) => {
      try {
        const res = await fetch('/api/location/batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ points }),
        });
        return res.ok;
      } catch (e) {
        return false;
      }
    });
  }

  private getErrorMessage(err: GeolocationPositionError): string {
    switch (err.code) {
      case err.PERMISSION_DENIED:
        return 'GPS permission denied. Please allow Location permission in your Phone App Settings or Browser Site Settings.';
      case err.POSITION_UNAVAILABLE:
        return 'GPS location is currently unavailable. Please enable Location/GPS on your smartphone.';
      case err.TIMEOUT:
        return 'GPS request timed out. Please verify your phone GPS signal.';
      default:
        return 'An error occurred while fetching GPS location.';
    }
  }
}

export const locationService = new HybridLocationService();
