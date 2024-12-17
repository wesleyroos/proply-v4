import { useEffect, useState, useRef } from 'react';

interface MapViewProps {
  address: string;
}

declare global {
  interface Window {
    google: typeof google;
  }
}

export default function MapView({ address }: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [marker, setMarker] = useState<google.maps.Marker | null>(null);

  // Initialize the map
  useEffect(() => {
    const initMap = async () => {
      if (!mapRef.current) return;

      try {
        const { Map } = await window.google.maps.importLibrary("maps") as google.maps.MapsLibrary;
        const { Marker } = await window.google.maps.importLibrary("marker") as google.maps.MarkerLibrary;

        const defaultLocation = { lat: -33.918861, lng: 18.423300 }; // Cape Town
        const newMap = new Map(mapRef.current, {
          center: defaultLocation,
          zoom: 13,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false
        });
        
        setMap(newMap);
        
        const newMarker = new Marker({
          map: newMap,
          visible: false
        });
        setMarker(newMarker);
      } catch (error) {
        console.error('Error initializing map:', error);
      }
    };

    initMap();
  }, []);

  // Update marker when address changes
  useEffect(() => {
    const updateMarker = async () => {
      if (!map || !marker || !address) return;

      try {
        const { Geocoder } = await window.google.maps.importLibrary("geocoding") as google.maps.GeocodingLibrary;
        const geocoder = new Geocoder();
        
        const results = await geocoder.geocode({ address });
        
        if (results.results && results.results[0]) {
          const location = results.results[0].geometry.location;
          map.setCenter(location);
          map.setZoom(16);
          marker.setPosition(location);
          marker.setVisible(true);
        } else {
          console.error('No results found');
          marker.setVisible(false);
        }
      } catch (error) {
        console.error('Geocoding failed:', error);
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
