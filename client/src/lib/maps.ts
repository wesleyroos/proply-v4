// Google Maps initialization module
export function initGoogleMaps() {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  console.log('Initializing Google Maps...');
  console.log('API Key available:', !!apiKey);
  console.log('API Key length:', apiKey?.length || 0);

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=marker`;
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      console.log('Google Maps script loaded successfully');
      resolve(true);
    };
    
    script.onerror = (error) => {
      console.error('Failed to load Google Maps script:', error);
      reject(error);
    };
    
    document.head.appendChild(script);
  });
}
