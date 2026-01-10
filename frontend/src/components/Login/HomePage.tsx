import { useState, useEffect } from 'react';
import { PlaylistCard } from './PlaylistCard';
import { ArtistCard } from './ArtistCard';
import { SongCard } from './SongCard';
import { ImageWithFallback } from './img/ImageWithFallback';
import { Sparkles, TrendingUp, Radio, Play, Music, Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { motion } from 'framer-motion';
import { getSongs, getLikedSongs, getRecommendations, followArtist, unfollowArtist, getFollowedArtists } from '../../services/api';
import type { Song, Artist, Album, Recommendation, Follower } from '../../types/music';

interface HomePageProps {
  onNavigate: (page: string, data?: any) => void;
}

export function HomePage({ onNavigate }: HomePageProps) {
  const [songs, setSongs] = useState<Song[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [followedArtists, setFollowedArtists] = useState<Follower[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch songs on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const fetchedSongs = await getSongs();
        setSongs(fetchedSongs);

        // Extract unique artists from songs
        const artistMap = new Map<string, Artist>();
        const albumMap = new Map<string, Album>();

        fetchedSongs.forEach((song) => {
          if (song.artist && song.artist.id) {
            artistMap.set(song.artist.id, song.artist);
          }
          if (song.album && song.album.id) {
            albumMap.set(song.album.id, song.album);
          }
        });

        setArtists(Array.from(artistMap.values()));
        setAlbums(Array.from(albumMap.values()));

        // Fetch followed artists
        try {
          const followed = await getFollowedArtists();
          setFollowedArtists(followed);
        } catch (err) {
          console.error('Error fetching followed artists:', err);
        }

        // Fetch recommendations based on liked songs or first song
        await fetchRecommendations(fetchedSongs);
      } catch (err) {
        console.error('Error fetching songs:', err);
        setError(err instanceof Error ? err.message : 'Failed to load music');
      } finally {
        setLoading(false);
      }
    };

    const fetchRecommendations = async (allSongs: Song[]) => {
      try {
        setLoadingRecommendations(true);
        
        // Try to get recommendations based on liked songs first
        const likedSongs = await getLikedSongs();
        if (likedSongs.length > 0) {
          // Get recommendations for the first liked song
          const firstLikedSong = allSongs.find(s => s.id === likedSongs[0].song_id);
          if (firstLikedSong) {
            const recs = await getRecommendations(firstLikedSong.id, 8);
            setRecommendations(recs.recommendations || []);
            return;
          }
        }

        // Fallback: Get recommendations for the first song
        if (allSongs.length > 0) {
          const recs = await getRecommendations(allSongs[0].id, 8);
          setRecommendations(recs.recommendations || []);
        }
      } catch (err) {
        console.error('Error fetching recommendations:', err);
        // Don't set error, just don't show recommendations
      } finally {
        setLoadingRecommendations(false);
      }
    };

    fetchData();
  }, []);

  // Get recently added songs (last 8, sorted by created_at)
  const recentlyAddedSongs = [...songs]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 8);

  // Get top artists (first 5 unique artists)
  const topArtists = artists.slice(0, 5);

  // Get featured albums (first 4 unique albums)
  const featuredAlbums = albums.slice(0, 4);

  // Trending playlists, AI personalized playlists, and radios will be fetched from API in the future
  const trendingNow: any[] = [];
  const aiPersonalized: any[] = [];
  const recommendedArtists: any[] = [];
  const popularRadios: any[] = [];

  if (loading) {
    return (
      <ScrollArea className="flex-1 h-full bg-black">
        <div className="flex items-center justify-center h-full">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 text-[#00ff88] animate-spin" />
            <p className="text-gray-400">Loading music...</p>
          </div>
        </div>
      </ScrollArea>
    );
  }

  if (error) {
    return (
      <ScrollArea className="flex-1 h-full bg-black">
        <div className="flex items-center justify-center h-full">
          <div className="flex flex-col items-center gap-4">
            <p className="text-red-400">Error: {error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-[#00ff88] text-black rounded-lg hover:bg-[#00cc6a] transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </ScrollArea>
    );
  }

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
            {/* Recently Added Songs */}
            {recentlyAddedSongs.length > 0 && (
              <div className="mb-12">
                <div className="flex items-center gap-3 mb-6">
                  <Music className="w-6 h-6 text-[#00ff88]" />
                  <h2 className="text-white text-2xl">Recently Added</h2>
                </div>
                <div className="grid grid-cols-4 gap-6">
                  {recentlyAddedSongs.map((song) => (
                    <SongCard key={song.id} song={song} onNavigate={onNavigate} />
                  ))}
                </div>
              </div>
            )}

            {/* Trending Now - Will be populated from API */}
            {trendingNow.length > 0 && (
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
            )}

            {/* AI Personalized - Recommended for You */}
            {recommendations.length > 0 && (
              <div className="mb-10">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <Sparkles className="w-5 h-5 text-[#a855f7]" />
                    <h2 className="text-white text-xl font-semibold">Recommended for You</h2>
                    <Badge className="bg-gradient-to-r from-[#00ff88] to-[#a855f7] text-black border-none text-xs">
                      AI Personalized
                    </Badge>
                  </div>
                </div>
                {loadingRecommendations ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 text-[#00ff88] animate-spin" />
                  </div>
                ) : (
                  <div className="grid grid-cols-4 gap-6">
                    {recommendations.map((rec) => (
                      <SongCard key={rec.id} song={rec} onNavigate={onNavigate} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* AI Personalized - For You (Fallback playlists) */}
            {recommendations.length === 0 && aiPersonalized.length > 0 && (
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
            )}

            {/* Top Artists from Imported Songs */}
            {topArtists.length > 0 && (
              <div className="mb-10">
                <h2 className="text-white text-xl font-semibold mb-5">Top Artists</h2>
                <div className="grid grid-cols-5 gap-8">
                  {topArtists.map((artist) => {
                    const isFollowed = followedArtists.some(fa => fa.artist_id === artist.id);
                    return (
                      <div
                        key={artist.id}
                        onClick={() => onNavigate('artist', { id: artist.id, stage_name: artist.stage_name })}
                      >
                        <ArtistCard
                          name={artist.stage_name}
                          imageUrl={`https://api.dicebear.com/7.x/avataaars/svg?seed=${artist.stage_name}`}
                          genre={isFollowed ? 'Following' : (artist.verified ? 'Verified' : 'Artist')}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Recommended Artists (Fallback if no imported artists) */}
            {topArtists.length === 0 && recommendedArtists.length > 0 && (
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
            )}

            {/* Featured Albums from Imported Songs */}
            {featuredAlbums.length > 0 && (
              <div className="mb-10">
                <h2 className="text-white text-xl font-semibold mb-5">Featured Albums</h2>
                <div className="grid grid-cols-4 gap-6">
                  {featuredAlbums.map((album) => (
                    <div
                      key={album.id}
                      onClick={() => onNavigate('playlist', {
                        title: album.title,
                        description: album.artist_name || 'Album',
                        imageUrl: album.cover_pic_url,
                        albumId: album.id
                      })}
                    >
                      <PlaylistCard
                        title={album.title}
                        description={album.artist_name || 'Album'}
                        imageUrl={album.cover_pic_url}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Popular Radios - Will be populated from API */}
            {popularRadios.length > 0 && (
              <div className="mb-10">
                <div className="flex items-center gap-3 mb-5">
                  <Radio className="w-5 h-5 text-[#00ff88]" />
                  <h2 className="text-white text-xl font-semibold">Popular Radios</h2>
                </div>
                <div className="grid grid-cols-3 gap-6">
                  {popularRadios.map((radio, index) => (
                    <motion.div
                      key={index}
                      whileHover={{ scale: 1.02 }}
                      className="group bg-[#1a1a1a] p-6 rounded-xl cursor-pointer transition-all hover:bg-[#252525] relative overflow-hidden"
                    >
                      <div className="absolute inset-0 opacity-20">
                        <ImageWithFallback
                          src={radio.imageUrl}
                          alt={radio.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="relative z-10">
                        <div className="flex items-center justify-between mb-4">
                          <Radio className="w-8 h-8 text-[#00ff88]" />
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            className="bg-[#00ff88] w-12 h-12 rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Play className="w-5 h-5 text-black fill-black ml-1" />
                          </motion.button>
                        </div>
                        <h3 className="text-white text-xl mb-2">{radio.title}</h3>
                        <p className="text-gray-400 text-sm">{radio.listeners} listeners</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="music" className="mt-0">
            {/* All Songs */}
            {songs.length > 0 && (
              <div className="mb-12">
                <h2 className="text-white text-2xl mb-6">All Songs ({songs.length})</h2>
                <div className="grid grid-cols-4 gap-6">
                  {songs.map((song) => (
                    <SongCard key={song.id} song={song} onNavigate={onNavigate} />
                  ))}
                </div>
              </div>
            )}

            {/* Featured Albums */}
            {featuredAlbums.length > 0 && (
              <div className="mb-12">
                <h2 className="text-white text-2xl mb-6">Featured Albums</h2>
                <div className="grid grid-cols-4 gap-6">
                  {featuredAlbums.map((album) => (
                    <div
                      key={album.id}
                      onClick={() => onNavigate('playlist', {
                        title: album.title,
                        description: album.artist_name || 'Album',
                        imageUrl: album.cover_pic_url,
                        albumId: album.id
                      })}
                    >
                      <PlaylistCard
                        title={album.title}
                        description={album.artist_name || 'Album'}
                        imageUrl={album.cover_pic_url}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Top Artists */}
            {topArtists.length > 0 && (
              <div className="mb-12">
                <h2 className="text-white text-2xl mb-6">Top Artists</h2>
                <div className="grid grid-cols-5 gap-8">
                  {topArtists.map((artist) => (
                    <div
                      key={artist.id}
                      onClick={() => onNavigate('artist', { id: artist.id, stage_name: artist.stage_name })}
                    >
                      <ArtistCard
                        name={artist.stage_name}
                        imageUrl={`https://api.dicebear.com/7.x/avataaars/svg?seed=${artist.stage_name}`}
                        genre={artist.verified ? 'Verified' : 'Artist'}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Fallback: Top Music Playlists */}
            {songs.length === 0 && trendingNow.length > 0 && (
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
            )}
          </TabsContent>
        </Tabs>
      </div>
    </ScrollArea>
  );
}
