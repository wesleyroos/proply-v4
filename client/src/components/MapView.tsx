import { useEffect, useState, useRef } from 'react';

interface MapViewProps {
  address: string;
}

export default function MapView({ address }: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [marker, setMarker] = useState<google.maps.Marker | null>(null);

  // Initialize the map
  useEffect(() => {
    if (!mapRef.current) return;

    const defaultLocation = { lat: -33.918861, lng: 18.423300 }; // Cape Town
    const newMap = new google.maps.Map(mapRef.current, {
      center: defaultLocation,
      zoom: 13,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false
    });
    
    setMap(newMap);
    
    // Create a marker but don't set its position yet
    const newMarker = new google.maps.Marker({
      map: newMap,
      visible: false
    });
    setMarker(newMarker);
  }, []);

  // Update marker when address changes
  useEffect(() => {
    if (!map || !marker || !address) return;

    const geocoder = new google.maps.Geocoder();
    
    geocoder.geocode({ address }, (results, status) => {
      if (status === 'OK' && results && results[0]) {
        const location = results[0].geometry.location;
        map.setCenter(location);
        marker.setPosition(location);
        marker.setVisible(true);
      } else {
        console.error('Geocoding failed:', status);
        marker.setVisible(false);
      }
    });
  }, [address, map, marker]);

  return (
    <div 
      ref={mapRef} 
      className="h-[300px] w-full rounded-lg overflow-hidden border"
    />
  );
}