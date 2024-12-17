import { useEffect, useState, useRef } from 'react';

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

  // Initialize map when Google Maps script is loaded
  useEffect(() => {
    const checkGoogleMapsLoaded = setInterval(() => {
      if (window.google?.maps) {
        console.log('Google Maps API loaded successfully');
        setIsLoaded(true);
        clearInterval(checkGoogleMapsLoaded);
      }
    }, 100);

    return () => clearInterval(checkGoogleMapsLoaded);
  }, []);

  // Initialize the map once Google Maps is loaded
  useEffect(() => {
    if (!isLoaded || !mapRef.current) return;

    try {
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
        
        const newMarker = new google.maps.Marker({
          map: newMap,
          visible: false
        });
        setMarker(newMarker);

        console.log('Map initialized successfully');
      } catch (error) {
        console.error('Error initializing map:', error);
      }
  }, [isLoaded]);

  // Update marker when address changes
  useEffect(() => {
    const updateMarker = async () => {
      if (!map || !marker || !address || !window.google?.maps) return;

      try {
        const geocoder = new google.maps.Geocoder();
        
        geocoder.geocode({ address }, (results, status) => {
          if (status === 'OK' && results && results[0]) {
            const location = results[0].geometry.location;
            map.setCenter(location);
            map.setZoom(16);
            marker.setPosition(location);
            marker.setVisible(true);
            console.log('Location updated:', location.toString());
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

  return (
    <div 
      ref={mapRef} 
      className="h-[300px] w-full rounded-lg overflow-hidden border"
    />
  );
}
