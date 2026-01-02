import { Plus, Heart, ListMusic, ArrowUpDown, Filter, Search, MoreVertical, Play, Clock } from 'lucide-react';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { ImageWithFallback } from './img/ImageWithFallback';
import { Input } from './ui/input';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from './ui/dropdown-menu';

interface LibraryPageProps {
  onNavigate: (page: string, data?: any) => void;
  category?: 'playlists' | 'songs' | 'artists' | 'albums';
}

export function LibraryPage({ onNavigate, category = 'playlists' }: LibraryPageProps) {
  const [songsSearchQuery, setSongsSearchQuery] = useState('');
  const [songsSortBy, setSongsSortBy] = useState('Recently Added');
  const [songsFilter, setSongsFilter] = useState('All');
  const [generalSortBy, setGeneralSortBy] = useState('Recently Added');
  const [generalFilter, setGeneralFilter] = useState('All');

  const playlists = [
    {
      title: 'My Favorite Mix',
      songs: 45,
      imageUrl: 'https://images.unsplash.com/photo-1692176548571-86138128e36c?w=300',
      isPrivate: false,
      downloaded: true,
    },
    {
      title: 'Workout Energy',
      songs: 32,
      imageUrl: 'https://images.unsplash.com/photo-1740459057005-65f000db582f?w=300',
      isPrivate: false,
      downloaded: false,
    },
    {
      title: 'Chill Vibes',
      songs: 28,
      imageUrl: 'https://images.unsplash.com/photo-1662012061995-0cd4a7ef2d12?w=300',
      isPrivate: true,
      downloaded: true,
    },
    {
      title: 'Focus Flow',
      songs: 18,
      imageUrl: null,
      isPrivate: false,
      downloaded: false,
      gradient: 'from-purple-500 to-pink-500',
    },
    {
      title: 'Party Hits',
      songs: 56,
      imageUrl: 'https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?w=300',
      isPrivate: false,
      downloaded: true,
    },
    {
      title: 'Road Trip',
      songs: 41,
      imageUrl: null,
      isPrivate: false,
      downloaded: false,
      gradient: 'from-orange-500 to-red-500',
    },
  ];

  const albums = [
    {
      title: 'Interstellar',
      artist: 'Nova Pulse',
      imageUrl: 'https://images.unsplash.com/photo-1692176548571-86138128e36c?w=300',
      year: 2025,
    },
    {
      title: 'Retrograde',
      artist: 'Synthwave',
      imageUrl: 'https://images.unsplash.com/photo-1744907529553-dc603ead4d4e?w=300',
      year: 2024,
    },
    {
      title: 'Digital Hearts',
      artist: 'Echo Dreams',
      imageUrl: 'https://images.unsplash.com/photo-1582024959432-aee9b60ff4e8?w=300',
      year: 2024,
    },
  ];

  const artists = [
    {
      name: 'Nova Pulse',
      followers: '2.4M',
      imageUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300',
    },
    {
      name: 'Echo Dreams',
      followers: '1.8M',
      imageUrl: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=300',
    },
    {
      name: 'Synthwave',
      followers: '3.2M',
      imageUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300',
    },
  ];

  // Liked Songs Data
  const likedSongs = [
    {
      id: 1,
      title: 'Neon Dreams',
      artist: 'Cyber Pulse',
      album: 'Digital Horizons',
      duration: '3:45',
      imageUrl: 'https://images.unsplash.com/photo-1692176548571-86138128e36c?w=100',
      isLiked: true,
      isDownloaded: true,
      addedAt: '2 days ago',
    },
    {
      id: 2,
      title: 'Electric Shadows',
      artist: 'Nova Wave',
      album: 'Retrograde',
      duration: '4:12',
      imageUrl: 'https://images.unsplash.com/photo-1744907529553-dc603ead4d4e?w=100',
      isLiked: true,
      isDownloaded: false,
      addedAt: '5 days ago',
    },
    {
      id: 3,
      title: 'Midnight Velocity',
      artist: 'Echo Dreams',
      album: 'Night Drive',
      duration: '3:58',
      imageUrl: 'https://images.unsplash.com/photo-1662012061995-0cd4a7ef2d12?w=100',
      isLiked: true,
      isDownloaded: true,
      addedAt: '1 week ago',
    },
    {
      id: 4,
      title: 'Crystal Skies',
      artist: 'Aurora Sound',
      album: 'Ethereal',
      duration: '5:23',
      imageUrl: 'https://images.unsplash.com/photo-1582024959432-aee9b60ff4e8?w=100',
      isLiked: true,
      isDownloaded: false,
      addedAt: '1 week ago',
    },
    {
      id: 5,
      title: 'Synthetic Love',
      artist: 'Digital Hearts',
      album: 'Future Romance',
      duration: '3:34',
      imageUrl: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=100',
      isLiked: true,
      isDownloaded: true,
      addedAt: '2 weeks ago',
    },
    {
      id: 6,
      title: 'Cosmic Journey',
      artist: 'Stellar Beats',
      album: 'Space Odyssey',
      duration: '4:45',
      imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100',
      isLiked: true,
      isDownloaded: false,
      addedAt: '2 weeks ago',
    },
    {
      id: 7,
      title: 'Urban Pulse',
      artist: 'City Lights',
      album: 'Metro',
      duration: '3:21',
      imageUrl: 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=100',
      isLiked: true,
      isDownloaded: true,
      addedAt: '3 weeks ago',
    },
    {
      id: 8,
      title: 'Serenity Now',
      artist: 'Calm Waves',
      album: 'Meditation Mix',
      duration: '6:12',
      imageUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=100',
      isLiked: true,
      isDownloaded: false,
      addedAt: '3 weeks ago',
    },
    {
      id: 9,
      title: 'Thunder Road',
      artist: 'Rock Legends',
      album: 'Greatest Hits',
      duration: '4:28',
      imageUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=100',
      isLiked: true,
      isDownloaded: true,
      addedAt: '1 month ago',
    },
    {
      id: 10,
      title: 'Deep Focus',
      artist: 'Concentration',
      album: 'Study Beats',
      duration: '5:56',
      imageUrl: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=100',
      isLiked: true,
      isDownloaded: false,
      addedAt: '1 month ago',
    },
    {
      id: 11,
      title: 'Solar Flare',
      artist: 'Cosmic Energy',
      album: 'Universe',
      duration: '4:02',
      imageUrl: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=100',
      isLiked: true,
      isDownloaded: true,
      addedAt: '1 month ago',
    },
    {
      id: 12,
      title: 'Velvet Nights',
      artist: 'Smooth Jazz',
      album: 'Late Night Sessions',
      duration: '5:18',
      imageUrl: 'https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?w=100',
      isLiked: true,
      isDownloaded: false,
      addedAt: '2 months ago',
    },
  ];

  // Filter and search songs
  const filteredSongs = likedSongs.filter(song => {
    const matchesSearch = song.title.toLowerCase().includes(songsSearchQuery.toLowerCase()) ||
                         song.artist.toLowerCase().includes(songsSearchQuery.toLowerCase()) ||
                         song.album.toLowerCase().includes(songsSearchQuery.toLowerCase());
    
    if (songsFilter === 'Downloaded') return matchesSearch && song.isDownloaded;
    if (songsFilter === 'Offline Available') return matchesSearch && song.isDownloaded;
    if (songsFilter === 'Favorites') return matchesSearch && song.isLiked;
    
    return matchesSearch;
  });

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
        return (
          <div className="grid grid-cols-5 gap-6">
            {albums.map((album, index) => (
              <motion.div
                key={index}
                whileHover={{ scale: 1.05 }}
                onClick={() => onNavigate('album', {
                  title: album.title,
                  artist: album.artist,
                  imageUrl: album.imageUrl,
                  year: album.year.toString(),
                })}
                className="group cursor-pointer"
              >
                <div className="relative bg-[#1a1a1a] rounded-xl overflow-hidden mb-4 aspect-square">
                  <ImageWithFallback
                    src={album.imageUrl}
                    alt={album.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                </div>
                <h3 className="text-white mb-1 group-hover:text-[#00ff88] transition-colors truncate">
                  {album.title}
                </h3>
                <p className="text-gray-400 text-sm">{album.artist} • {album.year}</p>
              </motion.div>
            ))}
          </div>
        );

      case 'artists':
        return (
          <div className="grid grid-cols-5 gap-6">
            {artists.map((artist, index) => (
              <motion.div
                key={index}
                whileHover={{ scale: 1.05 }}
                className="group cursor-pointer"
              >
                <div className="relative bg-[#1a1a1a] rounded-full overflow-hidden mb-4 aspect-square">
                  <ImageWithFallback
                    src={artist.imageUrl}
                    alt={artist.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                </div>
                <h3 className="text-white mb-1 group-hover:text-[#00ff88] transition-colors truncate text-center">
                  {artist.name}
                </h3>
                <p className="text-gray-400 text-sm text-center">{artist.followers} followers</p>
              </motion.div>
            ))}
          </div>
        );

      case 'songs':
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
                    <Heart className="w-12 h-12 text-white fill-white" />
                  </div>
                </div>

                {/* Text Content */}
                <div className="flex-1">
                  <h2 className="text-white text-3xl mb-2">Your Liked Songs</h2>
                  <p className="text-white/80 text-lg mb-1">{likedSongs.length} songs</p>
                  <p className="text-white/60 text-sm">Your favorite tracks all in one place</p>
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

            {/* Songs List Header */}
            <div className="grid grid-cols-[48px_1fr_1fr_80px_48px_48px] gap-4 px-4 py-2 text-gray-400 text-sm border-b border-[#1a1a1a]">
              <div className="text-center">#</div>
              <div>Title</div>
              <div>Album</div>
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
              </div>
              <div></div>
              <div></div>
            </div>

            {/* Songs List */}
            <div className="space-y-1">
              {filteredSongs.map((song, index) => (
                <motion.div
                  key={song.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  whileHover={{ backgroundColor: 'rgba(26, 26, 26, 0.5)' }}
                  className="grid grid-cols-[48px_1fr_1fr_80px_48px_48px] gap-4 px-4 py-3 rounded-lg cursor-pointer group items-center"
                >
                  {/* Song Cover */}
                  <div className="relative w-12 h-12 rounded-md overflow-hidden shadow-lg">
                    <ImageWithFallback
                      src={song.imageUrl}
                      alt={song.title}
                      className="w-full h-full object-cover"
                    />
                    <motion.div
                      initial={{ opacity: 0 }}
                      whileHover={{ opacity: 1 }}
                      className="absolute inset-0 bg-black/60 flex items-center justify-center"
                    >
                      <Play className="w-5 h-5 text-white fill-white" />
                    </motion.div>
                  </div>

                  {/* Title & Artist */}
                  <div className="min-w-0">
                    <h4 className="text-white truncate group-hover:text-[#00ff88] transition-colors">
                      {song.title}
                    </h4>
                    <p className="text-gray-400 text-sm truncate">{song.artist}</p>
                  </div>

                  {/* Album */}
                  <div className="text-gray-400 text-sm truncate">
                    {song.album}
                  </div>

                  {/* Duration */}
                  <div className="text-gray-400 text-sm">
                    {song.duration}
                  </div>

                  {/* Heart Icon */}
                  <div className="flex items-center justify-center">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="opacity-100 group-hover:opacity-100"
                    >
                      <Heart className={`w-5 h-5 ${song.isLiked ? 'text-[#00ff88] fill-[#00ff88]' : 'text-gray-400'}`} />
                    </motion.button>
                  </div>

                  {/* More Options */}
                  <div className="flex items-center justify-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <MoreVertical className="w-5 h-5 text-gray-400 hover:text-white" />
                        </motion.button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="bg-[#1a1a1a] border-[#2a2a2a]">
                        <DropdownMenuItem className="text-gray-300 hover:text-white hover:bg-[#252525]">
                          Add to Playlist
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-gray-300 hover:text-white hover:bg-[#252525]">
                          Go to Artist
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-gray-300 hover:text-white hover:bg-[#252525]">
                          Go to Album
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-[#2a2a2a]" />
                        <DropdownMenuItem className="text-gray-300 hover:text-white hover:bg-[#252525]">
                          Share
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-400 hover:text-red-300 hover:bg-[#252525]">
                          Remove from Liked Songs
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Empty State */}
            {filteredSongs.length === 0 && (
              <div className="text-center py-16">
                <Heart className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-white text-xl mb-2">No songs found</h3>
                <p className="text-gray-400">Try adjusting your search or filters</p>
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