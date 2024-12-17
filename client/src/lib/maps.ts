// Google Maps initialization module
let initPromise: Promise<void> | null = null;

export function initGoogleMaps() {
  if (initPromise) {
    return initPromise;
  }

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return Promise.reject(new Error('Google Maps API key not found'));
  }

  console.log('Initializing Google Maps...');

  initPromise = new Promise((resolve, reject) => {
    // If already loaded, resolve immediately
    if (window.google?.maps?.Map) {
      console.log('Google Maps already loaded');
      resolve();
      return;
    }

    // Create a callback function that Google Maps will call when loaded
    const callbackName = '_googleMapsCallback';
    window[callbackName] = () => {
      console.log('Google Maps script loaded successfully');
      delete window[callbackName];
      resolve();
    };

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=marker,places&callback=${callbackName}&loading=async&v=beta`;
    script.async = true;
    script.defer = true;
    
    script.onerror = (error) => {
      console.error('Failed to load Google Maps script:', error);
      delete window[callbackName];
      initPromise = null;
      reject(error);
    };
    
    document.head.appendChild(script);
  });

  return initPromise;
}
