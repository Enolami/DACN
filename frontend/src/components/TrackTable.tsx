import { Heart, Play, MoreHorizontal, Clock } from 'lucide-react';
import { Button } from './ui/button';
import { motion } from 'framer-motion';

interface Track {
  number: number;
  title: string;
  artist: string;
  album: string;
  duration: string;
  liked?: boolean;
}

interface TrackTableProps {
  tracks: Track[];
  onNavigate?: (page: string, data?: any) => void;
}

export function TrackTable({ tracks, onNavigate }: TrackTableProps) {
  const handleTrackClick = (track: Track) => {
    if (onNavigate) {
      onNavigate('song', {
        title: track.title,
        artist: track.artist,
        album: track.album,
        duration: track.duration,
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
              <span className="text-gray-400 truncate">{track.artist}</span>
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
                onClick={(e) => e.stopPropagation()}
                className={`w-8 h-8 ${
                  track.liked ? 'text-[#00ff88]' : 'text-gray-400 hover:text-white'
                }`}
              >
                <Heart className={`w-4 h-4 ${track.liked ? 'fill-[#00ff88]' : ''}`} />
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
