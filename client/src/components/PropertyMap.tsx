import { useEffect, useRef } from 'react';
import { Loader } from '@googlemaps/js-api-loader';

interface PropertyMapProps {
  address: string;
}

export default function PropertyMap({ address }: PropertyMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const loadMap = async () => {
      const loader = new Loader({
        apiKey: "AIzaSyAqp2MBbZHl0uZsq6qSNFtHDt0hP_kkTa4",
        version: "weekly",
        libraries: ["places"]
      });

      try {
        const google = await loader.load();
        const geocoder = new google.maps.Geocoder();
        
        geocoder.geocode({ address }, (results, status) => {
          if (status === "OK" && results?.[0]) {
            const map = new google.maps.Map(mapRef.current!, {
              center: results[0].geometry.location,
              zoom: 15
            });

            new google.maps.Marker({
              map,
              position: results[0].geometry.location
            });
          }
        });
      } catch (error) {
        console.error('Error loading map:', error);
      }
    };

    if (mapRef.current) {
      loadMap();
    }
  }, [address]);

  return <div ref={mapRef} className="w-full h-full min-h-[300px] rounded-lg" />;
}
