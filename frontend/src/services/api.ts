import type { 
  Song, 
  SongDetail, 
  Album, 
  Artist, 
  RecommendationsResponse,
  LikedSong,
  Follower,
  JamendoSearchResponse,
  Playlist,
  PlaylistSong
} from '../types/music';

const API_URL = 'http://localhost:8000';

const ACCESS_TOKEN_KEY = 'authAccessToken';
const REFRESH_TOKEN_KEY = 'authRefreshToken';

// --- Token storage helpers ---

export const storeTokens = (access: string, refresh: string, remember?: boolean) => {
  const primaryStorage = remember ? localStorage : sessionStorage;
  const secondaryStorage = remember ? sessionStorage : localStorage;

  // Clear previous tokens from both
  secondaryStorage.removeItem(ACCESS_TOKEN_KEY);
  secondaryStorage.removeItem(REFRESH_TOKEN_KEY);
  primaryStorage.removeItem(ACCESS_TOKEN_KEY);
  primaryStorage.removeItem(REFRESH_TOKEN_KEY);

  primaryStorage.setItem(ACCESS_TOKEN_KEY, access);
  primaryStorage.setItem(REFRESH_TOKEN_KEY, refresh);
};

export const getAccessToken = (): string | null => {
  return localStorage.getItem(ACCESS_TOKEN_KEY) || sessionStorage.getItem(ACCESS_TOKEN_KEY);
};

export const getRefreshToken = (): string | null => {
  return localStorage.getItem(REFRESH_TOKEN_KEY) || sessionStorage.getItem(REFRESH_TOKEN_KEY);
};

export const clearTokens = () => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  sessionStorage.removeItem(ACCESS_TOKEN_KEY);
  sessionStorage.removeItem(REFRESH_TOKEN_KEY);
};

export const loginUser = async (usernameOrEmail: string, password: string) => {
  console.log("Attempting login with:", { usernameOrEmail });
  try {
    const response = await fetch(`${API_URL}/accounts/api/login/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username_or_email: usernameOrEmail, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      // LOG THE SERVER ERROR HERE
      console.error("Server Error Details:", data); 
      
      // Check for specific error messages (like email not verified)
      const errorMessage = data.detail 
        ? data.detail 
        : data.non_field_errors 
        ? data.non_field_errors[0] 
        : Object.values(data).flat().join(', ');
        
      throw new Error(errorMessage || 'Login failed');
    }

    return data; // contains: access, refresh, user_id, email, username
  } catch (error) {
    console.error("Login Error:", error);
    throw error;
  }
};

export const registerUser = async (email: string, password: string, fullname: string) => {
  console.log("Attempting registration with:", { email, fullname });
  try {
    const response = await fetch(`${API_URL}/accounts/api/signup/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        email, 
        password, 
        first_name: fullname 
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Server Error Details:", data);
      
      // Handle Django array errors (e.g. { email: ["This email is already in use."] })
      const firstErrorKey = Object.keys(data)[0];
      const errorMessage = Array.isArray(data[firstErrorKey]) 
        ? data[firstErrorKey][0] 
        : data[firstErrorKey];
        
      throw new Error(errorMessage || 'Registration failed');
    }

    return data; // Returns: { message, user_id, email }
  } catch (error) {
    console.error("Registration Error:", error);
    throw error;
  }
};

export const verifySignupOTP = async (email: string, code: string) => {
  console.log("Verifying OTP for:", email);
  try {
    const response = await fetch(`${API_URL}/accounts/api/signup/verify-otp/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        email,
        code 
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("OTP Verification Error:", data);
      const errorMessage = data.detail || data.error || 'Invalid or expired code';
      throw new Error(errorMessage);
    }

    return data; // Returns: { access, refresh, user_id, email, message }
  } catch (error) {
    console.error("OTP Verification Error:", error);
    throw error;
  }
};

export const loginWithGoogle = async (accessToken: string) => {
  try {
    const response = await fetch(`${API_URL}/accounts/api/google-login/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ access_token: accessToken }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Google login failed');
    }

    return data; // contains: access, refresh, user_id, email
  } catch (error) {
    console.error("Google Login Error:", error);
    throw error;
  }
};

export const loginWithFacebook = async (accessToken: string) => {
  try {
    const response = await fetch(`${API_URL}/accounts/api/facebook-login/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ access_token: accessToken }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Facebook login failed');
    }

    return data; // contains: access, refresh, user_id, email, username OR needs_username, temp_token
  } catch (error) {
    console.error("Facebook Login Error:", error);
    throw error;
  }
};

export const linkOAuthAccount = async (
  email: string,
  password: string,
  provider: 'google' | 'facebook',
  oauthAccessToken: string
): Promise<{ access: string; refresh: string; user_id: number; email: string; username: string; message: string }> => {
  try {
    const response = await fetch(`${API_URL}/accounts/api/link-oauth-account/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
        provider,
        oauth_access_token: oauthAccessToken,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      const errorMessage = data.error || data.detail || 'Failed to link account';
      throw new Error(errorMessage);
    }

    return data;
  } catch (error) {
    console.error('Link OAuth account error:', error);
    throw error;
  }
};

export const setUsername = async (username: string, tempToken?: string): Promise<{ access: string; refresh: string; username: string; email: string }> => {
  try {
    const token = tempToken || getAccessToken();
    if (!token) {
      throw new Error('No authentication token available');
    }

    const response = await fetch(`${API_URL}/accounts/api/set-username/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ username }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to set username');
    }

    return data; // contains: access, refresh, username, email
  } catch (error) {
    console.error("Set Username Error:", error);
    throw error;
  }
};

// --- JWT refresh + authenticated fetch helper ---

export const refreshAccessToken = async (): Promise<string | null> => {
  const refresh = getRefreshToken();
  if (!refresh) return null;

  try {
    const response = await fetch(`${API_URL}/accounts/api/token/refresh/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh }),
    });

    const data = await response.json();

    if (!response.ok || !data.access) {
      clearTokens();
      return null;
    }

    // Preserve remember-me behavior by inferring from where refresh was stored
    const remember = !!localStorage.getItem(REFRESH_TOKEN_KEY);
    storeTokens(data.access, data.refresh ?? refresh, remember);
    return data.access;
  } catch (error) {
    console.error('Failed to refresh access token:', error);
    clearTokens();
    return null;
  }
};

export const apiFetch = async (path: string, options: RequestInit = {}) => {
  const url = `${API_URL}${path}`;
  let access = getAccessToken();

  // Merge headers properly - start with options.headers, then add defaults
  const optionsHeaders = (options.headers as Record<string, string>) || {};
  const headers: Record<string, string> = {
    ...optionsHeaders,
    'Content-Type': optionsHeaders['Content-Type'] || 'application/json',
  };

  // Always add Authorization if token exists
  if (access) {
    headers['Authorization'] = `Bearer ${access}`;
  }

  // Create new options with merged headers
  const fetchOptions: RequestInit = {
    ...options,
    headers,
  };

  let response = await fetch(url, fetchOptions);

  // If unauthorized, try to refresh once
  if (response.status === 401) {
    const newAccess = await refreshAccessToken();
    if (newAccess) {
      // Update headers with new token
      const retryHeaders: Record<string, string> = {
        ...headers,
        'Authorization': `Bearer ${newAccess}`,
      };
      
      // Retry with new token
      const retryOptions: RequestInit = {
        ...options,
        headers: retryHeaders,
      };
      response = await fetch(url, retryOptions);
    }
  }

  return response;
};

// --- Profile APIs ---

export interface ProfileData {
  id: number;
  name?: string; // Profile.name (display name)
  first_name?: string; // Alias for Profile.name (for compatibility)
  email: string;
  username: string; // User.username
  avatar_url?: string;
  bio?: string;
  is_private?: boolean;
  join_date?: string;
  created_at?: string;
  updated_at?: string;
}

// Validate token by making a test API call
export const validateToken = async (): Promise<boolean> => {
  const token = getAccessToken();
  if (!token) {
    return false;
  }

  try {
    const response = await apiFetch('/accounts/api/profile/', {
      method: 'GET',
    });

    if (response.status === 401) {
      // Token is invalid, try to refresh
      const newToken = await refreshAccessToken();
      if (!newToken) {
        // Refresh failed, token is invalid
        clearTokens();
        return false;
      }
      // Token refreshed, validate again
      const retryResponse = await apiFetch('/accounts/api/profile/', {
        method: 'GET',
      });
      return retryResponse.ok;
    }

    return response.ok;
  } catch (error) {
    console.error('Token validation error:', error);
    clearTokens();
    return false;
  }
};

export const getProfile = async (): Promise<ProfileData> => {
  const response = await apiFetch('/accounts/api/profile/');
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || data.error || 'Failed to fetch profile');
  }

  return data;
};

export const updateProfile = async (first_name?: string, bio?: string, is_private?: boolean): Promise<ProfileData> => {
  const body: any = {};
  if (first_name !== undefined) body.first_name = first_name;
  if (bio !== undefined) body.bio = bio;
  if (is_private !== undefined) body.is_private = is_private;

  const response = await apiFetch('/accounts/api/profile/', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || data.error || 'Failed to update profile');
  }

  return data;
};

export const uploadAvatar = async (imageDataUrl: string): Promise<ProfileData> => {
  const response = await apiFetch('/accounts/api/profile/avatar/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ image: imageDataUrl }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to upload avatar');
  }

  return data;
};

export const forgotPassword = async (email: string): Promise<{ message: string; error?: string; oauth_provider?: string }> => {
  try {
    const response = await fetch(`${API_URL}/accounts/api/forgot-password/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();

    if (!response.ok) {
      const errorMessage = data.error || 'Failed to send reset code';
      throw new Error(errorMessage);
    }

    return data;
  } catch (error) {
    console.error('Forgot password error:', error);
    throw error;
  }
};

export const verifyResetOTP = async (email: string, code: string): Promise<{ message: string; reset_token: string; email: string }> => {
  try {
    const response = await fetch(`${API_URL}/accounts/api/verify-reset-otp/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, code }),
    });

    const data = await response.json();

    if (!response.ok) {
      const errorMessage = data.error || 'Failed to verify code';
      throw new Error(errorMessage);
    }

    return data;
  } catch (error) {
    console.error('Verify reset OTP error:', error);
    throw error;
  }
};

export const resetPassword = async (newPassword: string, confirmPassword: string, resetToken: string): Promise<{ access: string; refresh: string; user_id: number; email: string; username: string; message: string }> => {
  try {
    const response = await fetch(`${API_URL}/accounts/api/reset-password/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resetToken}`,
      },
      body: JSON.stringify({
        new_password: newPassword,
        confirm_password: confirmPassword,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      const errorMessage = data.error || 'Failed to reset password';
      throw new Error(errorMessage);
    }

    return data;
  } catch (error) {
    console.error('Reset password error:', error);
    throw error;
  }
};

export const removeAvatar = async (): Promise<ProfileData> => {
  const response = await apiFetch('/accounts/api/profile/avatar/', {
    method: 'DELETE',
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to remove avatar');
  }

  return data;
};

/**
 * Change user password
 */
export const changePassword = async (oldPassword: string, newPassword: string, confirmPassword: string): Promise<{ message: string; access?: string; refresh?: string; requires_otp?: boolean; email?: string }> => {
  const response = await apiFetch('/accounts/api/change-password/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      old_password: oldPassword,
      new_password: newPassword,
      confirm_password: confirmPassword,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to change password');
  }

  return data;
};

/**
 * Verify OTP for password change (for OAuth users)
 */
export const verifyPasswordOTP = async (code: string, newPassword: string, confirmPassword: string): Promise<{ message: string; access: string; refresh: string }> => {
  const response = await apiFetch('/accounts/api/verify-password-otp/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      code: code,
      new_password: newPassword,
      confirm_password: confirmPassword,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to verify OTP');
  }

  return data;
};

// --- Music APIs ---



/**
 * Get all songs from the database
 */
export const getSongs = async (): Promise<Song[]> => {
  const response = await apiFetch('/music/songs/');
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || data.detail || 'Failed to fetch songs');
  }

  return data;
};

/**
 * Get detailed information about a specific song (includes MFCC vector)
 */
export const getSong = async (songId: string): Promise<SongDetail> => {
  const response = await apiFetch(`/music/songs/${songId}/`);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || data.detail || 'Failed to fetch song');
  }

  return data;
};

/**
 * Get music recommendations based on a song
 * @param songId - UUID of the song to get recommendations for
 * @param topN - Number of recommendations to return (default: 5)
 * @param minSimilarity - Minimum similarity score (default: 0.0)
 */
export const getRecommendations = async (
  songId: string, 
  topN: number = 5, 
  minSimilarity: number = 0.0
): Promise<RecommendationsResponse> => {
  const response = await apiFetch(
    `/music/songs/${songId}/recommendations/?top_n=${topN}&min_similarity=${minSimilarity}`
  );
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || data.detail || 'Failed to fetch recommendations');
  }

  return data;
};

/**
 * Like a song
 */
export const likeSong = async (songId: string): Promise<LikedSong> => {
  const response = await apiFetch(`/music/songs/${songId}/like/`, {
    method: 'POST',
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || data.detail || 'Failed to like song');
  }

  return data;
};

/**
 * Unlike a song
 */
export const unlikeSong = async (songId: string): Promise<{ message: string }> => {
  const response = await apiFetch(`/music/songs/${songId}/unlike/`, {
    method: 'DELETE',
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || data.detail || 'Failed to unlike song');
  }

  return data;
};

/**
 * Get all songs liked by the current user
 */
export const getLikedSongs = async (): Promise<LikedSong[]> => {
  const response = await apiFetch('/music/liked-songs/');
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || data.detail || 'Failed to fetch liked songs');
  }

  return data;
};

/**
 * Follow an artist
 */
export const followArtist = async (artistId: string): Promise<Follower> => {
  const response = await apiFetch(`/music/artists/${artistId}/follow/`, {
    method: 'POST',
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || data.detail || 'Failed to follow artist');
  }

  return data;
};

/**
 * Unfollow an artist
 */
export const unfollowArtist = async (artistId: string): Promise<{ message: string }> => {
  const response = await apiFetch(`/music/artists/${artistId}/unfollow/`, {
    method: 'DELETE',
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || data.detail || 'Failed to unfollow artist');
  }

  return data;
};

/**
 * Get all artists followed by the current user
 */
export const getFollowedArtists = async (): Promise<Follower[]> => {
  const response = await apiFetch('/music/followed-artists/');
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || data.detail || 'Failed to fetch followed artists');
  }

  return data;
};

/**
 * Get the total number of followers for an artist
 */
export const getArtistFollowerCount = async (artistId: string): Promise<{ artist_id: string; artist_name: string; follower_count: number }> => {
  const response = await apiFetch(`/music/artists/${artistId}/followers/count/`);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || data.detail || 'Failed to fetch follower count');
  }

  return data;
};

/**
 * Search for tracks on Jamendo
 * @param query - Search query (track name)
 */
export const searchJamendo = async (query: string): Promise<JamendoSearchResponse> => {
  const response = await apiFetch(`/music/jamendo/search/?q=${encodeURIComponent(query)}`);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || data.detail || 'Failed to search Jamendo');
  }

  return data;
};

/**
 * Import a track from Jamendo into the database
 * @param jamendoId - Jamendo track ID
 */
export const importFromJamendo = async (jamendoId: string): Promise<Song> => {
  const response = await apiFetch('/music/jamendo/import/', {
    method: 'POST',
    body: JSON.stringify({ id: jamendoId }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || data.detail || 'Failed to import track from Jamendo');
  }

  // If song already exists, data.song will be present
  return data.song || data;
};

/**
 * Helper function to format duration from seconds to MM:SS
 */
export const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Get the audio streaming URL for a song
 */
export const getAudioStreamUrl = (songId: string): string => {
  return `${API_URL}/music/stream/${songId}/`;
};

/**
 * Helper function to transform song data for frontend display
 * With enhanced serializers, album and artist are already included
 */
export const transformSongForDisplay = (song: Song): {
  id: string;
  title: string;
  albumId: string | null;
  artistId: string | null;
  duration: number;
  durationFormatted: string;
  audioUrl: string;
  imageUrl: string | null;
  jamendoId?: string | null;
} => {
  return {
    id: song.id,
    title: song.title,
    albumId: song.album_id || (song.album ? song.album.id : null),
    artistId: song.artist_id || (song.artist ? song.artist.id : null),
    duration: song.duration,
    durationFormatted: formatDuration(song.duration),
    audioUrl: song.audio_file_url || '',
    imageUrl: song.image_url || (song.album ? song.album.cover_pic_url : null),
    jamendoId: song.jamendo_id || null,
  };
};

/**
 * Helper to check if a song is liked by the current user
 * This should be called after fetching liked songs
 */
export const isSongLiked = (songId: string, likedSongs: LikedSong[]): boolean => {
  return likedSongs.some(ls => ls.song_id === songId);
};

/**
 * Helper to check if an artist is followed by the current user
 * This should be called after fetching followed artists
 */
export const isArtistFollowed = (artistId: string, followedArtists: Follower[]): boolean => {
  return followedArtists.some(fa => fa.artist_id === artistId);
};

// --- Playlist Management API ---

/**
 * Get all playlists (user's playlists and public playlists)
 */
export const getPlaylists = async (): Promise<Playlist[]> => {
  const token = getAccessToken();
  if (!token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${API_URL}/music/playlists/`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || data.error || 'Failed to fetch playlists');
  }

  return data;
};

/**
 * Get a single playlist by ID
 */
export const getPlaylist = async (playlistId: string): Promise<Playlist> => {
  const token = getAccessToken();
  if (!token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${API_URL}/music/playlists/${playlistId}/`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || data.error || 'Failed to fetch playlist');
  }

  return data;
};

/**
 * Create a new playlist
 */
export const createPlaylist = async (title: string, isPublic: boolean = false): Promise<Playlist> => {
  const token = getAccessToken();
  if (!token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${API_URL}/music/playlists/`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title,
      is_public: isPublic,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || data.error || 'Failed to create playlist');
  }

  return data;
};

/**
 * Update a playlist
 */
export const updatePlaylist = async (playlistId: string, title?: string, isPublic?: boolean): Promise<Playlist> => {
  const token = getAccessToken();
  if (!token) {
    throw new Error('Not authenticated');
  }

  const body: any = {};
  if (title !== undefined) body.title = title;
  if (isPublic !== undefined) body.is_public = isPublic;

  const response = await fetch(`${API_URL}/music/playlists/${playlistId}/`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || data.error || 'Failed to update playlist');
  }

  return data;
};

/**
 * Delete a playlist
 */
export const deletePlaylist = async (playlistId: string): Promise<void> => {
  const token = getAccessToken();
  if (!token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${API_URL}/music/playlists/${playlistId}/`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.detail || data.error || 'Failed to delete playlist');
  }
};

/**
 * Get all songs in a playlist
 */
export const getPlaylistSongs = async (playlistId: string): Promise<PlaylistSong[]> => {
  const token = getAccessToken();
  if (!token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${API_URL}/music/playlists/${playlistId}/songs/`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || data.error || 'Failed to fetch playlist songs');
  }

  return data;
};

/**
 * Add a song to a playlist
 */
export const addSongToPlaylist = async (playlistId: string, songId: string): Promise<Playlist> => {
  const token = getAccessToken();
  if (!token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${API_URL}/music/playlists/${playlistId}/songs/${songId}/`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || data.error || 'Failed to add song to playlist');
  }

  return data;
};

/**
 * Remove a song from a playlist
 */
export const removeSongFromPlaylist = async (playlistId: string, songId: string): Promise<Playlist> => {
  const token = getAccessToken();
  if (!token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${API_URL}/music/playlists/${playlistId}/songs/${songId}/remove/`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || data.error || 'Failed to remove song from playlist');
  }

  return data;
};

/**
 * Reorder songs in a playlist
 */
export const reorderPlaylistSongs = async (playlistId: string, songIds: string[]): Promise<Playlist> => {
  const token = getAccessToken();
  if (!token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${API_URL}/music/playlists/${playlistId}/reorder/`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      song_ids: songIds,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || data.error || 'Failed to reorder playlist songs');
  }

  return data;
};