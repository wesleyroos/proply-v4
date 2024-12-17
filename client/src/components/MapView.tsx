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
        
        const newMarker = new window.google.maps.Marker({
          position: defaultLocation,
          map: newMap,
          visible: false
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
      if (!map || !marker || !address || !window.google?.maps) {
        console.log('Skipping marker update, dependencies not ready:', {
          mapReady: !!map,
          markerReady: !!marker,
          addressProvided: !!address,
          googleMapsReady: !!window.google?.maps
        });
        return;
      }

      try {
        console.log('Geocoding address:', address);
        const geocoder = new window.google.maps.Geocoder();
        
        geocoder.geocode({ address }, (results: any, status: any) => {
          console.log('Geocoding response:', { status, results: results?.[0]?.geometry?.location });
          
          if (status === window.google.maps.GeocoderStatus.OK && results?.[0]) {
            const location = results[0].geometry.location;
            console.log('Setting marker position to:', location.toString());
            
            map.setCenter(location);
            map.setZoom(16);
            
            // Ensure marker is properly configured
            marker.setMap(map);
            marker.setPosition(location);
            marker.setVisible(true);
            
            console.log('Marker visibility:', marker.getVisible());
            console.log('Marker position:', marker.getPosition()?.toString());
          } else {
            console.error('Geocoding failed:', status);
            marker.setVisible(false);
          }
        });
      } catch (error) {
        console.error('Geocoding error:', error);
        marker.setVisible(false);
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
