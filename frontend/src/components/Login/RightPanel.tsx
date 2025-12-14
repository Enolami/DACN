import { ImageWithFallback } from './img/ImageWithFallback';
import { Heart, Plus, Share2, MoreHorizontal, Radio, Sparkles } from 'lucide-react';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { motion } from 'framer-motion';

export function RightPanel() {
  const upNext = [
    { title: 'Neon Dreams', artist: 'Nova Pulse', duration: '3:42' },
    { title: 'Electric Soul', artist: 'Synthwave', duration: '4:15' },
    { title: 'Midnight Drive', artist: 'Echo Dreams', duration: '3:58' },
    { title: 'Digital Horizon', artist: 'Crystal Sound', duration: '4:23' },
  ];

  return (
    <div className="w-80 bg-black h-full border-l border-[#1a1a1a] flex flex-col">
      {/* Currently Playing */}
      <div className="p-6 border-b border-[#1a1a1a]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white">Now Playing</h3>
          <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
            <MoreHorizontal className="w-5 h-5" />
          </Button>
        </div>

        {/* Album Artwork */}
        <div className="relative mb-6 group">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            className="aspect-square rounded-full overflow-hidden shadow-2xl"
          >
            <ImageWithFallback
              src="https://images.unsplash.com/photo-1692176548571-86138128e36c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlbGVjdHJvbmljJTIwbXVzaWMlMjBkanxlbnwxfHx8fDE3NjEzMDQ1Nzh8MA&ixlib=rb-4.1.0&q=80&w=1080"
              alt="Album Art"
              className="w-full h-full object-cover"
            />
          </motion.div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>

        {/* Song Details */}
        <div className="mb-6">
          <h2 className="text-white text-xl mb-1">Cosmic Waves</h2>
          <p className="text-gray-400">Nova Pulse</p>
          <div className="flex items-center gap-2 mt-2">
            <Sparkles className="w-3 h-3 text-[#00ff88]" />
            <span className="text-xs text-[#00ff88]">AI Enhanced Audio</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
              <Button
                size="icon"
                variant="ghost"
                className="w-10 h-10 text-gray-400 hover:text-[#00ff88] hover:bg-[#00ff88]/10"
              >
                <Heart className="w-5 h-5" />
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
              <Button
                size="icon"
                variant="ghost"
                className="w-10 h-10 text-gray-400 hover:text-[#00ff88] hover:bg-[#00ff88]/10"
              >
                <Plus className="w-5 h-5" />
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
              <Button
                size="icon"
                variant="ghost"
                className="w-10 h-10 text-gray-400 hover:text-[#00ff88] hover:bg-[#00ff88]/10"
              >
                <Share2 className="w-5 h-5" />
              </Button>
            </motion.div>
          </div>
          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
            <Button
              size="sm"
              className="bg-[#a855f7] hover:bg-[#a855f7]/80 text-white gap-2"
            >
              <Radio className="w-4 h-4" />
              Radio
            </Button>
          </motion.div>
        </div>
      </div>

      {/* Up Next Queue */}
      <div className="flex-1 flex flex-col">
        <div className="p-6 pb-4">
          <h3 className="text-white">Up Next</h3>
        </div>
        <ScrollArea className="flex-1 px-6">
          <div className="space-y-4 pb-6">
            {upNext.map((song, index) => (
              <motion.div
                key={index}
                whileHover={{ x: 4 }}
                className="flex items-center justify-between group cursor-pointer"
              >
                <div className="flex-1 min-w-0">
                  <h4 className="text-white text-sm truncate group-hover:text-[#00ff88] transition-colors">
                    {song.title}
                  </h4>
                  <p className="text-gray-400 text-xs truncate">{song.artist}</p>
                </div>
                <span className="text-gray-400 text-xs ml-2">{song.duration}</span>
              </motion.div>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
