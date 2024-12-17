import { useEffect, useRef, useState } from 'react';

interface MapViewProps {
  address: string;
}

declare global {
  interface Window {
    google: typeof google;
    initMap: () => void;
  }
}

export default function MapView({ address }: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!mapRef.current || !address) return;

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&callback=initMap`;
    script.async = true;
    script.defer = true;

    // Define the initMap function that Google Maps will call
    window.initMap = async () => {
      try {
        const geocoder = new google.maps.Geocoder();
        
        const results = await new Promise<google.maps.GeocoderResponse>((resolve, reject) => {
          geocoder.geocode({ address }, (results, status) => {
            if (status === google.maps.GeocoderStatus.OK) {
              resolve({ results } as google.maps.GeocoderResponse);
            } else {
              reject(new Error(`Geocoding failed: ${status}`));
            }
          });
        });

        if (results.results.length > 0) {
          const location = results.results[0].geometry.location;
          const map = new google.maps.Map(mapRef.current!, {
            center: location,
            zoom: 14,
            zoomControl: true,
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: false,
          });

          new google.maps.Marker({
            map,
            position: location,
          });

          setError(null);
        } else {
          setError('Could not locate address on map');
        }
      } catch (err) {
        console.error('Error initializing map:', err);
        setError('Error loading map');
      }
    };

    document.head.appendChild(script);

    return () => {
      // Cleanup
      document.head.removeChild(script);
      delete window.initMap;
    };
  }, [address]);

  if (error) {
    return (
      <div className="w-full h-[300px] rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div 
      ref={mapRef} 
      className="w-full h-[300px] rounded-lg overflow-hidden bg-gray-100"
    />
  );
}
