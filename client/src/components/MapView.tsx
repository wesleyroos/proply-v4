import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';

// Fix the marker icon issue in React
const icon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41]
});

interface MapViewProps {
  address: string;
}

// Component to handle map center updates
function MapUpdater({ address }: { address: string }) {
  const map = useMap();
  
  useEffect(() => {
    if (!address) return;

    async function updateMapLocation() {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`
        );
        const data = await response.json();
        
        if (data && data.length > 0) {
          const { lat, lon } = data[0];
          const location: L.LatLngTuple = [parseFloat(lat), parseFloat(lon)];
          map.setView(location, 16);
        }
      } catch (error) {
        console.error('Error geocoding address:', error);
      }
    }

    updateMapLocation();
  }, [address, map]);

  return null;
}

export default function MapView({ address }: MapViewProps) {
  const [location, setLocation] = useState<[number, number] | null>(null);

  useEffect(() => {
    if (!address) return;

    async function geocodeAddress() {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`
        );
        const data = await response.json();
        
        if (data && data.length > 0) {
          const { lat, lon } = data[0];
          setLocation([parseFloat(lat), parseFloat(lon)]);
        }
      } catch (error) {
        console.error('Error geocoding address:', error);
      }
    }

    geocodeAddress();
  }, [address]);

  if (!address) return null;

  return (
    <div className="h-[300px] w-full rounded-lg overflow-hidden border">
      <MapContainer
        center={location || [-33.918861, 18.423300]} // Default center (Cape Town)
        zoom={13}
        scrollWheelZoom={false}
        className="h-full w-full"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        {location && <Marker position={location} icon={icon} />}
        <MapUpdater address={address} />
      </MapContainer>
    </div>
  );
}
