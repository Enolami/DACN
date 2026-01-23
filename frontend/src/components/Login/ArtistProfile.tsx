import { ImageWithFallback } from './img/ImageWithFallback';
import { Play, Heart, Share2, MoreHorizontal, UserPlus, BadgeCheck, Music2, Disc3, Video, Info, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ArtistCard } from './ArtistCard';
import { Badge } from './ui/badge';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef, useState, useEffect } from 'react';
import { getSongs, followArtist, unfollowArtist, getFollowedArtists, getArtistFollowerCount, formatDuration } from '../../services/api';
import { TrackTable } from './TrackTable';
import { generateDefaultAvatar } from '../../utils/avatarUtils';
import type { Song, Artist, Album } from '../../types/music';

interface ArtistProfileProps {
  artist: {
    id?: string;
    stage_name?: string;
    name?: string;
    genre?: string;
    imageUrl?: string;
    verified?: boolean;
  };
  onNavigate?: (page: string, data?: any) => void;
}

export function ArtistProfile({ artist: initialArtist, onNavigate }: ArtistProfileProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [artist, setArtist] = useState<Artist | null>(null);
  const [artistSongs, setArtistSongs] = useState<Song[]>([]);
  const [artistAlbums, setArtistAlbums] = useState<Album[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [containerReady, setContainerReady] = useState(false);
  
  // Only use scroll when container is ready (mounted and not in loading/error states)
  const { scrollY } = useScroll({
    container: containerReady ? containerRef : undefined,
  });

  const headerOpacity = useTransform(scrollY, [0, 200], [1, 0]);
  const headerScale = useTransform(scrollY, [0, 200], [1, 0.8]);

  // Fetch artist data and songs
  useEffect(() => {
    const fetchArtistData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get artist ID
        const artistId = initialArtist.id;
        if (!artistId) {
          setError('Artist ID is required');
          setLoading(false);
          return;
        }

        // Fetch all songs and filter by artist
        const allSongs = await getSongs();
        const filteredSongs = allSongs.filter(
          song => song.artist_id === artistId || song.artist?.id === artistId
        );

        if (filteredSongs.length === 0) {
          setError('No songs found for this artist');
          setLoading(false);
          return;
        }

        // Extract artist from first song
        const artistData = filteredSongs[0].artist;
        if (artistData) {
          setArtist(artistData);
        }

        setArtistSongs(filteredSongs);

        // Extract unique albums
        const albumMap = new Map<string, Album>();
        filteredSongs.forEach((song) => {
          if (song.album && song.album.id) {
            albumMap.set(song.album.id, song.album);
          }
        });
        setArtistAlbums(Array.from(albumMap.values()));

        // Check if artist is followed
        const followedArtists = await getFollowedArtists();
        const followed = followedArtists.some(fa => fa.artist_id === artistId);
        setIsFollowing(followed);

        // Fetch follower count
        try {
          const followerData = await getArtistFollowerCount(artistId);
          setFollowerCount(followerData.follower_count);
        } catch (err) {
          console.error('Error fetching follower count:', err);
          // Set to 0 on error, don't fail the whole page
          setFollowerCount(0);
        }
      } catch (err) {
        console.error('Error fetching artist data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load artist');
      } finally {
        setLoading(false);
      }
    };

    fetchArtistData();
  }, [initialArtist.id]);

  // Set container ready when component is mounted and data is loaded
  // This must be called before any early returns (React hooks rule)
  useEffect(() => {
    if (containerRef.current && !loading && !error && artist) {
      setContainerReady(true);
    }
  }, [loading, error, artist]);

  // Handle follow/unfollow
  const handleFollowToggle = async () => {
    if (!artist) return;

    try {
      if (isFollowing) {
        await unfollowArtist(artist.id);
        setIsFollowing(false);
        // Update follower count
        setFollowerCount(prev => Math.max(0, prev - 1));
      } else {
        await followArtist(artist.id);
        setIsFollowing(true);
        // Update follower count
        setFollowerCount(prev => prev + 1);
      }
    } catch (err) {
      console.error('Error toggling follow:', err);
      // Revert on error
      setIsFollowing(!isFollowing);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-[#00ff88] animate-spin" />
          <p className="text-gray-400">Loading artist...</p>
        </div>
      </div>
    );
  }

  if (error || !artist) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-4">
          <p className="text-red-400">Error: {error || 'Artist not found'}</p>
          <Button onClick={() => onNavigate?.('home')} variant="outline">
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  const artistName = artist.stage_name || initialArtist.name || 'Unknown Artist';
  // Use artist image_url if available, otherwise generate avatar from first letter
  const artistImageUrl = artist.image_url || generateDefaultAvatar(artistName);

  // Transform songs to Track format
  const tracksForTable = artistSongs.map((song, index) => ({
    number: index + 1,
    title: song.title,
    artist: artistName,
    album: song.album_title || song.album?.title || 'Unknown Album',
    duration: formatDuration(song.duration),
    liked: false,
  }));

  const relatedArtists = [
    { name: 'Synthwave', imageUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=synth', genre: 'Retro Wave' },
    { name: 'Echo Dreams', imageUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=echo', genre: 'Ambient' },
    { name: 'Bass Drop', imageUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=bass', genre: 'Dubstep' },
    { name: 'Crystal Sound', imageUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=crystal', genre: 'Chill' },
  ];

  const genreTags = ['Electronic', 'Synthwave', 'Retro', 'Ambient'];
  const monthlyListeners = '12.4M';

  return (
    <div ref={containerRef} className="flex-1 h-full overflow-auto">
      {/* Hero Header with Scroll Effect */}
      <div className="relative h-[500px] overflow-hidden">
        {/* Background Image with Gradient */}
              <div className="absolute inset-0">
                <ImageWithFallback
                  src={artistImageUrl}
                  alt={artistName}
                  className="w-full h-full object-cover"
                />
          {/* Multi-layer Gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/60 to-black" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,255,136,0.15)_0%,transparent_70%)]" />
        </div>

        {/* Artist Info */}
        <motion.div
          style={{ opacity: headerOpacity, scale: headerScale }}
          className="absolute bottom-0 left-0 right-0 p-12"
        >
          <div className="flex items-end gap-8">
            {/* Circular Avatar */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ duration: 0.8, type: 'spring' }}
              className="relative"
            >
              <div className="w-56 h-56 rounded-full overflow-hidden border-4 border-[#00ff88] shadow-2xl ring-4 ring-[#00ff88]/20">
                <ImageWithFallback
                  src={artistImageUrl}
                  alt={artistName}
                  className="w-full h-full object-cover"
                />
              </div>
              {/* Glow effect */}
              <div className="absolute -inset-4 bg-[#00ff88]/20 rounded-full blur-2xl -z-10" />
            </motion.div>

            <div className="flex-1 pb-6">
              {/* Verified Badge & Monthly Listeners */}
              <div className="flex items-center gap-3 mb-3">
                {artist.verified && (
                  <div className="flex items-center gap-2 bg-[#00ff88]/20 backdrop-blur-sm px-3 py-1 rounded-full border border-[#00ff88]/30">
                    <BadgeCheck className="w-4 h-4 text-[#00ff88]" />
                    <span className="text-sm text-[#00ff88]">Verified Artist</span>
                  </div>
                )}
                <span className="text-gray-400">{artistSongs.length} {artistSongs.length === 1 ? 'song' : 'songs'}</span>
              </div>

              <h1 className="text-white text-7xl mb-4">{artistName}</h1>
              
              {/* Genre Tags */}
              {initialArtist.genre && (
                <div className="flex flex-wrap gap-2 mb-6">
                  <Badge className="bg-white/10 text-white border-white/20 backdrop-blur-sm">
                    {initialArtist.genre}
                  </Badge>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-4">
                <Button className="bg-[#00ff88] hover:bg-[#00ff88]/80 text-black gap-2 px-10 py-7 rounded-full shadow-lg shadow-[#00ff88]/30">
                  <Play className="w-6 h-6 fill-black" />
                  Play
                </Button>
                <Button
                  onClick={handleFollowToggle}
                  className={`border-2 ${
                    isFollowing
                      ? 'bg-transparent border-white text-white hover:bg-white/10'
                      : 'bg-transparent border-[#00ff88] text-[#00ff88] hover:bg-[#00ff88]/10'
                  } gap-2 px-10 py-7 rounded-full`}
                >
                  <UserPlus className="w-5 h-5" />
                  {isFollowing ? 'Following' : 'Follow'}
                </Button>
                <Button variant="ghost" size="icon" className="w-14 h-14 text-gray-300 hover:text-white hover:bg-white/10 rounded-full">
                  <Share2 className="w-6 h-6" />
                </Button>
                <Button variant="ghost" size="icon" className="w-14 h-14 text-gray-300 hover:text-white hover:bg-white/10 rounded-full">
                  <MoreHorizontal className="w-6 h-6" />
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Content Tabs */}
      <div className="p-8 pt-12">
        <Tabs defaultValue="popular" className="w-full">
          <TabsList className="bg-transparent border-b border-[#1a1a1a] rounded-none p-0 h-auto gap-8 mb-10">
            <TabsTrigger
              value="popular"
              className="bg-transparent rounded-none border-b-2 border-transparent data-[state=active]:border-[#00ff88] data-[state=active]:text-[#00ff88] text-gray-400 pb-4 gap-2"
            >
              <Music2 className="w-4 h-4" />
              Popular
            </TabsTrigger>
            <TabsTrigger
              value="albums"
              className="bg-transparent rounded-none border-b-2 border-transparent data-[state=active]:border-[#00ff88] data-[state=active]:text-[#00ff88] text-gray-400 pb-4 gap-2"
            >
              <Disc3 className="w-4 h-4" />
              Albums
            </TabsTrigger>
            <TabsTrigger
              value="singles"
              className="bg-transparent rounded-none border-b-2 border-transparent data-[state=active]:border-[#00ff88] data-[state=active]:text-[#00ff88] text-gray-400 pb-4 gap-2"
            >
              <Music2 className="w-4 h-4" />
              Singles & EPs
            </TabsTrigger>
            <TabsTrigger
              value="about"
              className="bg-transparent rounded-none border-b-2 border-transparent data-[state=active]:border-[#00ff88] data-[state=active]:text-[#00ff88] text-gray-400 pb-4 gap-2"
            >
              <Info className="w-4 h-4" />
              About
            </TabsTrigger>
          </TabsList>

          {/* Popular Tracks */}
          <TabsContent value="popular" className="mt-0">
            <div className="mb-12">
              <h2 className="text-white text-2xl mb-6">All Tracks ({artistSongs.length})</h2>
              {artistSongs.length > 0 ? (
                <TrackTable tracks={tracksForTable} onNavigate={onNavigate} />
              ) : (
                <div className="text-center py-16">
                  <Music2 className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-white text-xl mb-2">No songs found</h3>
                  <p className="text-gray-400">This artist has no songs yet</p>
                </div>
              )}
            </div>

          </TabsContent>

          {/* Albums */}
          <TabsContent value="albums" className="mt-0">
            {artistAlbums.length > 0 ? (
              <div className="grid grid-cols-3 gap-8">
                {artistAlbums.map((album) => {
                  const releaseYear = album.release_date ? new Date(album.release_date).getFullYear() : null;
                  const songCount = artistSongs.filter(song => song.album_id === album.id || song.album?.id === album.id).length;
                  return (
                    <motion.div
                      key={album.id}
                      whileHover={{ scale: 1.05, y: -5 }}
                      onClick={() => onNavigate?.('album', {
                        id: album.id,
                        title: album.title,
                        artist: artistName,
                        imageUrl: album.cover_pic_url,
                        year: releaseYear?.toString() || '',
                      })}
                      className="group cursor-pointer"
                    >
                      <div className="relative bg-[#1a1a1a] rounded-2xl overflow-hidden mb-4 aspect-square">
                        <ImageWithFallback
                          src={album.cover_pic_url}
                          alt={album.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                        {/* Hover Overlay */}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Button className="bg-[#00ff88] hover:bg-[#00ff88]/80 text-black rounded-full w-16 h-16">
                            <Play className="w-6 h-6 fill-black" />
                          </Button>
                        </div>
                        {/* Year Badge */}
                        {releaseYear && (
                          <div className="absolute top-4 right-4 bg-black/80 backdrop-blur-sm px-3 py-1 rounded-full">
                            <span className="text-white text-sm">{releaseYear}</span>
                          </div>
                        )}
                      </div>
                      <h3 className="text-white text-xl mb-1 group-hover:text-[#00ff88] transition-colors">{album.title}</h3>
                      <p className="text-gray-400">Album {releaseYear && `• ${releaseYear}`} • {songCount} {songCount === 1 ? 'song' : 'songs'}</p>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-16">
                <Disc3 className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-white text-xl mb-2">No albums found</h3>
                <p className="text-gray-400">This artist has no albums yet</p>
              </div>
            )}
          </TabsContent>

          {/* Singles & EPs */}
          <TabsContent value="singles" className="mt-0">
            {/* For now, show songs without albums as singles */}
            {artistSongs.filter(song => !song.album_id && !song.album).length > 0 ? (
              <div className="overflow-x-auto pb-4">
                <div className="flex gap-6" style={{ width: 'max-content' }}>
                  {artistSongs
                    .filter(song => !song.album_id && !song.album)
                    .map((song) => {
                      const imageUrl = song.image_url || null;
                      return (
                        <motion.div
                          key={song.id}
                          whileHover={{ scale: 1.05, y: -5 }}
                          onClick={() => onNavigate?.('song', { song })}
                          className="group cursor-pointer w-64"
                        >
                          <div className="relative bg-[#1a1a1a] rounded-2xl overflow-hidden mb-4 aspect-square">
                            <ImageWithFallback
                              src={imageUrl || undefined}
                              alt={song.title}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <Button className="bg-[#00ff88] hover:bg-[#00ff88]/80 text-black rounded-full w-16 h-16">
                                <Play className="w-6 h-6 fill-black" />
                              </Button>
                            </div>
                          </div>
                          <h3 className="text-white mb-1 group-hover:text-[#00ff88] transition-colors truncate">{song.title}</h3>
                          <p className="text-gray-400 text-sm">Single</p>
                        </motion.div>
                      );
                    })}
                </div>
              </div>
            ) : (
              <div className="text-center py-16">
                <Music2 className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-white text-xl mb-2">No singles found</h3>
                <p className="text-gray-400">This artist has no singles yet</p>
              </div>
            )}
          </TabsContent>

          {/* About */}
          <TabsContent value="about" className="mt-0">
            <div className="max-w-4xl space-y-8">
              {/* Biography */}
              <div className="bg-[#1a1a1a] rounded-2xl p-8">
                <h3 className="text-white text-2xl mb-6">About</h3>
                <div className="space-y-4 text-gray-300 leading-relaxed">
                  <p>
                    {artistName} {artist.verified && 'is a verified artist'} with {artistSongs.length} {artistSongs.length === 1 ? 'song' : 'songs'} 
                    {artistAlbums.length > 0 && ` across ${artistAlbums.length} ${artistAlbums.length === 1 ? 'album' : 'albums'}`}.
                  </p>
                  {initialArtist.genre && (
                    <p>
                      Genre: {initialArtist.genre}
                    </p>
                  )}
                </div>
              </div>

              {/* Stats & Info */}
              <div className="grid grid-cols-3 gap-6">
                <div className="bg-[#1a1a1a] rounded-2xl p-6 text-center">
                  <div className="text-[#00ff88] text-3xl mb-2">{artistSongs.length}</div>
                  <div className="text-gray-400">Songs</div>
                </div>
                <div className="bg-[#1a1a1a] rounded-2xl p-6 text-center">
                  <div className="text-[#a855f7] text-3xl mb-2">{artistAlbums.length}</div>
                  <div className="text-gray-400">Albums</div>
                </div>
                <div className="bg-[#1a1a1a] rounded-2xl p-6 text-center">
                  <div className="text-[#00ff88] text-3xl mb-2">{followerCount}</div>
                  <div className="text-gray-400">Followers</div>
                </div>
              </div>

            </div>
          </TabsContent>
        </Tabs>
        <div className="pb-32"></div>
      </div>
    </div>
  );
}
