import { useEffect, useRef } from 'react';
import { initGoogleMaps } from '../lib/maps';

interface Property {
  id: number;
  address: string;
  type: 'analyzer' | 'compare';
}

interface DashboardMapProps {
  properties: Property[];
}

// ── Geocoding cache (localStorage, 30-day TTL) ───────────────────────────────
const CACHE_KEY = 'proply_geocache';
const CACHE_TTL = 30 * 24 * 60 * 60 * 1000;

function getCached(address: string): { lat: number; lng: number } | null {
  try {
    const store = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
    const entry = store[address];
    if (entry && Date.now() - entry.ts < CACHE_TTL) return { lat: entry.lat, lng: entry.lng };
  } catch {}
  return null;
}

function setCache(address: string, lat: number, lng: number) {
  try {
    const store = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
    store[address] = { lat, lng, ts: Date.now() };
    localStorage.setItem(CACHE_KEY, JSON.stringify(store));
  } catch {}
}
// ─────────────────────────────────────────────────────────────────────────────

export default function DashboardMap({ properties }: DashboardMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isMounted = true;
    let map: google.maps.Map | null = null;
    let markers: google.maps.Marker[] = [];

    const initializeMap = async () => {
      try {
        await initGoogleMaps();

        if (!isMounted || !mapRef.current) return;

        const defaultLocation = { lat: -33.918861, lng: 18.4233 };
        map = new google.maps.Map(mapRef.current, {
          center: defaultLocation,
          zoom: 12,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        });

        const geocoder = new google.maps.Geocoder();

        for (const property of properties) {
          try {
            // Use cache to avoid repeated paid API calls for the same address
            let coords = getCached(property.address);

            if (!coords) {
              const result = await new Promise<google.maps.GeocoderResult>((resolve, reject) => {
                geocoder.geocode({ address: property.address }, (results, status) => {
                  if (status === "OK" && results?.[0]) resolve(results[0]);
                  else reject(new Error(`Geocoding failed: ${status}`));
                });
              });
              const loc = result.geometry.location;
              coords = { lat: loc.lat(), lng: loc.lng() };
              setCache(property.address, coords.lat, coords.lng);
            }

            const marker = new google.maps.Marker({
              map,
              position: coords,
              title: property.address,
              icon: {
                path: "M21.47,11.88l-9-8a1,1,0,0,0-1.33,0l-9,8a1,1,0,0,0,1.33,1.49L4,12.88v8a1,1,0,0,0,1,1H19a1,1,0,0,0,1-1v-8l0.47,0.42a1,1,0,0,0,1.33-1.49Z",
                fillColor: property.type === 'analyzer' ? '#3B82F6' : '#ef4444',
                fillOpacity: 1,
                strokeWeight: 1.5,
                strokeColor: '#ffffff',
                scale: 1.2,
                anchor: new google.maps.Point(12, 12),
              },
            });

            markers.push(marker);

            if (markers.length === 1) {
              map.setCenter(coords);
            } else {
              const bounds = new google.maps.LatLngBounds();
              markers.forEach(m => bounds.extend(m.getPosition()!));
              map.fitBounds(bounds);
            }
          } catch (error) {
            console.error(`Error geocoding ${property.address}:`, error);
          }
        }
      } catch (error) {
        console.error('Error initializing map:', error);
      }
    };

    initializeMap();

    return () => {
      isMounted = false;
      markers.forEach(m => m.setMap(null));
    };
  }, [properties]);

  return (
    <div
      ref={mapRef}
      data-map-container="true"
      style={{ position: 'absolute', top: '1rem', right: '1rem', bottom: '1rem', left: '1rem' }}
    />
  );
}
