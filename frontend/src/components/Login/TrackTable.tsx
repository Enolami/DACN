import { Heart, Play, MoreHorizontal, Clock } from 'lucide-react';
import { Button } from './ui/button';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { likeSong, unlikeSong, getLikedSongs } from '../../services/api';

interface Track {
  number: number;
  title: string;
  artist: string;
  album: string;
  duration: string;
  liked?: boolean;
  songId?: string; // Song ID for like functionality
  song?: any; // Full song object for navigation
}

interface TrackTableProps {
  tracks: Track[];
  onNavigate?: (page: string, data?: any) => void;
  onRemoveFromPlaylist?: (songId: string) => void;
  showRemoveButton?: boolean;
}

export function TrackTable({ tracks, onNavigate, onRemoveFromPlaylist, showRemoveButton = false }: TrackTableProps) {
  const [likedSongs, setLikedSongs] = useState<Set<string>>(new Set());

  // Fetch liked songs on mount
  useEffect(() => {
    const fetchLikedSongs = async () => {
      try {
        const liked = await getLikedSongs();
        setLikedSongs(new Set(liked.map(ls => ls.song_id)));
      } catch (err) {
        console.error('Error fetching liked songs:', err);
      }
    };
    fetchLikedSongs();
  }, []);

  const handleTrackClick = (track: Track) => {
    if (onNavigate) {
      // If we have the full song object, use it; otherwise fall back to partial data
      if (track.song) {
        onNavigate('song', { song: track.song });
      } else {
        onNavigate('song', {
          title: track.title,
          artist: track.artist,
          album: track.album,
          duration: track.duration,
          id: track.songId,
        });
      }
    }
  };

  const handleLikeToggle = async (e: React.MouseEvent, track: Track) => {
    e.stopPropagation();
    if (!track.songId) return;

    const isLiked = likedSongs.has(track.songId);
    try {
      if (isLiked) {
        await unlikeSong(track.songId);
        setLikedSongs(prev => {
          const newSet = new Set(prev);
          newSet.delete(track.songId!);
          return newSet;
        });
      } else {
        await likeSong(track.songId);
        setLikedSongs(prev => new Set(prev).add(track.songId!));
      }
    } catch (err) {
      console.error('Error toggling like:', err);
    }
  };

  const handleArtistClick = (e: React.MouseEvent, artistName: string) => {
    e.stopPropagation();
    if (onNavigate) {
      onNavigate('artist', {
        name: artistName,
        genre: 'Electronic',
      });
    }
  };
  return (
    <div className="w-full">
      {/* Table Header */}
      <div className="grid grid-cols-[40px_1fr_1fr_1fr_80px_60px] gap-4 px-4 py-2 border-b border-[#1a1a1a] text-gray-400 text-sm">
        <div className="text-center">#</div>
        <div>Title</div>
        <div>Artist</div>
        <div>Album</div>
        <div className="flex items-center justify-center gap-1">
          <Clock className="w-4 h-4" />
        </div>
        <div></div>
      </div>

      {/* Track Rows */}
      <div className="mt-2">
        {tracks.map((track, index) => (
          <motion.div
            key={index}
            whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
            onClick={() => handleTrackClick(track)}
            className="grid grid-cols-[40px_1fr_1fr_1fr_80px_60px] gap-4 px-4 py-3 rounded-lg cursor-pointer group"
          >
            {/* Track Number / Play Button */}
            <div className="flex items-center justify-center">
              <span className="text-gray-400 group-hover:hidden">{track.number}</span>
              <Play className="w-4 h-4 text-white fill-white hidden group-hover:block" />
            </div>

            {/* Title */}
            <div className="flex items-center min-w-0">
              <span className="text-white truncate group-hover:text-[#00ff88] transition-colors">
                {track.title}
              </span>
            </div>

            {/* Artist */}
            <div className="flex items-center min-w-0">
              <span 
                onClick={(e) => handleArtistClick(e, track.artist)}
                className="text-gray-400 truncate cursor-pointer hover:text-[#00ff88] transition-colors"
              >
                {track.artist}
              </span>
            </div>

            {/* Album */}
            <div className="flex items-center min-w-0">
              <span className="text-gray-400 truncate">{track.album}</span>
            </div>

            {/* Duration */}
            <div className="flex items-center justify-center">
              <span className="text-gray-400">{track.duration}</span>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                size="icon"
                variant="ghost"
                onClick={(e) => handleLikeToggle(e, track)}
                className={`w-8 h-8 ${
                  (track.liked || (track.songId && likedSongs.has(track.songId))) 
                    ? 'text-[#ec4899]' 
                    : 'text-gray-400 hover:text-[#ec4899]'
                }`}
              >
                <Heart className={`w-4 h-4 ${
                  (track.liked || (track.songId && likedSongs.has(track.songId))) 
                    ? 'fill-[#ec4899]' 
                    : ''
                }`} />
              </Button>
              <Button 
                size="icon" 
                variant="ghost" 
                onClick={(e) => e.stopPropagation()}
                className="w-8 h-8 text-gray-400 hover:text-white"
              >
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}