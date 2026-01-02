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

function App() {
  const [currentView, setCurrentView] = useState<View>('login');
  const [resetMode, setResetMode] = useState<'reset' | 'verify'>('verify');
  const [currentPage, setCurrentPage] = useState<string>('home');
  const [selectedArtist, setSelectedArtist] = useState<any>(null);
  const [selectedPlaylist, setSelectedPlaylist] = useState<any>(null);
  const [selectedSong, setSelectedSong] = useState<any>(null);
  const [showNowPlaying, setShowNowPlaying] = useState(false);
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

  const handleNavigate = (page: string, data?: any) => {
    console.log(`Navigating to: ${page}`, data);
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
      setCurrentView('song');
      setCurrentPage('song');
    } else if (page === 'profile') {
      // Navigate to user profile
      setCurrentView('profile');
      setCurrentPage('profile');
    } else {
      // Update current page for sidebar navigation
      setCurrentPage(page);
    }
  };

  const handleExpandPlayer = () => {
    // Open Now Playing Fullscreen
    setShowNowPlaying(true);
  };

  const handleSidebarNavigate = (page: string) => {
    setCurrentPage(page);
    // Handle navigation to different pages
    if (page === 'home' && currentView !== 'home') {
      setCurrentView('home');
    } else if (page === 'library' || page === 'liked' || page === 'artists' || page === 'albums') {
      // For library pages, stay in home view but show LibraryPage
      if (currentView !== 'home') {
        setCurrentView('home');
      }
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
                />
                {renderContent()}
              </div>
              <RightPanel onNavigate={handleNavigate} />
            </div>
            <MusicPlayer 
              onNavigate={handleNavigate}
              onExpandClick={handleExpandPlayer}
              currentSong={currentSong}
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
        />
      )}
    </>
  );
}

export default App;
