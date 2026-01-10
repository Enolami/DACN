/**
 * TypeScript interfaces for music-related data structures
 * These match the backend API response formats
 */

export interface Song {
  id: string;
  title: string;
  album: Album | null; // Full album object (nested)
  album_id: string | null; // Album UUID (for convenience)
  album_title: string | null; // Album title (for convenience)
  artist: Artist | null; // Full artist object (nested)
  artist_id: string | null; // Artist UUID (for convenience)
  artist_name: string | null; // Artist name (for convenience)
  duration: number; // Duration in seconds
  audio_file: string | null; // Local file path
  audio_file_url: string; // URL to stream audio
  jamendo_id?: string | null;
  image_url: string | null; // Album cover URL (from album.cover_pic_url)
  mfcc_vector?: number[] | null; // Only in detail view
  created_at: string;
  updated_at: string;
}

export interface SongDetail extends Song {
  mfcc_vector: number[] | null; // Always present in detail view
}

export interface Album {
  id: string;
  title: string;
  artist: Artist; // Full artist object (nested)
  artist_id: string; // Artist UUID (for convenience)
  artist_name: string; // Artist name (for convenience)
  release_date: string | null;
  cover_pic_url: string;
  cover_pic_id: string;
  created_at: string;
  updated_at: string;
}

export interface Artist {
  id: string;
  user: string; // User UUID
  stage_name: string;
  verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface Recommendation extends Song {
  song_id: string; // Duplicate of id for compatibility
  similarity_score: number; // 0.0 to 1.0
}

export interface RecommendationsResponse {
  song_id: string;
  song_title: string;
  recommendations: Recommendation[];
  count: number;
}

export interface LikedSong {
  id: string;
  user: string; // User UUID
  user_username: string;
  song: string; // Song UUID
  song_id: string;
  song_title: string;
  liked_at: string;
}

export interface Follower {
  id: string;
  user: string; // User UUID (the fan)
  user_username: string;
  artist: string; // Artist UUID (the idol)
  artist_id: string;
  artist_name: string;
  followed_at: string;
}

export interface JamendoTrack {
  id: string;
  name: string;
  duration: number;
  artist_name: string;
  album_name: string;
  audio: string; // Audio URL
  image: string; // Cover art URL
  [key: string]: any; // Other Jamendo fields
}

export interface JamendoSearchResponse {
  headers: {
    status: string;
    code: number;
    error_message: string;
    warnings: string;
    results_count: number;
  };
  results: JamendoTrack[];
}

// Frontend-friendly formats (transformed from backend data)
// Note: With enhanced serializers, Song interface already includes all needed data
// This interface is kept for backward compatibility or additional transformations
export interface SongCard {
  id: string;
  title: string;
  artist: string; // Artist name (from artist_name or artist.stage_name)
  artistId: string | null;
  album: string; // Album name (from album_title or album.title)
  albumId: string | null;
  duration: number;
  durationFormatted: string; // "MM:SS" format
  audioUrl: string;
  imageUrl: string | null; // Album cover URL (from image_url)
  jamendoId?: string | null;
  liked?: boolean; // Whether current user has liked this song
}

export interface ArtistCard {
  id: string;
  name: string;
  stageName: string;
  verified: boolean;
  songCount: number;
  albumCount: number;
  imageUrl: string | null; // Can use default avatar
  followed?: boolean; // Whether current user follows this artist
}

export interface AlbumCard {
  id: string;
  title: string;
  artist: string; // Artist name
  artistId: string;
  coverUrl: string | null;
  releaseDate: string | null;
  songCount: number;
  totalDuration: number; // Total duration in seconds
}
