import { ImageWithFallback } from './img/ImageWithFallback';
import { Play, Heart, Download, Share2, MoreHorizontal, Clock } from 'lucide-react';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { TrackTable } from './TrackTable';
import { PlaylistCard } from './PlaylistCard';
import { Badge } from './ui/badge';
import { motion } from 'framer-motion';

interface PlaylistDetailProps {
  playlist: {
    title: string;
    description: string;
    imageUrl: string;
  };
  onNavigate?: (page: string, data?: any) => void;
}

export function PlaylistDetail({ playlist, onNavigate }: PlaylistDetailProps) {
  // Playlist tracks will be fetched from API in the future
  const tracks: any[] = [];

  const suggestedPlaylists = [
    {
      title: 'Similar Vibes',
      description: 'More tracks like these',
      imageUrl: 'https://images.unsplash.com/photo-1662012061995-0cd4a7ef2d12?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhYnN0cmFjdCUyMG5lb24lMjBsaWdodHN8ZW58MXx8fHwxNzYxMzE4MTg3fDA&ixlib=rb-4.1.0&q=80&w=1080',
    },
    {
      title: 'Electronic Essentials',
      description: 'The best of electronic',
      imageUrl: 'https://images.unsplash.com/photo-1740459057005-65f000db582f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb25jZXJ0JTIwc3RhZ2UlMjBsaWdodHN8ZW58MXx8fHwxNzYxMzI2ODc5fDA&ixlib=rb-4.1.0&q=80&w=1080',
    },
    {
      title: 'Night Sessions',
      description: 'Late night beats',
      imageUrl: 'https://images.unsplash.com/photo-1744907529553-dc603ead4d4e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzb3VuZCUyMHdhdmVzJTIwYWJzdHJhY3R8ZW58MXx8fHwxNzYxMzkzMzU3fDA&ixlib=rb-4.1.0&q=80&w=1080',
    },
    {
      title: 'AI Discovery Mix',
      description: 'AI-curated for you',
      imageUrl: 'https://images.unsplash.com/photo-1582024959432-aee9b60ff4e8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtdXNpYyUyMHByb2R1Y2VyJTIwc3R1ZGlvfGVufDF8fHx8MTc2MTM1MzY0MHww&ixlib=rb-4.1.0&q=80&w=1080',
    },
  ];

  const totalDuration = '32 min';
  const totalSongs = tracks.length;

  return (
    <ScrollArea className="flex-1 h-full">
      {/* Hero Section with Gradient Overlay */}
      <div className="relative h-80 overflow-hidden">
        {/* Background with blur */}
        <div className="absolute inset-0">
          <ImageWithFallback
            src={playlist.imageUrl}
            alt={playlist.title}
            className="w-full h-full object-cover scale-110 blur-2xl"
          />
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#00ff88]/20 via-black/80 to-black" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#a855f7]/10 to-transparent" />
        </div>

        {/* Playlist Info */}
        <div className="absolute bottom-0 left-0 right-0 p-8">
          <div className="flex items-end gap-6">
            <motion.div
              initial={{ scale: 0, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ duration: 0.5 }}
              className="w-56 h-56 rounded-xl overflow-hidden shadow-2xl border-2 border-[#00ff88]/30"
            >
              <ImageWithFallback
                src={playlist.imageUrl}
                alt={playlist.title}
                className="w-full h-full object-cover"
              />
            </motion.div>
            <div className="flex-1 pb-4">
              <p className="text-sm text-gray-400 mb-2">PLAYLIST</p>
              <h1 className="text-white text-5xl md:text-6xl mb-3 font-bold">{playlist.title}</h1>
              <p className="text-gray-300 text-lg mb-4">{playlist.description}</p>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <span className="text-white">AI Music</span>
                <span>•</span>
                <span>{totalSongs} songs</span>
                <span>•</span>
                <span>{totalDuration}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="px-8 py-6 flex items-center gap-3 flex-wrap">
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button 
            className="bg-[#00ff88] hover:bg-[#00ff88]/80 text-black gap-2 px-8 py-5 rounded-full font-semibold"
            onClick={() => {
              // Start playing first track in playlist
              if (tracks.length > 0 && onNavigate) {
                const firstTrack = tracks[0];
                onNavigate('song', {
                  title: firstTrack.title,
                  artist: firstTrack.artist,
                  album: firstTrack.album,
                  duration: firstTrack.duration,
                  imageUrl: playlist.imageUrl,
                });
              }
            }}
          >
            <Play className="w-5 h-5 fill-black" />
            Play
          </Button>
        </motion.div>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button className="bg-transparent border-2 border-[#a855f7] text-[#a855f7] hover:bg-[#a855f7]/10 gap-2 px-6 py-5 rounded-full">
            <Heart className="w-4 h-4" />
            Follow
          </Button>
        </motion.div>
        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
          <Button variant="ghost" size="icon" className="w-10 h-10 text-gray-400 hover:text-white hover:bg-[#1a1a1a] rounded-full">
            <Download className="w-4 h-4" />
          </Button>
        </motion.div>
        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
          <Button variant="ghost" size="icon" className="w-10 h-10 text-gray-400 hover:text-white hover:bg-[#1a1a1a] rounded-full">
            <Share2 className="w-4 h-4" />
          </Button>
        </motion.div>
        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
          <Button variant="ghost" size="icon" className="w-10 h-10 text-gray-400 hover:text-white hover:bg-[#1a1a1a] rounded-full">
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </motion.div>
      </div>

      {/* Track Table */}
      <div className="px-8 pb-8">
        <TrackTable tracks={tracks} onNavigate={onNavigate} />
      </div>

      {/* AI Recommendations */}
      <div className="px-8 pb-12">
        <div className="flex items-center gap-3 mb-6">
          <h2 className="text-white text-2xl">Suggested for this playlist</h2>
          <Badge className="bg-gradient-to-r from-[#00ff88] to-[#a855f7] text-black border-none">
            AI Powered
          </Badge>
        </div>
        <div className="grid grid-cols-4 gap-6">
          {suggestedPlaylists.map((suggestedPlaylist, index) => (
            <PlaylistCard key={index} {...suggestedPlaylist} onNavigate={onNavigate} />
          ))}
        </div>
      </div>
    </ScrollArea>
  );
}