import { ImageWithFallback } from './img/ImageWithFallback';
import { Play, Heart, Download, Share2, MoreVertical, ChevronDown, Clock, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { TrackTable } from './TrackTable';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from './ui/collapsible';
import { getSongs, formatDuration } from '../../services/api';
import type { Song, Album } from '../../types/music';

interface AlbumDetailProps {
  album: {
    id?: string;
    title?: string;
    artist?: string;
    imageUrl?: string;
    year?: string;
    genre?: string;
    totalTracks?: number;
    duration?: string;
    album?: Album; // Full album object if passed
  };
  onNavigate?: (page: string, data?: any) => void;
}

export function AlbumDetail({ album: initialAlbum, onNavigate }: AlbumDetailProps) {
  const [album, setAlbum] = useState<Album | null>(null);
  const [albumSongs, setAlbumSongs] = useState<Song[]>([]);
  const [isLiked, setIsLiked] = useState(false);
  const [isCreditsOpen, setIsCreditsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch album data and songs
  useEffect(() => {
    const fetchAlbumData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get album ID
        const albumId = initialAlbum.id || initialAlbum.album?.id;
        if (!albumId) {
          setError('Album ID is required');
          setLoading(false);
          return;
        }

        // If we have a full album object, use it
        if (initialAlbum.album) {
          setAlbum(initialAlbum.album);
        }

        // Fetch all songs and filter by album
        const allSongs = await getSongs();
        const filteredSongs = allSongs.filter(
          song => song.album_id === albumId || song.album?.id === albumId
        );

        if (filteredSongs.length === 0 && !initialAlbum.album) {
          setError('No songs found for this album');
          setLoading(false);
          return;
        }

        // Extract album from first song if not already set
        if (!initialAlbum.album && filteredSongs.length > 0) {
          const albumData = filteredSongs[0].album;
          if (albumData) {
            setAlbum(albumData);
          }
        }

        setAlbumSongs(filteredSongs);
      } catch (err) {
        console.error('Error fetching album data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load album');
      } finally {
        setLoading(false);
      }
    };

    fetchAlbumData();
  }, [initialAlbum.id, initialAlbum.album]);

  // Calculate total duration
  const totalDurationSeconds = albumSongs.reduce((sum, song) => sum + song.duration, 0);
  const totalDuration = formatDuration(totalDurationSeconds);

  // Transform songs to Track format
  const tracksForTable = albumSongs.map((song, index) => ({
    number: index + 1,
    title: song.title,
    artist: song.artist_name || song.artist?.stage_name || 'Unknown Artist',
    album: album?.title || initialAlbum.title || 'Unknown Album',
    duration: formatDuration(song.duration),
    liked: false,
  }));

  if (loading) {
    return (
      <ScrollArea className="flex-1 h-full">
        <div className="flex items-center justify-center h-full">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 text-[#00ff88] animate-spin" />
            <p className="text-gray-400">Loading album...</p>
          </div>
        </div>
      </ScrollArea>
    );
  }

  if (error || !album) {
    return (
      <ScrollArea className="flex-1 h-full">
        <div className="flex items-center justify-center h-full">
          <div className="flex flex-col items-center gap-4">
            <p className="text-red-400">Error: {error || 'Album not found'}</p>
            <Button onClick={() => onNavigate?.('home')} variant="outline">
              Go Home
            </Button>
          </div>
        </div>
      </ScrollArea>
    );
  }

  const albumTitle = album.title || initialAlbum.title || 'Unknown Album';
  const artistName = album.artist_name || album.artist?.stage_name || initialAlbum.artist || 'Unknown Artist';
  const artistId = album.artist_id || album.artist?.id;
  const imageUrl = album.cover_pic_url || initialAlbum.imageUrl || null;
  const releaseYear = album.release_date ? new Date(album.release_date).getFullYear() : (initialAlbum.year ? parseInt(initialAlbum.year) : null);
  const totalTracks = albumSongs.length;

  const credits = [
    { role: 'Artist', name: artistName },
    { role: 'Album', name: albumTitle },
    { role: 'Release Date', name: releaseYear ? releaseYear.toString() : 'Unknown' },
    { role: 'Tracks', name: `${totalTracks} ${totalTracks === 1 ? 'song' : 'songs'}` },
    { role: 'Total Duration', name: totalDuration },
  ];

  return (
    <ScrollArea className="flex-1 h-full">
      {/* Album Header Section */}
      <div className="relative h-[480px] overflow-hidden">
        {/* Background Layers */}
        <div className="absolute inset-0">
          {/* Layer 1: Blurred album art */}
          <div className="absolute inset-0 scale-150 blur-[80px] opacity-30">
            <ImageWithFallback
              src={imageUrl || undefined}
              alt={albumTitle}
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
                  src={imageUrl || undefined}
                  alt={albumTitle}
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
                  {albumTitle}
                </h1>
                <button
                  onClick={() => onNavigate?.('artist', { 
                    id: artistId,
                    stage_name: artistName 
                  })}
                  className="text-xl text-gray-400 hover:text-[#00ff88] transition-colors mb-3 hover:underline underline-offset-4"
                >
                  {artistName}
                </button>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="flex items-center gap-2 text-sm text-gray-500 mb-8"
                >
                  {releaseYear && (
                    <>
                      <span>{releaseYear}</span>
                      <span className="opacity-60">•</span>
                    </>
                  )}
                  <span>{totalTracks} {totalTracks === 1 ? 'track' : 'tracks'}</span>
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
        {albumSongs.length > 0 ? (
          <TrackTable tracks={tracksForTable} onNavigate={onNavigate} />
        ) : (
          <div className="text-center py-16">
            <Clock className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-white text-xl mb-2">No tracks found</h3>
            <p className="text-gray-400">This album has no songs yet</p>
          </div>
        )}
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

      {/* More Albums Section - Show other albums by same artist */}
      {artistId && (
        <div className="max-w-[1400px] mx-auto px-20 pb-32">
          <h2 className="text-white text-3xl mb-6">More from {artistName}</h2>
          {/* This would require fetching other albums by the artist */}
          {/* For now, we'll leave it empty or show a placeholder */}
          <p className="text-gray-400">Other albums by this artist will appear here</p>
        </div>
      )}
    </ScrollArea>
  );
}
