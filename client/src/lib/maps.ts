// Google Maps initialization module
let initPromise: Promise<boolean> | null = null;

export function initGoogleMaps() {
  if (initPromise) {
    return initPromise;
  }

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  console.log('Initializing Google Maps...');
  console.log('API Key available:', !!apiKey);

  initPromise = new Promise((resolve, reject) => {
    if (window.google?.maps) {
      console.log('Google Maps already loaded');
      resolve(true);
      return;
    }

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
      initPromise = null;
      reject(error);
    };
    
    document.head.appendChild(script);
  });

  return initPromise;
}
