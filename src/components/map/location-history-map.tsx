'use client';

import React, { useEffect, useRef } from 'react';
import { calculateTotalRouteDistance } from '@/lib/utils';

interface LocationPoint {
  latitude: number;
  longitude: number;
  timestamp: string;
}

interface LocationHistoryMapProps {
  locations: LocationPoint[];
}

export default function LocationHistoryMap({ locations }: LocationHistoryMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<any>(null);

  const totalDistanceKm = calculateTotalRouteDistance(locations);

  useEffect(() => {
    if (typeof window === 'undefined' || !mapRef.current || locations.length === 0) return;

    import('leaflet').then((L) => {
      if (!leafletMap.current) {
        leafletMap.current = L.map(mapRef.current!).setView([locations[0].latitude, locations[0].longitude], 13);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap',
          maxZoom: 19,
        }).addTo(leafletMap.current);
      }

      const map = leafletMap.current;
      const points = locations.map((loc) => [loc.latitude, loc.longitude] as [number, number]);

      // Draw route polyline path
      const polyline = L.polyline(points, {
        color: '#6366f1',
        weight: 4,
        opacity: 0.8,
      }).addTo(map);

      // Start marker
      L.circleMarker(points[0], {
        radius: 8,
        fillColor: '#10b981',
        color: '#ffffff',
        weight: 2,
        fillOpacity: 1,
      })
        .addTo(map)
        .bindPopup(`🟢 Shift Start<br/>${new Date(locations[0].timestamp).toLocaleTimeString()}`);

      // End marker
      if (points.length > 1) {
        L.circleMarker(points[points.length - 1], {
          radius: 8,
          fillColor: '#ef4444',
          color: '#ffffff',
          weight: 2,
          fillOpacity: 1,
        })
          .addTo(map)
          .bindPopup(`🔴 Latest Location<br/>${new Date(locations[locations.length - 1].timestamp).toLocaleTimeString()}`);
      }

      map.fitBounds(polyline.getBounds(), { padding: [30, 30] });
    });
  }, [locations]);

  if (locations.length === 0) {
    return (
      <div className="w-full h-[300px] rounded-xl bg-surface-900 flex items-center justify-center text-surface-400 text-xs border border-surface-800">
        No location points logged for this date.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center px-1 text-xs text-surface-300">
        <span>📍 Route Trail ({locations.length} points)</span>
        <span className="font-bold text-emerald-400 font-mono">
          Est. Traveled Distance: {totalDistanceKm} km
        </span>
      </div>
      <div ref={mapRef} className="w-full h-[300px] rounded-xl z-10" />
    </div>
  );
}
