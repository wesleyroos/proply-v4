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

  // Initialize map when Google Maps script is loaded
  useEffect(() => {
    console.log('MapView mounted, initializing Google Maps...');
    
    initGoogleMaps()
      .then(() => {
        console.log('Google Maps initialization successful');
        setIsLoaded(true);
      })
      .catch((err) => {
        console.error('Failed to initialize Google Maps:', err);
        setError('Failed to load Google Maps');
      });
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
        
        // Create a marker element using the new AdvancedMarkerElement
        const newMarker = new window.google.maps.marker.AdvancedMarkerElement({
          map: null, // Initially not shown on map
          position: defaultLocation,
          title: 'Property Location'
        });
        setMarker(newMarker);

        console.log('Map initialized successfully');
      } catch (error) {
        console.error('Error initializing map:', error);
        setError('Error creating map');
      }
  }, [isLoaded]);

  // Update marker when address changes
  useEffect(() => {
    const updateMarker = async () => {
      // Only proceed if we have all required dependencies and a non-empty address
      if (!map || !marker || !address?.trim() || !window.google?.maps) {
        console.log('Skipping marker update, dependencies not ready:', {
          mapReady: !!map,
          markerReady: !!marker,
          addressProvided: !!address?.trim(),
          googleMapsReady: !!window.google?.maps
        });
        return;
      }

      try {
        console.log('Starting geocoding for address:', address);
        const geocoder = new window.google.maps.Geocoder();
        
        // Use Promise-based approach for better error handling
        const geocodeAddress = () => new Promise((resolve, reject) => {
          geocoder.geocode({ address }, (results: any, status: any) => {
            if (status === window.google.maps.GeocoderStatus.OK && results?.[0]) {
              resolve(results[0]);
            } else {
              reject(new Error(`Geocoding failed: ${status}`));
            }
          });
        });

        const result = await geocodeAddress();
        const location = result.geometry.location;
        console.log('Successfully geocoded address to:', location.toString());
        
        // Center the map
        map.setCenter(location);
        map.setZoom(16);
        
        // Update marker
        marker.position = location;
        marker.map = map;
        
        console.log('Marker placed successfully at:', location.toString());
      } catch (error) {
        console.error('Error updating marker:', error);
        marker.map = null; // Hide the marker
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
