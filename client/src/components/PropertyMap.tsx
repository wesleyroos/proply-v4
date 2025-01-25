import { useEffect, useRef, useState } from 'react';
import { initGoogleMaps } from '../lib/maps';

interface PropertyMapProps {
  address: string;
  onMapLoad?: () => void;
  mapClassName?: string;
}

export default function PropertyMap({ address, onMapLoad, mapClassName }: PropertyMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [geocoder, setGeocoder] = useState<google.maps.Geocoder | null>(null);

  useEffect(() => {
    let isMounted = true;

    const initializeMap = async () => {
      try {
        await initGoogleMaps();

        if (!isMounted || !mapRef.current) return;

        const geocoderInstance = new google.maps.Geocoder();
        setGeocoder(geocoderInstance);

        const defaultLocation = { lat: -33.918861, lng: 18.4233 };

        const mapInstance = new google.maps.Map(mapRef.current, {
          center: defaultLocation,
          zoom: 15,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          gestureHandling: 'cooperative'
        });

        setMap(mapInstance);

        if (onMapLoad) {
          onMapLoad();
        }

        geocoderInstance.geocode({ address }, (results, status) => {
          if (status === "OK" && results?.[0]) {
            const location = results[0].geometry.location;
            mapInstance.setCenter(location);
            mapInstance.setZoom(16);

            new google.maps.Marker({
              map: mapInstance,
              position: location,
              title: "Property Location"
            });
          } else {
            console.error('Geocoding failed:', status);
            setError(`Could not find location: ${status}`);
          }
        });

      } catch (error) {
        console.error('Map initialization error:', error);
        setError(error instanceof Error ? error.message : 'Failed to load map');
      }
    };

    initializeMap();

    return () => {
      isMounted = false;
    };
  }, [address, onMapLoad]);

  if (error) {
    return (
      <div className={`${mapClassName || 'h-[300px] w-full'} rounded-lg overflow-hidden border bg-gray-100 flex items-center justify-center`}>
        <p className="text-red-500">Error: {error}</p>
      </div>
    );
  }

  return (
    <div 
      ref={mapRef}
      className={`${mapClassName || 'h-[300px] w-full'} rounded-lg overflow-hidden border`}
    />
  );
}