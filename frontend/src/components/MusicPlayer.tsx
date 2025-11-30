import { Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Repeat1, Volume2, VolumeX, ListMusic, Maximize2 } from 'lucide-react';
import { Slider } from './ui/slider';
import { Button } from './ui/button';
import { WaveformAnimation } from './WaveformAnimation';
import { ImageWithFallback } from './img/ImageWithFallback';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

interface MusicPlayerProps {
  onExpandClick?: () => void;
  onNavigate?: (page: string, data?: any) => void;
  currentSong?: {
    title: string;
    artist: string;
    imageUrl?: string;
    duration?: number;
  };
}

export function MusicPlayer({ onExpandClick, onNavigate, currentSong }: MusicPlayerProps) {
  const handleSongClick = () => {
    if (onNavigate && song) {
      onNavigate('song', {
        title: song.title,
        artist: song.artist,
        imageUrl: song.imageUrl,
        duration: song.duration ? `${Math.floor(song.duration / 60)}:${(song.duration % 60).toString().padStart(2, '0')}` : undefined,
      });
    }
  };
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState([45]);
  const [volume, setVolume] = useState([75]);
  const [isShuffled, setIsShuffled] = useState(false);
  const [repeatMode, setRepeatMode] = useState<'off' | 'all' | 'one'>('off');
  const [currentTime, setCurrentTime] = useState(135); // seconds
  const [totalTime, setTotalTime] = useState(222); // seconds (3:42)

  // Default song data
  const song = currentSong || {
    title: 'Cosmic Waves',
    artist: 'Nova Pulse',
    imageUrl: 'https://images.unsplash.com/photo-1692176548571-86138128e36c?w=100',
    duration: 222,
  };

  // Format time helper
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Update total time when song changes
  useEffect(() => {
    if (song.duration) {
      setTotalTime(song.duration);
    }
  }, [song.duration]);

  // Simulate progress when playing
  useEffect(() => {
    if (!isPlaying) return;
    
    const interval = setInterval(() => {
      setCurrentTime((prev) => {
        const newTime = prev + 1;
        if (newTime >= totalTime) {
          setIsPlaying(false);
          return totalTime;
        }
        const newProgress = (newTime / totalTime) * 100;
        setProgress([newProgress]);
        return newTime;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlaying, totalTime]);

  // Handle progress change
  const handleProgressChange = (value: number[]) => {
    setProgress(value);
    const newTime = (value[0] / 100) * totalTime;
    setCurrentTime(newTime);
  };

  // Handle repeat mode toggle
  const handleRepeatClick = () => {
    setRepeatMode((prev) => {
      if (prev === 'off') return 'all';
      if (prev === 'all') return 'one';
      return 'off';
    });
  };

  return (
    <div className="h-24 bg-[#0a0a0a] border-t border-[#1a1a1a] px-6 flex items-center justify-between">
      {/* Left - Song Info & Waveform */}
      <div className="flex items-center gap-4 w-80 min-w-0">
        {/* Album Cover */}
        <div 
          onClick={handleSongClick}
          className="w-14 h-14 rounded-md overflow-hidden flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
        >
          <ImageWithFallback
            src={song.imageUrl}
            alt={song.title}
            className="w-full h-full object-cover"
          />
        </div>
        
        {/* Song Info */}
        <div className="flex-1 min-w-0">
          <h4 
            onClick={handleSongClick}
            className="text-white text-sm truncate hover:text-[#00ff88] transition-colors cursor-pointer"
          >
            {song.title}
          </h4>
          <p 
            onClick={handleSongClick}
            className="text-gray-400 text-xs truncate cursor-pointer hover:text-[#00ff88] transition-colors"
          >
            {song.artist}
          </p>
        </div>

        {/* Waveform - Only show when playing */}
        {isPlaying && (
          <div className="flex-shrink-0">
            <WaveformAnimation />
          </div>
        )}
      </div>

      {/* Center - Playback Controls */}
      <div className="flex-1 max-w-2xl">
        <div className="flex items-center justify-center gap-4 mb-2">
          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setIsShuffled(!isShuffled)}
              className={`w-9 h-9 ${isShuffled ? 'text-[#00ff88]' : 'text-gray-400'} hover:text-white hover:bg-[#1a1a1a]`}
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
            onClick={() => setIsPlaying(!isPlaying)}
          >
            <Button
              size="icon"
              className="w-12 h-12 bg-[#00ff88] hover:bg-[#00ff88]/80 text-black rounded-full"
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 fill-black" />
              ) : (
                <Play className="w-5 h-5 fill-black ml-0.5" />
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
              onClick={handleRepeatClick}
              className={`w-9 h-9 ${
                repeatMode === 'off' 
                  ? 'text-gray-400' 
                  : repeatMode === 'one' 
                    ? 'text-[#a855f7]' 
                    : 'text-[#00ff88]'
              } hover:text-white hover:bg-[#1a1a1a]`}
            >
              {repeatMode === 'one' ? (
                <Repeat1 className="w-4 h-4" />
              ) : (
                <Repeat className="w-4 h-4" />
              )}
            </Button>
          </motion.div>
        </div>

        {/* Progress Bar */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400 w-10 text-right">{formatTime(currentTime)}</span>
          <Slider
            value={progress}
            onValueChange={handleProgressChange}
            max={100}
            step={0.1}
            className="flex-1"
          />
          <span className="text-xs text-gray-400 w-10">{formatTime(totalTime)}</span>
        </div>
      </div>

      {/* Right - Volume & Queue */}
      <div className="flex items-center gap-4 w-80 justify-end">
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

        <div className="flex items-center gap-2">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setVolume(volume[0] > 0 ? [0] : [75])}
            className="w-8 h-8 text-gray-400 hover:text-white"
          >
            {volume[0] === 0 ? (
              <VolumeX className="w-4 h-4" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </Button>
          <Slider
            value={volume}
            onValueChange={setVolume}
            max={100}
            step={1}
            className="w-24"
          />
        </div>
      </div>
    </div>
  );
}