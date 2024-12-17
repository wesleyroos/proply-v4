import { useEffect, useState, useRef } from "react";
import { initGoogleMaps } from "../lib/maps";

interface MapViewProps {
  address: string;
}

// Add type definitions for Google Maps
declare global {
  interface Window {
    google: typeof google;
    _googleMapsCallback?: () => void;
  }
}

export default function MapView({ address }: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [marker, setMarker] = useState<google.maps.Marker | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cleanup function to remove marker from map
  const cleanupMarker = () => {
    if (marker) {
      marker.setMap(null);
      setMarker(null);
    }
  };

  // Initialize the Google Maps script and map instance
  useEffect(() => {
    let isMounted = true;
    console.log("MapView mounted, initializing Google Maps...");

    async function initializeMap() {
      try {
        await initGoogleMaps();
        console.log("Google Maps script loaded successfully");

        if (!isMounted || !mapRef.current) return;

        const defaultLocation = { lat: -33.918861, lng: 18.4233 }; // Cape Town
        const newMap = new google.maps.Map(mapRef.current, {
          center: defaultLocation,
          zoom: 13,
          mapId: "8c097f85efc9c75f", // Use Map ID for the project
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        });

        setMap(newMap);
        console.log("Map initialized successfully");
      } catch (error) {
        console.error("Error initializing Google Maps:", error);
        setError("Failed to load Google Maps");
      }
    }

    initializeMap();

    return () => {
      isMounted = false;
      cleanupMarker();
    };
  }, []);

  // Update marker when address changes
  useEffect(() => {
    const updateMarker = async () => {
      if (!map || !window.google?.maps) {
        console.log("Map or Google Maps not ready yet");
        return;
      }

      // Remove existing marker
      if (marker) {
        marker.map = null;
        setMarker(null);
      }

      if (!address?.trim()) {
        console.log("No address provided, centering on default location");
        const defaultLocation = { lat: -33.918861, lng: 18.4233 }; // Cape Town
        map.setCenter(defaultLocation);
        map.setZoom(13);
        return;
      }

      try {
        console.log("Geocoding address:", address);
        const geocoder = new window.google.maps.Geocoder();

        const result = await new Promise<google.maps.GeocoderResult>((resolve, reject) => {
          geocoder.geocode({ address }, (results, status) => {
            if (status === "OK" && results?.[0]) {
              resolve(results[0]);
            } else {
              reject(new Error(`Geocoding failed: ${status}`));
            }
          });
        });

        const location = result.geometry.location;
        console.log("Geocoding successful, found location:", location.toString());

        // Update map view
        map.setCenter(location);
        map.setZoom(16);

        // Create a new AdvancedMarkerElement
        const newMarker = new window.google.maps.marker.AdvancedMarkerElement({
          map: map,
          position: location,
          title: "Property Location"
        });

        setMarker(newMarker);
        console.log("Advanced marker placed at:", location.toString());
      } catch (error) {
        console.error("Error updating marker:", error);
        setError("Error placing marker on map");
      }
    };

    updateMarker();
  }, [address, map]);

  // Display any errors
  if (error) {
    return (
      <div className="h-[300px] w-full rounded-lg overflow-hidden border bg-gray-100 flex items-center justify-center">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  // Render the map container
  return (
    <div
      ref={mapRef}
      className="h-[300px] w-full rounded-lg overflow-hidden border"
    />
  );
}