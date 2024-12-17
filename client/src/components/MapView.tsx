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

    // Initialize Google Maps using dynamic import as recommended
    const initializeMap = async () => {
      try {
        // Bootstrap loader script
        const loader = ((g) => {
          let h, a, k, p = "The Google Maps JavaScript API", c = "google", l = "importLibrary",
              q = "__ib__", m = document, b = window;
          b = b[c] || (b[c] = {});
          const d = b.maps || (b.maps = {});
          const r = new Set();
          const e = new URLSearchParams;
          const u = () => h || (h = new Promise(async (f, n) => {
            await (a = m.createElement("script"));
            e.set("libraries", [...r] + "");
            for (k in g) e.set(k.replace(/[A-Z]/g, t => "_" + t[0].toLowerCase()), g[k]);
            e.set("callback", c + ".maps." + q);
            a.src = `https://maps.${c}apis.com/maps/api/js?` + e;
            d[q] = f;
            a.onerror = () => h = n(Error(p + " could not load."));
            a.nonce = m.querySelector("script[nonce]")?.nonce || "";
            m.head.append(a)
          }));
          d[l] ? console.warn(p + " only loads once. Ignoring:", g) :
              d[l] = (f, ...n) => r.add(f) && u().then(() => d[l](f, ...n));
          return u();
        })({
          key: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
          v: "weekly"
        });

        await loader;
        const { Map } = await window.google.maps.importLibrary("maps") as google.maps.MapsLibrary;
        const { Geocoder } = await window.google.maps.importLibrary("geocoding") as google.maps.GeocodingLibrary;

        const geocoder = new Geocoder();
        const results = await geocoder.geocode({ address });

        if (results.results.length > 0) {
          const { location } = results.results[0].geometry;
          
          const map = new Map(mapRef.current, {
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

    initializeMap();
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
