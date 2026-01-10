import { Plus, Heart, ListMusic, ArrowUpDown, Filter, Search, MoreVertical, Play, Clock, Loader2, Music } from 'lucide-react';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { ImageWithFallback } from './img/ImageWithFallback';
import { Input } from './ui/input';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from './ui/dropdown-menu';
import { getSongs, formatDuration, getLikedSongs, getFollowedArtists } from '../../services/api';
import { TrackTable } from './TrackTable';
import type { Song, Artist, Album, LikedSong, Follower } from '../../types/music';

interface LibraryPageProps {
  onNavigate: (page: string, data?: any) => void;
  category?: 'playlists' | 'songs' | 'artists' | 'albums';
}

export function LibraryPage({ onNavigate, category = 'playlists' }: LibraryPageProps) {
  const [songs, setSongs] = useState<Song[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [likedSongs, setLikedSongs] = useState<LikedSong[]>([]);
  const [followedArtists, setFollowedArtists] = useState<Follower[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [songsSearchQuery, setSongsSearchQuery] = useState('');
  const [songsSortBy, setSongsSortBy] = useState('Recently Added');
  const [songsFilter, setSongsFilter] = useState('All');
  const [generalSortBy, setGeneralSortBy] = useState('Recently Added');
  const [generalFilter, setGeneralFilter] = useState('All');

  // Fetch songs on component mount or when category changes
  useEffect(() => {
    const fetchData = async () => {
      if (category === 'playlists') {
        setLoading(false);
        return; // Playlists are user-created, no API call needed yet
      }

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

        // Fetch liked songs and followed artists if needed
        if (category === 'songs') {
          try {
            const liked = await getLikedSongs();
            setLikedSongs(liked);
          } catch (err) {
            console.error('Error fetching liked songs:', err);
          }
        }

        if (category === 'artists') {
          try {
            const followed = await getFollowedArtists();
            setFollowedArtists(followed);
          } catch (err) {
            console.error('Error fetching followed artists:', err);
          }
        }
      } catch (err) {
        console.error('Error fetching songs:', err);
        setError(err instanceof Error ? err.message : 'Failed to load music');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [category]);

  // Playlists will be fetched from API in the future
  const playlists: any[] = [];

  // Helper function to get song count for an artist
  const getArtistSongCount = (artistId: string): number => {
    return songs.filter(song => song.artist_id === artistId || song.artist?.id === artistId).length;
  };

  // Helper function to get song count for an album
  const getAlbumSongCount = (albumId: string): number => {
    return songs.filter(song => song.album_id === albumId || song.album?.id === albumId).length;
  };

  // Filter and search songs
  const filteredSongs = songs.filter(song => {
    const matchesSearch = song.title.toLowerCase().includes(songsSearchQuery.toLowerCase()) ||
                         (song.artist_name || song.artist?.stage_name || '').toLowerCase().includes(songsSearchQuery.toLowerCase()) ||
                         (song.album_title || song.album?.title || '').toLowerCase().includes(songsSearchQuery.toLowerCase());
    
    // Note: Downloaded/Offline filters would require additional backend data
    // For now, we'll just filter by search query
    return matchesSearch;
  });

  // Sort songs
  const sortedSongs = [...filteredSongs].sort((a, b) => {
    switch (songsSortBy) {
      case 'A → Z':
        return a.title.localeCompare(b.title);
      case 'Artist':
        const artistA = a.artist_name || a.artist?.stage_name || '';
        const artistB = b.artist_name || b.artist?.stage_name || '';
        return artistA.localeCompare(artistB);
      case 'Most Played':
        // Would need play count from backend
        return 0;
      case 'Recently Added':
      default:
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
  });

  // Transform songs to Track format for TrackTable
  const likedSongIds = new Set(likedSongs.map(ls => ls.song_id));
  const tracksForTable = sortedSongs.map((song, index) => ({
    number: index + 1,
    title: song.title,
    artist: song.artist_name || song.artist?.stage_name || 'Unknown Artist',
    album: song.album_title || song.album?.title || 'Unknown Album',
    duration: formatDuration(song.duration),
    liked: likedSongIds.has(song.id),
    songId: song.id, // Add song ID for like functionality
    song: song, // Include full song object for navigation
  }));

  // Get category title
  const getCategoryTitle = () => {
    switch (category) {
      case 'playlists': return 'Playlists';
      case 'songs': return 'Liked Songs';
      case 'artists': return 'Artists';
      case 'albums': return 'Albums';
      default: return 'Your Library';
    }
  };

  // Render content based on category
  const renderCategoryContent = () => {
    switch (category) {
      case 'playlists':
        return (
          <div className="grid grid-cols-5 gap-6">
            {/* Create Playlist Card */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-gradient-to-br from-[#00ff88]/20 to-[#00cc6e]/20 border-2 border-dashed border-[#00ff88] rounded-xl p-8 cursor-pointer flex flex-col items-center justify-center aspect-square"
            >
              <div className="w-16 h-16 bg-[#00ff88] rounded-full flex items-center justify-center mb-4">
                <Plus className="w-8 h-8 text-black" />
              </div>
              <h3 className="text-white">Create Playlist</h3>
            </motion.div>

            {/* Playlist Cards */}
            {playlists.map((playlist, index) => (
              <motion.div
                key={index}
                whileHover={{ scale: 1.05 }}
                className="group cursor-pointer"
                onClick={() => onNavigate('playlist', playlist)}
              >
                <div className="relative bg-[#1a1a1a] rounded-xl overflow-hidden mb-4 aspect-square">
                  {playlist.imageUrl ? (
                    <ImageWithFallback
                      src={playlist.imageUrl}
                      alt={playlist.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  ) : (
                    <div className={`w-full h-full bg-gradient-to-br ${playlist.gradient} flex items-center justify-center`}>
                      <ListMusic className="w-16 h-16 text-white/50" />
                    </div>
                  )}
                </div>
                <h3 className="text-white mb-1 group-hover:text-[#00ff88] transition-colors truncate">
                  {playlist.title}
                </h3>
                <p className="text-gray-400 text-sm">{playlist.songs} songs</p>
              </motion.div>
            ))}
          </div>
        );

      case 'albums':
        if (loading) {
          return (
            <div className="flex items-center justify-center py-16">
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="w-8 h-8 text-[#00ff88] animate-spin" />
                <p className="text-gray-400">Loading albums...</p>
              </div>
            </div>
          );
        }

        if (error) {
          return (
            <div className="text-center py-16">
              <p className="text-red-400 mb-4">Error: {error}</p>
              <Button onClick={() => window.location.reload()} variant="outline">
                Retry
              </Button>
            </div>
          );
        }

        if (albums.length === 0) {
          return (
            <div className="text-center py-16">
              <ListMusic className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-white text-xl mb-2">No albums found</h3>
              <p className="text-gray-400">Import songs to see albums here</p>
            </div>
          );
        }

        return (
          <div className="grid grid-cols-5 gap-6">
            {albums.map((album) => {
              const songCount = getAlbumSongCount(album.id);
              const releaseYear = album.release_date ? new Date(album.release_date).getFullYear() : null;
              return (
                <motion.div
                  key={album.id}
                  whileHover={{ scale: 1.05 }}
                  onClick={() => onNavigate('album', {
                    id: album.id,
                    title: album.title,
                    artist: album.artist_name || album.artist?.stage_name || 'Unknown Artist',
                    imageUrl: album.cover_pic_url,
                    year: releaseYear?.toString() || '',
                  })}
                  className="group cursor-pointer"
                >
                  <div className="relative bg-[#1a1a1a] rounded-xl overflow-hidden mb-4 aspect-square">
                    <ImageWithFallback
                      src={album.cover_pic_url}
                      alt={album.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  </div>
                  <h3 className="text-white mb-1 group-hover:text-[#00ff88] transition-colors truncate">
                    {album.title}
                  </h3>
                  <p className="text-gray-400 text-sm">
                    {album.artist_name || album.artist?.stage_name || 'Unknown Artist'}
                    {releaseYear && ` • ${releaseYear}`}
                  </p>
                  <p className="text-gray-500 text-xs mt-1">{songCount} {songCount === 1 ? 'song' : 'songs'}</p>
                </motion.div>
              );
            })}
          </div>
        );

      case 'artists':
        if (loading) {
          return (
            <div className="flex items-center justify-center py-16">
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="w-8 h-8 text-[#00ff88] animate-spin" />
                <p className="text-gray-400">Loading artists...</p>
              </div>
            </div>
          );
        }

        if (error) {
          return (
            <div className="text-center py-16">
              <p className="text-red-400 mb-4">Error: {error}</p>
              <Button onClick={() => window.location.reload()} variant="outline">
                Retry
              </Button>
            </div>
          );
        }

        // Show followed artists if available, otherwise show all artists
        const followedArtistIds = new Set(followedArtists.map(fa => fa.artist_id));
        const artistsToShow = followedArtists.length > 0
          ? artists.filter(artist => followedArtistIds.has(artist.id))
          : artists;

        if (artistsToShow.length === 0) {
          return (
            <div className="text-center py-16">
              <ListMusic className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-white text-xl mb-2">
                {followedArtists.length > 0 ? 'No followed artists' : 'No artists found'}
              </h3>
              <p className="text-gray-400">
                {followedArtists.length > 0 
                  ? 'You haven\'t followed any artists yet' 
                  : 'Import songs to see artists here'}
              </p>
            </div>
          );
        }

        return (
          <div className="grid grid-cols-5 gap-6">
            {artistsToShow.map((artist) => {
              const songCount = getArtistSongCount(artist.id);
              const isFollowed = followedArtistIds.has(artist.id);
              return (
                <motion.div
                  key={artist.id}
                  whileHover={{ scale: 1.05 }}
                  onClick={() => onNavigate('artist', {
                    id: artist.id,
                    stage_name: artist.stage_name,
                    verified: artist.verified,
                  })}
                  className="group cursor-pointer"
                >
                  <div className="relative bg-[#1a1a1a] rounded-full overflow-hidden mb-4 aspect-square">
                    <ImageWithFallback
                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${artist.stage_name}`}
                      alt={artist.stage_name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    {isFollowed && (
                      <div className="absolute top-2 right-2 bg-[#00ff88] text-black text-xs px-2 py-1 rounded-full font-semibold">
                        Following
                      </div>
                    )}
                  </div>
                  <h3 className="text-white mb-1 group-hover:text-[#00ff88] transition-colors truncate text-center">
                    {artist.stage_name}
                  </h3>
                  <p className="text-gray-400 text-sm text-center">
                    {songCount} {songCount === 1 ? 'song' : 'songs'}
                  </p>
                </motion.div>
              );
            })}
          </div>
        );

      case 'songs':
        if (loading) {
          return (
            <div className="flex items-center justify-center py-16">
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="w-8 h-8 text-[#00ff88] animate-spin" />
                <p className="text-gray-400">Loading songs...</p>
              </div>
            </div>
          );
        }

        if (error) {
          return (
            <div className="text-center py-16">
              <p className="text-red-400 mb-4">Error: {error}</p>
              <Button onClick={() => window.location.reload()} variant="outline">
                Retry
              </Button>
            </div>
          );
        }

        return (
          <div className="space-y-6">
            {/* Premium Summary Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative overflow-hidden rounded-2xl"
            >
              {/* Animated Gradient Background */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#a855f7] via-[#ec4899] to-[#ef4444]" />
              <motion.div
                animate={{ 
                  backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'],
                }}
                transition={{ 
                  duration: 10,
                  repeat: Infinity,
                  ease: "linear"
                }}
                className="absolute inset-0 bg-gradient-to-br from-[#00ff88]/20 via-transparent to-[#a855f7]/20"
                style={{ backgroundSize: '200% 200%' }}
              />
              
              {/* Content */}
              <div className="relative p-8 flex items-center gap-8">
                {/* Heart Icon */}
                <div className="relative">
                  <motion.div
                    animate={{ 
                      scale: [1, 1.1, 1],
                      opacity: [0.5, 0.8, 0.5]
                    }}
                    transition={{ 
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    className="absolute inset-0 bg-white/30 rounded-full blur-2xl"
                  />
                  <div className="relative w-24 h-24 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/20">
                    <Music className="w-12 h-12 text-white fill-white" />
                  </div>
                </div>

                {/* Text Content */}
                <div className="flex-1">
                  <h2 className="text-white text-3xl mb-2">All Songs</h2>
                  <p className="text-white/80 text-lg mb-1">{songs.length} songs</p>
                  <p className="text-white/60 text-sm">Your music library</p>
                </div>

                {/* Play All Button */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="relative group"
                >
                  <div className="absolute inset-0 bg-white/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-2xl">
                    <Play className="w-7 h-7 text-black fill-black ml-1" />
                  </div>
                </motion.button>
              </div>
            </motion.div>

            {/* Search and Controls Bar */}
            <div className="sticky top-0 bg-black/95 backdrop-blur-sm z-10 -mx-8 px-8 py-4 border-b border-[#1a1a1a]">
              <div className="flex items-center gap-4">
                {/* Search Bar */}
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    value={songsSearchQuery}
                    onChange={(e) => setSongsSearchQuery(e.target.value)}
                    placeholder="Search in Your Songs"
                    className="w-full bg-[#0F0F0F] border border-[#2a2a2a] focus-visible:border-[#00ff88] rounded-full pl-11 pr-4 h-10 text-white text-sm placeholder:text-gray-500"
                  />
                </div>

                {/* Sort Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="text-gray-400 hover:text-white gap-2 h-10">
                      <ArrowUpDown className="w-4 h-4" />
                      <span className="text-sm">{songsSortBy}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-[#1a1a1a] border-[#2a2a2a]">
                    <DropdownMenuItem 
                      className="text-gray-300 hover:text-white hover:bg-[#252525]"
                      onClick={() => setSongsSortBy('Recently Added')}
                    >
                      Recently Added
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="text-gray-300 hover:text-white hover:bg-[#252525]"
                      onClick={() => setSongsSortBy('A → Z')}
                    >
                      A → Z
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="text-gray-300 hover:text-white hover:bg-[#252525]"
                      onClick={() => setSongsSortBy('Artist')}
                    >
                      Artist
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="text-gray-300 hover:text-white hover:bg-[#252525]"
                      onClick={() => setSongsSortBy('Most Played')}
                    >
                      Most Played
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Filter Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="text-gray-400 hover:text-white gap-2 h-10">
                      <Filter className="w-4 h-4" />
                      <span className="text-sm">{songsFilter}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-[#1a1a1a] border-[#2a2a2a]">
                    <DropdownMenuItem 
                      className="text-gray-300 hover:text-white hover:bg-[#252525]"
                      onClick={() => setSongsFilter('All')}
                    >
                      All
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="text-gray-300 hover:text-white hover:bg-[#252525]"
                      onClick={() => setSongsFilter('Downloaded')}
                    >
                      Downloaded
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="text-gray-300 hover:text-white hover:bg-[#252525]"
                      onClick={() => setSongsFilter('Offline Available')}
                    >
                      Offline Available
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-[#2a2a2a]" />
                    <DropdownMenuItem 
                      className="text-gray-300 hover:text-white hover:bg-[#252525]"
                      onClick={() => setSongsFilter('Favorites')}
                    >
                      Favorites Only
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* TrackTable Component */}
            {sortedSongs.length > 0 ? (
              <TrackTable tracks={tracksForTable} onNavigate={onNavigate} />
            ) : (
              <div className="text-center py-16">
                <Music className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-white text-xl mb-2">No songs found</h3>
                <p className="text-gray-400">Try adjusting your search or import some songs</p>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <ScrollArea className="flex-1 h-full">
      <div className="p-8">
        {/* Header - No gap, immediately after title */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-white text-4xl">{getCategoryTitle()}</h1>
          
          {/* Show Sort/Filter only for non-Songs categories */}
          {category !== 'songs' && (
            <div className="flex items-center gap-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="text-gray-400 hover:text-white gap-2">
                    <ArrowUpDown className="w-4 h-4" />
                    <span className="text-sm">{generalSortBy}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-[#1a1a1a] border-[#2a2a2a]">
                  <DropdownMenuItem 
                    className="text-gray-300 hover:text-white hover:bg-[#252525]"
                    onClick={() => setGeneralSortBy('Recently Added')}
                  >
                    Recently Added
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="text-gray-300 hover:text-white hover:bg-[#252525]"
                    onClick={() => setGeneralSortBy('Alphabetical')}
                  >
                    Alphabetical
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="text-gray-300 hover:text-white hover:bg-[#252525]"
                    onClick={() => setGeneralSortBy('Most Played')}
                  >
                    Most Played
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="text-gray-400 hover:text-white gap-2">
                    <Filter className="w-4 h-4" />
                    <span className="text-sm">{generalFilter}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-[#1a1a1a] border-[#2a2a2a]">
                  <DropdownMenuItem 
                    className="text-gray-300 hover:text-white hover:bg-[#252525]"
                    onClick={() => setGeneralFilter('All')}
                  >
                    All
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="text-gray-300 hover:text-white hover:bg-[#252525]"
                    onClick={() => setGeneralFilter('Downloaded')}
                  >
                    Downloaded
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="text-gray-300 hover:text-white hover:bg-[#252525]"
                    onClick={() => setGeneralFilter('Public')}
                  >
                    Public
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="text-gray-300 hover:text-white hover:bg-[#252525]"
                    onClick={() => setGeneralFilter('Private')}
                  >
                    Private
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>

        {/* Dynamic Content Based on Category */}
        {renderCategoryContent()}
      </div>
    </ScrollArea>
  );
}