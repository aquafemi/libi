/**
 * Formats a timestamp or date into a relative time string (e.g., "2 hours ago")
 * 
 * @param {Object|string} timestamp - The timestamp to format (Last.fm format)
 * @returns {string} - The relative time string
 */
export const formatRelativeTime = (timestamp) => {
  // If no timestamp or it's not properly formatted, return "Recently"
  if (!timestamp || (!timestamp.uts && !timestamp['#text'])) {
    return "Recently";
  }
  
  // Try to parse the timestamp (Last.fm provides it in different formats)
  let date;
  if (timestamp.uts) {
    // Unix timestamp (seconds since epoch)
    date = new Date(timestamp.uts * 1000);
  } else if (timestamp['#text']) {
    // Text date format
    date = new Date(timestamp['#text']);
  } else {
    return "Recently";
  }
  
  // Check if date is valid
  if (isNaN(date.getTime())) {
    return "Recently";
  }
  
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  const diffMonth = Math.floor(diffDay / 30);
  
  // Format based on how long ago
  if (diffMonth > 0) {
    return diffMonth === 1 ? "1 month ago" : `${diffMonth} months ago`;
  } else if (diffDay > 0) {
    return diffDay === 1 ? "Yesterday" : `${diffDay} days ago`;
  } else if (diffHour > 0) {
    return diffHour === 1 ? "1 hour ago" : `${diffHour} hours ago`;
  } else if (diffMin > 0) {
    return diffMin === 1 ? "1 minute ago" : `${diffMin} minutes ago`;
  } else {
    return "Just now";
  }
};