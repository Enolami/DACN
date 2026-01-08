import * as React from 'react';
import { useState } from 'react';
import { Mail, Lock, Sparkles, Loader2, AtSign } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Separator } from './ui/separator';
import { motion } from 'framer-motion';
import { loginUser, loginWithGoogle, loginWithFacebook, storeTokens, linkOAuthAccount } from '../../services/api';
import { AccountLinkingDialog } from './AccountLinkingDialog';
import { useGoogleLogin } from '@react-oauth/google';
// CHANGED: Import the Component instead of the Hook to avoid TS errors
import FacebookLogin from '@greatsumini/react-facebook-login';

const FACEBOOK_APP_ID = process.env.REACT_APP_FACEBOOK_APP_ID || '';

interface LoginPageProps {
  onLogin: (token: string, remember?: boolean, view?: string, data?: any) => void;
  onSkipToSubscription: () => void;
  onForgotPassword?: () => void;
}

export function LoginPage({ onLogin, onSkipToSubscription, onForgotPassword }: LoginPageProps) {
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Account linking state
  const [showAccountLinking, setShowAccountLinking] = useState(false);
  const [linkingData, setLinkingData] = useState<{
    email: string;
    provider: 'google' | 'facebook';
    oauthAccessToken: string;
  } | null>(null);

  // 1. GOOGLE LOGIN HOOK
  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setIsLoading(true);
      setError('');
      try {
        const data = await loginWithGoogle(tokenResponse.access_token);
        
        // Check if account linking is needed
        if (data.needs_account_linking) {
          setLinkingData({
            email: data.email,
            provider: 'google',
            oauthAccessToken: data.oauth_access_token || tokenResponse.access_token,
          });
          setShowAccountLinking(true);
          return;
        }
        
        // Check if username is needed (OAuth users always need to set username)
        if (data.needs_username) {
          // Store temp token and navigate to username setup
          storeTokens(data.temp_token, '', true);
          onLogin(data.temp_token, true, 'set-username', data);
          return;
        }
        
        // Social logins behave like "remember me" by default
        storeTokens(data.access, data.refresh, true);
        onLogin(data.access, true, undefined, data);
      } catch (err: any) {
        setError(err.message || 'Google login failed.');
      } finally {
        setIsLoading(false);
      }
    },
    onError: () => setError('Google login cancelled.'),
  });

  // 2. FACEBOOK LOGIC
  // We handle the logic inside these callbacks, which are passed to the component below
  const handleFacebookSuccess = async (response: any) => {
    console.log('Facebook Success:', response);
    setIsLoading(true);
    setError('');
    try {
      // Check if user actually accepted (has accessToken and userID)
      if (!response.accessToken || !response.userID) {
        // User cancelled or didn't grant permissions
        setError('Facebook login was cancelled.');
        setIsLoading(false);
        return;
      }
      
      const data = await loginWithFacebook(response.accessToken);
      
      // Check if account linking is needed
      if (data.needs_account_linking) {
        setLinkingData({
          email: data.email,
          provider: 'facebook',
          oauthAccessToken: data.oauth_access_token || response.accessToken,
        });
        setShowAccountLinking(true);
        return;
      }
      
      // Check if username is needed (OAuth users always need to set username)
      if (data.needs_username) {
        // Store temp token and navigate to username setup
        storeTokens(data.temp_token, '', true);
        onLogin(data.temp_token, true, 'set-username', data);
        return;
      }
      
      // Social logins behave like "remember me" by default
      storeTokens(data.access, data.refresh, true);
      onLogin(data.access, true, undefined, data);
    } catch (err: any) {
      setError(err.message || 'Facebook login failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFacebookFail = (error: any) => {
    console.error('Facebook Login Failed:', error);
    setIsLoading(false);
    setError('Facebook login was cancelled or failed.');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const data = await loginUser(usernameOrEmail, password);
      storeTokens(data.access, data.refresh, rememberMe);
      onLogin(data.access, rememberMe, undefined, data);
    } catch (err: any) {
      setError(err.message || 'Invalid username/email or password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-black flex items-center justify-center relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute inset-0">
        <motion.div animate={{ opacity: [0.3, 0.6, 0.3], scale: [1, 1.2, 1] }} transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }} className="absolute top-0 left-1/4 w-96 h-96 bg-[#00ff88] rounded-full blur-[120px]" />
        <motion.div animate={{ opacity: [0.4, 0.7, 0.4], scale: [1.2, 1, 1.2] }} transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }} className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#a855f7] rounded-full blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-md mx-4"
      >
        <div className="bg-black/40 backdrop-blur-xl border border-[#1a1a1a] rounded-3xl p-8 shadow-2xl">
          {/* Logo */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-[#00ff88] to-[#a855f7] rounded-2xl flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-black" />
            </div>
          </div>

          <h1 className="text-white text-center text-3xl mb-2">Welcome Back</h1>
          <p className="text-gray-400 text-center mb-8">Log in to continue your musical journey</p>

          {/* Social Login Buttons */}
          <div className="space-y-3 mb-6">
            {/* GOOGLE BUTTON */}
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                className="w-full bg-white hover:bg-gray-100 text-black gap-3 py-6 rounded-xl"
                onClick={() => googleLogin()}
                type="button"
                disabled={isLoading}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Continue with Google
              </Button>
            </motion.div>

            {/* FACEBOOK BUTTON (Using Render Prop Pattern) */}
            <FacebookLogin
              appId={FACEBOOK_APP_ID}
              onSuccess={handleFacebookSuccess}
              onFail={handleFacebookFail}
              render={({ onClick }) => (
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    className="w-full bg-[#1877F2] hover:bg-[#1864D9] text-white gap-3 py-6 rounded-xl"
                    onClick={onClick} // Attach the library's click handler
                    type="button"
                    disabled={isLoading}
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.791-4.647 4.535-4.647 1.317 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                    Continue with Facebook
                  </Button>
                </motion.div>
              )}
            />
          </div>

          <div className="flex items-center gap-4 mb-6">
            <Separator className="flex-1 bg-[#1a1a1a]" />
            <span className="text-gray-400 text-sm">or</span>
            <Separator className="flex-1 bg-[#1a1a1a]" />
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            {error && (
              <div className="text-red-500 text-sm text-center bg-red-500/10 p-2 rounded border border-red-500/20">
                {error}
              </div>
            )}
            <div>
              <Label htmlFor="usernameOrEmail" className="text-gray-300 mb-2 block">Username or Email</Label>
              <div className="relative">
                <AtSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="usernameOrEmail"
                  type="text"
                  placeholder="username or your@email.com"
                  className="w-full bg-[#1a1a1a] border-[#2a2a2a] rounded-xl pl-12 h-12 text-white placeholder:text-gray-500 focus-visible:ring-2 focus-visible:ring-[#00ff88]"
                  value={usernameOrEmail}
                  onChange={(e) => setUsernameOrEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="password" className="text-gray-300 mb-2 block">Password</Label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="w-full bg-[#1a1a1a] border-[#2a2a2a] rounded-xl pl-12 h-12 text-white placeholder:text-gray-500 focus-visible:ring-2 focus-visible:ring-[#00ff88]"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-gray-400 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-gray-600 bg-[#1a1a1a]"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                Remember me
              </label>
              <button 
                type="button"
                onClick={onForgotPassword}
                className="text-[#00ff88] hover:underline"
              >
                Forgot password?
              </button>
            </div>

            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-[#00ff88] to-[#00cc6e] hover:from-[#00ff88]/80 hover:to-[#00cc6e]/80 text-black py-6 rounded-xl disabled:opacity-50"
              >
                {isLoading ? <Loader2 className="animate-spin" /> : "Log In"}
              </Button>
            </motion.div>
          </form>

          <p className="text-center text-gray-400 text-sm mt-6">
            Don't have an account?{' '}
            <button onClick={onSkipToSubscription} className="text-[#00ff88] hover:underline">
              Sign up
            </button>
          </p>
        </div>
      </motion.div>

      {/* Account Linking Dialog */}
      {linkingData && (
        <AccountLinkingDialog
          isOpen={showAccountLinking}
          onClose={() => {
            setShowAccountLinking(false);
            setLinkingData(null);
          }}
          onLink={async (password: string) => {
            if (!linkingData) return;
            
            try {
              const data = await linkOAuthAccount(
                linkingData.email,
                password,
                linkingData.provider,
                linkingData.oauthAccessToken
              );
              
              // Store tokens and navigate to home
              storeTokens(data.access, data.refresh, true);
              setShowAccountLinking(false);
              setLinkingData(null);
              onLogin(data.access, true, undefined, data);
            } catch (err: any) {
              throw err; // Let the dialog handle the error
            }
          }}
          email={linkingData.email}
          provider={linkingData.provider}
          message="We found an existing account with this email. Would you like to link your account to it?"
        />
      )}
    </div>
  );
}