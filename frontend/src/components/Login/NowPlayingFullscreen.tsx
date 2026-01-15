import { 
    ChevronDown, Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, 
    Heart, Download, ListPlus, Cast, X, Sparkles, UserPlus, Music2, 
    Calendar, Users 
  } from 'lucide-react';
  import { Button } from './ui/button';
  import { Slider } from './ui/slider';
  import { ImageWithFallback } from './img/ImageWithFallback';
  import { VinylDisc } from './VinylDisc';
  import { Badge } from './ui/badge';
  import { motion, AnimatePresence } from 'framer-motion';
  import { useState, useEffect, useRef } from 'react';
  import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
  import { ScrollArea } from './ui/scroll-area';
  import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
  import { Separator } from './ui/separator';
  
  interface NowPlayingFullscreenProps {
    onClose: () => void;
    onArtistClick?: (artistId: string) => void;
    onNavigate?: (page: string, data?: any) => void;
    currentSong?: {
      title?: string;
      artist?: string;
      album?: string;
      duration?: string;
      imageUrl?: string;
    };
    isPlaying?: boolean;
    onPlayPause?: (playing: boolean) => void;
  }
  
  export function NowPlayingFullscreen({ onClose, onArtistClick, onNavigate, currentSong, isPlaying: externalIsPlaying = false, onPlayPause }: NowPlayingFullscreenProps) {
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
    const [isLiked, setIsLiked] = useState(false);
    const [isShuffle, setIsShuffle] = useState(false);
    const [repeatMode, setRepeatMode] = useState<'off' | 'all' | 'one'>('off');
    const [currentTime, setCurrentTime] = useState(135);
    const [duration] = useState(222);
    const [visualizerBars, setVisualizerBars] = useState<number[]>([]);
    const [showLyrics, setShowLyrics] = useState(true);
    const [showArtistPanel, setShowArtistPanel] = useState(false);
    const [isFollowing, setIsFollowing] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');
    const lyricsRef = useRef<HTMLDivElement>(null);
  
    const lyrics = [
      { time: 0, text: "Lost in the digital haze" },
      { time: 15, text: "Electric dreams light my way" },
      { time: 30, text: "Through the neon city nights" },
      { time: 45, text: "We dance until the morning light" },
      { time: 60, text: "Synthetic love in binary" },
      { time: 75, text: "Our hearts beat in harmony" },
      { time: 90, text: "Forever young, forever free" },
      { time: 105, text: "In this AI symphony" },
      { time: 120, text: "Code runs through my veins" },
      { time: 135, text: "Breaking through these digital chains", current: true },
      { time: 150, text: "In the metaverse we play" },
      { time: 165, text: "Dancing till the break of day" },
      { time: 180, text: "Algorithms set us free" },
      { time: 195, text: "In perfect harmony" },
      { time: 210, text: "This is our destiny" },
    ];
  
    const topSongs = [
      { id: 1, title: "Digital Dreams", plays: "125M", duration: "3:42" },
      { id: 2, title: "Neon Nights", plays: "98M", duration: "4:15" },
      { id: 3, title: "Binary Love", plays: "87M", duration: "3:28" },
      { id: 4, title: "Cyber Soul", plays: "76M", duration: "4:02" },
      { id: 5, title: "Electric Heart", plays: "65M", duration: "3:55" },
    ];
  
    const relatedArtists = [
      { id: 1, name: "Cyber Pulse", followers: "2.3M", image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=200" },
      { id: 2, name: "Digital Echo", followers: "1.8M", image: "https://images.unsplash.com/photo-1571330735066-03aaa9429d89?w=200" },
      { id: 3, name: "Synthwave Dream", followers: "3.1M", image: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=200" },
      { id: 4, name: "Neon Vibes", followers: "1.5M", image: "https://images.unsplash.com/photo-1598387993441-a364f854c3e1?w=200" },
    ];
  
    const events = [
      { id: 1, date: "Nov 15, 2025", venue: "Cyber Arena, Tokyo", city: "Tokyo, JP" },
      { id: 2, date: "Nov 22, 2025", venue: "Digital Dome, Seoul", city: "Seoul, KR" },
      { id: 3, date: "Dec 01, 2025", venue: "Neon Hall, Los Angeles", city: "Los Angeles, US" },
    ];
  
    // Generate visualizer bars
    useEffect(() => {
      const generateBars = () => {
        const bars = Array.from({ length: 100 }, () => Math.random() * 100);
        setVisualizerBars(bars);
      };
  
      generateBars();
      const interval = setInterval(generateBars, 80);
      return () => clearInterval(interval);
    }, []);
  
    // Auto-scroll lyrics to current line
    useEffect(() => {
      if (showLyrics && lyricsRef.current) {
        const currentLineElement = lyricsRef.current.querySelector('[data-current="true"]');
        if (currentLineElement) {
          currentLineElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } 
      }
    }, [currentTime, showLyrics]);
  
    const handleRepeatToggle = () => {
      const modes: ('off' | 'all' | 'one')[] = ['off', 'all', 'one'];
      const currentIndex = modes.indexOf(repeatMode);
      setRepeatMode(modes[(currentIndex + 1) % modes.length]);
    };
  
    const formatTime = (seconds: number) => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    };
  
    const handleArtistNameClick = () => {
      if (onNavigate && currentSong?.artist) {
        onNavigate('artist', { name: currentSong.artist, genre: 'Electronic' });
        onClose(); // Close fullscreen when navigating
      } else {
        setShowArtistPanel(true);
      }
    };

    const handleSongTitleClick = () => {
      if (onNavigate && currentSong) {
        onNavigate('song', currentSong);
        // Don't close fullscreen, just update the song
      }
    };
  
    return (
      <div className="fixed inset-0 z-50 bg-black">
        {/* Animated Background Visualizer */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Blurred gradient background */}
          <motion.div
            animate={{
              opacity: [0.2, 0.4, 0.2],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="absolute top-0 left-0 w-full h-full bg-[#00ff88] blur-[200px]"
          />
          <motion.div
            animate={{
              opacity: [0.15, 0.3, 0.15],
              scale: [1.2, 1, 1.2],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="absolute bottom-0 right-0 w-full h-full bg-[#a855f7] blur-[200px]"
          />
  
          {/* Visualizer bars behind */}
          {!showLyrics && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.15 }}
              exit={{ opacity: 0 }}
              className="absolute bottom-0 left-0 right-0 h-96 flex items-end justify-center gap-1 px-8"
            >
              {visualizerBars.map((height, index) => (
                <motion.div
                  key={index}
                  animate={{ height: `${height}%` }}
                  transition={{ duration: 0.08 }}
                  className="flex-1 bg-gradient-to-t from-[#00ff88] to-[#a855f7] rounded-t-full blur-sm"
                  style={{ minHeight: '4px' }}
                />
              ))}
            </motion.div>
          )}
        </div>
  
        {/* Top Bar - Minimize & Cast */}
        <div className="absolute top-0 left-0 right-0 p-6 flex items-center justify-between z-20">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className="w-12 h-12 bg-black/40 backdrop-blur-xl rounded-full flex items-center justify-center text-white hover:bg-black/60 transition-all"
          >
            <ChevronDown className="w-6 h-6" />
          </motion.button>
  
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="w-12 h-12 bg-black/40 backdrop-blur-xl rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:bg-black/60 transition-all"
          >
            <Cast className="w-5 h-5" />
          </motion.button>
        </div>
  
        {/* Main Content */}
        <div className="relative z-10 h-full flex flex-col items-center justify-center px-8 py-20">
          <div className="w-full max-w-2xl flex flex-col items-center">
            {/* Album Artwork */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6 }}
              className="relative mb-8 cursor-pointer"
              onClick={handleSongTitleClick}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="relative pointer-events-auto">
                <VinylDisc
                  imageUrl={currentSong?.imageUrl || "https://images.unsplash.com/photo-1692176548571-86138128e36c?w=500"}
                  alt={currentSong?.title ? `${currentSong.title} by ${currentSong.artist}` : "Album Cover"}
                  size={500}
                  isPlaying={isPlaying}
                />
              </div>
            </motion.div>
  
            {/* Track Info */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-center mb-8 w-full"
            >
              <motion.h1 
                onClick={handleSongTitleClick}
                className="text-white text-4xl md:text-5xl font-bold mb-4 cursor-pointer hover:text-[#00ff88] transition-colors"
                whileHover={{ scale: 1.02 }}
              >
                {currentSong?.title || "Digital Dreams"}
              </motion.h1>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleArtistNameClick}
                className="text-gray-300 hover:text-white hover:underline transition-all mb-4 text-lg"
              >
                {currentSong?.artist || "Nova Pulse"}
              </motion.button>
              <div className="flex items-center justify-center gap-2 flex-wrap">
                <Badge className="bg-[#1a1a1a] text-[#00ff88] border-[#00ff88] px-3 py-1">
                  Electronic
                </Badge>
                <Badge className="bg-gradient-to-r from-[#00ff88] to-[#a855f7] text-black border-none px-3 py-1">
                  <Sparkles className="w-3 h-3 mr-1" />
                  AI Enhanced
                </Badge>
              </div>
            </motion.div>
  
            {/* Lyrics/Visualization Toggle */}
            <div className="mb-8">
              <Tabs value={showLyrics ? 'lyrics' : 'visualization'} onValueChange={(v) => setShowLyrics(v === 'lyrics')} className="bg-black/40 backdrop-blur-xl rounded-full p-1">
                <TabsList className="bg-transparent gap-1">
                  <TabsTrigger 
                    value="lyrics" 
                    className="rounded-full data-[state=active]:bg-[#00ff88] data-[state=active]:text-black text-white px-8 py-2 text-sm font-medium"
                  >
                    Lyrics
                  </TabsTrigger>
                  <TabsTrigger 
                    value="visualization" 
                    className="rounded-full data-[state=active]:bg-[#a855f7] data-[state=active]:text-white text-white px-8 py-2 text-sm font-medium"
                  >
                    Visualization
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
  
            {/* Lyrics Panel */}
            <AnimatePresence mode="wait">
              {showLyrics ? (
                <motion.div
                  key="lyrics"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="w-full mb-8"
                >
                  <div 
                    ref={lyricsRef}
                    className="bg-black/40 backdrop-blur-xl border border-[#1a1a1a] rounded-3xl p-8 h-72 overflow-auto custom-scrollbar"
                  >
                    <div className="space-y-6">
                      {lyrics.map((line, index) => (
                        <motion.p
                          key={index}
                          data-current={line.current}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className={`transition-all duration-500 cursor-pointer ${
                            line.current
                              ? 'text-[#00ff88] scale-110 origin-left drop-shadow-[0_0_10px_rgba(0,255,136,0.5)]'
                              : 'text-gray-400 hover:text-gray-300'
                          }`}
                        >
                          {line.text}
                        </motion.p>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="visualization"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="w-full mb-8 h-64 flex items-end justify-center gap-1"
                >
                  {visualizerBars.slice(0, 60).map((height, index) => (
                    <motion.div
                      key={index}
                      animate={{ height: `${height}%` }}
                      transition={{ duration: 0.08 }}
                      className="flex-1 bg-gradient-to-t from-[#00ff88] to-[#a855f7] rounded-t-full"
                      style={{ 
                        minHeight: '8px',
                        filter: 'drop-shadow(0 0 8px rgba(0,255,136,0.4))',
                      }}
                    />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
  
            {/* Progress Bar */}
            <div className="w-full mb-8">
              <Slider
                value={[currentTime]}
                onValueChange={([value]) => setCurrentTime(value)}
                max={duration}
                step={1}
                className="w-full mb-3"
              />
              <div className="flex justify-between text-gray-400 text-sm font-mono">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>
  
            {/* Playback Controls */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex items-center gap-4 mb-8"
            >
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsShuffle(!isShuffle)}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                  isShuffle ? 'text-[#00ff88]' : 'text-gray-400 hover:text-white'
                }`}
              >
                <Shuffle className="w-5 h-5" />
              </motion.button>
  
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-all"
              >
                <SkipBack className="w-6 h-6" />
              </motion.button>
  
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handlePlayPause}
                className="w-20 h-20 rounded-full bg-gradient-to-r from-[#00ff88] to-[#00cc6e] flex items-center justify-center text-black shadow-lg shadow-[#00ff88]/50"
              >
                {isPlaying ? (
                  <Pause className="w-10 h-10 fill-black" />
                ) : (
                  <Play className="w-10 h-10 fill-black ml-1" />
                )}
              </motion.button>
  
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-all"
              >
                <SkipForward className="w-6 h-6" />
              </motion.button>
  
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleRepeatToggle}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all relative ${
                  repeatMode !== 'off' ? 'text-[#00ff88]' : 'text-gray-400 hover:text-white'
                }`}
              >
                <Repeat className="w-5 h-5" />
                {repeatMode === 'one' && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-[#00ff88] rounded-full text-[8px] flex items-center justify-center text-black">
                    1
                  </span>
                )}
              </motion.button>
            </motion.div>
  
            {/* Secondary Controls */}
            <div className="flex items-center gap-3">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsLiked(!isLiked)}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                  isLiked
                    ? 'bg-[#00ff88]/20 text-[#00ff88]'
                    : 'bg-white/10 text-gray-400 hover:text-white'
                }`}
              >
                <Heart className={`w-6 h-6 ${isLiked ? 'fill-[#00ff88]' : ''}`} />
              </motion.button>
  
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-all"
              >
                <Download className="w-6 h-6" />
              </motion.button>
  
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-all"
              >
                <ListPlus className="w-6 h-6" />
              </motion.button>
            </div>
          </div>
        </div>
  
        {/* Artist Info Overlay Panel */}
        <AnimatePresence>
          {showArtistPanel && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowArtistPanel(false)}
                className="absolute inset-0 bg-black/60 backdrop-blur-md z-30"
              />
  
              {/* Slide-up Panel */}
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                className="absolute inset-x-0 bottom-0 bg-gradient-to-b from-[#0a0a0a] to-black border-t border-[#1a1a1a] rounded-t-3xl z-40 max-h-[90vh] overflow-hidden"
              >
                {/* Mini Player at Bottom */}
                <div className="absolute bottom-0 left-0 right-0 h-20 bg-black/80 backdrop-blur-xl border-t border-[#1a1a1a] px-6 flex items-center justify-between z-50">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg overflow-hidden">
                      <ImageWithFallback
                        src="https://images.unsplash.com/photo-1644855640845-ab57a047320e?w=600"
                        alt="Album"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <p className="text-white text-sm">Digital Dreams</p>
                      <p className="text-gray-400 text-xs">Nova Pulse</p>
                    </div>
                  </div>
                  <div className="flex-1 max-w-md mx-8">
                    <Slider
                      value={[currentTime]}
                      max={duration}
                      step={1}
                      className="w-full"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={handlePlayPause}
                      className="w-10 h-10 rounded-full bg-[#00ff88] flex items-center justify-center text-black"
                    >
                      {isPlaying ? (
                        <Pause className="w-5 h-5 fill-black" />
                      ) : (
                        <Play className="w-5 h-5 fill-black ml-0.5" />
                      )}
                    </motion.button>
                  </div>
                </div>
  
                {/* Panel Content */}
                <ScrollArea className="h-[calc(90vh-80px)]">
                  <div className="p-8 pb-24">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-8">
                      <div className="flex items-center gap-6">
                        <Avatar className="w-24 h-24 border-2 border-[#00ff88]">
                          <AvatarImage src="https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=200" />
                          <AvatarFallback>NP</AvatarFallback>
                        </Avatar>
                        <div>
                          <h2 className="text-white mb-2">Nova Pulse</h2>
                          <p className="text-gray-400 mb-3">15.2M monthly listeners</p>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setIsFollowing(!isFollowing)}
                            className={`px-6 py-2 rounded-full transition-all ${
                              isFollowing
                                ? 'bg-white/10 text-white border border-[#2a2a2a]'
                                : 'bg-[#00ff88] text-black hover:bg-[#00cc6e]'
                            }`}
                          >
                            <UserPlus className="w-4 h-4 mr-2 inline" />
                            {isFollowing ? 'Following' : 'Follow'}
                          </motion.button>
                        </div>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setShowArtistPanel(false)}
                        className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-gray-400 hover:text-white"
                      >
                        <X className="w-5 h-5" />
                      </motion.button>
                    </div>
  
                    {/* AI Recommendation Tag */}
                    <div className="mb-6 p-4 bg-gradient-to-r from-[#00ff88]/10 to-[#a855f7]/10 border border-[#00ff88]/20 rounded-xl">
                      <div className="flex items-center gap-2 text-[#00ff88]">
                        <Sparkles className="w-4 h-4" />
                        <span className="text-sm">Because you listen to Electronic & Synthwave</span>
                      </div>
                    </div>
  
                    {/* Tabs */}
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                      <TabsList className="w-full bg-[#1a1a1a] mb-6">
                        <TabsTrigger value="overview" className="flex-1">
                          Overview
                        </TabsTrigger>
                        <TabsTrigger value="related" className="flex-1">
                          Related Artists
                        </TabsTrigger>
                        <TabsTrigger value="events" className="flex-1">
                          Events
                        </TabsTrigger>
                      </TabsList>
  
                      {/* Overview Tab */}
                      <TabsContent value="overview" className="space-y-8">
                        {/* Bio */}
                        <div>
                          <h3 className="text-white mb-3">About</h3>
                          <p className="text-gray-400">
                            Nova Pulse is a pioneering electronic music artist blending AI-generated soundscapes 
                            with human creativity. Known for pushing the boundaries of digital music production, 
                            Nova Pulse has become a leading voice in the cyberpunk and synthwave genres.
                          </p>
                        </div>
  
                        <Separator className="bg-[#1a1a1a]" />
  
                        {/* Top 5 Songs */}
                        <div>
                          <h3 className="text-white mb-4 flex items-center gap-2">
                            <Music2 className="w-5 h-5" />
                            Popular Tracks
                          </h3>
                          <div className="space-y-3">
                            {topSongs.map((song, index) => (
                              <motion.div
                                key={song.id}
                                whileHover={{ scale: 1.02 }}
                                onClick={() => {
                                  if (onNavigate) {
                                    onNavigate('song', {
                                      title: song.title,
                                      artist: currentSong?.artist || 'Nova Pulse',
                                      duration: song.duration,
                                    });
                                    onClose();
                                  }
                                }}
                                className="flex items-center gap-4 p-3 rounded-lg hover:bg-[#1a1a1a] transition-all cursor-pointer"
                              >
                                <span className="text-gray-400 w-6">{index + 1}</span>
                                <div className="flex-1">
                                  <p className="text-white">{song.title}</p>
                                  <p className="text-gray-400 text-sm">{song.plays} plays</p>
                                </div>
                                <span className="text-gray-400 text-sm">{song.duration}</span>
                              </motion.div>
                            ))}
                          </div>
                        </div>
  
                        <Separator className="bg-[#1a1a1a]" />
  
                        {/* Popular Albums */}
                        <div>
                          <h3 className="text-white mb-4">Popular Albums</h3>
                          <div className="grid grid-cols-3 gap-4">
                            {[1, 2, 3].map((album) => (
                              <motion.div
                                key={album}
                                whileHover={{ scale: 1.05 }}
                                onClick={() => {
                                  if (onNavigate) {
                                    onNavigate('playlist', {
                                      title: `Cyber Dreams Vol. ${album}`,
                                      description: `Album by ${currentSong?.artist || 'Nova Pulse'}`,
                                      imageUrl: `https://images.unsplash.com/photo-${album === 1 ? '1644855640845-ab57a047320e' : album === 2 ? '1470225620780-dba8ba36b745' : '1598387993441-a364f854c3e1'}?w=300`,
                                    });
                                    onClose();
                                  }
                                }}
                                className="cursor-pointer"
                              >
                                <div className="aspect-square rounded-lg overflow-hidden mb-2">
                                  <ImageWithFallback
                                    src={`https://images.unsplash.com/photo-${album === 1 ? '1644855640845-ab57a047320e' : album === 2 ? '1470225620780-dba8ba36b745' : '1598387993441-a364f854c3e1'}?w=300`}
                                    alt={`Album ${album}`}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <p className="text-white text-sm">Cyber Dreams Vol. {album}</p>
                                <p className="text-gray-400 text-xs">2024</p>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      </TabsContent>
  
                      {/* Related Artists Tab */}
                      <TabsContent value="related">
                        <div className="space-y-4">
                          {relatedArtists.map((artist) => (
                            <motion.div
                              key={artist.id}
                              whileHover={{ scale: 1.02 }}
                              onClick={() => {
                                if (onNavigate) {
                                  onNavigate('artist', {
                                    name: artist.name,
                                    genre: 'Electronic',
                                    imageUrl: artist.image,
                                  });
                                  onClose();
                                }
                              }}
                              className="flex items-center gap-4 p-4 rounded-lg hover:bg-[#1a1a1a] transition-all cursor-pointer"
                            >
                              <Avatar className="w-16 h-16">
                                <AvatarImage src={artist.image} />
                                <AvatarFallback>{artist.name[0]}</AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <p className="text-white">{artist.name}</p>
                                <p className="text-gray-400 text-sm flex items-center gap-1">
                                  <Users className="w-3 h-3" />
                                  {artist.followers} followers
                                </p>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                className="bg-transparent border-[#2a2a2a] text-white hover:bg-white/10"
                              >
                                Follow
                              </Button>
                            </motion.div>
                          ))}
                        </div>
                      </TabsContent>
  
                      {/* Events Tab */}
                      <TabsContent value="events">
                        <div className="space-y-4">
                          {events.map((event) => (
                            <motion.div
                              key={event.id}
                              whileHover={{ scale: 1.02 }}
                              className="p-4 border border-[#1a1a1a] rounded-lg hover:border-[#00ff88]/30 transition-all cursor-pointer"
                            >
                              <div className="flex items-start gap-4">
                                <div className="w-16 h-16 bg-[#1a1a1a] rounded-lg flex flex-col items-center justify-center">
                                  <Calendar className="w-6 h-6 text-[#00ff88]" />
                                </div>
                                <div className="flex-1">
                                  <p className="text-white mb-1">{event.venue}</p>
                                  <p className="text-gray-400 text-sm mb-2">{event.city}</p>
                                  <p className="text-[#00ff88] text-sm">{event.date}</p>
                                </div>
                                <Button
                                  size="sm"
                                  className="bg-[#00ff88] text-black hover:bg-[#00cc6e]"
                                >
                                  Get Tickets
                                </Button>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </TabsContent>
                    </Tabs>
                  </div>
                </ScrollArea>
              </motion.div>
            </>
          )}
        </AnimatePresence>
  
        <style>{`
          .custom-scrollbar::-webkit-scrollbar {
            width: 8px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: rgba(26, 26, 26, 0.5);
            border-radius: 4px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(0, 255, 136, 0.3);
            border-radius: 4px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: rgba(0, 255, 136, 0.5);
          }
        `}</style>
      </div>
    );
  }
