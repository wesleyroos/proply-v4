import { useEffect, useRef } from 'react';

interface MapViewProps {
  address: string;
}

declare global {
  interface Window {
    google: any;
    initMap: () => void;
  }
}

export default function MapView({ address }: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const scriptRef = useRef<HTMLScriptElement | null>(null);

  useEffect(() => {
    if (!mapRef.current || !address) return;

    // Initialize map function
    window.initMap = () => {
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ address }, (results, status) => {
        if (status === 'OK' && results && results[0]) {
          const mapOptions = {
            center: results[0].geometry.location,
            zoom: 14,
            zoomControl: true,
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: false,
          };
          
          const map = new window.google.maps.Map(mapRef.current!, mapOptions);
          
          new window.google.maps.Marker({
            map,
            position: results[0].geometry.location
          });
        } else {
          console.error('Geocoding failed:', status);
          if (mapRef.current) {
            mapRef.current.innerHTML = '<div class="flex items-center justify-center h-full text-red-500">Could not locate address on map</div>';
          }
        }
      });
    };

    // Load Google Maps script if not already loaded
    if (!window.google) {
      scriptRef.current = document.createElement('script');
      scriptRef.current.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&callback=initMap`;
      scriptRef.current.async = true;
      scriptRef.current.defer = true;
      document.head.appendChild(scriptRef.current);

      return () => {
        if (scriptRef.current) {
          document.head.removeChild(scriptRef.current);
        }
      };
    } else {
      // If script is already loaded, just initialize the map
      window.initMap();
    }
  }, [address]);

  return (
    <div 
      ref={mapRef} 
      className="w-full h-[300px] rounded-lg overflow-hidden bg-gray-100"
    />
  );
}
