import { useEffect, useRef, useState } from 'react';
import { initGoogleMaps } from '../lib/maps';

interface PropertyMapProps {
  address: string;
}

export default function PropertyMap({ address }: PropertyMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    let map: google.maps.Map | null = null;
    let marker: google.maps.Marker | null = null;

    const initializeMap = async () => {
      try {
        await initGoogleMaps();
        console.log("Google Maps initialized successfully");

        if (!isMounted || !mapRef.current || !address) {
          console.error("Missing required elements for map initialization");
          return;
        }

        // Initialize map with default location
        const defaultLocation = { lat: -33.918861, lng: 18.4233 }; // Cape Town
        map = new google.maps.Map(mapRef.current, {
          center: defaultLocation,
          zoom: 13,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          gestureHandling: 'cooperative',
          mapId: "8c097f85efc9c75f",
        });

        // Wait for map to be ready
        await new Promise((resolve) => google.maps.event.addListenerOnce(map, 'idle', resolve));

        // Geocode the address
        const geocoder = new google.maps.Geocoder();
        const result = await new Promise<google.maps.GeocoderResult>((resolve, reject) => {
          geocoder.geocode({ address }, (results, status) => {
            if (status === "OK" && results?.[0]) {
              resolve(results[0]);
            } else {
              reject(new Error(`Geocoding failed: ${status}`));
            }
          });
        });

        const location = result.geometry.location;
        
        // Update map view
        map.setCenter(location);
        map.setZoom(16);

        // Create marker
        marker = new google.maps.Marker({
          map: map,
          position: location,
          title: "Property Location",
        });

      } catch (error) {
        console.error('Error initializing map:', error);
        setError('Failed to load property location on map');
      }
    };

    initializeMap();

    return () => {
      isMounted = false;
      if (marker) {
        marker.setMap(null);
      }
    };
  }, [address]);

  if (error) {
    return (
      <div className="h-[300px] w-full rounded-lg overflow-hidden border bg-gray-100 flex items-center justify-center">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return <div ref={mapRef} className="h-[300px] w-full rounded-lg overflow-hidden border" />;
}
