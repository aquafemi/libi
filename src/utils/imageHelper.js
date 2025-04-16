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
 * Get track/album image with fallback
 * 
 * @param {object} track - Track object from Last.fm API
 * @param {string} fallback - Fallback URL
 * @returns {string} - URL of the track/album image
 */
export const getTrackImage = (track, fallback = 'https://via.placeholder.com/300?text=Album') => {
  if (!track) return fallback;
  
  // 1. If the track has images already from Last.fm API, try to use them first
  if (track.image && Array.isArray(track.image) && track.image.length > 0) {
    const bestImage = getBestImage(track.image, '');
    // Check that the image URL isn't empty and doesn't contain the default Last.fm placeholder
    if (bestImage && 
        bestImage.trim() !== '' && 
        !bestImage.includes('2a96cbd8b46e442fc41c2b86b821562f') &&
        !bestImage.includes('c6f59c1e5e7240a4c0d427abd71f3dbb')) {
      return bestImage;
    }
  }
  
  // 2. Create music note icon with track name or album name
  let trackName = '';
  let artistName = '';
  
  if (track.name) {
    trackName = track.name;
  }
  
  if (track.artist) {
    if (typeof track.artist === 'string') {
      artistName = track.artist;
    } else if (track.artist['#text']) {
      artistName = track.artist['#text'];
    } else if (track.artist.name) {
      artistName = track.artist.name;
    }
  }
  
  // Choose what text to display on the placeholder
  let displayText = '';
  if (trackName && artistName) {
    displayText = `${trackName} - ${artistName}`;
  } else if (trackName) {
    displayText = trackName;
  } else if (artistName) {
    displayText = artistName;
  } else {
    displayText = 'Track';
  }
  
  // Limit length for URLs
  displayText = displayText.substring(0, 30);
  
  // Create a consistent color based on the track/artist name for variability
  const nameStr = (trackName || artistName || 'music');
  const nameColorCode = nameStr.charCodeAt(0) % 360; // Use first char for hue
  
  // Convert HSL to hex
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
  
  // Create the placeholder with text
  return `https://via.placeholder.com/500/${bgColor}/${textColor}?text=${encodeURIComponent(displayText)}`;
};

/**
 * Get artist image with fallback to placeholder organized by genre/type
 * 
 * @param {object} artist - Artist object 
 * @param {string} fallback - Fallback URL
 * @returns {string} - URL of the artist image
 */
/**
 * Get artist image using MusicBrainz ID (MBID) from Last.fm
 * 
 * @param {object} artist - Artist object from Last.fm API
 * @param {string} fallback - Fallback URL if no MBID is available
 * @returns {string} - URL of the artist image
 */
export const getArtistImage = (artist, fallback = 'https://via.placeholder.com/300?text=Artist') => {
  if (!artist) return fallback;
  
  // 1. If the artist has images already from Last.fm API, try to use them first
  if (artist.image && Array.isArray(artist.image) && artist.image.length > 0) {
    const bestImage = getBestImage(artist.image, '');
    // Check that the image URL isn't empty and doesn't contain the default Last.fm placeholder
    if (bestImage && 
        bestImage.trim() !== '' && 
        !bestImage.includes('2a96cbd8b46e442fc41c2b86b821562f') &&
        !bestImage.includes('c6f59c1e5e7240a4c0d427abd71f3dbb')) {
      return bestImage;
    }
  }
  
  // 2. Use a custom Spotify-style artist avatar with initials on a colored background
  let avatarUrl = fallback;
  if (artist.name) {
    // 2a. Get first letter or first letter of each word for initials
    const words = artist.name.split(' ');
    let initials = '';
    
    if (words.length === 1) {
      // Single word artist name - take first letter
      initials = artist.name.charAt(0).toUpperCase();
    } else if (words.length > 1) {
      // Multi-word artist name - take first letter of first and last word
      initials = words[0].charAt(0).toUpperCase();
      if (words[words.length-1].length > 0) {
        initials += words[words.length-1].charAt(0).toUpperCase();
      }
    }
    
    // Limit to max 2 letters
    initials = initials.substring(0, 2);
    
    // 2b. Create a consistent color based on the artist name
    const nameColorCode = artist.name.charCodeAt(0) % 360; // Use first char for hue
    
    // Convert HSL to hex for Avatar URL
    // Simple rough conversion - not perfect but works for our needs
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
    
    // 2c. Create the personalized avatar URL using initials and color
    avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=${bgColor}&color=${textColor}&size=500&bold=true&rounded=true`;
  }
  
  // 3. If artist has a custom defaultImage property, use it instead of the generated avatar
  if (artist.defaultImage && artist.defaultImage.trim() !== '') {
    return artist.defaultImage;
  }
  
  // 4. Return the avatar URL
  return avatarUrl;
};