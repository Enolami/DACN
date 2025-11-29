import React, { useState } from 'react';
import { LoginPage } from './components/LoginPage';
import { SignUpPage } from './components/SignUpPage';
import { ForgotPasswordPage } from './components/ForgotPasswordPage';
import { ResetPasswordPage } from './components/ResetPasswordPage';
import { SubscriptionPage } from './components/SubscriptionPage';
import { HomePage } from './components/HomePage';
import { LeftSidebar } from './components/LeftSidebar';

import { RightPanel } from './components/RightPanel';
import { TopNavigation } from './components/TopNavigation';
import { ArtistProfile } from './components/ArtistProfile';
import { PlaylistDetail } from './components/PlaylistDetail';
import { LibraryPage } from './components/LibraryPage';

type View = 'login' | 'signup' | 'forgot-password' | 'reset-password' | 'verify' | 'subscription' | 'home' | 'artist-profile' | 'playlist-detail' | 'library-page';

function App() {
  const [currentView, setCurrentView] = useState<View>('login');
  const [resetMode, setResetMode] = useState<'reset' | 'verify'>('verify');
  const [currentPage, setCurrentPage] = useState<string>('home');
  const [selectedArtist, setSelectedArtist] = useState<any>(null);
  const [selectedPlaylist, setSelectedPlaylist] = useState<any>(null);
  const [libraryCategory, setLibraryCategory] = useState<'playlists' | 'songs' | 'podcasts' | 'artists' | 'albums'>('playlists');
  

  const handleLogin = () => {
    console.log('Login clicked');
    // TODO: Implement login logic (API call, validation, etc.)
    // After successful login, navigate to subscription page
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
      // TODO: Navigate to playlist detail page when implemented
      setSelectedPlaylist(data);
      setCurrentView('playlist-detail');
      setCurrentPage('playlist');
      console.log(`Navigate to ${page}:`, data);
    } else if (page === 'artist') {
      // Navigate to artist profile
      setSelectedArtist(data);
      setCurrentView('artist-profile');
      setCurrentPage('artist');
    }
    else {
      // Update current page for sidebar navigation
      setCurrentPage(page);
    }
  };

  const handleSidebarNavigate = (page: string) => {
    setCurrentPage(page);
    // TODO: Implement navigation to different pages (search, library, etc.)
    // For now, if navigating to home, ensure we're on home view
    if (page === 'home' && currentView !== 'home') {
      setCurrentView('home');
    } else if (page === 'library') {
      // Navigate to library-page with playlists category
      setLibraryCategory('playlists');
      setCurrentView('library-page');
    } else if (page === 'liked') {
      // Navigate to library-page with songs category
      setLibraryCategory('songs');
      setCurrentView('library-page');
    } else if (page === 'podcasts') {
      // Navigate to library-page with podcasts category
      setLibraryCategory('podcasts');
      setCurrentView('library-page');
    } else if (page === 'artists') {
      // Navigate to library-page with artists category
      setLibraryCategory('artists');
      setCurrentView('library-page');
    } else if (page === 'albums') {
      // Navigate to library-page with albums category
      setLibraryCategory('albums');
      setCurrentView('library-page');
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
            onLogin={handleLogin}
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
        return (
          <div className="flex h-screen bg-black overflow-hidden">
            <LeftSidebar 
              onNavigate={handleSidebarNavigate}
              currentPage={currentPage}
            />
            <div className="flex-1 flex flex-col overflow-hidden">
              <TopNavigation 
                onNavigate={handleNavigate}
                currentPage={currentPage}
              />
              <HomePage 
                onNavigate={handleNavigate}
              />
            </div>
            <RightPanel />
          </div>
        );
      case 'artist-profile':
        return (
          <div className="flex h-screen bg-black overflow-hidden">
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
            <RightPanel />
          </div>
        );
      case 'playlist-detail':
        return (
          <div className="flex h-screen bg-black overflow-hidden">
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
                />
              )}
            </div>
            <RightPanel />
          </div>
        );
      case 'library-page':
        return (
          <div className="flex h-screen bg-black overflow-hidden">
            <LeftSidebar 
              onNavigate={handleSidebarNavigate}
              currentPage={currentPage}
            />
            <div className="flex-1 flex flex-col overflow-hidden">
              <TopNavigation 
                onNavigate={handleNavigate}
                currentPage={currentPage}
              />
              <LibraryPage 
                onNavigate={handleNavigate}
                category={libraryCategory}
              />
            </div>
            <RightPanel />
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

  return <>{renderView()}</>;
}

export default App;
