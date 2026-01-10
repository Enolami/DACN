import { ImageWithFallback } from './img/ImageWithFallback';
import { Play, Heart, Share2, MoreHorizontal, UserPlus, BadgeCheck, Music2, Disc3, Video, Info } from 'lucide-react';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ArtistCard } from './ArtistCard';
import { Badge } from './ui/badge';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef, useState } from 'react';

interface ArtistProfileProps {
  artist: {
    name: string;
    genre: string;
    imageUrl?: string;
  };
  onNavigate?: (page: string, data?: any) => void;
}

export function ArtistProfile({ artist, onNavigate }: ArtistProfileProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  
  const { scrollY } = useScroll({
    container: containerRef,
  });

  const headerOpacity = useTransform(scrollY, [0, 200], [1, 0]);
  const headerScale = useTransform(scrollY, [0, 200], [1, 0.8]);

  const topTracks = [
    { title: 'Cosmic Waves', plays: '45.2M', duration: '3:42', imageUrl: 'https://images.unsplash.com/photo-1692176548571-86138128e36c?w=200' },
    { title: 'Neon Dreams', plays: '38.7M', duration: '4:15', imageUrl: 'https://images.unsplash.com/photo-1744907529553-dc603ead4d4e?w=200' },
    { title: 'Electric Soul', plays: '32.1M', duration: '3:58', imageUrl: 'https://images.unsplash.com/photo-1740459057005-65f000db582f?w=200' },
    { title: 'Midnight Drive', plays: '28.9M', duration: '4:23', imageUrl: 'https://images.unsplash.com/photo-1662012061995-0cd4a7ef2d12?w=200' },
    { title: 'Digital Horizon', plays: '24.5M', duration: '3:36', imageUrl: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=200' },
    { title: 'Starlight Echo', plays: '21.3M', duration: '4:01', imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200' },
    { title: 'Synthetic Dreams', plays: '19.8M', duration: '3:48', imageUrl: 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=200' },
    { title: 'Virtual Reality', plays: '17.4M', duration: '4:12', imageUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=200' },
    { title: 'Crystal Vision', plays: '15.9M', duration: '3:55', imageUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=200' },
    { title: 'Future Pulse', plays: '14.2M', duration: '4:18', imageUrl: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=200' },
  ];

  const albums = [
    { title: 'Interstellar', year: 2025, imageUrl: 'https://images.unsplash.com/photo-1692176548571-86138128e36c?w=300' },
    { title: 'Retrograde', year: 2024, imageUrl: 'https://images.unsplash.com/photo-1744907529553-dc603ead4d4e?w=300' },
    { title: 'Digital Hearts', year: 2024, imageUrl: 'https://images.unsplash.com/photo-1582024959432-aee9b60ff4e8?w=300' },
  ];

  const singles = [
    { title: 'Night Rider', year: 2025, imageUrl: 'https://images.unsplash.com/photo-1740459057005-65f000db582f?w=300' },
    { title: 'Echo Chamber', year: 2025, imageUrl: 'https://images.unsplash.com/photo-1662012061995-0cd4a7ef2d12?w=300' },
    { title: 'Frequency', year: 2024, imageUrl: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=300' },
    { title: 'Wavelength', year: 2024, imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=300' },
  ];

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
            src="https://images.unsplash.com/photo-1596807323443-a1528e2cd0ec?w=1600"
            alt={artist.name}
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
                  src={artist.imageUrl || 'https://api.dicebear.com/7.x/avataaars/svg?seed=nova'}
                  alt={artist.name}
                  className="w-full h-full object-cover"
                />
              </div>
              {/* Glow effect */}
              <div className="absolute -inset-4 bg-[#00ff88]/20 rounded-full blur-2xl -z-10" />
            </motion.div>

            <div className="flex-1 pb-6">
              {/* Verified Badge & Monthly Listeners */}
              <div className="flex items-center gap-3 mb-3">
                <div className="flex items-center gap-2 bg-[#00ff88]/20 backdrop-blur-sm px-3 py-1 rounded-full border border-[#00ff88]/30">
                  <BadgeCheck className="w-4 h-4 text-[#00ff88]" />
                  <span className="text-sm text-[#00ff88]">Verified Artist</span>
                </div>
                <span className="text-gray-400">{monthlyListeners} monthly listeners</span>
              </div>

              <h1 className="text-white text-7xl mb-4">{artist.name}</h1>
              
              {/* Genre Tags */}
              <div className="flex flex-wrap gap-2 mb-6">
                {genreTags.map((tag, index) => (
                  <Badge
                    key={index}
                    className="bg-white/10 text-white border-white/20 backdrop-blur-sm"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-4">
                <Button className="bg-[#00ff88] hover:bg-[#00ff88]/80 text-black gap-2 px-10 py-7 rounded-full shadow-lg shadow-[#00ff88]/30">
                  <Play className="w-6 h-6 fill-black" />
                  Play
                </Button>
                <Button
                  onClick={() => setIsFollowing(!isFollowing)}
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
              <h2 className="text-white text-2xl mb-6">Top 10 Tracks</h2>
              <div className="space-y-2">
                {topTracks.map((track, index) => (
                  <motion.div
                    key={index}
                    whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
                    className="flex items-center gap-5 p-4 rounded-xl cursor-pointer group"
                    onClick={() => onNavigate?.('song', { title: track.title, artist: artist.name, imageUrl: track.imageUrl })}
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
                      <p className="text-gray-400 text-sm">{track.plays} plays</p>
                    </div>

                    {/* Popularity Bar */}
                    <div className="hidden md:flex items-center gap-3 w-32">
                      <div className="flex-1 h-1 bg-[#1a1a1a] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#00ff88] to-[#a855f7]"
                          style={{ width: `${100 - index * 8}%` }}
                        />
                      </div>
                    </div>

                    <span className="text-gray-400 w-16 text-right">{track.duration}</span>
                    
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button size="icon" variant="ghost" className="w-10 h-10 text-gray-400 hover:text-[#ec4899]">
                        <Heart className="w-5 h-5" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Related Artists */}
            <div>
              <h2 className="text-white text-2xl mb-4">Fans Also Like</h2>
              <p className="text-gray-400 mb-6">Based on what you listen to</p>
              <div className="grid grid-cols-4 gap-8">
                {relatedArtists.map((relatedArtist, index) => (
                  <div key={index} onClick={() => onNavigate?.('artist', relatedArtist)}>
                    <ArtistCard {...relatedArtist} />
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Albums */}
          <TabsContent value="albums" className="mt-0">
            <div className="grid grid-cols-3 gap-8">
              {albums.map((album, index) => (
                <motion.div
                  key={index}
                  whileHover={{ scale: 1.05, y: -5 }}
                  onClick={() => onNavigate?.('playlist', {
                    title: album.title,
                    description: `Album by ${artist.name}`,
                    imageUrl: album.imageUrl,
                  })}
                  className="group cursor-pointer"
                >
                  <div className="relative bg-[#1a1a1a] rounded-2xl overflow-hidden mb-4 aspect-square">
                    <ImageWithFallback
                      src={album.imageUrl}
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
                    <div className="absolute top-4 right-4 bg-black/80 backdrop-blur-sm px-3 py-1 rounded-full">
                      <span className="text-white text-sm">{album.year}</span>
                    </div>
                  </div>
                  <h3 className="text-white text-xl mb-1 group-hover:text-[#00ff88] transition-colors">{album.title}</h3>
                  <p className="text-gray-400">Album • {album.year}</p>
                </motion.div>
              ))}
            </div>
          </TabsContent>

          {/* Singles & EPs */}
          <TabsContent value="singles" className="mt-0">
            <div className="overflow-x-auto pb-4">
              <div className="flex gap-6" style={{ width: 'max-content' }}>
                {singles.map((single, index) => (
                  <motion.div
                    key={index}
                    whileHover={{ scale: 1.05, y: -5 }}
                    onClick={() => onNavigate?.('playlist', {
                      title: single.title,
                      description: `Single by ${artist.name}`,
                      imageUrl: single.imageUrl,
                    })}
                    className="group cursor-pointer w-64"
                  >
                    <div className="relative bg-[#1a1a1a] rounded-2xl overflow-hidden mb-4 aspect-square">
                      <ImageWithFallback
                        src={single.imageUrl}
                        alt={single.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button className="bg-[#00ff88] hover:bg-[#00ff88]/80 text-black rounded-full w-16 h-16">
                          <Play className="w-6 h-6 fill-black" />
                        </Button>
                      </div>
                      <div className="absolute top-4 right-4 bg-black/80 backdrop-blur-sm px-3 py-1 rounded-full">
                        <span className="text-white text-sm">{single.year}</span>
                      </div>
                    </div>
                    <h3 className="text-white mb-1 group-hover:text-[#00ff88] transition-colors truncate">{single.title}</h3>
                    <p className="text-gray-400 text-sm">Single • {single.year}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* About */}
          <TabsContent value="about" className="mt-0">
            <div className="max-w-4xl space-y-8">
              {/* Biography */}
              <div className="bg-[#1a1a1a] rounded-2xl p-8">
                <h3 className="text-white text-2xl mb-6">Biography</h3>
                <div className="space-y-4 text-gray-300 leading-relaxed">
                  <p>
                    {artist.name} is a pioneering force in the {artist.genre} music scene, known for pushing the
                    boundaries of electronic sound and creating immersive sonic experiences. With a career spanning
                    over a decade, they have consistently delivered groundbreaking tracks that blend cutting-edge
                    production with emotional depth.
                  </p>
                  <p>
                    Their music has been featured in major festivals worldwide, including Coachella, Tomorrowland,
                    and Electric Daisy Carnival. The unique fusion of organic and synthetic elements in their work
                    has earned them a devoted global following and critical acclaim from publications like Rolling
                    Stone and Pitchfork.
                  </p>
                  <p>
                    Recent collaborations with other top artists in the industry have resulted in chart-topping
                    releases and have solidified their position as one of the most influential artists in modern
                    electronic music. Their innovative use of AI-powered sound design continues to push the genre
                    forward.
                  </p>
                </div>
              </div>

              {/* Stats & Info */}
              <div className="grid grid-cols-3 gap-6">
                <div className="bg-[#1a1a1a] rounded-2xl p-6 text-center">
                  <div className="text-[#00ff88] text-3xl mb-2">{monthlyListeners}</div>
                  <div className="text-gray-400">Monthly Listeners</div>
                </div>
                <div className="bg-[#1a1a1a] rounded-2xl p-6 text-center">
                  <div className="text-[#a855f7] text-3xl mb-2">2.1M</div>
                  <div className="text-gray-400">Followers</div>
                </div>
                <div className="bg-[#1a1a1a] rounded-2xl p-6 text-center">
                  <div className="text-[#00ff88] text-3xl mb-2">15</div>
                  <div className="text-gray-400">Albums Released</div>
                </div>
              </div>

              {/* Social Links */}
              <div className="bg-[#1a1a1a] rounded-2xl p-8">
                <h3 className="text-white text-xl mb-4">Connect</h3>
                <div className="flex gap-4">
                  <Button className="flex-1 bg-[#1a1a1a] border-2 border-[#2a2a2a] hover:border-[#00ff88] text-white">
                    Instagram
                  </Button>
                  <Button className="flex-1 bg-[#1a1a1a] border-2 border-[#2a2a2a] hover:border-[#00ff88] text-white">
                    Twitter
                  </Button>
                  <Button className="flex-1 bg-[#1a1a1a] border-2 border-[#2a2a2a] hover:border-[#00ff88] text-white">
                    Website
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
