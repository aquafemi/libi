import {
  searchArtists,
  getArtistInfo,
  getTrackInfo,
  getUserTopArtists
} from '../api/lastfm';
import { calculateEarnings } from '../utils/formatters/earningsFormatter';

/**
 * Search for artists by name
 * 
 * @param {string} query - Search query
 * @param {number} limit - Max number of results
 * @returns {Promise<Array>} - Array of artist objects
 */
export const searchForArtists = async (query, limit = 10) => {
  if (!query || !query.trim()) {
    return [];
  }
  
  const results = await searchArtists(query);
  if (results?.results?.artistmatches?.artist) {
    return results.results.artistmatches.artist.slice(0, limit);
  }
  
  return [];
};

/**
 * Get detailed artist info including user play count
 * 
 * @param {Object} artist - Basic artist object
 * @param {string} username - Last.fm username
 * @returns {Promise<Object>} - Detailed artist object
 */
export const getDetailedArtistInfo = async (artist, username) => {
  if (!artist || !username) {
    throw new Error('Artist and username are required');
  }
  
  // Get artist info with user's play count
  const artistInfo = await getArtistInfo(artist.name, username);
  
  // Get MusicBrainz data if available
  let mbInfo = null;
  if (artist.mbid) {
    try {
      const mbArtistInfo = await getMusicBrainzArtistInfo(artist.mbid);
      mbInfo = mbArtistInfo;
    } catch (err) {
      console.error(`Error fetching MusicBrainz info for ${artist.name}:`, err);
    }
  }
  
  // Get top tracks for this artist
  const topTracksData = [];
  if (artistInfo?.artist?.tracks?.track) {
    // Fetch user play count for each track
    for (const track of artistInfo.artist.tracks.track.slice(0, 5)) {
      try {
        const trackInfo = await getTrackInfo(artist.name, track.name, username);
        if (trackInfo?.track) {
          const playCount = parseInt(trackInfo.track.userplaycount || '0', 10);
          const earnings = calculateEarnings(playCount);
          
          topTracksData.push({
            ...track,
            userplaycount: playCount,
            earnings
          });
        }
      } catch (e) {
        console.error(`Error fetching track info for ${track.name}:`, e);
      }
    }
  }
  
  // Calculate streaming revenue estimate
  let artistPlayCount = 0;
  if (artistInfo?.artist?.stats?.userplaycount) {
    artistPlayCount = parseInt(artistInfo.artist.stats.userplaycount, 10);
  }
  const estimatedEarnings = calculateEarnings(artistPlayCount);
  
  // Create links to streaming and purchase platforms
  const streamingLinks = [
    { 
      name: 'Spotify', 
      icon: 'spotify', 
      iconSet: 'fa5',
      url: `https://open.spotify.com/search/${encodeURIComponent(artist.name)}`,
      color: '#1DB954'
    },
    { 
      name: 'Apple Music', 
      icon: 'apple', 
      iconSet: 'mc',
      url: `https://music.apple.com/search?term=${encodeURIComponent(artist.name)}`,
      color: '#fa243c'
    },
    { 
      name: 'YouTube Music', 
      icon: 'youtube', 
      iconSet: 'mc',
      url: `https://music.youtube.com/search?q=${encodeURIComponent(artist.name)}`,
      color: '#ff0000'
    },
    { 
      name: 'Amazon Music', 
      icon: 'amazon',
      iconSet: 'fa5',
      url: `https://music.amazon.com/search/${encodeURIComponent(artist.name)}`,
      color: '#00A8E1'
    },
  ];
  
  const purchaseLinks = [
    { 
      name: 'Amazon', 
      icon: 'shopping-cart', 
      iconSet: 'fa5', 
      url: `https://www.amazon.com/s?k=${encodeURIComponent(artist.name)}+music&i=digital-music`,
      color: '#ff9900'
    },
  ];
  
  // Return the complete artist data
  return {
    ...artistInfo?.artist,
    image: artistInfo?.artist?.image || [],
    mbInfo,
    playCount: artistPlayCount,
    earnings: estimatedEarnings,
    streamingLinks,
    purchaseLinks,
    topTracks: topTracksData
  };
};

/**
 * Fetch user's top artists
 * 
 * @param {string} username - Last.fm username
 * @param {string} period - Time period ('overall', '7day', '1month', etc.)
 * @param {number} limit - Maximum number of artists to fetch
 * @returns {Promise<Array>} - Array of top artist objects
 */
export const fetchTopArtists = async (username, period = 'overall', limit = 20) => {
  if (!username) {
    throw new Error('Username is required');
  }
  
  // Get user's top artists
  const topArtistsData = await getUserTopArtists(username, period, limit);
  
  if (!topArtistsData?.topartists?.artist) {
    return [];
  }
  
  // Process each top artist with additional data
  const processedArtists = await Promise.all(
    topArtistsData.topartists.artist.map(async (artist, index) => {
      try {
        // Calculate streaming earnings
        const playCount = parseInt(artist.playcount, 10) || 0;
        const earnings = calculateEarnings(playCount);
        
        // Get artist info with user stats
        const artistInfo = await getArtistInfo(artist.name, username);
        
        return {
          ...artist,
          rank: index + 1,
          earnings,
          image: artistInfo?.artist?.image || artist.image || [],
          genre: artistInfo?.artist?.tags?.tag?.[0]?.name || 'Music',
          streamingLinks: [
            { 
              name: 'Spotify', 
              icon: 'spotify', 
              iconSet: 'fa5',
              url: `https://open.spotify.com/search/${encodeURIComponent(artist.name)}`,
              color: '#1DB954'
            },
            { 
              name: 'Apple Music', 
              icon: 'apple', 
              iconSet: 'mc',
              url: `https://music.apple.com/search?term=${encodeURIComponent(artist.name)}`,
              color: '#fa243c'
            },
            { 
              name: 'YouTube Music', 
              icon: 'youtube', 
              iconSet: 'mc',
              url: `https://music.youtube.com/search?q=${encodeURIComponent(artist.name)}`,
              color: '#ff0000'
            },
            { 
              name: 'Amazon Music', 
              icon: 'amazon',
              iconSet: 'fa5',
              url: `https://music.amazon.com/search/${encodeURIComponent(artist.name)}`,
              color: '#00A8E1'
            },
          ],
          purchaseLinks: [
            { 
              name: 'Amazon', 
              icon: 'shopping-cart', 
              iconSet: 'fa5', 
              url: `https://www.amazon.com/s?k=${encodeURIComponent(artist.name)}+music&i=digital-music`,
              color: '#ff9900'
            },
          ]
        };
      } catch (error) {
        console.error(`Error processing top artist ${artist.name}:`, error);
        
        // Return basic artist info if processing fails
        return {
          ...artist,
          rank: index + 1,
          earnings: calculateEarnings(parseInt(artist.playcount, 10))
        };
      }
    }).slice(0, limit)
  );
  
  return processedArtists;
};