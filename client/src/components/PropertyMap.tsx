import { useEffect, useRef, useState } from 'react';
import { initGoogleMaps } from '../lib/maps';

interface PropertyMapProps {
  address: string;
}

export default function PropertyMap({ address }: PropertyMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const mapInstance = useRef<google.maps.Map | null>(null);
  const markerInstance = useRef<google.maps.Marker | null>(null);

  useEffect(() => {
    let isMounted = true;

    const initializeMap = async () => {
      try {
        console.log('Starting map initialization for address:', address);

        await initGoogleMaps();
        console.log('Google Maps API loaded successfully');

        if (!isMounted) {
          console.warn('Component unmounted during initialization');
          return;
        }

        if (!mapRef.current) {
          console.error('Map container ref is not available');
          setError('Map container not found');
          return;
        }

        if (!address) {
          console.error('No address provided');
          setError('Address is required');
          return;
        }

        // Get container dimensions
        const container = mapRef.current;
        console.log('Map container dimensions:', {
          width: container.clientWidth,
          height: container.clientHeight
        });

        // Initialize map with default location
        const defaultLocation = { lat: -33.918861, lng: 18.4233 }; // Cape Town
        mapInstance.current = new google.maps.Map(container, {
          center: defaultLocation,
          zoom: 13,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          gestureHandling: 'cooperative',
          mapId: "8c097f85efc9c75f",
          preserveDrawingBuffer: true,
          backgroundColor: '#ffffff'
        });

        console.log('Map instance created');

        // Wait for map to be ready
        await new Promise((resolve) => {
          google.maps.event.addListenerOnce(mapInstance.current!, 'idle', () => {
            console.log('Map idle event fired');
            resolve(null);
          });
        });

        // Geocode the address
        const geocoder = new google.maps.Geocoder();
        console.log('Geocoding address:', address);

        const result = await new Promise<google.maps.GeocoderResult>((resolve, reject) => {
          geocoder.geocode({ address }, (results, status) => {
            console.log('Geocoding status:', status);
            if (status === "OK" && results?.[0]) {
              resolve(results[0]);
            } else {
              reject(new Error(`Geocoding failed: ${status}`));
            }
          });
        });

        const location = result.geometry.location;
        console.log('Location found:', { lat: location.lat(), lng: location.lng() });

        // Update map view
        mapInstance.current!.setCenter(location);
        mapInstance.current!.setZoom(16);

        // Create marker
        markerInstance.current = new google.maps.Marker({
          map: mapInstance.current,
          position: location,
          title: "Property Location",
        });

        console.log('Marker placed successfully');
        setMapLoaded(true);

      } catch (error) {
        console.error('Map initialization error:', error);
        setError(error instanceof Error ? error.message : 'Failed to load map');
      }
    };

    initializeMap();

    return () => {
      console.log('Cleaning up map component');
      isMounted = false;
      if (markerInstance.current) {
        markerInstance.current.setMap(null);
      }
      setMapLoaded(false);
    };
  }, [address]);

  if (error) {
    return (
      <div className="h-[300px] w-full rounded-lg overflow-hidden border bg-gray-100 flex items-center justify-center">
        <p className="text-red-500">Error: {error}</p>
      </div>
    );
  }

  return (
    <div 
      ref={mapRef} 
      className="h-[300px] w-full rounded-lg overflow-hidden border relative"
      style={{ minHeight: '300px' }}
    />
  );
}