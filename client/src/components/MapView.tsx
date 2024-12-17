import { useEffect, useState, useRef } from 'react';
import { initGoogleMaps } from '../lib/maps';

interface MapViewProps {
  address: string;
}

// Add type definitions for Google Maps
declare global {
  interface Window {
    google: any;
    initMap: () => void;
  }
}

export default function MapView({ address }: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [marker, setMarker] = useState<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize map when component mounts
  useEffect(() => {
    let isMounted = true;
    console.log('MapView mounted, initializing Google Maps...');
    
    initGoogleMaps()
      .then(() => {
        if (!isMounted) return;
        console.log('Google Maps initialization successful');
        setIsLoaded(true);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error('Failed to initialize Google Maps:', err);
        setError('Failed to load Google Maps');
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Initialize the map once Google Maps is loaded
  useEffect(() => {
    if (!isLoaded || !mapRef.current) return;

    try {
      console.log('Creating map instance...');
      const defaultLocation = { lat: -33.918861, lng: 18.423300 }; // Cape Town
      const newMap = new window.google.maps.Map(mapRef.current, {
        center: defaultLocation,
        zoom: 13,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        styles: [
          {
            featureType: "poi",
            elementType: "labels",
            stylers: [{ visibility: "off" }]
          }
        ]
      });
        
      setMap(newMap);
        
      // Create a standard marker
      const newMarker = new window.google.maps.Marker({
        map: null, // Initialize with no map
        position: defaultLocation,
        title: 'Property Location'
      });
      setMarker(newMarker);

      console.log('Map initialized successfully with marker');
    } catch (error) {
      console.error('Error initializing map:', error);
      setError('Error creating map');
    }
  }, [isLoaded]);

  // Update marker when address changes or map/marker become available
  useEffect(() => {
    const updateMarker = async () => {
      if (!map || !marker || !window.google?.maps) {
        console.log('Map or marker not ready yet');
        return;
      }

      // If no address is provided, center on default location
      if (!address?.trim()) {
        const defaultLocation = { lat: -33.918861, lng: 18.423300 }; // Cape Town
        map.setCenter(defaultLocation);
        marker.setMap(null); // Hide marker when no address
        return;
      }

      try {
        console.log('Geocoding address:', address);
        const geocoder = new window.google.maps.Geocoder();
        
        const result = await new Promise((resolve, reject) => {
          geocoder.geocode({ address }, (results: any, status: any) => {
            if (status === 'OK' && results?.[0]) {
              resolve(results[0]);
            } else {
              reject(new Error(`Geocoding failed: ${status}`));
            }
          });
        });

        const location = result.geometry.location;
        console.log('Found location:', location.toString());
        
        map.setCenter(location);
        map.setZoom(16);
        
        // Update marker properties
        marker.setPosition(location);
        marker.setMap(map);
        
        console.log('Marker placed successfully at:', location.toString());
      } catch (error) {
        console.error('Error updating marker:', error);
        marker.setMap(null);
      }
    };

    updateMarker();
  }, [address, map, marker]);

  if (error) {
    return (
      <div className="h-[300px] w-full rounded-lg overflow-hidden border bg-gray-100 flex items-center justify-center">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div 
      ref={mapRef} 
      className="h-[300px] w-full rounded-lg overflow-hidden border"
    />
  );
}
