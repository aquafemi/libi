/**
 * Constants for calculating earnings
 */
export const STREAM_RATE = 0.004; // $0.004 per stream

/**
 * Calculate earnings from play count
 * 
 * @param {number} playCount - Number of plays/streams
 * @param {number} decimalPlaces - Number of decimal places (default 4)
 * @returns {string} - Formatted earnings string 
 */
export const calculateEarnings = (playCount, decimalPlaces = 4) => {
  if (!playCount || isNaN(parseInt(playCount))) return "0.0000";
  
  const count = parseInt(playCount, 10);
  const earnings = count * STREAM_RATE;
  
  return earnings.toFixed(decimalPlaces);
};