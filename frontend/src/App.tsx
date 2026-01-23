import React, { useState, useEffect } from 'react';
import { getAccessToken, clearTokens, storeTokens, validateToken } from './services/api';
import type { Song } from './types/music';
import { LoginPage } from './components/Login/LoginPage';
import { SignUpPage } from './components/Login/SignUpPage';
import { OTPVerificationPage } from './components/Login/OTPVerificationPage';
import { UsernameSetupPage } from './components/Login/UsernameSetupPage';
import { ForgotPasswordPage } from './components/Login/ForgotPasswordPage';
import { ResetPasswordPage } from './components/Login/ResetPasswordPage';
import { HomePage } from './components/Login/HomePage';
import { SearchPage } from './components/Login/SearchPage';
import { LeftSidebar } from './components/Login/LeftSidebar';
import { RightPanel } from './components/Login/RightPanel';
import { TopNavigation } from './components/Login/TopNavigation';
import { ArtistProfile } from './components/Login/ArtistProfile';
import { ProfilePage } from './components/Profile/ProfilePage';
import { PlaylistDetail } from './components/Login/PlaylistDetail';
import { LibraryPage } from './components/Login/LibraryPage';
import { SongDetail } from './components/Login/SongDetail';
import { MusicPlayer } from './components/Login/MusicPlayer';
import { NowPlayingFullscreen } from './components/Login/NowPlayingFullscreen';

type View = 'login' | 'signup' | 'verify-otp' | 'forgot-password' | 'reset-password' | 'verify' | 'set-username' | 'home' | 'artist-profile' | 'profile' | 'playlist' | 'song' | 'search';

interface NavigationState {
  view: View;
  page: string;
  data?: any;
}

function App() {
  const [currentView, setCurrentView] = useState<View>('login');
  const [resetMode, setResetMode] = useState<'reset' | 'verify'>('verify');
  const [resetEmail, setResetEmail] = useState<string>('');
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<string>('home');
  const [signupEmail, setSignupEmail] = useState<string>('');
  const [selectedArtist, setSelectedArtist] = useState<any>(null);
  const [selectedPlaylist, setSelectedPlaylist] = useState<any>(null);
  const [selectedSong, setSelectedSong] = useState<any>(null);
  const [showNowPlaying, setShowNowPlaying] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Navigation history
  const [history, setHistory] = useState<NavigationState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  // Current playing song - shared across app
  const [currentSong, setCurrentSong] = useState<any>(null);
  
  // Queue management
  const [queue, setQueue] = useState<Song[]>([]);
  const [currentQueueIndex, setCurrentQueueIndex] = useState<number>(-1);

  // Auto-login on app load if a token already exists (remember me or session)
  useEffect(() => {
    const checkAuth = async () => {
      const storedToken = getAccessToken();
      if (storedToken) {
        // Validate token before auto-login
        const isValid = await validateToken();
        if (isValid) {
          setCurrentPage('home');
          setCurrentView('home');
        } else {
          // Token is invalid, clear it and stay on login
          clearTokens();
          setCurrentView('login');
        }
      }
    };
    checkAuth();
  }, []);

  const handleLogin = (token: string, remember?: boolean, view?: string, data?: any) => {
    // If view is specified (e.g., 'set-username'), navigate to that view
    if (view === 'set-username' && data?.email) {
      setCurrentView('set-username');
      setSignupEmail(data.email); // Reuse signupEmail state for username setup email
      return;
    }
    
    // Check if the token response indicates username is needed
    // This handles OAuth flows that return needs_username flag
    if (data?.needs_username && data?.email) {
      setCurrentView('set-username');
      setSignupEmail(data.email);
      return;
    }
    
    // Tokens are now stored via helpers in api.ts; here we just move the user into the main app
    setCurrentPage('home');
    setCurrentView('home');
  };

  const handleLogout = () => {
    clearTokens();

    // Reset high-level app state
    setCurrentView('login');
    setCurrentPage('home');
    setSelectedArtist(null);
    setSelectedPlaylist(null);
    setSelectedSong(null);
    setShowNowPlaying(false);
    setIsPlaying(false);
    setHistory([]);
    setHistoryIndex(-1);
  };

  const handleSignUp = (email: string) => {
    console.log('Sign up successful, showing OTP verification for:', email);
    setSignupEmail(email);
    setCurrentView('verify-otp');
  };

  const handleOTPVerified = (data: any) => {
    // Check if username is needed
    if (data.needs_username) {
      // Store temp token and navigate to username setup
      storeTokens(data.temp_token, '', true);
      setSignupEmail(data.email);
      setCurrentView('set-username');
      return;
    }
    
    // Store tokens - remember me by default after signup
    storeTokens(data.access, data.refresh, true);
    
    // Navigate to home
    setCurrentPage('home');
    setCurrentView('home');
  };

  const handleUsernameSetupComplete = (access: string, refresh: string) => {
    // Store tokens - remember me by default after OAuth
    storeTokens(access, refresh, true);
    
    // Navigate to home
    setCurrentPage('home');
    setCurrentView('home');
  };

  const addToHistory = (view: View, page: string, data?: any) => {
    const newState: NavigationState = { view, page, data };
    
    // If we're not at the end of history, remove future entries
    if (historyIndex >= 0 && historyIndex < history.length - 1) {
      const newHistory = history.slice(0, historyIndex + 1);
      const updatedHistory = [...newHistory, newState];
      setHistory(updatedHistory);
      setHistoryIndex(updatedHistory.length - 1);
    } else {
      // Add new entry to history
      const updatedHistory = [...history, newState];
      setHistory(updatedHistory);
      setHistoryIndex(updatedHistory.length - 1);
    }
  };

  const handleNavigate = (page: string, data?: any) => {
    console.log(`Navigating to: ${page}`, data);
    
    // Save current state to history before navigating
    if (currentView !== 'login' && currentView !== 'signup' && currentView !== 'forgot-password' && 
        currentView !== 'reset-password' && currentView !== 'verify') {
      addToHistory(currentView, currentPage, {
        selectedArtist,
        selectedPlaylist,
        selectedSong,
      });
    }
    
    // TODO: Implement navigation logic for different pages
    // For now, handle basic navigation
    if (page === 'playlist') {
      // Navigate to playlist detail page
      setSelectedPlaylist(data);
      setCurrentView('playlist');
      setCurrentPage('playlist');
    } else if (page === 'artist') {
      // Navigate to artist profile
      setSelectedArtist(data);
      setCurrentView('artist-profile');
      setCurrentPage('artist');
    } else if (page === 'song') {
      // Navigate to song detail
      setSelectedSong(data);
      // Update current playing song - handle both full song object and wrapped format
      const songToPlay = data?.song || data;
      setCurrentSong(songToPlay);
      setIsPlaying(true); // Auto-play when navigating to song
      
      // If song is in queue, update queue index
      const songId = songToPlay?.id;
      if (songId) {
        const queueIndex = queue.findIndex(s => s.id === songId);
        if (queueIndex >= 0) {
          setCurrentQueueIndex(queueIndex);
        } else {
          // Song not in queue, add it and set as current
          setQueue(prev => {
            const newQueue = [...prev, songToPlay];
            setCurrentQueueIndex(newQueue.length - 1);
            return newQueue;
          });
        }
      }
      
      setCurrentView('song');
      setCurrentPage('song');
    } else if (page === 'profile') {
      // Navigate to user profile
      setCurrentView('profile');
      setCurrentPage('profile');
    } else if (page === 'album') {
      // Treat album as playlist for now
      setSelectedPlaylist({
        title: data?.title || 'Album',
        description: `Album by ${data?.artist || 'Unknown'}`,
        imageUrl: data?.imageUrl,
      });
      setCurrentView('playlist');
      setCurrentPage('playlist');
    } else if (page === 'search') {
      // Navigate to search page
      setCurrentView('search');
      setCurrentPage('search');
    } else {
      // Update current page for sidebar navigation
      setCurrentPage(page);
    }
  };

  const handleBack = () => {
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1;
      const prevState = history[prevIndex];
      
      setHistoryIndex(prevIndex);
      setCurrentView(prevState.view);
      setCurrentPage(prevState.page);
      
      if (prevState.data) {
        if (prevState.view === 'playlist') {
          setSelectedPlaylist(prevState.data.selectedPlaylist);
        } else if (prevState.view === 'artist-profile') {
          setSelectedArtist(prevState.data.selectedArtist);
        } else if (prevState.view === 'song') {
          setSelectedSong(prevState.data.selectedSong);
          if (prevState.data.selectedSong) {
            setCurrentSong(prevState.data.selectedSong);
          }
        } else if (prevState.view === 'home') {
          // Restore home page state
          setSelectedPlaylist(null);
          setSelectedArtist(null);
          setSelectedSong(null);
        }
      } else {
        // Clear selections when going back to home without data
        if (prevState.view === 'home') {
          setSelectedPlaylist(null);
          setSelectedArtist(null);
          setSelectedSong(null);
        }
      }
    }
  };

  const handleForward = () => {
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      const nextState = history[nextIndex];
      
      setHistoryIndex(nextIndex);
      setCurrentView(nextState.view);
      setCurrentPage(nextState.page);
      
      if (nextState.data) {
        if (nextState.view === 'playlist') {
          setSelectedPlaylist(nextState.data.selectedPlaylist);
        } else if (nextState.view === 'artist-profile') {
          setSelectedArtist(nextState.data.selectedArtist);
        } else if (nextState.view === 'song') {
          setSelectedSong(nextState.data.selectedSong);
          if (nextState.data.selectedSong) {
            setCurrentSong(nextState.data.selectedSong);
          }
        } else if (nextState.view === 'home') {
          // Restore home page state
          setSelectedPlaylist(null);
          setSelectedArtist(null);
          setSelectedSong(null);
        }
      } else {
        // Clear selections when going forward to home without data
        if (nextState.view === 'home') {
          setSelectedPlaylist(null);
          setSelectedArtist(null);
          setSelectedSong(null);
        }
      }
    }
  };

  const canGoBack = historyIndex > 0;
  const canGoForward = historyIndex < history.length - 1;

  const handleExpandPlayer = () => {
    // Open Now Playing Fullscreen
    setShowNowPlaying(true);
  };

  const handleSidebarNavigate = (page: string) => {
    // Save current state to history before navigating
    if (currentView !== 'login' && currentView !== 'signup' && currentView !== 'forgot-password' && 
        currentView !== 'reset-password' && currentView !== 'verify') {
      addToHistory(currentView, currentPage, {
        selectedArtist,
        selectedPlaylist,
        selectedSong,
      });
    }
    
    // Handle navigation to different pages
    if (page === 'home') {
      setCurrentView('home');
      setCurrentPage('home');
      // Clear selections when going to home
      setSelectedPlaylist(null);
      setSelectedArtist(null);
      setSelectedSong(null);
    } else if (page === 'library' || page === 'liked' || page === 'artists' || page === 'albums') {
      // For library pages, stay in home view but show LibraryPage
      setCurrentView('home');
      setCurrentPage(page);
      // Clear selections when navigating to library pages
      setSelectedPlaylist(null);
      setSelectedArtist(null);
      setSelectedSong(null);
    } else {
      setCurrentPage(page);
    }
    console.log(`Sidebar navigation to: ${page}`);
  };

  const handleNavigateToSignUp = () => {
    setCurrentView('signup');
  };

  const handleNavigateToLogin = () => {
    setCurrentView('login');
  };

  const handleNavigateToForgotPassword = () => {
    setCurrentView('forgot-password');
  };

  const handleSendResetLink = (email: string) => {
    setResetEmail(email);
    // After sending reset link, show verification code page
    setResetMode('verify');
    setCurrentView('verify');
  };

  const handleResetPassword = (access?: string, refresh?: string) => {
    if (resetMode === 'verify') {
      // After verification successful, store the reset token and show reset password form
      if (access) {
        setResetToken(access); // Store the reset token
      }
      setResetMode('reset');
      setCurrentView('reset-password');
    } else {
      // After password reset successful, user is logged in
      if (access && refresh) {
        // Store tokens and navigate to home
        const { storeTokens } = require('./services/api');
        storeTokens(access, refresh, true);
        setCurrentView('home');
        setCurrentPage('library');
      } else {
        // Fallback: go back to login
        setCurrentView('login');
      }
      setResetMode('verify'); // Reset mode for next time
      setResetEmail(''); // Clear email
      setResetToken(null); // Clear reset token
    }
  };

  // Handle play song callback
  const handlePlaySong = (song: Song) => {
    setCurrentSong(song);
    setIsPlaying(true);
    
    // If song is in queue, update queue index
    const songId = song?.id;
    if (songId) {
      const queueIndex = queue.findIndex(s => s.id === songId);
      if (queueIndex >= 0) {
        setCurrentQueueIndex(queueIndex);
      } else {
        // Song not in queue, add it and set as current
        setQueue(prev => {
          const newQueue = [...prev, song];
          setCurrentQueueIndex(newQueue.length - 1);
          return newQueue;
        });
      }
    }
  };

  // Queue management functions
  const addToQueue = (song: Song, playNext: boolean = false) => {
    setQueue(prev => {
      // Check if song already in queue
      if (prev.some(s => s.id === song.id)) {
        return prev; // Already in queue
      }
      
      if (playNext && currentQueueIndex >= 0) {
        // Insert after current song
        const newQueue = [...prev];
        newQueue.splice(currentQueueIndex + 1, 0, song);
        return newQueue;
      } else {
        // Add to end
        return [...prev, song];
      }
    });
  };

  const removeFromQueue = (songId: string) => {
    setQueue(prev => {
      const newQueue = prev.filter(s => s.id !== songId);
      const removedIndex = prev.findIndex(s => s.id === songId);
      
      // Adjust current index if needed
      if (removedIndex >= 0) {
        if (removedIndex < currentQueueIndex) {
          setCurrentQueueIndex(prev => prev - 1);
        } else if (removedIndex === currentQueueIndex) {
          // If we removed the current song, move to next or previous
          if (newQueue.length > 0) {
            const nextIndex = Math.min(currentQueueIndex, newQueue.length - 1);
            setCurrentQueueIndex(nextIndex);
            if (nextIndex >= 0 && nextIndex < newQueue.length) {
              setCurrentSong(newQueue[nextIndex]);
              setIsPlaying(true);
            }
          } else {
            setCurrentQueueIndex(-1);
            setCurrentSong(null);
            setIsPlaying(false);
          }
        }
      }
      
      return newQueue;
    });
  };

  const clearQueue = () => {
    setQueue([]);
    setCurrentQueueIndex(-1);
    // Don't stop current song, just clear queue
  };

  const reorderQueue = (fromIndex: number, toIndex: number) => {
    setQueue(prev => {
      const newQueue = [...prev];
      const [removed] = newQueue.splice(fromIndex, 1);
      newQueue.splice(toIndex, 0, removed);
      
      // Update current index if needed
      if (currentQueueIndex === fromIndex) {
        setCurrentQueueIndex(toIndex);
      } else if (currentQueueIndex > fromIndex && currentQueueIndex <= toIndex) {
        setCurrentQueueIndex(prev => prev - 1);
      } else if (currentQueueIndex < fromIndex && currentQueueIndex >= toIndex) {
        setCurrentQueueIndex(prev => prev + 1);
      }
      
      return newQueue;
    });
  };

  // Auto-play next song when current song ends
  const handleSongEnd = () => {
    if (currentQueueIndex >= 0 && currentQueueIndex < queue.length - 1) {
      const nextIndex = currentQueueIndex + 1;
      const nextSong = queue[nextIndex];
      if (nextSong) {
        setCurrentQueueIndex(nextIndex);
        setCurrentSong(nextSong);
        setIsPlaying(true);
      }
    } else {
      // Queue ended or no next song
      setIsPlaying(false);
    }
  };

  const renderView = () => {
    switch (currentView) {
      case 'login':
        return (
          <LoginPage 
            onLogin={handleLogin} // This now accepts the token passed from LoginPage
            onSkipToSubscription={handleNavigateToSignUp}
            onForgotPassword={handleNavigateToForgotPassword}
          />
        );
      case 'signup':
        return (
          <SignUpPage 
            onSignUp={handleSignUp}
            onNavigateToLogin={handleNavigateToLogin}
          />
        );
      case 'verify-otp':
        return (
          <OTPVerificationPage
            email={signupEmail}
            onVerified={handleOTPVerified}
            onBack={() => setCurrentView('signup')}
          />
        );
      case 'set-username':
        return (
          <UsernameSetupPage
            email={signupEmail}
            onComplete={handleUsernameSetupComplete}
            onBack={() => setCurrentView('login')}
          />
        );
      case 'forgot-password':
        return (
          <ForgotPasswordPage 
            onSendResetLink={handleSendResetLink}
            onBackToLogin={handleNavigateToLogin}
          />
        );
      case 'verify':
        return (
          <ResetPasswordPage 
            onResetPassword={handleResetPassword}
            mode="verify"
            email={resetEmail}
            resetToken={null}
          />
        );
      case 'reset-password':
        return (
          <ResetPasswordPage 
            onResetPassword={handleResetPassword}
            mode="reset"
            email={resetEmail}
            resetToken={resetToken}
          />
        );
      case 'home':
        // Determine which page to show based on currentPage
        const renderContent = () => {
          if (currentPage === 'library' || currentPage === 'liked' || currentPage === 'artists' || currentPage === 'albums') {
            // Map page to category
            const categoryMap: Record<string, 'playlists' | 'songs' | 'artists' | 'albums'> = {
              'library': 'playlists',
              'liked': 'songs',
              'artists': 'artists',
              'albums': 'albums',
            };
            return (
              <LibraryPage 
                onNavigate={handleNavigate}
                category={categoryMap[currentPage] || 'playlists'}
              />
            );
          }
          return <HomePage onNavigate={handleNavigate} />;
        };

        return (
          <div className="flex h-screen bg-black overflow-hidden flex-col">
            <div className="flex flex-1 overflow-hidden">
              <LeftSidebar 
                onNavigate={handleSidebarNavigate}
                currentPage={currentPage}
              />
              <div className="flex-1 flex flex-col overflow-hidden">
                <TopNavigation 
                  onNavigate={handleNavigate}
                  currentPage={currentPage}
                  onBack={handleBack}
                  onForward={handleForward}
                  canGoBack={canGoBack}
                  canGoForward={canGoForward}
                />
                {renderContent()}
              </div>
              <RightPanel 
                onNavigate={handleNavigate} 
                currentSong={currentSong}
                queue={queue}
                currentQueueIndex={currentQueueIndex}
                onRemoveFromQueue={removeFromQueue}
                onClearQueue={clearQueue}
                onReorderQueue={reorderQueue}
                onPlayFromQueue={(song, index) => {
                  setCurrentSong(song);
                  setCurrentQueueIndex(index);
                  setIsPlaying(true);
                }}
              />
            </div>
            <MusicPlayer 
              onNavigate={handleNavigate}
              onExpandClick={handleExpandPlayer}
              currentSong={currentSong}
              isPlaying={isPlaying}
              onPlayPause={setIsPlaying}
              onSongEnd={handleSongEnd}
            />
          </div>
        );
      case 'artist-profile':
        return (
          <div className="flex h-screen bg-black overflow-hidden flex-col">
            <div className="flex flex-1 overflow-hidden">
              <LeftSidebar 
                onNavigate={handleSidebarNavigate}
                currentPage={currentPage}
              />
              <div className="flex-1 flex flex-col overflow-hidden">
                <TopNavigation 
                  onNavigate={handleNavigate}
                  currentPage={currentPage}
                  onBack={handleBack}
                  onForward={handleForward}
                  canGoBack={canGoBack}
                  canGoForward={canGoForward}
                />
                {selectedArtist && (
                  <ArtistProfile 
                    artist={selectedArtist}
                    onNavigate={handleNavigate}
                  />
                )}
              </div>
              <RightPanel 
                onNavigate={handleNavigate} 
                currentSong={currentSong}
                queue={queue}
                currentQueueIndex={currentQueueIndex}
                onRemoveFromQueue={removeFromQueue}
                onClearQueue={clearQueue}
                onReorderQueue={reorderQueue}
                onPlayFromQueue={(song, index) => {
                  setCurrentSong(song);
                  setCurrentQueueIndex(index);
                  setIsPlaying(true);
                }}
              />
            </div>
            <MusicPlayer 
              onNavigate={handleNavigate}
              onExpandClick={handleExpandPlayer}
              currentSong={currentSong}
              isPlaying={isPlaying}
              onPlayPause={setIsPlaying}
              onSongEnd={handleSongEnd}
            />
          </div>
        );
      case 'profile':
        return (
          <div className="flex h-screen bg-black overflow-hidden flex-col">
            <div className="flex flex-1 overflow-hidden">
              <LeftSidebar 
                onNavigate={handleSidebarNavigate}
                currentPage={currentPage}
              />
              <div className="flex-1 flex flex-col overflow-hidden">
                <TopNavigation 
                  onNavigate={handleNavigate}
                  currentPage={currentPage}
                  onBack={handleBack}
                  onForward={handleForward}
                  canGoBack={canGoBack}
                  canGoForward={canGoForward}
                />
                <ProfilePage 
                  onNavigate={handleNavigate}
                  onLogout={handleLogout}
                  onPlaySong={handlePlaySong}
                />
              </div>
              <RightPanel 
                onNavigate={handleNavigate} 
                currentSong={currentSong}
                queue={queue}
                currentQueueIndex={currentQueueIndex}
                onRemoveFromQueue={removeFromQueue}
                onClearQueue={clearQueue}
                onReorderQueue={reorderQueue}
                onPlayFromQueue={(song, index) => {
                  setCurrentSong(song);
                  setCurrentQueueIndex(index);
                  setIsPlaying(true);
                }}
              />
            </div>
            <MusicPlayer 
              onNavigate={handleNavigate}
              onExpandClick={handleExpandPlayer}
              currentSong={currentSong}
              isPlaying={isPlaying}
              onPlayPause={setIsPlaying}
              onSongEnd={handleSongEnd}
            />
          </div>
        );
      case 'playlist':
        return (
          <div className="flex h-screen bg-black overflow-hidden flex-col">
            <div className="flex flex-1 overflow-hidden">
              <LeftSidebar 
                onNavigate={handleSidebarNavigate}
                currentPage={currentPage}
              />
              <div className="flex-1 flex flex-col overflow-hidden">
                <TopNavigation 
                  onNavigate={handleNavigate}
                  currentPage={currentPage}
                  onBack={handleBack}
                  onForward={handleForward}
                  canGoBack={canGoBack}
                  canGoForward={canGoForward}
                />
                {selectedPlaylist && (
                  <PlaylistDetail 
                    playlist={selectedPlaylist}
                    onNavigate={handleNavigate}
                  />
                )}
              </div>
              <RightPanel 
                onNavigate={handleNavigate} 
                currentSong={currentSong}
                queue={queue}
                currentQueueIndex={currentQueueIndex}
                onRemoveFromQueue={removeFromQueue}
                onClearQueue={clearQueue}
                onReorderQueue={reorderQueue}
                onPlayFromQueue={(song, index) => {
                  setCurrentSong(song);
                  setCurrentQueueIndex(index);
                  setIsPlaying(true);
                }}
              />
            </div>
            <MusicPlayer 
              onNavigate={handleNavigate}
              onExpandClick={handleExpandPlayer}
              currentSong={currentSong}
              isPlaying={isPlaying}
              onPlayPause={setIsPlaying}
              onSongEnd={handleSongEnd}
            />
          </div>
        );
      case 'song':
        return (
          <div className="flex h-screen bg-black overflow-hidden flex-col">
            <div className="flex flex-1 overflow-hidden">
              <LeftSidebar 
                onNavigate={handleSidebarNavigate}
                currentPage={currentPage}
              />
              <div className="flex-1 flex flex-col overflow-hidden">
                <TopNavigation 
                  onNavigate={handleNavigate}
                  currentPage={currentPage}
                  onBack={handleBack}
                  onForward={handleForward}
                  canGoBack={canGoBack}
                  canGoForward={canGoForward}
                />
                {selectedSong && (
                  <SongDetail 
                    initialSong={selectedSong}
                    onNavigate={handleNavigate}
                    onPlaySong={(song) => {
                      console.log('onPlaySong called with:', song);
                      const songToPlay = song;
                      setCurrentSong(songToPlay);
                      setIsPlaying(true);
                      // Also update selectedSong to keep state in sync
                      setSelectedSong(songToPlay);
                    }}
                  />
                )}
              </div>
              <RightPanel 
                onNavigate={handleNavigate} 
                currentSong={currentSong}
                queue={queue}
                currentQueueIndex={currentQueueIndex}
                onRemoveFromQueue={removeFromQueue}
                onClearQueue={clearQueue}
                onReorderQueue={reorderQueue}
                onPlayFromQueue={(song, index) => {
                  setCurrentSong(song);
                  setCurrentQueueIndex(index);
                  setIsPlaying(true);
                }}
              />
            </div>
            <MusicPlayer 
              onNavigate={handleNavigate}
              onExpandClick={handleExpandPlayer}
              currentSong={currentSong}
              isPlaying={isPlaying}
              onPlayPause={setIsPlaying}
              onSongEnd={handleSongEnd}
            />
          </div>
        );
      case 'search':
        return (
          <div className="flex h-screen bg-black overflow-hidden flex-col">
            <div className="flex flex-1 overflow-hidden">
              <LeftSidebar 
                onNavigate={handleSidebarNavigate}
                currentPage={currentPage}
              />
              <div className="flex-1 flex flex-col overflow-hidden">
                <TopNavigation 
                  onNavigate={handleNavigate}
                  currentPage={currentPage}
                  onBack={handleBack}
                  onForward={handleForward}
                  canGoBack={canGoBack}
                  canGoForward={canGoForward}
                />
                <SearchPage onNavigate={handleNavigate} />
              </div>
              <RightPanel 
                onNavigate={handleNavigate} 
                currentSong={currentSong}
                queue={queue}
                currentQueueIndex={currentQueueIndex}
                onRemoveFromQueue={removeFromQueue}
                onClearQueue={clearQueue}
                onReorderQueue={reorderQueue}
                onPlayFromQueue={(song, index) => {
                  setCurrentSong(song);
                  setCurrentQueueIndex(index);
                  setIsPlaying(true);
                }}
              />
            </div>
            <MusicPlayer 
              onNavigate={handleNavigate}
              onExpandClick={handleExpandPlayer}
              currentSong={currentSong}
              isPlaying={isPlaying}
              onPlayPause={setIsPlaying}
              onSongEnd={handleSongEnd}
            />
          </div>
        );
      default:
        return (
          <LoginPage 
            onLogin={handleLogin}
            onSkipToSubscription={handleNavigateToSignUp}
            onForgotPassword={handleNavigateToForgotPassword}
          />
        );
    }
  };

  return (
    <>
      {renderView()}
      {showNowPlaying && (
        <NowPlayingFullscreen 
          onClose={() => setShowNowPlaying(false)}
          currentSong={currentSong}
          isPlaying={isPlaying}
          onPlayPause={setIsPlaying}
          onNavigate={handleNavigate}
        />
      )}
    </>
  );
}

export default App;
