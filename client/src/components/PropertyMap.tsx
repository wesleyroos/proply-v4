
import { useEffect, useRef, useState } from 'react';
import { initGoogleMaps } from '../lib/maps';

interface PropertyMapProps {
  address: string;
  onMapLoad?: () => void;
}

export default function PropertyMap({ address, onMapLoad }: PropertyMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const loadedRef = useRef(false);
  const mapInstance = useRef<google.maps.Map | null>(null);
  const markerInstance = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);
  const listenerRef = useRef<google.maps.MapsEventListener | null>(null);

  useEffect(() => {
    let isMounted = true;

    const initializeMap = async () => {
      try {
        await initGoogleMaps();

        if (!isMounted || !mapRef.current) return;

        const container = mapRef.current;
        const defaultLocation = { lat: -33.918861, lng: 18.4233 };

        const mapOptions: google.maps.MapOptions = {
          center: defaultLocation,
          zoom: 15,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          gestureHandling: 'cooperative',
          mapId: "8c097f85efc9c75f",
          backgroundColor: '#ffffff',
          disableDefaultUI: false,
          clickableIcons: false,
          preserveDrawingBuffer: true,
          webglContextAttributes: {
            preserveDrawingBuffer: true,
            antialias: true,
            powerPreference: 'high-performance'
          },
          mapTypeId: google.maps.MapTypeId.ROADMAP
        };

        const map = new google.maps.Map(container, mapOptions);
        mapInstance.current = map;

        // Single event listener for map load
        listenerRef.current = google.maps.event.addListenerOnce(map, 'tilesloaded', () => {
          if (isMounted && onMapLoad && !loadedRef.current) {
            loadedRef.current = true;
            onMapLoad();
          }
        });

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

        if (!isMounted) return;

        const location = result.geometry.location;
        map.setCenter(location);
        map.setZoom(16);

        const marker = new google.maps.marker.AdvancedMarkerElement({
          map,
          position: location,
          title: "Property Location"
        });

        markerInstance.current = marker;

      } catch (error) {
        console.error('Map initialization error:', error);
        if (isMounted) {
          setError(error instanceof Error ? error.message : 'Failed to load map');
        }
      }
    };

    initializeMap();

    return () => {
      isMounted = false;
      
      // Clean up event listener
      if (listenerRef.current) {
        google.maps.event.removeListener(listenerRef.current);
        listenerRef.current = null;
      }

      // Clean up marker
      if (markerInstance.current) {
        markerInstance.current.map = null;
      }

      // Clean up map
      if (mapInstance.current) {
        mapInstance.current = null;
      }

      // Clean up container
      if (mapRef.current) {
        mapRef.current.innerHTML = '';
      }
    };
  }, [address, onMapLoad]);

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
      data-map-container="true"
      className="h-[300px] w-full rounded-lg overflow-hidden border relative"
      style={{ minHeight: '300px', minWidth: '100%' }}
    />
  );
}
