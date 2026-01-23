import { ImageWithFallback } from './img/ImageWithFallback';
import { Play } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatDuration } from '../../services/api';
import type { Song } from '../../types/music';

interface SongCardProps {
  song: Song;
  onNavigate?: (page: string, data?: any) => void;
  onClick?: () => void;
}

export function SongCard({ song, onNavigate, onClick }: SongCardProps) {
  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (onNavigate) {
      onNavigate('song', { song });
    }
  };

  const imageUrl = song.image_url || song.album?.cover_pic_url || null;
  const artistName = song.artist_name || song.artist?.stage_name || 'Unknown Artist';
  const albumTitle = song.album_title || song.album?.title || 'Unknown Album';

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      onClick={handleClick}
      className="group bg-[#1a1a1a] p-4 rounded-xl cursor-pointer transition-all hover:bg-[#252525] relative"
    >
      <div className="relative mb-4">
        <ImageWithFallback
          src={imageUrl || undefined}
          alt={song.title}
          className="w-full aspect-square object-cover rounded-lg shadow-2xl"
        />
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          whileHover={{ scale: 1.1 }}
          className="absolute bottom-2 right-2 bg-[#00ff88] w-12 h-12 rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Play className="w-5 h-5 text-black fill-black ml-1" />
        </motion.button>
      </div>
      <h3 className="text-white mb-1 truncate">{song.title}</h3>
      <p className="text-gray-400 text-sm truncate">{artistName}</p>
      {albumTitle && albumTitle !== 'Unknown Album' && (
        <p className="text-gray-500 text-xs truncate mt-1">{albumTitle}</p>
      )}
      <p className="text-gray-500 text-xs mt-1">{formatDuration(song.duration)}</p>
    </motion.div>
  );
}
