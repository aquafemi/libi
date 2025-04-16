import axios from 'axios';
import { LASTFM_API_KEY } from '@env';

// Last.fm API configuration
const API_KEY = LASTFM_API_KEY;
const BASE_URL = 'https://ws.audioscrobbler.com/2.0/';

// Create API client
const lastfm = axios.create({
  baseURL: BASE_URL,
  params: {
    api_key: API_KEY,
    format: 'json',
  },
});

// Get user recent tracks
export const getUserRecentTracks = async (username, limit = 50) => {
  try {
    const response = await lastfm.get('', {
      params: {
        method: 'user.getrecenttracks',
        user: username,
        limit,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching recent tracks:', error);
    throw error;
  }
};

// Get artist info including images
export const getArtistInfo = async (artist) => {
  try {
    const response = await lastfm.get('', {
      params: {
        method: 'artist.getinfo',
        artist,
        autocorrect: 1,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching artist info:', error);
    throw error;
  }
};

// Get artist info from MusicBrainz API with image relations
export const getMusicBrainzArtistInfo = async (mbid) => {
  try {
    if (!mbid) return null;
    
    // Use the MusicBrainz API to get an artist by MBID with image relations
    const response = await axios.get(`https://musicbrainz.org/ws/2/artist/${mbid}`, {
      params: {
        inc: 'url-rels', // Include URL relations which has image information
        fmt: 'json',
      },
      headers: {
        'User-Agent': 'Libi-App/1.0.0 (https://github.com/aquafemi/libi)',
      },
    });
    
    return response.data;
  } catch (error) {
    console.error('Error fetching MusicBrainz artist info:', error);
    return null;
  }
};

// Search for artist in MusicBrainz API by name
export const searchMusicBrainzArtist = async (artistName) => {
  try {
    if (!artistName) return null;
    
    // Use the MusicBrainz API to search for an artist by name
    const response = await axios.get('https://musicbrainz.org/ws/2/artist', {
      params: {
        query: artistName,
        fmt: 'json',
      },
      headers: {
        'User-Agent': 'Libi-App/1.0.0 (https://github.com/aquafemi/libi)',
      },
    });
    
    return response.data;
  } catch (error) {
    console.error('Error searching MusicBrainz artist:', error);
    return null;
  }
};

// Get user top artists
export const getUserTopArtists = async (username, period = 'overall', limit = 20) => {
  try {
    const response = await lastfm.get('', {
      params: {
        method: 'user.gettopartists',
        user: username,
        period,
        limit,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching top artists:', error);
    throw error;
  }
};

// Get user top tracks
export const getUserTopTracks = async (username, period = 'overall', limit = 20) => {
  try {
    const response = await lastfm.get('', {
      params: {
        method: 'user.gettoptracks',
        user: username,
        period,
        limit,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching top tracks:', error);
    throw error;
  }
};

// Get album info
export const getAlbumInfo = async (artist, album) => {
  try {
    const response = await lastfm.get('', {
      params: {
        method: 'album.getinfo',
        artist,
        album,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching album info:', error);
    throw error;
  }
};

// Get similar artists
export const getSimilarArtists = async (artist, limit = 10) => {
  try {
    const response = await lastfm.get('', {
      params: {
        method: 'artist.getsimilar',
        artist,
        limit,
        autocorrect: 1,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching similar artists:', error);
    throw error;
  }
};