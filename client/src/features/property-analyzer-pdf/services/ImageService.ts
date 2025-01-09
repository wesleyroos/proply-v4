import html2canvas from 'html2canvas';

export class ImageService {
  async captureMap(mapElement: HTMLElement): Promise<string> {
    try {
      const canvas = await html2canvas(mapElement, {
        useCORS: true,
        allowTaint: true,
        scrollY: -window.scrollY,
        windowWidth: mapElement.scrollWidth,
        windowHeight: mapElement.scrollHeight
      });
      return canvas.toDataURL('image/png');
    } catch (error) {
      console.error('Error capturing map:', error);
      throw new Error('Failed to capture map image');
    }
  }

  async optimizeImage(imageData: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        // Set dimensions to maintain aspect ratio while limiting size
        const maxDimension = 1500;
        let width = img.width;
        let height = img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = (height / width) * maxDimension;
            width = maxDimension;
          } else {
            width = (width / height) * maxDimension;
            height = maxDimension;
          }
        }

        canvas.width = width;
        canvas.height = height;

        // Draw and optimize
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };

      img.onerror = () => reject(new Error('Failed to load image for optimization'));
      img.src = imageData;
    });
  }

  async loadAndValidateImage(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        if (typeof e.target?.result !== 'string') {
          reject(new Error('Failed to read image file'));
          return;
        }

        try {
          const optimizedImage = await this.optimizeImage(e.target.result);
          resolve(optimizedImage);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('Failed to read image file'));
      reader.readAsDataURL(file);
    });
  }
}
