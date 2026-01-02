import React, { useState } from 'react';
import { LoginPage } from './components/Login/LoginPage';
import { SignUpPage } from './components/Login/SignUpPage';
import { ForgotPasswordPage } from './components/Login/ForgotPasswordPage';
import { ResetPasswordPage } from './components/Login/ResetPasswordPage';
import { SubscriptionPage } from './components/Login/SubscriptionPage';
import { HomePage } from './components/Login/HomePage';
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

type View = 'login' | 'signup' | 'forgot-password' | 'reset-password' | 'verify' | 'subscription' | 'home' | 'artist-profile' | 'profile' | 'playlist' | 'song';

interface NavigationState {
  view: View;
  page: string;
  data?: any;
}

function App() {
  const [currentView, setCurrentView] = useState<View>('login');
  const [resetMode, setResetMode] = useState<'reset' | 'verify'>('verify');
  const [currentPage, setCurrentPage] = useState<string>('home');
  const [selectedArtist, setSelectedArtist] = useState<any>(null);
  const [selectedPlaylist, setSelectedPlaylist] = useState<any>(null);
  const [selectedSong, setSelectedSong] = useState<any>(null);
  const [showNowPlaying, setShowNowPlaying] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Navigation history
  const [history, setHistory] = useState<NavigationState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  // Current playing song - shared across app
  const [currentSong, setCurrentSong] = useState<any>({
    title: 'Neon Dreams',
    artist: 'Cyber Pulse',
    album: 'Digital Horizons',
    duration: '3:42',
    imageUrl: 'https://images.unsplash.com/photo-1692176548571-86138128e36c?w=100'
  });

  const handleLogin = (token?: string) => {
  console.log('Login successful with token:', token);
  
  // Store the token (e.g., in localStorage)
  if (token) {
    localStorage.setItem('authToken', token);
  }
  
  // Navigate to subscription or home
  setCurrentView('subscription');
  };

  const handleSignUp = () => {
    console.log('Sign up clicked');
    // TODO: Implement sign up logic (API call, validation, etc.)
    // After successful sign up, navigate to subscription page
    setCurrentView('subscription');
  };

  const handleSelectPlan = (plan: 'free' | 'premium') => {
    console.log(`Selected plan: ${plan}`);
    // TODO: Implement plan selection logic (API call, save to database, etc.)
    // After selecting plan, navigate to home page
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
        currentView !== 'reset-password' && currentView !== 'verify' && currentView !== 'subscription') {
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
      setCurrentSong(data); // Update current playing song
      setIsPlaying(true); // Auto-play when navigating to song
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
        currentView !== 'reset-password' && currentView !== 'verify' && currentView !== 'subscription') {
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

  const handleSendResetLink = () => {
    console.log('Reset link sent');
    // After sending reset link, show verification code page
    setResetMode('verify');
    setCurrentView('verify');
  };

  const handleResetPassword = () => {
    if (resetMode === 'verify') {
      console.log('Verification code submitted');
      // After verification successful, show reset password form
      setResetMode('reset');
      setCurrentView('reset-password');
    } else {
      console.log('Password reset completed');
      // After password reset successful, go back to login
      setCurrentView('login');
      setResetMode('verify'); // Reset mode for next time
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
          />
        );
      case 'reset-password':
        return (
          <ResetPasswordPage 
            onResetPassword={handleResetPassword}
            mode="reset"
          />
        );
      case 'subscription':
        return (
          <SubscriptionPage 
            onSelectPlan={handleSelectPlan}
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
              <RightPanel onNavigate={handleNavigate} />
            </div>
            <MusicPlayer 
              onNavigate={handleNavigate}
              onExpandClick={handleExpandPlayer}
              currentSong={currentSong}
              isPlaying={isPlaying}
              onPlayPause={setIsPlaying}
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
              <RightPanel onNavigate={handleNavigate} />
            </div>
            <MusicPlayer 
              onNavigate={handleNavigate}
              onExpandClick={handleExpandPlayer}
              currentSong={currentSong}
              isPlaying={isPlaying}
              onPlayPause={setIsPlaying}
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
                />
              </div>
              <RightPanel onNavigate={handleNavigate} />
            </div>
            <MusicPlayer 
              onNavigate={handleNavigate}
              onExpandClick={handleExpandPlayer}
              currentSong={currentSong}
              isPlaying={isPlaying}
              onPlayPause={setIsPlaying}
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
              <RightPanel onNavigate={handleNavigate} />
            </div>
            <MusicPlayer 
              onNavigate={handleNavigate}
              onExpandClick={handleExpandPlayer}
              currentSong={currentSong}
              isPlaying={isPlaying}
              onPlayPause={setIsPlaying}
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
                    song={selectedSong}
                    onNavigate={handleNavigate}
                  />
                )}
              </div>
              <RightPanel onNavigate={handleNavigate} />
            </div>
            <MusicPlayer 
              onNavigate={handleNavigate}
              onExpandClick={handleExpandPlayer}
              currentSong={currentSong}
              isPlaying={isPlaying}
              onPlayPause={setIsPlaying}
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
