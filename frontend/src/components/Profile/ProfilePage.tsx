import { ImageWithFallback } from '../Login/img/ImageWithFallback';
import { Play, Heart, Share2, MoreHorizontal, Edit, Settings, Music2, ListMusic, UserPlus, Users, Calendar, Camera, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '../Login/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../Login/ui/tabs';
import { PlaylistCard } from '../Login/PlaylistCard';
import { ArtistCard } from '../Login/ArtistCard';
import { Badge } from '../Login/ui/badge';
import { ScrollArea } from '../Login/ui/scroll-area';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef, useState, useEffect, useMemo } from 'react';
import { ImagePickerDialog } from './ImagePickerDialog';
import { EditProfileDialog } from './EditProfileDialog';
import { SettingsDialog } from './SettingsDialog';
import { getProfile, updateProfile, uploadAvatar, removeAvatar, ProfileData, getPlaylists, getLikedSongs, getFollowedArtists, getSong, formatDuration } from '../../services/api';
import { generateDefaultAvatar } from '../../utils/avatarUtils';
import type { Playlist, LikedSong, Follower, Song, SongDetail, Artist } from '../../types/music';

interface ProfilePageProps {
  onNavigate?: (page: string, data?: any) => void;
  onLogout?: () => void;
  onPlaySong?: (song: Song) => void; // Optional callback to play song directly
}

export function ProfilePage({ onNavigate, onLogout, onPlaySong }: ProfilePageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isImageDialogOpen, setIsImageDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Profile state
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [userImageUrl, setUserImageUrl] = useState(generateDefaultAvatar('User'));
  const [userName, setUserName] = useState(''); // Display name (from Profile.name)
  const [userUsername, setUserUsername] = useState(''); // Username (from User.username)
  const [userBio, setUserBio] = useState('');

  // User data state
  const [userPlaylists, setUserPlaylists] = useState<Playlist[]>([]);
  const [likedSongs, setLikedSongs] = useState<Song[]>([]);
  const [followedArtists, setFollowedArtists] = useState<Artist[]>([]);
  const [isLoadingPlaylists, setIsLoadingPlaylists] = useState(false);
  const [isLoadingLikedSongs, setIsLoadingLikedSongs] = useState(false);
  const [isLoadingFollowedArtists, setIsLoadingFollowedArtists] = useState(false);
  const [errorPlaylists, setErrorPlaylists] = useState<string | null>(null);
  const [errorLikedSongs, setErrorLikedSongs] = useState<string | null>(null);
  const [errorFollowedArtists, setErrorFollowedArtists] = useState<string | null>(null);

  // Use scroll - container ref is always attached since container div is always rendered
  const { scrollY } = useScroll({
    container: containerRef,
  });

  const headerOpacity = useTransform(scrollY, [0, 200], [1, 0]);
  const headerScale = useTransform(scrollY, [0, 200], [1, 0.8]);

  // Fetch profile on mount
  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getProfile();
        setProfile(data);
        // Prioritize name over first_name (name is the actual field, first_name is alias)
        const displayName = data.name || data.first_name || data.username || 'User';
        setUserName(displayName); // Display name from Profile.name
        setUserUsername(data.username || ''); // Username from User.username
        setUserBio(data.bio || '');
        setUserImageUrl(
          data.avatar_url && data.avatar_url.trim() !== ''
            ? data.avatar_url
            : generateDefaultAvatar(data.username || 'User')
        );
      } catch (err: any) {
        console.error('Failed to fetch profile:', err);
        setError(err.message || 'Failed to load profile');
        // Set defaults on error
        setUserName('User');
        setUserBio('');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, []);

  // Fetch user playlists
  const fetchPlaylists = async () => {
    setIsLoadingPlaylists(true);
    setErrorPlaylists(null);
    try {
      const allPlaylists = await getPlaylists();
      // Filter to show only user's own playlists
      // getPlaylists() already filters by owner, but we double-check by username
      const userOwnedPlaylists = allPlaylists.filter(
        (playlist) => playlist.owner_username === userUsername
      );
      setUserPlaylists(userOwnedPlaylists);
    } catch (err: any) {
      console.error('Failed to fetch playlists:', err);
      setErrorPlaylists(err.message || 'Failed to load playlists');
    } finally {
      setIsLoadingPlaylists(false);
    }
  };

  useEffect(() => {
    if (userUsername) {
      fetchPlaylists();
    }
  }, [userUsername]);

  // Fetch liked songs
  const fetchLikedSongs = async () => {
    setIsLoadingLikedSongs(true);
    setErrorLikedSongs(null);
    try {
      const likedSongsData = await getLikedSongs();
      // Fetch full song details for each liked song
      const songsPromises = likedSongsData.map(async (likedSong) => {
        try {
          const songDetail = await getSong(likedSong.song_id);
          return songDetail;
        } catch (err) {
          console.error(`Failed to fetch song ${likedSong.song_id}:`, err);
          return null;
        }
      });
      const songs = await Promise.all(songsPromises);
      // Filter out null values (failed fetches) and convert SongDetail to Song
      const validSongs: Song[] = songs
        .filter((song): song is SongDetail => song !== null)
        .map((songDetail) => ({
          ...songDetail,
          mfcc_vector: songDetail.mfcc_vector ?? null,
        }));
      setLikedSongs(validSongs);
      if (validSongs.length === 0 && likedSongsData.length > 0) {
        setErrorLikedSongs('Some songs could not be loaded');
      }
    } catch (err: any) {
      console.error('Failed to fetch liked songs:', err);
      setErrorLikedSongs(err.message || 'Failed to load liked songs');
    } finally {
      setIsLoadingLikedSongs(false);
    }
  };

  useEffect(() => {
    fetchLikedSongs();
  }, []);

  // Fetch followed artists
  const fetchFollowedArtists = async () => {
    setIsLoadingFollowedArtists(true);
    setErrorFollowedArtists(null);
    try {
      const followers = await getFollowedArtists();
      // Transform Follower[] to Artist[] format
      // Note: Follower serializer doesn't include full artist data, so we need to fetch it
      // For now, create minimal Artist objects - we'll need to fetch full artist details if needed
      const artists: Artist[] = followers.map((follower) => ({
        id: follower.artist_id,
        stage_name: follower.artist_name,
        image_url: null, // Will be fetched separately if needed, or use generateDefaultAvatar
        jamendo_artist_id: null, // Not available in Follower serializer
        verified: false, // Not available in Follower serializer
        created_at: '', // Not available
        updated_at: '', // Not available
      }));
      setFollowedArtists(artists);
    } catch (err: any) {
      console.error('Failed to fetch followed artists:', err);
      setErrorFollowedArtists(err.message || 'Failed to load followed artists');
    } finally {
      setIsLoadingFollowedArtists(false);
    }
  };

  useEffect(() => {
    fetchFollowedArtists();
  }, []);

  // Format join date
  const formatJoinDate = (dateString: string) => {
    if (!dateString) return 'Recently';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  // User data derived from profile
  const user = {
    name: userName, // Display name (Profile.name)
    username: userUsername || profile?.username || 'user', // Username (User.username)
    bio: userBio,
    imageUrl: userImageUrl,
    coverImageUrl: 'https://images.unsplash.com/photo-1596807323443-a1528e2cd0ec?w=1600',
    joinDate: profile?.join_date ? formatJoinDate(profile.join_date) : 'Recently',
    location: 'New York, USA', // Not in schema yet
  };

  const handleImageSelect = async (imageUrl: string) => {
    try {
      setIsUploadingAvatar(true);
      setError(null);
      const updatedProfile = await uploadAvatar(imageUrl);
      setProfile(updatedProfile);
      setUserImageUrl(updatedProfile.avatar_url || imageUrl);
      
      // Dispatch event to notify other components (like TopNavigation) that profile was updated
      window.dispatchEvent(new CustomEvent('profileUpdated'));
    } catch (err: any) {
      console.error('Failed to upload avatar:', err);
      setError(err.message || 'Failed to upload avatar');
      throw err; // Re-throw to let dialog know upload failed
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleRemoveAvatar = async () => {
    try {
      setIsUploadingAvatar(true);
      setError(null);
      const updatedProfile = await removeAvatar();
      setProfile(updatedProfile);
      // Use default avatar with first letter of username
      const defaultAvatar = generateDefaultAvatar(updatedProfile.username || 'User');
      setUserImageUrl(defaultAvatar);
      
      // Dispatch event to notify other components (like TopNavigation) that profile was updated
      window.dispatchEvent(new CustomEvent('profileUpdated'));
    } catch (err: any) {
      console.error('Failed to remove avatar:', err);
      setError(err.message || 'Failed to remove avatar');
      throw err; // Re-throw to let dialog know removal failed
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleProfileSave = async (name: string, bio: string) => {
    try {
      setIsLoading(true);
      const updatedProfile = await updateProfile(name, bio);
      setProfile(updatedProfile);
      setUserName(updatedProfile.name || updatedProfile.first_name || 'User');
      setUserUsername(updatedProfile.username || '');
      setUserBio(updatedProfile.bio || '');
      
      // Dispatch event to notify other components (like TopNavigation) that profile was updated
      window.dispatchEvent(new CustomEvent('profileUpdated'));
    } catch (err: any) {
      console.error('Failed to update profile:', err);
      setError(err.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate stats from fetched data (memoized for performance)
  const stats = useMemo(() => ({
    playlists: userPlaylists.length,
    following: followedArtists.length,
    songs: likedSongs.length,
  }), [userPlaylists.length, followedArtists.length, likedSongs.length]);

  // Memoize sorted recent playlists for performance
  const recentPlaylists = useMemo(() => {
    return userPlaylists
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 3);
  }, [userPlaylists]);

  // Memoize recently liked songs (first 5) for performance
  const recentlyLikedSongs = useMemo(() => {
    return likedSongs.slice(0, 5);
  }, [likedSongs]);

  // Favorite genres (optional - derive from liked songs if needed)
  const favoriteGenres: string[] = [];

  return (
    <div ref={containerRef} className="flex-1 h-full overflow-auto">
      {isLoading && !profile ? (
        <div className="flex-1 h-full flex items-center justify-center">
          <div className="text-gray-400">Loading profile...</div>
        </div>
      ) : (
        <>
          {error && (
            <div className="m-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}
       {/* Hero Header with Scroll Effect */}
       <div className="relative h-[400px] sm:h-[450px] md:h-[500px] overflow-hidden">
        {/* Background Image with Gradient */}
        <div className="absolute inset-0">
          <ImageWithFallback
            src={user.coverImageUrl}
            alt={user.name}
            className="w-full h-full object-cover"
          />
          {/* Multi-layer Gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/60 to-black" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,255,136,0.15)_0%,transparent_70%)]" />
        </div>

        {/* User Info */}
        <motion.div
          style={{ opacity: headerOpacity, scale: headerScale }}
          className="absolute bottom-0 left-0 right-0 p-6 sm:p-8 md:p-12"
        >
          <div className="flex flex-col sm:flex-row items-end gap-4 sm:gap-6 md:gap-8">
            {/* Circular Avatar with Hover Effect */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ duration: 0.8, type: 'spring' }}
              className="relative group cursor-pointer flex-shrink-0"
              onClick={() => setIsImageDialogOpen(true)}
            >
              <div className="w-32 h-32 sm:w-40 sm:h-40 md:w-56 md:h-56 rounded-full overflow-hidden border-4 border-[#00ff88] shadow-2xl ring-4 ring-[#00ff88]/20 relative">
                <ImageWithFallback
                  src={user.imageUrl}
                  alt={user.name}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                />
                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    whileHover={{ scale: 1 }}
                    className="flex flex-col items-center gap-2"
                  >
                    <div className="w-12 h-12 rounded-full bg-[#00ff88] flex items-center justify-center shadow-lg">
                      <Camera className="w-6 h-6 text-black" />
                    </div>
                    <span className="text-white text-sm font-medium">Choose Photo</span>
                  </motion.div>
                </div>
              </div>
              {/* Glow effect */}
              <div className="absolute -inset-4 bg-[#00ff88]/20 rounded-full blur-2xl -z-10" />
            </motion.div>

            <div className="flex-1 pb-6">
              {/* User Badge & Join Date */}
              <div className="flex items-center gap-3 mb-3">
                <div className="flex items-center gap-2 text-gray-400">
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm">Joined {user.joinDate}</span>
                </div>
              </div>

               <h1 className="text-white text-4xl sm:text-5xl md:text-6xl lg:text-7xl mb-2">{user.name}</h1>
               <p className="text-gray-400 text-base sm:text-lg mb-4">{user.username}</p>
              
              {/* Genre Tags */}
              <div className="flex flex-wrap gap-2 mb-6">
                {favoriteGenres.map((genre, index) => (
                  <Badge
                    key={index}
                    className="bg-white/10 text-white border-white/20 backdrop-blur-sm"
                  >
                    {genre}
                  </Badge>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-4">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="w-14 h-14 text-gray-300 hover:text-white hover:bg-white/10 rounded-full"
                  onClick={() => setIsEditDialogOpen(true)}
                >
                  <Edit className="w-6 h-6" />
                </Button>
                <Button variant="ghost" size="icon" className="w-14 h-14 text-gray-300 hover:text-white hover:bg-white/10 rounded-full">
                  <Share2 className="w-6 h-6" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="w-14 h-14 text-gray-300 hover:text-white hover:bg-white/10 rounded-full"
                  onClick={() => setIsSettingsDialogOpen(true)}
                >
                  <Settings className="w-6 h-6" />
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
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="bg-transparent border-b border-[#1a1a1a] rounded-none p-0 h-auto gap-8 mb-10">
            <TabsTrigger
              value="overview"
              className="bg-transparent rounded-none border-b-2 border-transparent data-[state=active]:border-[#00ff88] data-[state=active]:text-[#00ff88] text-gray-400 pb-4 gap-2"
            >
              <UserPlus className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="playlists"
              className="bg-transparent rounded-none border-b-2 border-transparent data-[state=active]:border-[#00ff88] data-[state=active]:text-[#00ff88] text-gray-400 pb-4 gap-2"
            >
              <ListMusic className="w-4 h-4" />
              Playlists
            </TabsTrigger>
            <TabsTrigger
              value="liked"
              className="bg-transparent rounded-none border-b-2 border-transparent data-[state=active]:border-[#00ff88] data-[state=active]:text-[#00ff88] text-gray-400 pb-4 gap-2"
            >
              <Heart className="w-4 h-4" />
              Liked Songs
            </TabsTrigger>
            <TabsTrigger
              value="artists"
              className="bg-transparent rounded-none border-b-2 border-transparent data-[state=active]:border-[#00ff88] data-[state=active]:text-[#00ff88] text-gray-400 pb-4 gap-2"
            >
              <Music2 className="w-4 h-4" />
              Following
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="mt-0">
            <div className="max-w-4xl space-y-8 pb-24">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                <div className="bg-[#1a1a1a] rounded-2xl p-6 text-center">
                  {isLoadingPlaylists ? (
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="w-6 h-6 text-[#00ff88] animate-spin" />
                      <div className="text-gray-400 text-sm">Loading...</div>
                    </div>
                  ) : (
                    <>
                      <div className="text-[#00ff88] text-3xl mb-2 font-bold">{stats.playlists}</div>
                      <div className="text-gray-400">Playlists</div>
                    </>
                  )}
                </div>
                <div className="bg-[#1a1a1a] rounded-2xl p-6 text-center">
                  {isLoadingFollowedArtists ? (
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="w-6 h-6 text-[#00ff88] animate-spin" />
                      <div className="text-gray-400 text-sm">Loading...</div>
                    </div>
                  ) : (
                    <>
                      <div className="text-[#00ff88] text-3xl mb-2 font-bold">{stats.following}</div>
                      <div className="text-gray-400">Following</div>
                    </>
                  )}
                </div>
                <div className="bg-[#1a1a1a] rounded-2xl p-6 text-center">
                  {isLoadingLikedSongs ? (
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="w-6 h-6 text-[#ec4899] animate-spin" />
                      <div className="text-gray-400 text-sm">Loading...</div>
                    </div>
                  ) : (
                    <>
                      <div className="text-[#ec4899] text-3xl mb-2 font-bold">{stats.songs}</div>
                      <div className="text-gray-400">Liked Songs</div>
                    </>
                  )}
                </div>
              </div>

              {/* Bio Section */}
              <div className="bg-[#1a1a1a] rounded-2xl p-8">
                <h3 className="text-white text-2xl mb-6">About</h3>
                <div className="space-y-4 text-gray-300 leading-relaxed">
                  <p>{user.bio}</p>
                  <div className="flex items-center gap-4 pt-4 border-t border-[#2a2a2a]">
                    <div className="flex items-center gap-2 text-gray-400">
                      <Calendar className="w-4 h-4" />
                      <span>Joined {user.joinDate}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-400">
                      <Users className="w-4 h-4" />
                      <span>{user.location}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Playlists */}
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-white text-2xl">Recent Playlists</h2>
                  {userPlaylists.length > 3 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-gray-400 hover:text-white"
                      onClick={() => {
                        // Switch to playlists tab
                        const playlistsTab = document.querySelector('[value="playlists"]') as HTMLElement;
                        playlistsTab?.click();
                      }}
                    >
                      View All
                    </Button>
                  )}
                </div>
                {isLoadingPlaylists ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="w-8 h-8 text-[#00ff88] animate-spin" />
                      <p className="text-gray-400">Loading playlists...</p>
                    </div>
                  </div>
                ) : errorPlaylists ? (
                  <div className="text-center py-12">
                    <div className="flex flex-col items-center gap-3">
                      <p className="text-red-400 mb-2">{errorPlaylists}</p>
                      <Button
                        onClick={fetchPlaylists}
                        variant="outline"
                        size="sm"
                        className="bg-transparent border-[#00ff88] text-[#00ff88] hover:bg-[#00ff88]/10"
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Retry
                      </Button>
                    </div>
                  </div>
                ) : userPlaylists.length === 0 ? (
                  <div className="text-center py-12 bg-[#1a1a1a] rounded-2xl">
                    <ListMusic className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-400 text-lg mb-1">No playlists yet</p>
                    <p className="text-gray-500 text-sm">Create your first playlist to get started</p>
                  </div>
                 ) : (
                   <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                     {recentPlaylists.map((playlist) => (
                        <motion.div
                          key={playlist.id}
                          whileHover={{ scale: 1.02 }}
                          onClick={() => onNavigate?.('playlist', playlist)}
                          className="cursor-pointer"
                        >
                          <PlaylistCard 
                            title={playlist.title}
                            description={`${playlist.song_count} ${playlist.song_count === 1 ? 'song' : 'songs'}`}
                            imageUrl=""
                          />
                        </motion.div>
                      ))}
                  </div>
                )}
              </div>

              {/* Recently Liked Songs */}
              {likedSongs.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-white text-2xl">Recently Liked</h2>
                    {likedSongs.length > 5 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-gray-400 hover:text-white"
                        onClick={() => {
                          // Switch to liked songs tab
                          const likedTab = document.querySelector('[value="liked"]') as HTMLElement;
                          likedTab?.click();
                        }}
                      >
                        View All
                      </Button>
                    )}
                  </div>
                   <div className="space-y-2">
                     {recentlyLikedSongs.map((song, index) => {
                        const imageUrl = song.image_url || song.album?.cover_pic_url || '';
                        const artistName = song.artist_name || song.album?.artist_name || song.artist?.stage_name || 'Unknown Artist';
                        return (
                          <motion.div
                            key={song.id}
                            whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
                            className="flex items-center gap-4 p-3 rounded-xl cursor-pointer group"
                            onClick={() => onNavigate?.('song', song)}
                          >
                            <div className="w-8 text-center">
                              <span className="text-gray-400 group-hover:hidden text-sm">{index + 1}</span>
                              <Play className="w-4 h-4 text-[#00ff88] fill-[#00ff88] hidden group-hover:block mx-auto" />
                            </div>
                            
                            <div className="w-12 h-12 rounded-lg overflow-hidden bg-[#1a1a1a] flex-shrink-0">
                              <ImageWithFallback
                                src={imageUrl}
                                alt={song.title}
                                className="w-full h-full object-cover"
                              />
                            </div>

                            <div className="flex-1 min-w-0">
                              <h3 className="text-white group-hover:text-[#00ff88] transition-colors truncate text-sm font-medium">{song.title}</h3>
                              <p className="text-gray-400 text-xs truncate">{artistName}</p>
                            </div>

                            <span className="text-gray-400 text-xs w-12 text-right">{formatDuration(song.duration)}</span>
                          </motion.div>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Playlists Tab */}
          <TabsContent value="playlists" className="mt-0">
            <div className="mb-6 pb-24">
              <h2 className="text-white text-2xl mb-6">Your Playlists</h2>
              {isLoadingPlaylists ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-gray-400">Loading playlists...</div>
                </div>
              ) : userPlaylists.length === 0 ? (
                <div className="text-center py-16">
                  <p className="text-gray-400 text-lg mb-2">You haven't created any playlists yet</p>
                  <p className="text-gray-500 text-sm">Create your first playlist to get started</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                  {userPlaylists.map((playlist) => (
                    <div key={playlist.id} onClick={() => onNavigate?.('playlist', playlist)}>
                      <PlaylistCard 
                        title={playlist.title}
                        description={`${playlist.song_count} songs`}
                        imageUrl=""
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Liked Songs Tab */}
          <TabsContent value="liked" className="mt-0">
            <div className="mb-12 pb-24">
              <h2 className="text-white text-2xl mb-6">Liked Songs</h2>
              {isLoadingLikedSongs ? (
                <div className="flex items-center justify-center py-16">
                  <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-8 h-8 text-[#00ff88] animate-spin" />
                    <p className="text-gray-400">Loading liked songs...</p>
                  </div>
                </div>
              ) : errorLikedSongs ? (
                <div className="text-center py-16">
                  <div className="flex flex-col items-center gap-4">
                    <p className="text-red-400 mb-2">Error: {errorLikedSongs}</p>
                    <Button
                      onClick={fetchLikedSongs}
                      variant="outline"
                      className="bg-transparent border-[#00ff88] text-[#00ff88] hover:bg-[#00ff88]/10"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Retry
                    </Button>
                  </div>
                </div>
              ) : likedSongs.length === 0 ? (
                <div className="text-center py-16">
                  <p className="text-gray-400 text-lg mb-2">No liked songs yet</p>
                  <p className="text-gray-500 text-sm">Songs you like will appear here</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {likedSongs.map((song, index) => {
                  const imageUrl = song.image_url || song.album?.cover_pic_url || '';
                  const artistName = song.artist_name || song.album?.artist_name || song.artist?.stage_name || 'Unknown Artist';
                  return (
                    <motion.div
                      key={song.id}
                      whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
                      className="flex items-center gap-5 p-4 rounded-xl cursor-pointer group"
                      onClick={() => {
                        // Navigate to song detail and auto-play
                        onNavigate?.('song', song);
                      }}
                    >
                      <div className="w-10 text-center">
                        <span className="text-gray-400 group-hover:hidden">{index + 1}</span>
                        <Play className="w-5 h-5 text-[#00ff88] fill-[#00ff88] hidden group-hover:block mx-auto" />
                      </div>
                      
                      {/* Track Thumbnail */}
                      <div className="w-14 h-14 rounded-lg overflow-hidden bg-[#1a1a1a] flex-shrink-0">
                        <ImageWithFallback
                          src={imageUrl}
                          alt={song.title}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="text-white group-hover:text-[#00ff88] transition-colors truncate">{song.title}</h3>
                        <p className="text-gray-400 text-sm truncate">{artistName}</p>
                      </div>

                      {/* Popularity Bar */}
                      <div className="hidden md:flex items-center gap-3 w-32">
                        <div className="flex-1 h-1 bg-[#1a1a1a] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-[#00ff88] to-[#a855f7]"
                            style={{ width: `${Math.max(20, 100 - index * 5)}%` }}
                          />
                        </div>
                      </div>

                      <span className="text-gray-400 w-16 text-right">{formatDuration(song.duration)}</span>
                      
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                        {onPlaySong && (
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="w-10 h-10 text-gray-400 hover:text-[#00ff88]"
                            onClick={(e) => {
                              e.stopPropagation();
                              onPlaySong(song);
                            }}
                            title="Play Now"
                          >
                            <Play className="w-4 h-4 fill-[#00ff88]" />
                          </Button>
                        )}
                        <Button size="icon" variant="ghost" className="w-10 h-10 text-gray-400 hover:text-[#ec4899]">
                          <Heart className="w-5 h-5 fill-[#ec4899]" />
                        </Button>
                      </div>
                    </motion.div>
                  );
                })}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Following Tab */}
          <TabsContent value="artists" className="mt-0">
            <div className="pb-24">
              <h2 className="text-white text-2xl mb-4">Following</h2>
              <p className="text-gray-400 mb-6">Artists you follow</p>
              {isLoadingFollowedArtists ? (
                <div className="flex items-center justify-center py-16">
                  <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-8 h-8 text-[#00ff88] animate-spin" />
                    <p className="text-gray-400">Loading followed artists...</p>
                  </div>
                </div>
              ) : errorFollowedArtists ? (
                <div className="text-center py-16">
                  <div className="flex flex-col items-center gap-4">
                    <p className="text-red-400 mb-2">Error: {errorFollowedArtists}</p>
                    <Button
                      onClick={fetchFollowedArtists}
                      variant="outline"
                      className="bg-transparent border-[#00ff88] text-[#00ff88] hover:bg-[#00ff88]/10"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Retry
                    </Button>
                  </div>
                </div>
              ) : followedArtists.length === 0 ? (
                <div className="text-center py-16">
                  <p className="text-gray-400 text-lg mb-2">You're not following any artists yet</p>
                  <p className="text-gray-500 text-sm">Follow artists to see their latest releases</p>
                </div>
               ) : (
                 <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6 lg:gap-8">
                   {followedArtists.map((artist) => (
                    <div key={artist.id} onClick={() => onNavigate?.('artist', artist)}>
                      <ArtistCard 
                        name={artist.stage_name}
                        imageUrl={artist.image_url || generateDefaultAvatar(artist.stage_name)}
                        genre="Artist"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Image Picker Dialog */}
      <ImagePickerDialog
        isOpen={isImageDialogOpen}
        onClose={() => {
          if (!isUploadingAvatar) {
            setIsImageDialogOpen(false);
          }
        }}
        onImageSelect={handleImageSelect}
        onRemoveAvatar={handleRemoveAvatar}
        currentImageUrl={userImageUrl}
        isUploading={isUploadingAvatar}
      />

      {/* Edit Profile Dialog */}
      <EditProfileDialog
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        onSave={handleProfileSave}
        currentName={userName}
        currentBio={userBio}
      />

          {/* Settings Dialog */}
          <SettingsDialog
            isOpen={isSettingsDialogOpen}
            onClose={() => setIsSettingsDialogOpen(false)}
            onLogout={onLogout}
          />
        </>
      )}
    </div>
  );
}

