import { ImageWithFallback } from '../Login/img/ImageWithFallback';
import { Play, Heart, Share2, MoreHorizontal, Edit, Settings, Music2, ListMusic, UserPlus, Users, Calendar, Camera } from 'lucide-react';
import { Button } from '../Login/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../Login/ui/tabs';
import { PlaylistCard } from '../Login/PlaylistCard';
import { ArtistCard } from '../Login/ArtistCard';
import { Badge } from '../Login/ui/badge';
import { ScrollArea } from '../Login/ui/scroll-area';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef, useState } from 'react';
import { ImagePickerDialog } from './ImagePickerDialog';
import { EditProfileDialog } from './EditProfileDialog';
import { SettingsDialog } from './SettingsDialog';

interface ProfilePageProps {
  onNavigate?: (page: string, data?: any) => void;
}

export function ProfilePage({ onNavigate }: ProfilePageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isImageDialogOpen, setIsImageDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);
  const [userImageUrl, setUserImageUrl] = useState('https://api.dicebear.com/7.x/avataaars/svg?seed=john');
  const [userName, setUserName] = useState('John Doe');
  const [userBio, setUserBio] = useState('Music enthusiast and playlist curator. Love discovering new sounds and sharing them with the world.');
  
  const { scrollY } = useScroll({
    container: containerRef,
  });

  const headerOpacity = useTransform(scrollY, [0, 200], [1, 0]);
  const headerScale = useTransform(scrollY, [0, 200], [1, 0.8]);

  // Mock user data
  const user = {
    name: userName,
    username: '@johndoe',
    bio: userBio,
    imageUrl: userImageUrl,
    coverImageUrl: 'https://images.unsplash.com/photo-1596807323443-a1528e2cd0ec?w=1600',
    joinDate: 'January 2023',
    location: 'New York, USA',
  };

  const handleImageSelect = (imageUrl: string) => {
    setUserImageUrl(imageUrl);
    // In a real app, you would also save this to the backend here
    console.log('Image selected:', imageUrl);
  };

  const handleProfileSave = (name: string, bio: string) => {
    setUserName(name);
    setUserBio(bio);
    // In a real app, you would also save this to the backend here
    console.log('Profile updated:', { name, bio });
  };

  const stats = {
    playlists: 24,
    following: 156,
    songs: 342,
  };

  const userPlaylists = [
    {
      title: 'My Favorites 2025',
      description: 'Best tracks of the year',
      imageUrl: 'https://images.unsplash.com/photo-1692176548571-86138128e36c?w=200',
    },
    {
      title: 'Chill Vibes',
      description: 'Relaxing beats',
      imageUrl: 'https://images.unsplash.com/photo-1662012061995-0cd4a7ef2d12?w=200',
    },
    {
      title: 'Workout Mix',
      description: 'High energy tracks',
      imageUrl: 'https://images.unsplash.com/photo-1740459057005-65f000db582f?w=200',
    },
    {
      title: 'Late Night Drive',
      description: 'Perfect for cruising',
      imageUrl: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=200',
    },
    {
      title: 'Study Focus',
      description: 'Concentration music',
      imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200',
    },
    {
      title: 'Party Anthems',
      description: 'Dance all night',
      imageUrl: 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=200',
    },
  ];

  const likedSongs = [
    { title: 'Cosmic Waves', artist: 'Nova Pulse', plays: '45.2M', duration: '3:42', imageUrl: 'https://images.unsplash.com/photo-1692176548571-86138128e36c?w=200' },
    { title: 'Neon Dreams', artist: 'Synthwave', plays: '38.7M', duration: '4:15', imageUrl: 'https://images.unsplash.com/photo-1744907529553-dc603ead4d4e?w=200' },
    { title: 'Electric Soul', artist: 'Echo Dreams', plays: '32.1M', duration: '3:58', imageUrl: 'https://images.unsplash.com/photo-1740459057005-65f000db582f?w=200' },
    { title: 'Midnight Drive', artist: 'Bass Drop', plays: '28.9M', duration: '4:23', imageUrl: 'https://images.unsplash.com/photo-1662012061995-0cd4a7ef2d12?w=200' },
    { title: 'Digital Horizon', artist: 'Crystal Sound', plays: '24.5M', duration: '3:36', imageUrl: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=200' },
    { title: 'Starlight Echo', artist: 'Nova Pulse', plays: '21.3M', duration: '4:01', imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200' },
  ];

  const followedArtists = [
    { name: 'Nova Pulse', imageUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=nova', genre: 'Electronic' },
    { name: 'Synthwave', imageUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=synth', genre: 'Retro Wave' },
    { name: 'Echo Dreams', imageUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=echo', genre: 'Ambient' },
    { name: 'Bass Drop', imageUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=bass', genre: 'Dubstep' },
    { name: 'Crystal Sound', imageUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=crystal', genre: 'Chill' },
  ];

  const favoriteGenres = ['Electronic', 'House', 'Ambient', 'Synthwave'];

  return (
    <div ref={containerRef} className="flex-1 h-full overflow-auto">
      {/* Hero Header with Scroll Effect */}
      <div className="relative h-[500px] overflow-hidden">
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
          className="absolute bottom-0 left-0 right-0 p-12"
        >
          <div className="flex items-end gap-8">
            {/* Circular Avatar with Hover Effect */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ duration: 0.8, type: 'spring' }}
              className="relative group cursor-pointer"
              onClick={() => setIsImageDialogOpen(true)}
            >
              <div className="w-56 h-56 rounded-full overflow-hidden border-4 border-[#00ff88] shadow-2xl ring-4 ring-[#00ff88]/20 relative">
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
                <div className="flex items-center gap-2 bg-[#00ff88]/20 backdrop-blur-sm px-3 py-1 rounded-full border border-[#00ff88]/30">
                  <UserPlus className="w-4 h-4 text-[#00ff88]" />
                  <span className="text-sm text-[#00ff88]">Premium Member</span>
                </div>
                <div className="flex items-center gap-2 text-gray-400">
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm">Joined {user.joinDate}</span>
                </div>
              </div>

              <h1 className="text-white text-7xl mb-2">{user.name}</h1>
              <p className="text-gray-400 text-lg mb-4">{user.username}</p>
              
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
            <div className="max-w-4xl space-y-8">
              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-6">
                <div className="bg-[#1a1a1a] rounded-2xl p-6 text-center">
                  <div className="text-[#00ff88] text-3xl mb-2">{stats.playlists}</div>
                  <div className="text-gray-400">Playlists</div>
                </div>
                <div className="bg-[#1a1a1a] rounded-2xl p-6 text-center">
                  <div className="text-[#00ff88] text-3xl mb-2">{stats.following}</div>
                  <div className="text-gray-400">Following</div>
                </div>
                <div className="bg-[#1a1a1a] rounded-2xl p-6 text-center">
                  <div className="text-[#ec4899] text-3xl mb-2">{stats.songs}</div>
                  <div className="text-gray-400">Liked Songs</div>
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

              {/* Recent Activity */}
              <div>
                <h2 className="text-white text-2xl mb-6">Recent Playlists</h2>
                <div className="grid grid-cols-3 gap-6">
                  {userPlaylists.slice(0, 3).map((playlist, index) => (
                    <div key={index} onClick={() => onNavigate?.('playlist', playlist)}>
                      <PlaylistCard {...playlist} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Playlists Tab */}
          <TabsContent value="playlists" className="mt-0">
            <div className="mb-6">
              <h2 className="text-white text-2xl mb-6">Your Playlists</h2>
              <div className="grid grid-cols-4 gap-6">
                {userPlaylists.map((playlist, index) => (
                  <div key={index} onClick={() => onNavigate?.('playlist', playlist)}>
                    <PlaylistCard {...playlist} />
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Liked Songs Tab */}
          <TabsContent value="liked" className="mt-0">
            <div className="mb-12">
              <h2 className="text-white text-2xl mb-6">Liked Songs</h2>
              <div className="space-y-2">
                {likedSongs.map((track, index) => (
                  <motion.div
                    key={index}
                    whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
                    className="flex items-center gap-5 p-4 rounded-xl cursor-pointer group"
                    onClick={() => onNavigate?.('song', { title: track.title, artist: track.artist, imageUrl: track.imageUrl })}
                  >
                    <div className="w-10 text-center">
                      <span className="text-gray-400 group-hover:hidden">{index + 1}</span>
                      <Play className="w-5 h-5 text-[#00ff88] fill-[#00ff88] hidden group-hover:block mx-auto" />
                    </div>
                    
                    {/* Track Thumbnail */}
                    <div className="w-14 h-14 rounded-lg overflow-hidden bg-[#1a1a1a] flex-shrink-0">
                      <ImageWithFallback
                        src={track.imageUrl}
                        alt={track.title}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="text-white group-hover:text-[#00ff88] transition-colors truncate">{track.title}</h3>
                      <p className="text-gray-400 text-sm">{track.artist}</p>
                    </div>

                    {/* Popularity Bar */}
                    <div className="hidden md:flex items-center gap-3 w-32">
                      <div className="flex-1 h-1 bg-[#1a1a1a] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#00ff88] to-[#a855f7]"
                          style={{ width: `${100 - index * 12}%` }}
                        />
                      </div>
                    </div>

                    <span className="text-gray-400 w-16 text-right">{track.duration}</span>
                    
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button size="icon" variant="ghost" className="w-10 h-10 text-gray-400 hover:text-[#ec4899]">
                        <Heart className="w-5 h-5 fill-[#ec4899]" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Following Tab */}
          <TabsContent value="artists" className="mt-0">
            <div>
              <h2 className="text-white text-2xl mb-4">Following</h2>
              <p className="text-gray-400 mb-6">Artists you follow</p>
              <div className="grid grid-cols-5 gap-8">
                {followedArtists.map((artist, index) => (
                  <div key={index} onClick={() => onNavigate?.('artist', artist)}>
                    <ArtistCard {...artist} />
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Image Picker Dialog */}
      <ImagePickerDialog
        isOpen={isImageDialogOpen}
        onClose={() => setIsImageDialogOpen(false)}
        onImageSelect={handleImageSelect}
        currentImageUrl={userImageUrl}
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
        onLogout={() => {
          // In a real app, you would handle logout here
          console.log('User logged out');
          // Could navigate to login page, clear tokens, etc.
        }}
      />
    </div>
  );
}

