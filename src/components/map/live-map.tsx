'use client';

import React, { useEffect, useRef } from 'react';

interface EmployeeLocationMarker {
  id: string;
  name: string;
  status: 'WORKING' | 'ON_BREAK' | 'OFFLINE';
  task?: string;
  lat: number;
  lng: number;
  lastSeen?: string;
}

interface LiveMapProps {
  employees: EmployeeLocationMarker[];
  center?: [number, number];
  zoom?: number;
}

export default function LiveMap({ employees, center = [19.076, 72.8777], zoom = 12 }: LiveMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<any>(null);
  const markersRef = useRef<{ [key: string]: any }>({});

  useEffect(() => {
    if (typeof window === 'undefined' || !mapRef.current) return;

    // Load Leaflet dynamically
    import('leaflet').then((L) => {
      if (!leafletMap.current) {
        leafletMap.current = L.map(mapRef.current!).setView(center, zoom);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
        }).addTo(leafletMap.current);
      }

      // Update markers
      const currentMap = leafletMap.current;

      // Remove existing markers
      Object.keys(markersRef.current).forEach((key) => {
        currentMap.removeLayer(markersRef.current[key]);
      });
      markersRef.current = {};

      // Add employee markers
      employees.forEach((emp) => {
        if (!emp.lat || !emp.lng) return;

        const color = emp.status === 'WORKING' ? '#10b981' : emp.status === 'ON_BREAK' ? '#f59e0b' : '#64748b';

        // Custom HTML marker pin
        const customIcon = L.divIcon({
          className: 'custom-map-marker',
          html: `
            <div style="
              background-color: ${color};
              width: 24px;
              height: 24px;
              border-radius: 50%;
              border: 3px solid white;
              box-shadow: 0 4px 6px -1px rgba(0,0,0,0.5);
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-weight: bold;
              font-size: 11px;
            ">
              ${emp.name[0]}
            </div>
          `,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });

        const marker = L.marker([emp.lat, emp.lng], { icon: customIcon }).addTo(currentMap);

        const popupContent = `
          <div style="font-family: sans-serif; padding: 4px; min-width: 150px;">
            <strong style="font-size: 13px; color: #0f172a;">${emp.name}</strong><br/>
            <span style="font-size: 11px; color: ${color}; font-weight: bold;">Status: ${emp.status}</span><br/>
            ${emp.task ? `<span style="font-size: 11px; color: #475569;">Task: ${emp.task}</span><br/>` : ''}
            <span style="font-size: 10px; color: #94a3b8;">Coords: ${emp.lat.toFixed(4)}, ${emp.lng.toFixed(4)}</span>
          </div>
        `;

        marker.bindPopup(popupContent);
        markersRef.current[emp.id] = marker;
      });

      // Fit bounds if employees exist
      const validEmps = employees.filter((e) => e.lat && e.lng);
      if (validEmps.length > 0) {
        const bounds = L.latLngBounds(validEmps.map((e) => [e.lat, e.lng]));
        currentMap.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
      }
    });
  }, [employees]);

  return <div ref={mapRef} className="w-full h-full min-h-[380px] rounded-2xl z-10" />;
}
