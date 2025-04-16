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
    if (image && image['#text']) {
      return image['#text'];
    }
  }

  // If we can't find any image by size name, try the last one (usually largest)
  // or the first one that has a URL
  const lastImage = images[images.length - 1];
  if (lastImage && lastImage['#text']) {
    return lastImage['#text'];
  }

  // Find any image with a URL
  const anyImage = images.find(img => img['#text']);
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

  const image = images.find(img => img.size === size && img['#text']);
  return (image && image['#text']) ? image['#text'] : fallback;
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
  if (!images || !Array.isArray(images) || !images[index] || !images[index]['#text']) {
    return fallback;
  }
  
  return images[index]['#text'];
};