import { useState } from 'react';
import { Search, Download, Loader2, Music, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { motion } from 'framer-motion';
import { searchJamendo, importFromJamendo, getSongs, formatDuration } from '../../services/api';
import type { JamendoTrack, JamendoSearchResponse } from '../../types/music';
import { ImageWithFallback } from './img/ImageWithFallback';

interface SearchPageProps {
  onNavigate: (page: string, data?: any) => void;
}

export function SearchPage({ onNavigate }: SearchPageProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<JamendoTrack[]>([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!searchQuery.trim()) return;

    try {
      setLoading(true);
      setError(null);
      const response: JamendoSearchResponse = await searchJamendo(searchQuery);
      setSearchResults(response.results || []);
      setHasSearched(true);
    } catch (err) {
      console.error('Error searching Jamendo:', err);
      setError(err instanceof Error ? err.message : 'Failed to search Jamendo');
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async (track: JamendoTrack) => {
    try {
      setImporting(prev => new Set(prev).add(track.id));
      setError(null);
      
      // Import the track
      const importedSong = await importFromJamendo(track.id);
      
      // Refresh the songs list (could trigger a refresh in parent component)
      // For now, just show success
      alert(`Successfully imported "${track.name}" by ${track.artist_name}`);
      
      // Navigate to the imported song
      onNavigate('song', { song: importedSong });
    } catch (err) {
      console.error('Error importing track:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to import track';
      setError(errorMessage);
      alert(`Failed to import: ${errorMessage}`);
    } finally {
      setImporting(prev => {
        const newSet = new Set(prev);
        newSet.delete(track.id);
        return newSet;
      });
    }
  };

  return (
    <ScrollArea className="flex-1 h-full bg-black">
      <div className="p-6 md:p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-white text-3xl font-bold mb-2">Search Jamendo</h1>
          <p className="text-gray-400">Discover and import music from Jamendo's library</p>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search for tracks, artists, or albums..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-full pl-12 pr-24 h-12 text-white placeholder:text-gray-500 focus-visible:ring-2 focus-visible:ring-[#00ff88] focus-visible:border-[#00ff88]"
            />
            <Button
              type="submit"
              disabled={loading || !searchQuery.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#00ff88] text-black hover:bg-[#00cc6a] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Search'
              )}
            </Button>
          </div>
        </form>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-3"
          >
            <AlertCircle className="w-5 h-5 text-red-400" />
            <p className="text-red-400">{error}</p>
          </motion.div>
        )}

        {/* Search Results */}
        {hasSearched && (
          <div>
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="flex flex-col items-center gap-4">
                  <Loader2 className="w-8 h-8 text-[#00ff88] animate-spin" />
                  <p className="text-gray-400">Searching Jamendo...</p>
                </div>
              </div>
            ) : searchResults.length === 0 ? (
              <div className="text-center py-16">
                <Music className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-white text-xl mb-2">No results found</h3>
                <p className="text-gray-400">Try a different search query</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-white text-xl font-semibold">
                    Search Results ({searchResults.length})
                  </h2>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  {searchResults.map((track) => (
                    <motion.div
                      key={track.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
                      className="bg-[#1a1a1a] rounded-lg p-4 flex items-center gap-4 group"
                    >
                      {/* Album Art */}
                      <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                        <ImageWithFallback
                          src={track.image || ''}
                          alt={track.name}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Track Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white font-medium truncate group-hover:text-[#00ff88] transition-colors">
                          {track.name}
                        </h3>
                        <p className="text-gray-400 text-sm truncate">
                          {track.artist_name}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          {track.album_name && (
                            <>
                              <p className="text-gray-500 text-xs truncate">
                                {track.album_name}
                              </p>
                              <span className="text-gray-600">•</span>
                            </>
                          )}
                          <p className="text-gray-500 text-xs">
                            {formatDuration(track.duration)}
                          </p>
                        </div>
                      </div>

                      {/* Import Button */}
                      <Button
                        onClick={() => handleImport(track)}
                        disabled={importing.has(track.id)}
                        className="bg-[#00ff88] text-black hover:bg-[#00cc6a] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {importing.has(track.id) ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Importing...</span>
                          </>
                        ) : (
                          <>
                            <Download className="w-4 h-4" />
                            <span>Import</span>
                          </>
                        )}
                      </Button>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {!hasSearched && !loading && (
          <div className="text-center py-16">
            <Search className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-white text-xl mb-2">Search Jamendo Library</h3>
            <p className="text-gray-400">
              Enter a search query above to discover music from Jamendo
            </p>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
