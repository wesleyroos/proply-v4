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

        // Initialize map with default location (Cape Town)
        const defaultLocation = { lat: -33.918861, lng: 18.4233 };
        map = new google.maps.Map(mapRef.current, {
          center: defaultLocation,
          zoom: 12,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        });

        // Create markers for all properties
        const geocoder = new google.maps.Geocoder();

        // Process each property sequentially to avoid rate limiting
        for (const property of properties) {
          try {
            const result = await new Promise<google.maps.GeocoderResult>((resolve, reject) => {
              geocoder.geocode({ address: property.address }, (results, status) => {
                if (status === "OK" && results?.[0]) {
                  resolve(results[0]);
                } else {
                  reject(new Error(`Geocoding failed: ${status}`));
                }
              });
            });

            const location = result.geometry.location;

            // Create marker with Proply's light blue color
            const marker = new google.maps.Marker({
              map: map,
              position: location,
              title: property.address,
              icon: {
                path: google.maps.SymbolPath.CIRCLE,
                fillColor: '#3B82F6', // Proply light blue
                fillOpacity: 1,
                strokeWeight: 2,
                strokeColor: '#ffffff',
                scale: 10,
              },
            });

            markers.push(marker);

            // Fit bounds to include all markers
            if (markers.length === 1) {
              map.setCenter(location);
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
      markers.forEach(marker => marker.setMap(null));
    };
  }, [properties]);

  return (
    <div ref={mapRef} style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }} />
  );
}