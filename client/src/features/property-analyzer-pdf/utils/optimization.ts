export const optimizeCanvas = (canvas: HTMLCanvasElement): HTMLCanvasElement => {
  // Create a new canvas with the same dimensions
  const optimizedCanvas = document.createElement('canvas');
  optimizedCanvas.width = canvas.width;
  optimizedCanvas.height = canvas.height;
  
  const ctx = optimizedCanvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  // Apply optimizations
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  
  // Draw the original canvas onto the optimized one
  ctx.drawImage(canvas, 0, 0);

  return optimizedCanvas;
};

export const compressImageData = async (
  imageData: string,
  maxWidth = 1500,
  quality = 0.85
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      let width = img.width;
      let height = img.height;

      // Calculate new dimensions
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;

      // Draw and compress
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };

    img.onerror = () => reject(new Error('Failed to load image for compression'));
    img.src = imageData;
  });
};
