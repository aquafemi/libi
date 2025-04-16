/**
 * Get the largest available image from Last.fm API image array
 * Last.fm API provides images in sizes: small, medium, large, extralarge
 * 
 * @param {Array} images - Last.fm API image array
 * @param {string} fallback - Fallback URL to use if no images are available
 * @returns {string} - URL of the largest available image
 */
export const getBestImage = (images, fallback = 'https://via.placeholder.com/300') => {
  if (!images || !Array.isArray(images) || images.length === 0) {
    return fallback;
  }

  // Last.fm usually provides images in order of size, with the largest last
  // We'll try to find the extralarge image first, then fall back to smaller sizes
  const sizes = ['extralarge', 'large', 'medium', 'small'];
  
  for (const size of sizes) {
    const image = images.find(img => img.size === size && img['#text']);
    if (image && image['#text'] && image['#text'].trim() !== '') {
      return image['#text'];
    }
  }

  // If we can't find any image by size name, try the last one (usually largest)
  // or the first one that has a URL
  const lastImage = images[images.length - 1];
  if (lastImage && lastImage['#text'] && lastImage['#text'].trim() !== '') {
    return lastImage['#text'];
  }

  // Find any image with a URL
  const anyImage = images.find(img => img['#text'] && img['#text'].trim() !== '');
  return anyImage ? anyImage['#text'] : fallback;
};

/**
 * Get image with specified size from Last.fm API image array
 * 
 * @param {Array} images - Last.fm API image array
 * @param {string} size - Desired size ('small', 'medium', 'large', 'extralarge')
 * @param {string} fallback - Fallback URL to use if the specified size isn't available
 * @returns {string} - URL of the image with requested size or fallback
 */
export const getImageBySize = (images, size = 'large', fallback = 'https://via.placeholder.com/300') => {
  if (!images || !Array.isArray(images) || images.length === 0) {
    return fallback;
  }

  const image = images.find(img => img.size === size && img['#text'] && img['#text'].trim() !== '');
  
  if (image && image['#text'] && image['#text'].trim() !== '') {
    return image['#text'];
  }
  
  // If we can't find the requested size, fall back to any valid image
  return getBestImage(images, fallback);
};

/**
 * Get an image by array index (Last.fm typically provides different sizes at different indices)
 * 
 * @param {Array} images - Last.fm API image array
 * @param {number} index - Index in the array (0=small, 1=medium, 2=large, 3=extralarge)
 * @param {string} fallback - Fallback URL to use if the specified index isn't available
 * @returns {string} - URL of the image at the specified index or fallback
 */
export const getImageByIndex = (images, index = 3, fallback = 'https://via.placeholder.com/300') => {
  if (!images || !Array.isArray(images) || !images[index] || !images[index]['#text'] || images[index]['#text'].trim() === '') {
    return fallback;
  }
  
  return images[index]['#text'];
};

/**
 * Get artist image with fallback to placeholder organized by genre/type
 * 
 * @param {object} artist - Artist object 
 * @param {string} fallback - Fallback URL
 * @returns {string} - URL of the artist image
 */
export const getArtistImage = (artist, fallback = 'https://via.placeholder.com/300?text=Artist') => {
  if (!artist) return fallback;
  
  // Create a personalized fallback if artist name is available
  let personalizedFallback = fallback;
  if (artist.name) {
    // Use first letter or first two letters of artist name for color
    const nameColorCode = artist.name.charCodeAt(0) % 360; // Use first char for hue
    
    // Convert HSL to hex for placeholder.com URL
    // Simple rough conversion - not perfect but works for placeholders
    const h = nameColorCode / 360;
    const s = 0.7;
    const l = 0.4;
    
    // Convert HSL to RGB
    let r, g, b;
    if (s === 0) {
      r = g = b = l; // achromatic
    } else {
      const hue2rgb = (p, q, t) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }
    
    // Convert to hex
    const toHex = x => {
      const hex = Math.round(x * 255).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };
    
    const bgColor = `${toHex(r)}${toHex(g)}${toHex(b)}`;
    const textColor = 'ffffff'; // White text
    
    // Use artist name for personalized placeholder
    const cleanName = encodeURIComponent(artist.name.substring(0, 20)); // Limit length for URLs
    personalizedFallback = `https://via.placeholder.com/300/${bgColor}/${textColor}?text=${cleanName}`;
  }
  
  // If artist has a custom defaultImage property, use it as fallback
  const artistFallback = artist.defaultImage || personalizedFallback;
  
  // Try to get image from artist object
  if (artist.image && Array.isArray(artist.image) && artist.image.length > 0) {
    const bestImage = getBestImage(artist.image, artistFallback);
    // If we get an empty image URL, use the fallback
    if (!bestImage || bestImage === '' || bestImage.trim() === '') {
      return artistFallback;
    }
    return bestImage;
  }
  
  return artistFallback;
};