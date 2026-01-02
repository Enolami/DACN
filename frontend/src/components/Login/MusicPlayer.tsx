import { Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Volume2, ListMusic, Maximize2 } from 'lucide-react';
import { Slider } from './ui/slider';
import { Button } from './ui/button';
import { WaveformAnimation } from './WaveformAnimation';
import { motion } from 'framer-motion';
import React, { useState, useEffect } from 'react';

interface MusicPlayerProps {
  onExpandClick?: () => void;
  onNavigate?: (page: string, data?: any) => void;
  currentSong?: {
    title: string;
    artist: string;
    album?: string;
    duration?: string;
    imageUrl?: string;
  };
  isPlaying?: boolean;
  onPlayPause?: (playing: boolean) => void;
}

export function MusicPlayer({ onExpandClick, onNavigate, currentSong, isPlaying: externalIsPlaying = false, onPlayPause }: MusicPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(externalIsPlaying);
  
  // Sync with external state
  useEffect(() => {
    setIsPlaying(externalIsPlaying);
  }, [externalIsPlaying]);

  const handlePlayPause = () => {
    const newState = !isPlaying;
    setIsPlaying(newState);
    onPlayPause?.(newState);
  };
  const [progress, setProgress] = useState([45]);
  const [volume, setVolume] = useState([75]);

  // Default song if none provided
  const song = currentSong || {
    title: 'Neon Dreams',
    artist: 'Cyber Pulse',
    album: 'Digital Horizons',
    duration: '3:42',
    imageUrl: 'https://images.unsplash.com/photo-1692176548571-86138128e36c?w=100'
  };

  return (
    <div className="h-24 bg-[#0a0a0a] border-t border-[#1a1a1a] px-6 flex items-center justify-between gap-4">
      {/* Left - Album Artwork, Song Info & Waveform */}
      <div 
        className="flex items-center gap-3 w-80 cursor-pointer group"
        onClick={() => onNavigate?.('song', song)}
      >
        {/* Album Artwork Thumbnail */}
        <div className="w-14 h-14 rounded-md overflow-hidden bg-[#1a1a1a] flex-shrink-0 shadow-lg">
          <img
            src={song.imageUrl || 'https://images.unsplash.com/photo-1692176548571-86138128e36c?w=100'}
            alt={song.title}
            className="w-full h-full object-cover"
          />
        </div>
        
        {/* Song Info */}
        <div className="flex-1 min-w-0">
          <h4 className="text-white text-sm font-medium truncate group-hover:text-[#00ff88] transition-colors">
            {song.title}
          </h4>
          <p className="text-gray-400 text-xs truncate">{song.artist}</p>
        </div>
        
        {/* Waveform Animation */}
        <div className="flex-shrink-0">
          <WaveformAnimation />
        </div>
      </div>

      {/* Center - Playback Controls */}
      <div className="flex-1 max-w-2xl flex flex-col items-center">
        <div className="flex items-center justify-center gap-3 mb-2">
          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
            <Button
              size="icon"
              variant="ghost"
              className="w-9 h-9 text-gray-400 hover:text-white hover:bg-[#1a1a1a]"
            >
              <Shuffle className="w-4 h-4" />
            </Button>
          </motion.div>

          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
            <Button
              size="icon"
              variant="ghost"
              className="w-9 h-9 text-gray-400 hover:text-white hover:bg-[#1a1a1a]"
            >
              <SkipBack className="w-4 h-4" />
            </Button>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handlePlayPause}
          >
            <Button
              size="icon"
              className="w-12 h-12 bg-[#00ff88] hover:bg-[#00ff88]/80 text-black rounded-full"
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 fill-black" />
              ) : (
                <Play className="w-5 h-5 fill-black" />
              )}
            </Button>
          </motion.div>

          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
            <Button
              size="icon"
              variant="ghost"
              className="w-9 h-9 text-gray-400 hover:text-white hover:bg-[#1a1a1a]"
            >
              <SkipForward className="w-4 h-4" />
            </Button>
          </motion.div>

          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
            <Button
              size="icon"
              variant="ghost"
              className="w-9 h-9 text-gray-400 hover:text-white hover:bg-[#1a1a1a]"
            >
              <Repeat className="w-4 h-4" />
            </Button>
          </motion.div>
        </div>

        {/* Progress Bar */}
        <div className="flex items-center gap-3 w-full max-w-md">
          <span className="text-xs text-gray-400 w-10 text-right font-mono">2:15</span>
          <Slider
            value={progress}
            onValueChange={setProgress}
            max={100}
            step={1}
            className="flex-1"
          />
          <span className="text-xs text-gray-400 w-10 font-mono">{song.duration || '3:42'}</span>
        </div>
      </div>

      {/* Right - Volume & Queue */}
      <div className="flex items-center gap-3 w-80 justify-end">
        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
          <Button
            size="icon"
            variant="ghost"
            onClick={onExpandClick}
            className="w-9 h-9 text-gray-400 hover:text-white hover:bg-[#1a1a1a]"
          >
            <Maximize2 className="w-4 h-4" />
          </Button>
        </motion.div>

        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
          <Button
            size="icon"
            variant="ghost"
            className="w-9 h-9 text-gray-400 hover:text-white hover:bg-[#1a1a1a]"
          >
            <ListMusic className="w-4 h-4" />
          </Button>
        </motion.div>

        <div className="flex items-center gap-2 min-w-[120px]">
          <Volume2 className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <Slider
            value={volume}
            onValueChange={setVolume}
            max={100}
            step={1}
            className="w-20"
          />
        </div>
      </div>
    </div>
  );
}