import { Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Volume2, ListMusic, Maximize2 } from 'lucide-react';
import { Slider } from './ui/slider';
import { Button } from './ui/button';
import { WaveformAnimation } from './WaveformAnimation';
import { ImageWithFallback } from './img/ImageWithFallback';
import { motion } from 'framer-motion';
import React, { useState, useEffect, useRef } from 'react';
import { getAudioStreamUrl, formatDuration, getAccessToken } from '../../services/api';
import type { Song } from '../../types/music';

interface MusicPlayerProps {
  onExpandClick?: () => void;
  onNavigate?: (page: string, data?: any) => void;
  currentSong?: Song | {
    id?: string;
    title?: string;
    artist?: string;
    album?: string;
    duration?: string | number;
    imageUrl?: string;
    audio_file_url?: string;
  };
  isPlaying?: boolean;
  onPlayPause?: (playing: boolean) => void;
  onSongEnd?: () => void;
}

export function MusicPlayer({ onExpandClick, onNavigate, currentSong, isPlaying: externalIsPlaying = false, onPlayPause, onSongEnd }: MusicPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const isPlayingRef = useRef(externalIsPlaying); // Ref to track current playing state
  const isSeekingRef = useRef(false); // Ref to track if user is seeking
  const currentSongIdRef = useRef<string | null>(null); // Ref to track current song ID
  const [isPlaying, setIsPlaying] = useState(externalIsPlaying);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState([75]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Sync with external state - handle play/pause without reloading
  useEffect(() => {
    isPlayingRef.current = externalIsPlaying; // Update ref
    setIsPlaying(externalIsPlaying);
    const audio = audioRef.current;
    if (!audio) return;
    
    // Only play/pause if audio is ready and not loading
    // Don't reload the audio, just control playback
    if (audio.readyState >= 2) { // HAVE_CURRENT_DATA or higher
      if (externalIsPlaying) {
        if (audio.paused) {
          audio.play().catch((err) => {
            console.error('Error playing audio:', err);
          });
        }
      } else {
        if (!audio.paused) {
          audio.pause();
        }
      }
    }
  }, [externalIsPlaying]);

  // Handle song change - only reload when song actually changes
  useEffect(() => {
    if (!currentSong) return;

    const audio = audioRef.current;
    if (!audio) return;

    // Get song ID to check if it's actually a new song
    const songId = ('id' in currentSong && currentSong.id) ? currentSong.id : null;
    
    // If it's the same song, don't do anything - don't reload
    if (songId && currentSongIdRef.current === songId) {
      return; // Same song, skip reload
    }

    // Get audio URL - prefer streaming endpoint for better control
    let audioUrl = '';
    if (songId) {
      // Use streaming endpoint for better control
      audioUrl = getAudioStreamUrl(songId);
      // Add authentication token as query parameter if available
      // (HTML5 audio can't set custom headers, so we use query param)
      const token = getAccessToken();
      if (token) {
        audioUrl += `?token=${encodeURIComponent(token)}`;
      }
    } else if ('audio_file_url' in currentSong && currentSong.audio_file_url) {
      // Fallback to direct URL if no ID
      audioUrl = currentSong.audio_file_url.startsWith('http') 
        ? currentSong.audio_file_url 
        : `http://localhost:8000${currentSong.audio_file_url}`;
    }

    if (!audioUrl) {
      console.warn('No audio URL available for song');
      return;
    }

    // It's a new song - load it
    currentSongIdRef.current = songId;
    setIsLoading(true);
    audio.src = audioUrl;
    audio.load();

    // Set duration when metadata loads
    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      setIsLoading(false);
      // Auto-play if external state says we should be playing
      // Use ref to get current value (not closure)
      if (isPlayingRef.current) {
        audio.play().catch((err) => {
          console.error('Error playing audio on metadata load:', err);
        });
      }
    };

    // Also try to play when canplay event fires (audio is ready to play)
    const handleCanPlay = () => {
      // Use ref to get current value (not closure)
      if (isPlayingRef.current && audio.paused) {
        audio.play().catch((err) => {
          console.error('Error playing audio on canplay:', err);
        });
      }
    };

    // Update current time
    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    // Handle song end
    const handleEnded = () => {
      setIsPlaying(false);
      onPlayPause?.(false);
      setCurrentTime(0);
      // Call onSongEnd callback if provided (for auto-playing next song)
      if (onSongEnd) {
        onSongEnd();
      }
    };

    // Handle errors
    const handleError = (e: ErrorEvent) => {
      console.error('Audio error:', e);
      setIsLoading(false);
      setIsPlaying(false);
      onPlayPause?.(false);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, [currentSong]); // Only re-run when song changes, not when playing state changes

  // Handle volume change
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume[0] / 100;
    }
  }, [volume]);

  const handlePlayPause = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    try {
      if (isPlaying) {
        audio.pause();
        setIsPlaying(false);
        onPlayPause?.(false);
      } else {
        await audio.play();
        setIsPlaying(true);
        onPlayPause?.(true);
      }
    } catch (error) {
      console.error('Error playing audio:', error);
    }
  };

  const handleSeek = (value: number[]) => {
    const audio = audioRef.current;
    if (!audio || !duration) {
      console.warn('Cannot seek: audio or duration not available');
      return;
    }
    
    // Check if audio is ready to seek
    if (audio.readyState === 0) {
      console.warn('Cannot seek: audio not loaded yet');
      return;
    }
    
    const newTime = (value[0] / 100) * duration;
    console.log('Seeking to:', newTime, 'seconds');
    
    // Set seeking flag to prevent timeupdate from interfering
    isSeekingRef.current = true;
    
    // Update audio position - this seeks to the new time
    // Don't reload, just change currentTime
    try {
      // Store current playing state
      const wasPlaying = !audio.paused;
      
      // Seek to new position - this should NOT reload the audio
      audio.currentTime = newTime;
      setCurrentTime(newTime);
      
      // If it was playing before, make sure it continues playing
      // (some browsers pause when seeking)
      if (wasPlaying && audio.paused && isPlayingRef.current) {
        // Small delay to ensure seek completes before resuming
        setTimeout(() => {
          audio.play().catch((err) => {
            console.error('Error resuming after seek:', err);
          });
        }, 50);
      }
    } catch (error) {
      console.error('Error seeking audio:', error);
      isSeekingRef.current = false;
    }
    
    // Clear seeking flag after a delay to allow timeupdate to resume
    setTimeout(() => {
      isSeekingRef.current = false;
    }, 500);
  };

  // Handle visual update while dragging (don't seek yet)
  const handleSeekChange = (value: number[]) => {
    if (!duration) return;
    const newTime = (value[0] / 100) * duration;
    // Only update visual position while dragging, don't seek yet
    // Set seeking flag to prevent timeupdate from overwriting
    isSeekingRef.current = true;
    setCurrentTime(newTime);
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Extract song data
  const getSongData = () => {
    if (!currentSong) {
      return {
        id: '',
        title: 'No song selected',
        artist: 'Select a song to play',
        album: '',
        duration: 0,
        imageUrl: null,
      };
    }

    // If it's a full Song object
    if ('id' in currentSong && 'title' in currentSong && 'duration' in currentSong) {
      const song = currentSong as Song;
      return {
        id: song.id,
        title: song.title,
        artist: song.artist_name || song.artist?.stage_name || 'Unknown Artist',
        album: song.album_title || song.album?.title || '',
        duration: typeof song.duration === 'number' ? song.duration : 0,
        imageUrl: song.image_url || song.album?.cover_pic_url || null,
      };
    }

    // If it's a partial song object
    return {
      id: currentSong.id || '',
      title: currentSong.title || 'Unknown Song',
      artist: currentSong.artist || 'Unknown Artist',
      album: currentSong.album || '',
      duration: typeof currentSong.duration === 'number' 
        ? currentSong.duration 
        : (typeof currentSong.duration === 'string' 
          ? parseDuration(currentSong.duration) 
          : 0),
      imageUrl: currentSong.imageUrl || null,
    };
  };

  const parseDuration = (durationStr: string): number => {
    const parts = durationStr.split(':').map(Number);
    if (parts.length === 2) {
      return parts[0] * 60 + parts[1];
    } else if (parts.length === 3) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    }
    return 0;
  };

  const song = getSongData();
  const displayDuration = duration > 0 ? formatDuration(Math.floor(duration)) : (song.duration > 0 ? formatDuration(song.duration) : '0:00');
  const displayCurrentTime = formatDuration(Math.floor(currentTime));

  return (
    <>
      {/* Hidden audio element */}
      <audio ref={audioRef} preload="metadata" />
      
      <div className="h-24 bg-[#0a0a0a] border-t border-[#1a1a1a] px-6 flex items-center justify-between gap-4">
        {/* Left - Album Artwork, Song Info & Waveform */}
        <div 
          className="flex items-center gap-3 w-80 cursor-pointer group"
          onClick={() => onNavigate?.('song', { song: currentSong })}
        >
          {/* Album Artwork Thumbnail */}
          <div className="w-14 h-14 rounded-md overflow-hidden bg-[#1a1a1a] flex-shrink-0 shadow-lg">
            <ImageWithFallback
              src={song.imageUrl || undefined}
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
          <span className="text-xs text-gray-400 w-12 text-right font-mono">{displayCurrentTime}</span>
          <Slider
            value={[progress]}
            onValueChange={handleSeekChange}
            onValueCommit={handleSeek}
            max={100}
            step={0.1}
            className="flex-1"
            disabled={isLoading || duration === 0}
          />
          <span className="text-xs text-gray-400 w-12 font-mono">{displayDuration}</span>
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
    </>
  );
}