/**
 * Utility to extract dominant and vibrant colors from an image URL
 * Uses client-side Canvas downsampling for fast 60fps performance
 */

const colorCache = new Map();

/**
 * Extracts dominant color palette from an image URL
 * @param {string} imageUrl
 * @returns {Promise<{ primary: string, secondary: string, gradient: string, glow: string }>}
 */
export function extractDominantColors(imageUrl) {
  if (!imageUrl) {
    return Promise.resolve(getDefaultPalette());
  }

  if (colorCache.has(imageUrl)) {
    return Promise.resolve(colorCache.get(imageUrl));
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.src = imageUrl;

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        // Downsample to 24x24 for ultra-fast processing
        const size = 24;
        canvas.width = size;
        canvas.height = size;

        ctx.drawImage(img, 0, 0, size, size);
        const data = ctx.getImageData(0, 0, size, size).data;

        let totalR = 0, totalG = 0, totalB = 0, count = 0;
        let bestR = 40, bestG = 25, bestB = 30;
        let maxSaturation = 0;

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const a = data[i + 3];

          // Skip transparent or near-black/near-white pixels
          if (a < 128) continue;
          const max = Math.max(r, g, b);
          const min = Math.min(r, g, b);
          const brightness = (r * 299 + g * 587 + b * 114) / 1000;
          
          if (brightness < 20 || brightness > 235) continue;

          const delta = max - min;
          const saturation = max === 0 ? 0 : delta / max;

          totalR += r;
          totalG += g;
          totalB += b;
          count++;

          // Track the most saturated color for ambient vibrancy
          if (saturation > maxSaturation) {
            maxSaturation = saturation;
            bestR = r;
            bestG = g;
            bestB = b;
          }
        }

        // Blend dominant saturated color with average
        let finalR = bestR;
        let finalG = bestG;
        let finalB = bestB;

        if (count > 0 && maxSaturation < 0.25) {
          finalR = Math.round(totalR / count);
          finalG = Math.round(totalG / count);
          finalB = Math.round(totalB / count);
        }

        // Tone down brightness for readability (ensure dark, deep ambient feel)
        finalR = Math.min(200, Math.max(25, finalR));
        finalG = Math.min(200, Math.max(25, finalG));
        finalB = Math.min(200, Math.max(25, finalB));

        // Create secondary deeper tone
        const secR = Math.max(12, Math.round(finalR * 0.45));
        const secG = Math.max(12, Math.round(finalG * 0.45));
        const secB = Math.max(12, Math.round(finalB * 0.45));

        const palette = {
          r: finalR,
          g: finalG,
          b: finalB,
          primary: `rgb(${finalR}, ${finalG}, ${finalB})`,
          secondary: `rgb(${secR}, ${secG}, ${secB})`,
        };

        colorCache.set(imageUrl, palette);
        resolve(palette);
      } catch (err) {
        console.warn('Canvas color extraction fallback:', err.message);
        resolve(getDefaultPalette());
      }
    };

    img.onerror = () => {
      resolve(getDefaultPalette());
    };
  });
}

function getDefaultPalette() {
  return {
    r: 45,
    g: 45,
    b: 55,
    primary: 'rgb(45, 45, 55)',
    secondary: 'rgb(20, 20, 25)',
  };
}
