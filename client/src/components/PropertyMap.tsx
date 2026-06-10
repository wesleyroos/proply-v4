import { useEffect } from 'react';

interface PropertyMapProps {
  address: string;
  onMapLoad?: () => void;
  mapClassName?: string;
}

export default function PropertyMap({ address, onMapLoad, mapClassName }: PropertyMapProps) {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  useEffect(() => { onMapLoad?.(); }, []);

  if (!apiKey || !address?.trim()) {
    return (
      <div className={`${mapClassName || 'h-[300px] w-full'} rounded-lg overflow-hidden border bg-slate-100 flex items-center justify-center`}>
        <p className="text-sm text-slate-400">No address provided</p>
      </div>
    );
  }

  return (
    <iframe
      style={{ border: 0 }}
      loading="lazy"
      allowFullScreen
      referrerPolicy="no-referrer-when-downgrade"
      src={`https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${encodeURIComponent(address)}&zoom=15`}
      className={`${mapClassName || 'h-[300px] w-full'} rounded-lg`}
      onLoad={() => onMapLoad?.()}
    />
  );
}
