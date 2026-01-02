import { ImageWithFallback } from './img/ImageWithFallback';
import { Heart, Download, Share2, Plus, Play, ChevronDown, Music2 } from 'lucide-react';
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

interface SongDetailProps {
  song: {
    title: string;
    artist: string;
    album?: string;
    imageUrl?: string;
    duration?: string;
  };
  onNavigate?: (page: string, data?: any) => void;
}

export function SongDetail({ song, onNavigate }: SongDetailProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [currentLyricIndex, setCurrentLyricIndex] = useState(0);
  const [isCreditsOpen, setIsCreditsOpen] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Mock lyrics data
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

  const credits = [
    { role: 'Lead Artist', name: song.artist, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=artist1' },
    { role: 'Producer', name: 'Echo Sound Labs', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=producer' },
    { role: 'Composer', name: 'Alex Rivers', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=composer' },
    { role: 'Mixing Engineer', name: 'Sound Forge Studio', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=mixer' },
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
                src={song.imageUrl || 'https://images.unsplash.com/photo-1692176548571-86138128e36c?w=600'}
                alt={song.title}
                className="w-full h-full object-cover"
              />
            </div>
            {/* Main artwork */}
            <div className="relative z-10 w-full h-full">
              <ImageWithFallback
                src={song.imageUrl || 'https://images.unsplash.com/photo-1692176548571-86138128e36c?w=600'}
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
              onClick={() => onNavigate?.('artist', { name: song.artist, genre: 'Electronic' })}
              className="text-gray-400 hover:text-[#00ff88] transition-colors text-xl mb-6"
            >
              {song.artist}
            </button>
          </motion.div>

          {/* Primary Actions */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setIsLiked(!isLiked)}
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
              // Update current song and start playing
              if (onNavigate) {
                onNavigate('song', song);
              }
            }}
          >
            <Play className="w-5 h-5 fill-black" />
            Play Now
          </Button>
        </div>

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
