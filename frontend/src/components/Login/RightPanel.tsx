import { Clock, Music2, History } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

interface RightPanelProps {
  onNavigate?: (page: string, data?: any) => void;
}

export function RightPanel({ onNavigate }: RightPanelProps) {
  const upNext = [
    { id: 1, title: 'Neon Dreams', artist: 'Nova Pulse', duration: '3:42' },
    { id: 2, title: 'Electric Soul', artist: 'Synthwave', duration: '4:15' },
    { id: 3, title: 'Midnight Drive', artist: 'Echo Dreams', duration: '3:58' },
    { id: 4, title: 'Digital Horizon', artist: 'Crystal Sound', duration: '4:23' },
  ];

  const recentlyPlayed = [
    { id: 5, title: 'Cosmic Waves', artist: 'Nova Pulse', duration: '3:25', playedAt: '2 hours ago' },
    { id: 6, title: 'Stellar Journey', artist: 'Synthwave', duration: '4:10', playedAt: '5 hours ago' },
    { id: 7, title: 'Neon Nights', artist: 'Echo Dreams', duration: '3:50', playedAt: 'Yesterday' },
    { id: 8, title: 'Digital Dreams', artist: 'Crystal Sound', duration: '4:05', playedAt: 'Yesterday' },
  ];

  return (
    <div className="w-80 bg-black h-full border-l border-[#1a1a1a] flex flex-col">
      <Tabs defaultValue="queue" className="flex-1 flex flex-col">
        <div className="p-6 pb-0">
          <TabsList className="grid w-full grid-cols-2 bg-[#0a0a0a]">
            <TabsTrigger value="queue" className="flex items-center gap-2">
              <Music2 className="w-4 h-4" />
              Queue
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="w-4 h-4" />
              History
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="queue" className="flex-1 flex flex-col m-0 mt-4">
          <div className="px-6 pb-4">
            <h3 className="text-white text-sm font-medium">Up Next</h3>
            <p className="text-gray-400 text-xs mt-1">{upNext.length} songs in queue</p>
          </div>
          <ScrollArea className="flex-1 px-6">
            <div className="space-y-3 pb-6">
              {upNext.map((song, index) => (
                <motion.div
                  key={song.id}
                  whileHover={{ x: 4 }}
                  onClick={() => onNavigate?.('song', song)}
                  className="flex items-center justify-between group cursor-pointer p-2 rounded-lg hover:bg-[#1a1a1a] transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="text-gray-500 text-xs w-6 text-center">{index + 1}</div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-white text-sm truncate group-hover:text-[#00ff88] transition-colors">
                        {song.title}
                      </h4>
                      <p className="text-gray-400 text-xs truncate">{song.artist}</p>
                    </div>
                  </div>
                  <span className="text-gray-400 text-xs ml-2 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {song.duration}
                  </span>
                </motion.div>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="history" className="flex-1 flex flex-col m-0 mt-4">
          <div className="px-6 pb-4">
            <h3 className="text-white text-sm font-medium">Recently Played</h3>
            <p className="text-gray-400 text-xs mt-1">{recentlyPlayed.length} songs</p>
          </div>
          <ScrollArea className="flex-1 px-6">
            <div className="space-y-3 pb-6">
              {recentlyPlayed.map((song) => (
                <motion.div
                  key={song.id}
                  whileHover={{ x: 4 }}
                  onClick={() => onNavigate?.('song', song)}
                  className="flex items-center justify-between group cursor-pointer p-2 rounded-lg hover:bg-[#1a1a1a] transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <h4 className="text-white text-sm truncate group-hover:text-[#00ff88] transition-colors">
                      {song.title}
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-gray-400 text-xs truncate">{song.artist}</p>
                      <span className="text-gray-500 text-xs">•</span>
                      <span className="text-gray-500 text-xs">{song.playedAt}</span>
                    </div>
                  </div>
                  <span className="text-gray-400 text-xs ml-2 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {song.duration}
                  </span>
                </motion.div>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}
