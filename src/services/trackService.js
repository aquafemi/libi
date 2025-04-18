import {
  getUserRecentTracks,
  getArtistInfo,
  getTrackInfo
} from '../api/lastfm';
import { calculateEarnings } from '../utils/formatters/earningsFormatter';

/**
 * Fetch and process recent tracks for a user
 * 
 * @param {string} username - Last.fm username
 * @param {number} limit - Maximum number of tracks to fetch
 * @returns {Promise<Array>} - Array of processed track objects
 */
export const fetchRecentTracks = async (username, limit = 30) => {
  if (!username) {
    throw new Error('Username is required');
  }
  
  // Fetch recent tracks from Last.fm
  const recentTracksData = await getUserRecentTracks(username, limit);
  
  if (!recentTracksData?.recenttracks?.track?.length) {
    throw new Error('No recent tracks found');
  }
  
  // Process tracks
  const tracksToProcess = recentTracksData.recenttracks.track.slice(0, limit);
  const recentTracks = [];
  const apiPromises = [];
  
  // Process each track
  tracksToProcess.forEach((track, index) => {
    const artistName = track.artist['#text'] || track.artist.name;
    const trackName = track.name;
    
    // Create track object with default values
    const trackItem = {
      id: `${trackName}-${artistName}-${index}`,
      name: trackName,
      artistName: artistName,
      date: track.date,
      nowPlaying: track['@attr']?.nowplaying === 'true',
      image: track.image || [],
      playCount: 0,
      earnings: "0.0000",
      artistPlayCount: 0,
      artistEarnings: "0.0000",
      streamingLinks: [
        { 
          name: 'Spotify', 
          icon: 'spotify', 
          iconSet: 'fa5',
          url: `https://open.spotify.com/search/${encodeURIComponent(trackName + ' ' + artistName)}`,
          color: '#1DB954'
        },
        { 
          name: 'Apple Music', 
          icon: 'apple', 
          iconSet: 'mc',
          url: `https://music.apple.com/search?term=${encodeURIComponent(trackName + ' ' + artistName)}`,
          color: '#fa243c'
        },
        { 
          name: 'YouTube Music', 
          icon: 'youtube', 
          iconSet: 'mc',
          url: `https://music.youtube.com/search?q=${encodeURIComponent(trackName + ' ' + artistName)}`,
          color: '#ff0000'
        },
        { 
          name: 'Amazon Music', 
          icon: 'amazon',
          iconSet: 'fa5',
          url: `https://music.amazon.com/search/${encodeURIComponent(trackName + ' ' + artistName)}`,
          color: '#00A8E1'
        },
      ],
      purchaseLinks: [
        { 
          name: 'Amazon', 
          icon: 'shopping-cart', 
          iconSet: 'fa5', 
          url: `https://www.amazon.com/s?k=${encodeURIComponent(trackName + ' ' + artistName)}&i=digital-music`,
          color: '#ff9900'
        },
      ]
    };
    
    recentTracks.push(trackItem);
    
    // Track info promise - get play count
    const trackInfoPromise = getTrackInfo(artistName, trackName, username)
      .then(info => {
        if (info?.track?.userplaycount) {
          const playCount = parseInt(info.track.userplaycount, 10) || 0;
          recentTracks[index].playCount = playCount;
          recentTracks[index].earnings = calculateEarnings(playCount);
        }
      })
      .catch(err => console.error(`Error fetching track info for ${trackName}:`, err));
    
    // Artist info promise - get artist play count
    const artistInfoPromise = getArtistInfo(artistName, username)
      .then(info => {
        if (info?.artist?.stats?.userplaycount) {
          const playCount = parseInt(info.artist.stats.userplaycount, 10) || 0;
          recentTracks[index].artistPlayCount = playCount;
          recentTracks[index].artistEarnings = calculateEarnings(playCount);
        }
      })
      .catch(err => console.error(`Error fetching artist info for ${artistName}:`, err));
    
    apiPromises.push(trackInfoPromise, artistInfoPromise);
  });
  
  // Wait for all API calls to finish
  await Promise.all(apiPromises);
  
  return recentTracks;
};