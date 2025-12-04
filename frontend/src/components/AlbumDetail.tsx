import { ImageWithFallback } from './img/ImageWithFallback';
import { Play, Heart, Download, Share2, MoreVertical, ChevronDown, Clock } from 'lucide-react';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { TrackTable } from './TrackTable';
import { motion } from 'framer-motion';
import { useState } from 'react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from './ui/collapsible';

interface AlbumDetailProps {
  album: {
    title: string;
    artist: string;
    imageUrl: string;
    year?: string;
    genre?: string;
    totalTracks?: number;
    duration?: string;
  };
  onNavigate?: (page: string, data?: any) => void;
}

export function AlbumDetail({ album, onNavigate }: AlbumDetailProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [isCreditsOpen, setIsCreditsOpen] = useState(false);

  // Mock tracks data
  const tracks = [
    { number: 1, title: 'Cosmic Waves', artist: album.artist, album: album.title, duration: '3:42', liked: true },
    { number: 2, title: 'Neon Dreams', artist: album.artist, album: album.title, duration: '4:15' },
    { number: 3, title: 'Electric Soul', artist: album.artist, album: album.title, duration: '3:58', liked: true },
    { number: 4, title: 'Midnight Drive', artist: album.artist, album: album.title, duration: '4:23' },
    { number: 5, title: 'Digital Horizon', artist: album.artist, album: album.title, duration: '3:36' },
    { number: 6, title: 'Stellar Pulse', artist: album.artist, album: album.title, duration: '4:01' },
    { number: 7, title: 'Cybernetic Dreams', artist: album.artist, album: album.title, duration: '3:47', liked: true },
    { number: 8, title: 'Aurora Lights', artist: album.artist, album: album.title, duration: '4:18' },
    { number: 9, title: 'Quantum Leap', artist: album.artist, album: album.title, duration: '3:52' },
    { number: 10, title: 'Future Echoes', artist: album.artist, album: album.title, duration: '4:07' },
    { number: 11, title: 'Synthwave Sunset', artist: album.artist, album: album.title, duration: '3:29' },
    { number: 12, title: 'Binary Stars', artist: album.artist, album: album.title, duration: '4:34' },
  ];

  const credits = [
    { role: 'Producer', name: 'Echo Sound Labs' },
    { role: 'Recording Engineer', name: 'Alex Rivers' },
    { role: 'Mastering Engineer', name: 'Sound Forge Studio' },
    { role: 'Label', name: 'Neon Records' },
    { role: 'Copyright', name: '© 2024 Neon Records. All rights reserved.' },
    { role: 'Recorded', name: 'Studio X, Los Angeles, CA' },
  ];

  const moreAlbums = [
    { title: 'Retrograde', year: '2023', imageUrl: 'https://images.unsplash.com/photo-1614680376593-902f74cf0d41?w=180' },
    { title: 'Digital Hearts', year: '2022', imageUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=180' },
    { title: 'Night Rider', year: '2021', imageUrl: 'https://images.unsplash.com/photo-1619983081563-430f63602796?w=180' },
    { title: 'Future Sound', year: '2020', imageUrl: 'https://images.unsplash.com/photo-1611339555312-e607c8352fd7?w=180' },
  ];

  const totalDuration = album.duration || '48:32';
  const totalTracks = album.totalTracks || tracks.length;
  const year = album.year || '2024';
  const genre = album.genre || 'Electronic';

  return (
    <ScrollArea className="flex-1 h-full">
      {/* Album Header Section */}
      <div className="relative h-[480px] overflow-hidden">
        {/* Background Layers */}
        <div className="absolute inset-0">
          {/* Layer 1: Blurred album art */}
          <div className="absolute inset-0 scale-150 blur-[80px] opacity-30">
            <ImageWithFallback
              src={album.imageUrl}
              alt={album.title}
              className="w-full h-full object-cover"
            />
          </div>
          {/* Layer 2: Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/60 to-black" />
          {/* Layer 3: Noise texture */}
          <div className="absolute inset-0 opacity-[0.02] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PC9maWx0ZXI+PHJlY3Qgd2lkdGg9IjMwMCIgaGVpZ2h0PSIzMDAiIGZpbHRlcj0idXJsKCNhKSIgb3BhY2l0eT0iMC4wNSIvPjwvc3ZnPg==')]" />
        </div>

        {/* Content */}
        <div className="relative z-10 h-full flex items-end px-20 pb-16">
          <div className="flex items-end gap-8">
            {/* Album Cover */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.8 }}
              className="relative group cursor-pointer"
            >
              <div
                className="w-[280px] h-[280px] rounded-2xl overflow-hidden border border-white/10 transition-transform duration-300 group-hover:scale-105"
                style={{
                  boxShadow: `
                    0 8px 32px rgba(0, 0, 0, 0.6),
                    0 0 60px rgba(0, 255, 136, 0.25),
                    0 0 120px rgba(168, 85, 247, 0.15)
                  `,
                }}
              >
                <ImageWithFallback
                  src={album.imageUrl}
                  alt={album.title}
                  className="w-full h-full object-cover"
                />
              </div>
            </motion.div>

            {/* Album Info */}
            <div className="flex-1 pb-4">
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <p className="text-sm text-white/60 mb-2">Album</p>
                <h1 className="text-white text-5xl mb-4 max-w-[600px] leading-tight">
                  {album.title}
                </h1>
                <button
                  onClick={() => onNavigate?.('artist', { name: album.artist, genre })}
                  className="text-xl text-gray-400 hover:text-[#00ff88] transition-colors mb-3 hover:underline underline-offset-4"
                >
                  {album.artist}
                </button>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="flex items-center gap-2 text-sm text-gray-500 mb-8"
                >
                  <span>{year}</span>
                  <span className="opacity-60">•</span>
                  <span>{genre}</span>
                  <span className="opacity-60">•</span>
                  <span>{totalTracks} tracks</span>
                  <span className="opacity-60">•</span>
                  <span>{totalDuration}</span>
                </motion.div>

                {/* Action Buttons */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="flex items-center gap-3"
                >
                  {/* Play Button */}
                  <Button className="h-14 px-8 bg-gradient-to-r from-[#00ff88] to-[#00cc6e] hover:from-[#00ff88]/80 hover:to-[#00cc6e]/80 text-black rounded-full gap-3 transition-transform hover:scale-105 active:scale-95">
                    <Play className="w-5 h-5 fill-black" />
                    Play Album
                  </Button>

                  {/* Like Button */}
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setIsLiked(!isLiked)}
                    className={`w-12 h-12 rounded-full border transition-all ${
                      isLiked
                        ? 'bg-[#00ff88]/10 border-[#00ff88]/50 text-[#00ff88]'
                        : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <Heart className={`w-5 h-5 transition-transform ${isLiked ? 'fill-[#00ff88] scale-110' : ''}`} />
                  </Button>

                  {/* Download Button */}
                  <Button
                    size="icon"
                    variant="ghost"
                    className="w-12 h-12 rounded-full bg-white/5 border border-white/10 text-gray-400 hover:bg-white/10 hover:text-white"
                  >
                    <Download className="w-5 h-5" />
                  </Button>

                  {/* Share Button */}
                  <Button
                    size="icon"
                    variant="ghost"
                    className="w-12 h-12 rounded-full bg-white/5 border border-white/10 text-gray-400 hover:bg-white/10 hover:text-white"
                  >
                    <Share2 className="w-5 h-5" />
                  </Button>

                  {/* More Options */}
                  <Button
                    size="icon"
                    variant="ghost"
                    className="w-12 h-12 rounded-full bg-white/5 border border-white/10 text-gray-400 hover:bg-white/10 hover:text-white"
                  >
                    <MoreVertical className="w-5 h-5" />
                  </Button>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* Tracklist Section */}
      <div className="max-w-[1400px] mx-auto px-20 py-12">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/[0.06]">
          <h2 className="text-white text-2xl">Tracks</h2>
          <div className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer hover:text-white transition-colors">
            <Clock className="w-4 h-4" />
            <span>Duration</span>
          </div>
        </div>

        {/* Track Table */}
        <TrackTable tracks={tracks} onNavigate={onNavigate} />
      </div>

      {/* Album Credits Section */}
      <div className="max-w-[1400px] mx-auto px-20 pb-12">
        <Collapsible open={isCreditsOpen} onOpenChange={setIsCreditsOpen}>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className="w-full bg-white/[0.03] hover:bg-white/[0.05] border border-white/[0.06] rounded-xl p-6 flex items-center justify-between transition-all"
            >
              <span className="text-white text-lg">Album Credits & Details</span>
              <motion.div
                animate={{ rotate: isCreditsOpen ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown className="w-5 h-5 text-gray-400" />
              </motion.div>
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-4">
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-8">
              <div className="grid grid-cols-2 gap-6">
                {credits.map((credit, index) => (
                  <div key={index} className="flex flex-col gap-1">
                    <p className="text-sm text-gray-500">{credit.role}</p>
                    <p className="text-white">{credit.name}</p>
                  </div>
                ))}
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>

      {/* More Albums Section */}
      <div className="max-w-[1400px] mx-auto px-20 pb-20">
        <h2 className="text-white text-3xl mb-6">More from {album.artist}</h2>
        <div className="flex gap-5 overflow-x-auto pb-4 scrollbar-hide">
          {moreAlbums.map((moreAlbum, index) => (
            <motion.div
              key={index}
              whileHover={{ scale: 1.05 }}
              className="flex-shrink-0 cursor-pointer group"
              onClick={() =>
                onNavigate?.('album', {
                  title: moreAlbum.title,
                  artist: album.artist,
                  imageUrl: moreAlbum.imageUrl,
                  year: moreAlbum.year,
                })
              }
            >
              <div className="w-[180px]">
                <div
                  className="w-[180px] h-[180px] rounded-xl overflow-hidden mb-3 transition-shadow duration-300"
                  style={{
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
                  }}
                >
                  <ImageWithFallback
                    src={moreAlbum.imageUrl}
                    alt={moreAlbum.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                </div>
                <p className="text-white group-hover:text-[#00ff88] transition-colors truncate">
                  {moreAlbum.title}
                </p>
                <p className="text-sm text-gray-400">{moreAlbum.year}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </ScrollArea>
  );
}
