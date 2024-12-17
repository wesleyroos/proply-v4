import { useEffect, useState, useRef } from 'react';
import { initGoogleMaps } from '../lib/maps';

interface MapViewProps {
  address: string;
}

// Add type definitions for Google Maps
declare global {
  interface Window {
    google: typeof google;
    _googleMapsCallback?: () => void;
  }
}

declare namespace google.maps.marker {
  class AdvancedMarkerElement {
    constructor(options: {
      map: google.maps.Map;
      position: google.maps.LatLng | google.maps.LatLngLiteral;
      title?: string;
    });
    map: google.maps.Map | null;
    position: google.maps.LatLng | google.maps.LatLngLiteral;
  }
}

export default function MapView({ address }: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [marker, setMarker] = useState<google.maps.marker.AdvancedMarkerElement | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cleanup function to remove marker from map
  const cleanupMarker = () => {
    if (marker) {
      marker.map = null;
      setMarker(null);
    }
  };

  // Initialize map when component mounts
  useEffect(() => {
    let isMounted = true;
    console.log('MapView mounted, initializing Google Maps...');
    
    async function initializeMap() {
      try {
        await initGoogleMaps();
        
        if (!isMounted || !mapRef.current) return;
        
        console.log('Google Maps initialization successful');
        
        // Create map instance
        console.log('Creating map instance...');
        const defaultLocation = { lat: -33.918861, lng: 18.423300 }; // Cape Town
        const newMap = new google.maps.Map(mapRef.current, {
          center: defaultLocation,
          zoom: 13,
          mapId: '8c097f85efc9c75f', // Required for AdvancedMarkerElement
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
        
        // Create an advanced marker element
        if (!window.google.maps.marker) {
          console.error('Advanced Marker library not loaded');
          setError('Error: Advanced Marker library not available');
          return;
        }

        const newMarker = new window.google.maps.marker.AdvancedMarkerElement({
          map: newMap,
          position: defaultLocation,
          title: 'Property Location',
        });
        setMarker(newMarker);

        console.log('Map initialized successfully with advanced marker');
      } catch (error) {
        console.error('Error initializing map:', error);
        setError('Error creating map');
      }
    }
    initializeMap();

    return () => {
      isMounted = false;
      cleanupMarker();
    };
  }, []);

  // Update marker when address changes
  useEffect(() => {
    const updateMarker = async () => {
      if (!map || !window.google?.maps) {
        console.log('Map not ready yet');
        return;
      }

      // Clean up existing marker
      cleanupMarker();

      // If no address is provided, center on default location
      if (!address?.trim()) {
        const defaultLocation = { lat: -33.918861, lng: 18.423300 }; // Cape Town
        map.setCenter(defaultLocation);
        map.setZoom(13);
        return;
      }

      try {
        console.log('Geocoding address:', address);
        const geocoder = new window.google.maps.Geocoder();
        
        const result = await new Promise<google.maps.GeocoderResult>((resolve, reject) => {
          geocoder.geocode({ address }, (results, status) => {
            if (status === 'OK' && results?.[0]) {
              resolve(results[0]);
            } else {
              reject(new Error(`Geocoding failed: ${status}`));
            }
          });
        });

        const location = result.geometry.location;
        console.log('Found location:', location.toString());
        
        // Update map view
        map.setCenter(location);
        map.setZoom(16);
        
        // Create new marker
        if (window.google.maps.marker) {
          const newMarker = new window.google.maps.marker.AdvancedMarkerElement({
            map: map,
            position: location,
            title: 'Property Location',
          });
          setMarker(newMarker);
          console.log('New advanced marker created at:', location.toString());
        } else {
          console.error('Advanced Marker library not available');
          setError('Error: Advanced Marker library not available');
        }
      } catch (error) {
        console.error('Error updating marker:', error);
        setError('Error placing marker on map');
      }
    };

    updateMarker();

    // Cleanup on unmount or address change
    return () => {
      cleanupMarker();
    };
  }, [address, map]);

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
