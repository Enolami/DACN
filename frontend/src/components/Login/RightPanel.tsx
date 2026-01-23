import { Clock, Music2, History, Sparkles, Loader2, X, GripVertical, Trash2 } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Button } from './ui/button';
import { useState, useEffect } from 'react';
import { getLikedSongs, getRecommendations, getSongs, formatDuration } from '../../services/api';
import { Badge } from './ui/badge';
import type { Song, Recommendation } from '../../types/music';

interface RightPanelProps {
  onNavigate?: (page: string, data?: any) => void;
  currentSong?: Song | any; // Current playing song for context
  queue?: Song[];
  currentQueueIndex?: number;
  onRemoveFromQueue?: (songId: string) => void;
  onClearQueue?: () => void;
  onReorderQueue?: (fromIndex: number, toIndex: number) => void;
  onPlayFromQueue?: (song: Song, index: number) => void;
}

export function RightPanel({ 
  onNavigate, 
  currentSong,
  queue = [],
  currentQueueIndex = -1,
  onRemoveFromQueue,
  onClearQueue,
  onReorderQueue,
  onPlayFromQueue,
}: RightPanelProps) {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [recentlyPlayed, setRecentlyPlayed] = useState<Song[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Get songs that are actually "up next" (after current)
  const upNext = currentQueueIndex >= 0 
    ? queue.slice(currentQueueIndex + 1)
    : queue;

  // Fetch recommendations and recently played
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get recently played from liked songs (as a proxy for play history)
        const likedSongs = await getLikedSongs();
        if (likedSongs.length > 0) {
          const allSongs = await getSongs();
          const recentSongs = likedSongs
            .slice(0, 8)
            .map(ls => allSongs.find(s => s.id === ls.song_id))
            .filter((s): s is Song => s !== undefined);
          setRecentlyPlayed(recentSongs);
        }

        // Get recommendations based on current song or first liked song
        if (currentSong && 'id' in currentSong && currentSong.id) {
          setLoadingRecommendations(true);
          const recs = await getRecommendations(currentSong.id, 5);
          setRecommendations(recs.recommendations || []);
        } else if (likedSongs.length > 0) {
          setLoadingRecommendations(true);
          const allSongs = await getSongs();
          const firstLikedSong = allSongs.find(s => s.id === likedSongs[0].song_id);
          if (firstLikedSong) {
            const recs = await getRecommendations(firstLikedSong.id, 5);
            setRecommendations(recs.recommendations || []);
          }
        }
      } catch (err) {
        console.error('Error fetching panel data:', err);
      } finally {
        setLoadingRecommendations(false);
      }
    };

    fetchData();
  }, [currentSong]);

  const [activeTab, setActiveTab] = useState<'queue' | 'history'>('queue');

  return (
    <div className="w-80 bg-black h-full border-l border-[#1a1a1a] flex flex-col">
      <Tabs value={activeTab} onValueChange={(v: string) => setActiveTab(v as any)} className="flex-1 flex flex-col">
        <div className="px-6 pb-0">
          <TabsList className="bg-[#0a0a0a] text-gray-400 inline-flex h-10 w-full items-center justify-center rounded-lg p-1 border border-[#333333]">
            <TabsTrigger 
              value="queue" 
              className="inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 rounded-lg border border-transparent px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-all duration-200 text-gray-400 hover:text-white hover:bg-[#1a1a1a] data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#00ff88]/20 data-[state=active]:to-[#00cc66]/10 data-[state=active]:text-[#00ff88] data-[state=active]:border-[#00ff88]/30 data-[state=active]:shadow-[0_0_10px_rgba(0,255,136,0.15)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00ff88]/50 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
            >
              <Music2 className="w-4 h-4" />
              Queue
            </TabsTrigger>
            <TabsTrigger 
              value="history" 
              className="inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 rounded-lg border border-transparent px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-all duration-200 text-gray-400 hover:text-white hover:bg-[#1a1a1a] data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#00ff88]/20 data-[state=active]:to-[#00cc66]/10 data-[state=active]:text-[#00ff88] data-[state=active]:border-[#00ff88]/30 data-[state=active]:shadow-[0_0_10px_rgba(0,255,136,0.15)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00ff88]/50 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
            >
              <History className="w-4 h-4" />
              History
            </TabsTrigger>
          </TabsList>
        </div>

        {activeTab === 'queue' && (
        <TabsContent value="queue" className="flex-1 flex flex-col m-0">
          <div className="px-6 pb-4 flex items-center justify-between">
            <div>
              <h3 className="text-white text-sm font-medium">Up Next</h3>
              <p className="text-gray-400 text-xs mt-1">{queue.length} {queue.length === 1 ? 'song' : 'songs'} in queue</p>
            </div>
            {queue.length > 0 && onClearQueue && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearQueue}
                className="text-gray-400 hover:text-white text-xs h-7 px-2"
              >
                Clear
              </Button>
            )}
          </div>
          <ScrollArea className="flex-1 px-6">
            {queue.length > 0 ? (
              <div className="space-y-2 pb-6">
                {queue.map((song, index) => {
                  const isCurrent = index === currentQueueIndex;
                  const isUpNext = index > currentQueueIndex;
                  
                  return (
                    <motion.div
                      key={song.id}
                      whileHover={{ x: 4 }}
                      drag={onReorderQueue ? "y" : false}
                      dragConstraints={{ top: 0, bottom: 0 }}
                      dragElastic={0.1}
                      onDragStart={() => setDraggedIndex(index)}
                      onDragEnd={(e, info) => {
                        setDraggedIndex(null);
                        if (!onReorderQueue) return;
                        // Calculate target index based on drag distance
                        const itemHeight = 60; // Approximate height of each item
                        const dragDistance = info.offset.y;
                        const targetOffset = Math.round(dragDistance / itemHeight);
                        const targetIndex = Math.max(0, Math.min(queue.length - 1, index + targetOffset));
                        if (targetIndex !== index) {
                          onReorderQueue(index, targetIndex);
                        }
                      }}
                      onClick={() => {
                        if (onPlayFromQueue) {
                          onPlayFromQueue(song, index);
                        } else {
                          onNavigate?.('song', { song });
                        }
                      }}
                      className={`flex items-center justify-between group cursor-pointer p-2 rounded-lg transition-colors ${
                        isCurrent 
                          ? 'bg-[#00ff88]/20 border border-[#00ff88]/30' 
                          : 'hover:bg-[#1a1a1a]'
                      } ${draggedIndex === index ? 'opacity-50 cursor-grabbing' : ''}`}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {onReorderQueue && (
                          <GripVertical className="w-4 h-4 text-gray-600 cursor-grab active:cursor-grabbing" />
                        )}
                        <div className={`text-xs w-6 text-center ${isCurrent ? 'text-[#00ff88] font-semibold' : 'text-gray-500'}`}>
                          {isCurrent ? '▶' : index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className={`text-sm truncate transition-colors ${
                            isCurrent 
                              ? 'text-[#00ff88]' 
                              : 'text-white group-hover:text-[#00ff88]'
                          }`}>
                            {song.title}
                          </h4>
                          <p className="text-gray-400 text-xs truncate">
                            {song.artist_name || song.artist?.stage_name || 'Unknown Artist'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400 text-xs flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDuration(song.duration)}
                        </span>
                        {onRemoveFromQueue && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              onRemoveFromQueue(song.id);
                            }}
                            className="w-6 h-6 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400 text-sm">
                <Music2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>Queue is empty</p>
                <p className="text-xs mt-1 text-gray-500">Add songs to start a queue</p>
              </div>
            )}

            {/* Recommendations Section */}
            {recommendations.length > 0 && (
              <div className="mt-8 pt-6 border-t border-[#1a1a1a]">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-4 h-4 text-[#a855f7]" />
                  <h3 className="text-white text-sm font-medium">You might also like</h3>
                </div>
                {loadingRecommendations ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="w-4 h-4 text-[#00ff88] animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recommendations.map((rec) => (
                      <motion.div
                        key={rec.id}
                        whileHover={{ x: 4 }}
                        onClick={() => onNavigate?.('song', { song: rec })}
                        className="flex items-center justify-between group cursor-pointer p-2 rounded-lg hover:bg-[#1a1a1a] transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <h4 className="text-white text-sm truncate group-hover:text-[#00ff88] transition-colors">
                            {rec.title}
                          </h4>
                          <p className="text-gray-400 text-xs truncate">
                            {rec.artist_name || rec.artist?.stage_name || 'Unknown Artist'}
                          </p>
                        </div>
                        {rec.similarity_score !== undefined && (
                          <Badge className="ml-2 bg-[#00ff88]/20 text-[#00ff88] border-[#00ff88]/30 text-xs">
                            {(rec.similarity_score * 100).toFixed(0)}%
                          </Badge>
                        )}
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </ScrollArea>
        </TabsContent>
        )}

        {activeTab === 'history' && (
        <TabsContent value="history" className="flex-1 flex flex-col m-0">
          <div className="px-6 pb-4">
            <h3 className="text-white text-sm font-medium">Recently Played</h3>
            <p className="text-gray-400 text-xs mt-1">{recentlyPlayed.length} songs</p>
          </div>
          <ScrollArea className="flex-1 px-6">
            {recentlyPlayed.length > 0 ? (
              <div className="space-y-3 pb-6">
                {recentlyPlayed.map((song) => (
                  <motion.div
                    key={song.id}
                    whileHover={{ x: 4 }}
                    onClick={() => onNavigate?.('song', { song })}
                    className="flex items-center justify-between group cursor-pointer p-2 rounded-lg hover:bg-[#1a1a1a] transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <h4 className="text-white text-sm truncate group-hover:text-[#00ff88] transition-colors">
                        {song.title}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-gray-400 text-xs truncate">
                          {song.artist_name || song.artist?.stage_name || 'Unknown Artist'}
                        </p>
                      </div>
                    </div>
                    <span className="text-gray-400 text-xs ml-2 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDuration(song.duration)}
                    </span>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400 text-sm">
                <History className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No recent plays</p>
              </div>
            )}
          </ScrollArea>
        </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
