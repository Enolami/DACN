import { ImageWithFallback } from './img/ImageWithFallback';
import { Heart, Download, Share2, Plus, Play, ChevronDown, Music2, Loader2, Sparkles } from 'lucide-react';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';
import { motion } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from './ui/collapsible';
import { getSong, getRecommendations, likeSong, unlikeSong, getLikedSongs, formatDuration } from '../../services/api';
import { SongCard } from './SongCard';
import type { Song, Recommendation } from '../../types/music';

interface SongDetailProps {
  song?: Song | {
    id?: string;
    title?: string;
    artist?: string;
    album?: string;
    imageUrl?: string;
    duration?: string;
    song?: Song; // Full song object if passed
  } | null;
  initialSong?: Song | {
    id?: string;
    title?: string;
    artist?: string;
    album?: string;
    imageUrl?: string;
    duration?: string;
    song?: Song; // Full song object if passed
  } | null;
  onNavigate?: (page: string, data?: any) => void;
  onPlaySong?: (song: Song) => void; // Callback to play song directly
}

export function SongDetail({ song: propSong, initialSong, onNavigate, onPlaySong }: SongDetailProps) {
  // Use propSong if provided, otherwise use initialSong
  const initialSongData = propSong || initialSong;
  // Handle different input formats
  const getInitialSong = (): Song | null => {
    if (!initialSongData) return null;
    // If it's already a full Song object
    if ('id' in initialSongData && 'title' in initialSongData && 'duration' in initialSongData) {
      return initialSongData as Song;
    }
    // If it's wrapped in a song property
    if ('song' in initialSongData && initialSongData.song) {
      return initialSongData.song;
    }
    return null;
  };

  const [song, setSong] = useState<Song | null>(getInitialSong());
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isLiked, setIsLiked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentLyricIndex, setCurrentLyricIndex] = useState(0);
  const [isCreditsOpen, setIsCreditsOpen] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Fetch song details on mount
  useEffect(() => {
    const fetchSongData = async () => {
      try {
        setLoading(true);
        setError(null);

        // If we already have a full song object, use it
        const existingSong = getInitialSong();
        if (existingSong) {
          setSong(existingSong);
          setLoading(false);
          return;
        }

        // If we have a song ID, fetch it
        if (initialSongData && typeof initialSongData === 'object' && 'id' in initialSongData && initialSongData.id) {
          const fetchedSong = await getSong(initialSongData.id);
          setSong(fetchedSong);
        }
        // Otherwise, error
        else {
          setError('Song ID is required');
          setLoading(false);
          return;
        }
      } catch (err) {
        console.error('Error fetching song:', err);
        setError(err instanceof Error ? err.message : 'Failed to load song');
      } finally {
        setLoading(false);
      }
    };

    fetchSongData();
  }, [initialSong]);

  // Check if song is liked and fetch recommendations when song loads
  useEffect(() => {
    if (!song) return;

    const checkLikedAndFetchRecommendations = async () => {
      try {
        // Check if song is liked
        const likedSongs = await getLikedSongs();
        const liked = likedSongs.some(ls => ls.song_id === song.id);
        setIsLiked(liked);

        // Fetch recommendations
        setLoadingRecommendations(true);
        const recs = await getRecommendations(song.id);
        setRecommendations(recs.recommendations || []);
      } catch (err) {
        console.error('Error checking liked status or fetching recommendations:', err);
      } finally {
        setLoadingRecommendations(false);
      }
    };

    checkLikedAndFetchRecommendations();
  }, [song]);

  // Handle like/unlike
  const handleLikeToggle = async () => {
    if (!song) return;

    try {
      if (isLiked) {
        await unlikeSong(song.id);
        setIsLiked(false);
      } else {
        await likeSong(song.id);
        setIsLiked(true);
      }
    } catch (err) {
      console.error('Error toggling like:', err);
      // Revert on error
      setIsLiked(!isLiked);
    }
  };

  // Mock lyrics data (would come from API in future)
  const lyrics = [
    { time: 0, text: "Lost in the neon glow" },
    { time: 3, text: "Dancing through the night" },
    { time: 6, text: "Feeling the rhythm flow" },
    { time: 9, text: "Everything feels so right" },
    { time: 12, text: "Synthwave dreams collide" },
    { time: 15, text: "With electric hearts tonight" },
    { time: 18, text: "We're alive, we're free" },
    { time: 21, text: "Lost in this melody" },
  ];

  // Simulate lyric progression
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentLyricIndex((prev) => (prev + 1) % lyrics.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Visualizer animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    let animationId: number;
    let time = 0;

    const animate = () => {
      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const bars = 64;
      const barWidth = canvas.width / bars;

      for (let i = 0; i < bars; i++) {
        const height = Math.sin(time + i * 0.5) * 100 + Math.random() * 50;
        const x = i * barWidth;
        const y = canvas.height / 2 - height / 2;

        const gradient = ctx.createLinearGradient(x, y, x, y + height);
        gradient.addColorStop(0, '#00ff88');
        gradient.addColorStop(0.5, '#a855f7');
        gradient.addColorStop(1, '#00ff88');

        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, barWidth - 2, height);
      }

      time += 0.05;
      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => cancelAnimationFrame(animationId);
  }, []);

  if (loading) {
    return (
      <ScrollArea className="flex-1 h-full">
        <div className="flex items-center justify-center h-full">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 text-[#00ff88] animate-spin" />
            <p className="text-gray-400">Loading song...</p>
          </div>
        </div>
      </ScrollArea>
    );
  }

  if (error || !song) {
    return (
      <ScrollArea className="flex-1 h-full">
        <div className="flex items-center justify-center h-full">
          <div className="flex flex-col items-center gap-4">
            <p className="text-red-400">Error: {error || 'Song not found'}</p>
            <Button onClick={() => onNavigate?.('home')} variant="outline">
              Go Home
            </Button>
          </div>
        </div>
      </ScrollArea>
    );
  }

  const imageUrl = song.image_url || song.album?.cover_pic_url || null;
  const artistName = song.artist_name || song.artist?.stage_name || 'Unknown Artist';
  const albumTitle = song.album_title || song.album?.title || null;
  const artistId = song.artist_id || song.artist?.id;

  const credits = [
    { role: 'Lead Artist', name: artistName, avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${artistName}` },
    { role: 'Album', name: albumTitle || 'Single', avatar: imageUrl || 'https://api.dicebear.com/7.x/avataaars/svg?seed=album' },
  ];

  return (
    <ScrollArea className="flex-1 h-full">
      <div className="max-w-4xl mx-auto p-8">
        {/* Header with Artwork */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="relative w-80 h-80 mx-auto mb-6 rounded-2xl overflow-hidden shadow-2xl"
            style={{
              boxShadow: '0 20px 60px rgba(0, 255, 136, 0.3)',
            }}
          >
            {/* Background blur */}
            <div className="absolute inset-0 blur-3xl opacity-50">
              <ImageWithFallback
                src={imageUrl || undefined}
                alt={song.title}
                className="w-full h-full object-cover"
              />
            </div>
            {/* Main artwork */}
            <div className="relative z-10 w-full h-full">
              <ImageWithFallback
                src={imageUrl || undefined}
                alt={song.title}
                className="w-full h-full object-cover"
              />
            </div>
          </motion.div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <h1 className="text-white text-4xl mb-3">{song.title}</h1>
            <button
              onClick={() => onNavigate?.('artist', { 
                id: artistId,
                stage_name: artistName 
              })}
              className="text-gray-400 hover:text-[#00ff88] transition-colors text-xl mb-2"
            >
              {artistName}
            </button>
            {albumTitle && (
              <button
                onClick={() => onNavigate?.('album', { 
                  id: song.album_id || song.album?.id,
                  title: albumTitle 
                })}
                className="text-gray-500 hover:text-[#00ff88] transition-colors text-lg block mx-auto"
              >
                {albumTitle}
              </button>
            )}
            <p className="text-gray-500 text-sm mt-2">{formatDuration(song.duration)}</p>
          </motion.div>

          {/* Primary Actions */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <Button
              size="icon"
              variant="ghost"
              onClick={handleLikeToggle}
              className={`w-10 h-10 rounded-full ${isLiked ? 'text-[#ec4899]' : 'text-gray-400'} hover:text-[#ec4899] hover:bg-[#1a1a1a]`}
            >
              <Heart className={`w-5 h-5 ${isLiked ? 'fill-[#ec4899]' : ''}`} />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="w-10 h-10 rounded-full text-gray-400 hover:text-white hover:bg-[#1a1a1a]"
            >
              <Download className="w-4 h-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="w-10 h-10 rounded-full text-gray-400 hover:text-white hover:bg-[#1a1a1a]"
            >
              <Share2 className="w-4 h-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="w-10 h-10 rounded-full text-gray-400 hover:text-white hover:bg-[#1a1a1a]"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          {/* Play Button */}
          <Button 
            className="bg-gradient-to-r from-[#00ff88] to-[#00cc6e] hover:from-[#00ff88]/80 hover:to-[#00cc6e]/80 text-black px-10 py-5 rounded-full gap-2 mb-8 font-semibold text-base"
            onClick={() => {
              // Play song directly - use onPlaySong if available, otherwise navigate
              if (song) {
                if (onPlaySong) {
                  console.log('Playing song via onPlaySong:', song);
                  onPlaySong(song);
                } else if (onNavigate) {
                  console.log('Navigating to song:', song);
                  onNavigate('song', { song });
                }
              } else {
                console.warn('No song available to play');
              }
            }}
          >
            <Play className="w-5 h-5 fill-black" />
            Play Now
          </Button>
        </div>

        {/* Recommendations Section */}
        {recommendations.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-6">
              <Sparkles className="w-6 h-6 text-[#a855f7]" />
              <h2 className="text-white text-2xl">Similar Songs</h2>
              <Badge className="bg-gradient-to-r from-[#00ff88] to-[#a855f7] text-black border-none text-xs">
                AI Recommended
              </Badge>
            </div>
            {loadingRecommendations ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 text-[#00ff88] animate-spin" />
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-6">
                {recommendations.map((rec) => (
                  <div key={rec.id} className="relative">
                    <SongCard 
                      song={rec} 
                      onNavigate={onNavigate} 
                    />
                    {/* Show similarity score as overlay badge */}
                    {rec.similarity_score !== undefined && (
                      <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm px-2 py-1 rounded text-xs text-[#00ff88]">
                        {(rec.similarity_score * 100).toFixed(0)}% match
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Lyrics & Visualizer Tabs */}
        <Tabs defaultValue="lyrics" className="w-full mb-8">
          <TabsList className="w-full bg-[#1a1a1a] rounded-xl p-1 mb-6">
            <TabsTrigger
              value="lyrics"
              className="flex-1 data-[state=active]:bg-[#00ff88] data-[state=active]:text-black rounded-lg"
            >
              <Music2 className="w-4 h-4 mr-2" />
              Lyrics
            </TabsTrigger>
            <TabsTrigger
              value="visualizer"
              className="flex-1 data-[state=active]:bg-[#a855f7] data-[state=active]:text-white rounded-lg"
            >
              Visualizer
            </TabsTrigger>
          </TabsList>

          <TabsContent value="lyrics" className="mt-0">
            <div className="bg-[#1a1a1a] rounded-xl p-8 min-h-[400px]">
              <div className="space-y-4">
                {lyrics.map((lyric, index) => (
                  <motion.p
                    key={index}
                    className={`text-center text-2xl transition-all duration-500 ${
                      index === currentLyricIndex
                        ? 'text-[#00ff88] scale-110'
                        : 'text-gray-500 scale-100'
                    }`}
                    animate={{
                      opacity: index === currentLyricIndex ? 1 : 0.3,
                    }}
                  >
                    {lyric.text}
                  </motion.p>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="visualizer" className="mt-0">
            <div className="bg-[#0a0a0a] rounded-xl overflow-hidden">
              <canvas
                ref={canvasRef}
                className="w-full h-[400px] cursor-pointer"
                onClick={() => {/* Could trigger fullscreen */}}
              />
            </div>
          </TabsContent>
        </Tabs>

        {/* Credits Section */}
        <Collapsible open={isCreditsOpen} onOpenChange={setIsCreditsOpen}>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className="w-full bg-[#1a1a1a] hover:bg-[#252525] rounded-xl p-6 flex items-center justify-between"
            >
              <span className="text-white text-xl">Credits</span>
              <motion.div
                animate={{ rotate: isCreditsOpen ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown className="w-5 h-5 text-gray-400" />
              </motion.div>
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-4">
            <div className="bg-[#1a1a1a] rounded-xl p-6 space-y-4">
              {credits.map((credit, index) => (
                <motion.div
                  key={index}
                  whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
                  className="flex items-center gap-4 p-3 rounded-lg cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-[#252525]">
                    <ImageWithFallback
                      src={credit.avatar}
                      alt={credit.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-400 text-sm">{credit.role}</p>
                    <p className="text-white">{credit.name}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </ScrollArea>
  );
}
