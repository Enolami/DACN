import React, { useState } from 'react';
import { LoginPage } from './components/LoginPage';
import { SignUpPage } from './components/SignUpPage';
import { ForgotPasswordPage } from './components/ForgotPasswordPage';
import { ResetPasswordPage } from './components/ResetPasswordPage';
import { SubscriptionPage } from './components/SubscriptionPage';

type View = 'login' | 'signup' | 'forgot-password' | 'reset-password' | 'verify' | 'subscription';

function App() {
  const [currentView, setCurrentView] = useState<View>('login');
  const [resetMode, setResetMode] = useState<'reset' | 'verify'>('verify');

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
    // After selecting plan, navigate to dashboard or main app
    // For now, just log the selection
    // setCurrentView('dashboard'); // Uncomment when dashboard is ready
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
