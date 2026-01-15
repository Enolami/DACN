import { PlaylistCard } from './PlaylistCard';
import { ArtistCard } from './ArtistCard';
import { ImageWithFallback } from './img/ImageWithFallback';
import { Sparkles, TrendingUp, Play } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { motion } from 'framer-motion';

interface HomePageProps {
  onNavigate: (page: string, data?: any) => void;
}

export function HomePage({ onNavigate }: HomePageProps) {
  const trendingNow = [
    {
      title: 'Viral Hits 2025',
      description: 'The biggest tracks right now',
      imageUrl: 'https://images.unsplash.com/photo-1692176548571-86138128e36c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlbGVjdHJvbmljJTIwbXVzaWMlMjBkanxlbnwxfHx8fDE3NjEzMDQ1Nzh8MA&ixlib=rb-4.1.0&q=80&w=1080',
    },
    {
      title: 'Night Drive',
      description: 'Late night vibes',
      imageUrl: 'https://images.unsplash.com/photo-1662012061995-0cd4a7ef2d12?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhYnN0cmFjdCUyMG5lb24lMjBsaWdodHN8ZW58MXx8fHwxNzYxMzE4MTg3fDA&ixlib=rb-4.1.0&q=80&w=1080',
    },
    {
      title: 'Workout Energy',
      description: 'High intensity workout mix',
      imageUrl: 'https://images.unsplash.com/photo-1740459057005-65f000db582f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb25jZXJ0JTIwc3RhZ2UlMjBsaWdodHN8ZW58MXx8fHwxNzYxMzI2ODc5fDA&ixlib=rb-4.1.0&q=80&w=1080',
    },
    {
      title: 'Peaceful Morning',
      description: 'Start your day right',
      imageUrl: 'https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtdXNpYyUyMGZlc3RpdmFsJTIwY3Jvd2R8ZW58MXx8fHwxNzYxMzg5MzcxfDA&ixlib=rb-4.1.0&q=80&w=1080',
    },
  ];

  const aiPersonalized = [
    {
      title: 'AI Focus Mix',
      description: 'Deep concentration beats for you',
      imageUrl: 'https://images.unsplash.com/photo-1582024959432-aee9b60ff4e8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtdXNpYyUyMHByb2R1Y2VyJTIwc3R1ZGlvfGVufDF8fHx8MTc2MTM1MzY0MHww&ixlib=rb-4.1.0&q=80&w=1080',
    },
    {
      title: 'Your Daily Mix 1',
      description: 'Electronic, House, and more',
      imageUrl: 'https://images.unsplash.com/photo-1747494750675-d1aecb8672b3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoZWFkcGhvbmVzJTIwbXVzaWN8ZW58MXx8fHwxNzYxMjgyNzAzfDA&ixlib=rb-4.1.0&q=80&w=1080',
    },
    {
      title: 'Discover Weekly',
      description: 'Your personalized playlist',
      imageUrl: 'https://images.unsplash.com/photo-1603850121303-d4ade9e5ba65?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx2aW55bCUyMHJlY29yZCUyMHBsYXllcnxlbnwxfHx8fDE3NjEzNzU5MTV8MA&ixlib=rb-4.1.0&q=80&w=1080',
    },
    {
      title: 'Release Radar',
      description: 'New releases for you',
      imageUrl: 'https://images.unsplash.com/photo-1744907529553-dc603ead4d4e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzb3VuZCUyMHdhdmVzJTIwYWJzdHJhY3R8ZW58MXx8fHwxNzYxMzkzMzU3fDA&ixlib=rb-4.1.0&q=80&w=1080',
    },
  ];

  const recommendedArtists = [
    { name: 'Nova Pulse', imageUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=nova', genre: 'Electronic' },
    { name: 'Synthwave', imageUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=synth', genre: 'Retro Wave' },
    { name: 'Echo Dreams', imageUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=echo', genre: 'Ambient' },
    { name: 'Bass Drop', imageUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=bass', genre: 'Dubstep' },
    { name: 'Crystal Sound', imageUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=crystal', genre: 'Chill' },
  ];

  return (
    <ScrollArea className="flex-1 h-full bg-black">
      <div className="p-6 md:p-8">
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="bg-transparent border-b border-[#1a1a1a] rounded-none p-0 h-auto gap-8 mb-8">
            <TabsTrigger
              value="all"
              className="bg-transparent rounded-none border-b-2 border-transparent data-[state=active]:border-[#00ff88] data-[state=active]:text-[#00ff88] text-gray-400 pb-4"
            >
              All
            </TabsTrigger>
            <TabsTrigger
              value="music"
              className="bg-transparent rounded-none border-b-2 border-transparent data-[state=active]:border-[#00ff88] data-[state=active]:text-[#00ff88] text-gray-400 pb-4"
            >
              Music
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-0">
            {/* Trending Now */}
            <div className="mb-12">
              <div className="flex items-center gap-3 mb-6">
                <TrendingUp className="w-6 h-6 text-[#00ff88]" />
                <h2 className="text-white text-2xl">Trending Now</h2>
              </div>
              <div className="grid grid-cols-4 gap-6">
                {trendingNow.map((playlist, index) => (
                  <div key={index} onClick={() => onNavigate('playlist', playlist)}>
                    <PlaylistCard {...playlist} />
                  </div>
                ))}
              </div>
            </div>

            {/* AI Personalized - For You */}
            <div className="mb-10">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <Sparkles className="w-5 h-5 text-[#a855f7]" />
                  <h2 className="text-white text-xl font-semibold">For You</h2>
                  <Badge className="bg-gradient-to-r from-[#00ff88] to-[#a855f7] text-black border-none text-xs">
                    AI Personalized
                  </Badge>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-6">
                {aiPersonalized.map((playlist, index) => (
                  <div key={index} onClick={() => onNavigate('playlist', playlist)}>
                    <PlaylistCard {...playlist} />
                  </div>
                ))}
              </div>
            </div>

            {/* Recommended Artists */}
            <div className="mb-10">
              <h2 className="text-white text-xl font-semibold mb-5">Recommended Artists</h2>
              <div className="grid grid-cols-5 gap-8">
                {recommendedArtists.map((artist, index) => (
                  <div key={index} onClick={() => onNavigate('artist', artist)}>
                    <ArtistCard {...artist} />
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="music" className="mt-0">
            {/* Music Content */}
            <div className="mb-12">
              <h2 className="text-white text-2xl mb-6">Top Music Playlists</h2>
              <div className="grid grid-cols-4 gap-6">
                {trendingNow.map((playlist, index) => (
                  <div key={index} onClick={() => onNavigate('playlist', playlist)}>
                    <PlaylistCard {...playlist} />
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </ScrollArea>
  );
}
