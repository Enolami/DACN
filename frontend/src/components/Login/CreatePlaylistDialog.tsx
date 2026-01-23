import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';

interface CreatePlaylistDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (title: string, isPublic: boolean) => Promise<void>;
}

export function CreatePlaylistDialog({ isOpen, onClose, onCreate }: CreatePlaylistDialogProps) {
  const [title, setTitle] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      setError('Playlist title is required');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await onCreate(title.trim(), isPublic);
      setTitle('');
      setIsPublic(false);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create playlist');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setTitle('');
      setIsPublic(false);
      setError(null);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-[#1a1a1a] rounded-2xl p-6 w-full max-w-md border border-[#2a2a2a] shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-white text-2xl font-bold">Create Playlist</h2>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="text-gray-400 hover:text-white transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title" className="text-gray-300 mb-2 block">
              Playlist Name
            </Label>
            <Input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="My Playlist"
              disabled={isLoading}
              className="bg-[#0a0a0a] border-[#2a2a2a] text-white placeholder:text-gray-500 focus:border-[#00ff88]"
              autoFocus
            />
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isPublic"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              disabled={isLoading}
              className="w-4 h-4 rounded border-[#2a2a2a] bg-[#0a0a0a] text-[#00ff88] focus:ring-[#00ff88]"
            />
            <Label htmlFor="isPublic" className="text-gray-300 cursor-pointer">
              Make playlist public
            </Label>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              variant="ghost"
              className="flex-1 border border-[#2a2a2a] text-gray-300 hover:text-white hover:bg-[#2a2a2a]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !title.trim()}
              className="flex-1 bg-[#00ff88] hover:bg-[#00cc6a] text-black font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Creating...' : 'Create'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
