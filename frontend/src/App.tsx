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

type View = 'login' | 'signup' | 'forgot-password' | 'reset-password' | 'verify' | 'subscription' | 'home' | 'artist-profile' | 'profile';

function App() {
  const [currentView, setCurrentView] = useState<View>('login');
  const [resetMode, setResetMode] = useState<'reset' | 'verify'>('verify');
  const [currentPage, setCurrentPage] = useState<string>('home');
  const [selectedArtist, setSelectedArtist] = useState<any>(null);

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
      // TODO: Navigate to playlist detail page when implemented
      console.log(`Navigate to ${page}:`, data);
    } else if (page === 'artist') {
      // Navigate to artist profile
      setSelectedArtist(data);
      setCurrentView('artist-profile');
      setCurrentPage('artist');
    } else if (page === 'profile') {
      // Navigate to user profile
      setCurrentView('profile');
      setCurrentPage('profile');
    } else {
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
      case 'profile':
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
              <ProfilePage 
                onNavigate={handleNavigate}
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
