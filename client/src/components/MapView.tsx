import { useEffect, useState } from 'react';
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';

const containerStyle = {
  width: '100%',
  height: '300px'
};

interface MapViewProps {
  address: string;
}

export default function MapView({ address }: MapViewProps) {
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!address) return;

    // Create a Geocoder to convert address to coordinates
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ address }, (results, status) => {
      if (status === 'OK' && results && results[0]) {
        const { lat, lng } = results[0].geometry.location;
        setCoordinates({ lat: lat(), lng: lng() });
      }
      setIsLoading(false);
    });
  }, [address]);

  if (!coordinates || isLoading) {
    return <div className="w-full h-[300px] bg-gray-100 animate-pulse rounded-lg" />;
  }

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={coordinates}
      zoom={15}
    >
      <Marker position={coordinates} />
    </GoogleMap>
  );
}
