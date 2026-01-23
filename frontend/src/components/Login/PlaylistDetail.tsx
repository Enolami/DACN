import { ImageWithFallback } from './img/ImageWithFallback';
import { Play, Heart, Download, Share2, MoreHorizontal, Clock, Edit, Trash2, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { TrackTable } from './TrackTable';
import { PlaylistCard } from './PlaylistCard';
import { Badge } from './ui/badge';
import { EditPlaylistDialog } from './EditPlaylistDialog';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from './ui/dropdown-menu';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { getPlaylist, updatePlaylist, deletePlaylist, removeSongFromPlaylist, formatDuration } from '../../services/api';
import type { Playlist as PlaylistType, PlaylistSong } from '../../types/music';

interface PlaylistDetailProps {
  playlist: {
    id?: string;
    title?: string;
    description?: string;
    imageUrl?: string;
  };
  onNavigate?: (page: string, data?: any) => void;
}

export function PlaylistDetail({ playlist: initialPlaylist, onNavigate }: PlaylistDetailProps) {
  const [playlist, setPlaylist] = useState<PlaylistType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch playlist data
  useEffect(() => {
    const fetchPlaylistData = async () => {
      if (!initialPlaylist.id) {
        setError('Playlist ID is required');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const fetchedPlaylist = await getPlaylist(initialPlaylist.id);
        setPlaylist(fetchedPlaylist);
      } catch (err) {
        console.error('Error fetching playlist:', err);
        setError(err instanceof Error ? err.message : 'Failed to load playlist');
      } finally {
        setLoading(false);
      }
    };

    fetchPlaylistData();
  }, [initialPlaylist.id]);

  // Handle update playlist
  const handleUpdatePlaylist = async (playlistId: string, title: string, isPublic: boolean) => {
    const updatedPlaylist = await updatePlaylist(playlistId, title, isPublic);
    setPlaylist(updatedPlaylist);
  };

  // Handle delete playlist
  const handleDeletePlaylist = async () => {
    if (!playlist || !window.confirm(`Are you sure you want to delete "${playlist.title}"?`)) {
      return;
    }

    setIsDeleting(true);
    try {
      await deletePlaylist(playlist.id);
      onNavigate?.('library', { category: 'playlists' });
    } catch (err) {
      console.error('Error deleting playlist:', err);
      alert(err instanceof Error ? err.message : 'Failed to delete playlist');
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle remove song from playlist
  const handleRemoveSong = async (songId: string) => {
    if (!playlist) return;

    try {
      const updatedPlaylist = await removeSongFromPlaylist(playlist.id, songId);
      setPlaylist(updatedPlaylist);
    } catch (err) {
      console.error('Error removing song:', err);
      alert(err instanceof Error ? err.message : 'Failed to remove song');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-[#00ff88] animate-spin" />
          <p className="text-gray-400">Loading playlist...</p>
        </div>
      </div>
    );
  }

  if (error || !playlist) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-4">
          <p className="text-red-400">Error: {error || 'Playlist not found'}</p>
          <Button onClick={() => onNavigate?.('library', { category: 'playlists' })} variant="outline">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  // Transform playlist songs to Track format
  const tracks = (playlist.songs || []).map((playlistSong: PlaylistSong, index: number) => {
    const song = playlistSong.song;
    return {
      number: index + 1,
      title: song.title,
      artist: song.artist_name || song.artist?.stage_name || 'Unknown Artist',
      album: song.album_title || song.album?.title || 'Unknown Album',
      duration: formatDuration(song.duration),
      liked: false,
      songId: song.id,
      song: song,
    };
  });

  // Calculate total duration
  const totalDurationSeconds = tracks.reduce((sum, track) => {
    const song = track.song;
    return sum + (song?.duration || 0);
  }, 0);
  const totalDuration = formatDuration(totalDurationSeconds);
  const totalSongs = tracks.length;

  // Get playlist image (first song's image or default)
  const playlistImageUrl = tracks.length > 0 && tracks[0].song?.image_url
    ? tracks[0].song.image_url
    : initialPlaylist.imageUrl || undefined;

  return (
    <ScrollArea className="flex-1 h-full">
      <div className="pb-32">
      {/* Hero Section with Gradient Overlay */}
      <div className="relative h-80 overflow-hidden">
        {/* Background with blur */}
        <div className="absolute inset-0">
              <ImageWithFallback
                src={playlistImageUrl}
                alt={playlist.title}
                className="w-full h-full object-cover scale-110 blur-2xl"
              />
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#00ff88]/20 via-black/80 to-black" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#a855f7]/10 to-transparent" />
        </div>

        {/* Playlist Info */}
        <div className="absolute bottom-0 left-0 right-0 p-8">
          <div className="flex items-end gap-6">
            <motion.div
              initial={{ scale: 0, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ duration: 0.5 }}
              className="w-56 h-56 rounded-xl overflow-hidden shadow-2xl border-2 border-[#00ff88]/30"
            >
              <ImageWithFallback
                src={playlistImageUrl}
                alt={playlist.title}
                className="w-full h-full object-cover"
              />
            </motion.div>
            <div className="flex-1 pb-4">
              <p className="text-sm text-gray-400 mb-2">PLAYLIST</p>
              <h1 className="text-white text-5xl md:text-6xl mb-3 font-bold">{playlist.title}</h1>
              <p className="text-gray-300 text-lg mb-4">
                {playlist.owner_username} {playlist.is_public && '• Public'}
              </p>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <span className="text-white">{playlist.owner_username}</span>
                <span>•</span>
                <span>{totalSongs} {totalSongs === 1 ? 'song' : 'songs'}</span>
                <span>•</span>
                <span>{totalDuration}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="px-8 py-6 flex items-center gap-3 flex-wrap">
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button 
            className="bg-[#00ff88] hover:bg-[#00ff88]/80 text-black gap-2 px-8 py-5 rounded-full font-semibold"
            onClick={() => {
              // Start playing first track in playlist
              if (tracks.length > 0 && onNavigate && tracks[0].song) {
                onNavigate('song', { song: tracks[0].song });
              }
            }}
          >
            <Play className="w-5 h-5 fill-black" />
            Play
          </Button>
        </motion.div>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button className="bg-transparent border-2 border-[#a855f7] text-[#a855f7] hover:bg-[#a855f7]/10 gap-2 px-6 py-5 rounded-full">
            <Heart className="w-4 h-4" />
            Follow
          </Button>
        </motion.div>
        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
          <Button variant="ghost" size="icon" className="w-10 h-10 text-gray-400 hover:text-white hover:bg-[#1a1a1a] rounded-full">
            <Download className="w-4 h-4" />
          </Button>
        </motion.div>
        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
          <Button variant="ghost" size="icon" className="w-10 h-10 text-gray-400 hover:text-white hover:bg-[#1a1a1a] rounded-full">
            <Share2 className="w-4 h-4" />
          </Button>
        </motion.div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
              <Button variant="ghost" size="icon" className="w-10 h-10 text-gray-400 hover:text-white hover:bg-[#1a1a1a] rounded-full">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </motion.div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-[#1a1a1a] border-[#2a2a2a]">
            <DropdownMenuItem
              onClick={() => setIsEditDialogOpen(true)}
              className="text-white hover:bg-[#2a2a2a] cursor-pointer"
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit Playlist
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-[#2a2a2a]" />
            <DropdownMenuItem
              onClick={handleDeletePlaylist}
              disabled={isDeleting}
              className="text-red-400 hover:bg-[#2a2a2a] cursor-pointer"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {isDeleting ? 'Deleting...' : 'Delete Playlist'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Track Table */}
      <div className="px-8 pb-8">
        {tracks.length > 0 ? (
          <TrackTable 
            tracks={tracks} 
            onNavigate={onNavigate}
            onRemoveFromPlaylist={handleRemoveSong}
            showRemoveButton={true}
          />
        ) : (
          <div className="text-center py-16">
            <p className="text-gray-400 text-lg mb-2">This playlist is empty</p>
            <p className="text-gray-500 text-sm">Add songs to get started</p>
          </div>
        )}
      </div>


      <EditPlaylistDialog
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        playlist={playlist}
        onUpdate={handleUpdatePlaylist}
      />
      </div>
    </ScrollArea>
  );
}