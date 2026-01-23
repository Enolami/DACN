import { useState, useEffect } from 'react';
import { X, Plus, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import type { Playlist } from '../../types/music';

interface AddToPlaylistDialogProps {
  isOpen: boolean;
  onClose: () => void;
  songId: string;
  playlists: Playlist[];
  onCreatePlaylist: () => void;
  onAddToPlaylist: (playlistId: string) => Promise<void>;
  isLoading?: boolean;
}

export function AddToPlaylistDialog({
  isOpen,
  onClose,
  songId,
  playlists,
  onCreatePlaylist,
  onAddToPlaylist,
  isLoading = false,
}: AddToPlaylistDialogProps) {
  const [addingToPlaylistId, setAddingToPlaylistId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setAddingToPlaylistId(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAddToPlaylist = async (playlistId: string) => {
    setAddingToPlaylistId(playlistId);
    setError(null);

    try {
      await onAddToPlaylist(playlistId);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add song to playlist');
    } finally {
      setAddingToPlaylistId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-[#1a1a1a] rounded-2xl p-6 w-full max-w-md border border-[#2a2a2a] shadow-2xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-white text-2xl font-bold">Add to Playlist</h2>
          <button
            onClick={onClose}
            disabled={isLoading || addingToPlaylistId !== null}
            className="text-gray-400 hover:text-white transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400 text-sm mb-4">
            {error}
          </div>
        )}

        <ScrollArea className="flex-1 mb-4">
          <div className="space-y-2">
            {/* Create New Playlist Option */}
            <button
              onClick={onCreatePlaylist}
              disabled={isLoading || addingToPlaylistId !== null}
              className="w-full p-4 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg hover:border-[#00ff88] hover:bg-[#0f0f0f] transition-all flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="w-12 h-12 bg-[#00ff88]/20 rounded-lg flex items-center justify-center">
                <Plus className="w-6 h-6 text-[#00ff88]" />
              </div>
              <div className="flex-1 text-left">
                <div className="text-white font-semibold">Create New Playlist</div>
                <div className="text-gray-400 text-sm">Start a new playlist with this song</div>
              </div>
            </button>

            {/* Existing Playlists */}
            {playlists.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <p>No playlists yet</p>
                <p className="text-sm mt-2">Create your first playlist above</p>
              </div>
            ) : (
              playlists.map((playlist) => (
                <button
                  key={playlist.id}
                  onClick={() => handleAddToPlaylist(playlist.id)}
                  disabled={isLoading || addingToPlaylistId !== null}
                  className="w-full p-4 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg hover:border-[#00ff88] hover:bg-[#0f0f0f] transition-all flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-[#00ff88] to-[#a855f7] rounded-lg flex items-center justify-center text-white font-bold text-lg">
                    {playlist.title[0]?.toUpperCase() || 'P'}
                  </div>
                  <div className="flex-1 text-left">
                    <div className="text-white font-semibold">{playlist.title}</div>
                    <div className="text-gray-400 text-sm">
                      {playlist.song_count} {playlist.song_count === 1 ? 'song' : 'songs'}
                      {playlist.is_public && ' • Public'}
                    </div>
                  </div>
                  {addingToPlaylistId === playlist.id && (
                    <Loader2 className="w-5 h-5 text-[#00ff88] animate-spin" />
                  )}
                </button>
              ))
            )}
          </div>
        </ScrollArea>

        <Button
          onClick={onClose}
          disabled={isLoading || addingToPlaylistId !== null}
          variant="ghost"
          className="w-full border border-[#2a2a2a] text-gray-300 hover:text-white hover:bg-[#2a2a2a]"
        >
          Close
        </Button>
      </div>
    </div>
  );
}
