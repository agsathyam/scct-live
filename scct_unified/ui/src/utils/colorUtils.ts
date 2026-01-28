export interface BrandColors {
  primary: string;
  secondary: string;
}

// Simple color extraction from image
// In a real app we might use 'colorthief' or similar, but for zero-dep we can use canvas
export const extractColorsFromImage = (imageSrc: string): Promise<BrandColors> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.src = imageSrc;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve({ primary: '#3b82f6', secondary: '#1e40af' }); // Fallback

      canvas.width = 100; // Resize for speed
      canvas.height = 100;
      ctx.drawImage(img, 0, 0, 100, 100);

      const imageData = ctx.getImageData(0, 0, 100, 100).data;
      const colorMap: Record<string, number> = {};
      let maxCount = 0;
      let dominantColor = '#3b82f6';

      // Simple histogram bucket approach (skip every 10px for speed)
      for (let i = 0; i < imageData.length; i += 40) {
        const r = imageData[i];
        const g = imageData[i + 1];
        const b = imageData[i + 2];
        const a = imageData[i + 3];

        if (a < 128) continue; // Skip transparent
        if (r > 230 && g > 230 && b > 230) continue; // Skip white/near-white
        if (r < 30 && g < 30 && b < 30) continue; // Skip black/near-black

        const key = `${r},${g},${b}`;
        colorMap[key] = (colorMap[key] || 0) + 1;

        if (colorMap[key] > maxCount) {
          maxCount = colorMap[key];
          dominantColor = `rgb(${r},${g},${b})`;
        }
      }

      // Generate a secondary color (darker version of primary)
      // We can just rely on the primary for now and let CSS helpers dim it
      resolve({ primary: dominantColor, secondary: dominantColor });
    };
    img.onerror = () => resolve({ primary: '#3b82f6', secondary: '#1e40af' });
  });
};

export const getContrastColor = (hexColor: string): string => {
  // Convert generic color string to hex if possible or just return white for safety
  // For proper WCAG this needs full parsing, for now assume dark bg needs white text
  return '#ffffff';
};
