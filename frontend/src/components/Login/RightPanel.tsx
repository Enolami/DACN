import { Clock, Music2, History, Sparkles, Loader2 } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { useState, useEffect } from 'react';
import { getLikedSongs, getRecommendations, getSongs, formatDuration } from '../../services/api';
import { Badge } from './ui/badge';
import type { Song, Recommendation } from '../../types/music';

interface RightPanelProps {
  onNavigate?: (page: string, data?: any) => void;
  currentSong?: Song | any; // Current playing song for context
}

export function RightPanel({ onNavigate, currentSong }: RightPanelProps) {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [recentlyPlayed, setRecentlyPlayed] = useState<Song[]>([]);

  // Mock queue for now (could be enhanced with actual queue management)
  const upNext: Song[] = [];

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
            {upNext.length > 0 ? (
              <div className="space-y-3 pb-6">
                {upNext.map((song, index) => (
                  <motion.div
                    key={song.id}
                    whileHover={{ x: 4 }}
                    onClick={() => onNavigate?.('song', { song })}
                    className="flex items-center justify-between group cursor-pointer p-2 rounded-lg hover:bg-[#1a1a1a] transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="text-gray-500 text-xs w-6 text-center">{index + 1}</div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-white text-sm truncate group-hover:text-[#00ff88] transition-colors">
                          {song.title}
                        </h4>
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
                <Music2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>Queue is empty</p>
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

        <TabsContent value="history" className="flex-1 flex flex-col m-0 mt-4">
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
      </Tabs>
    </div>
  );
}
