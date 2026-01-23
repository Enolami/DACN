import { Mail, Lock, Sparkles, User, Eye, EyeOff, Loader2, AtSign } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Separator } from './ui/separator';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { registerUser, loginWithGoogle, loginWithFacebook, storeTokens, linkOAuthAccount } from '../../services/api';
import { AccountLinkingDialog } from './AccountLinkingDialog';
import { useGoogleLogin } from '@react-oauth/google';
import FacebookLogin from '@greatsumini/react-facebook-login';

const FACEBOOK_APP_ID = process.env.REACT_APP_FACEBOOK_APP_ID || '';

interface SignUpPageProps {
  onSignUp: (email: string) => void;
  onNavigateToLogin: () => void;
  onLogin?: (token: string, remember?: boolean, view?: string, data?: any) => void; // For OAuth login success
}

export function SignUpPage({ onSignUp, onNavigateToLogin, onLogin }: SignUpPageProps) {
  // 1. State Management
  const [formData, setFormData] = useState({
    fullname: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Account linking state
  const [showAccountLinking, setShowAccountLinking] = useState(false);
  const [linkingData, setLinkingData] = useState<{
    email: string;
    provider: 'google' | 'facebook';
    oauthAccessToken: string;
  } | null>(null);

  // Google Login Hook
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
          if (onLogin) {
            onLogin(data.temp_token, true, 'set-username', data);
          }
          return;
        }
        
        // Social signups behave like "remember me" by default
        storeTokens(data.access, data.refresh, true);
        if (onLogin) {
          onLogin(data.access, true, undefined, data);
        }
      } catch (err: any) {
        setError(err.message || 'Google signup failed.');
      } finally {
        setIsLoading(false);
      }
    },
    onError: () => setError('Google signup cancelled.'),
  });

  // Facebook Login Handlers
  const handleFacebookSuccess = async (response: any) => {
    console.log('Facebook Success:', response);
    setIsLoading(true);
    setError('');
    try {
      // Check if user actually accepted (has accessToken and userID)
      if (!response.accessToken || !response.userID) {
        // User cancelled or didn't grant permissions
        setError('Facebook signup was cancelled.');
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
        if (onLogin) {
          onLogin(data.temp_token, true, 'set-username', data);
        }
        return;
      }
      
      // Social signups behave like "remember me" by default
      storeTokens(data.access, data.refresh, true);
      if (onLogin) {
        onLogin(data.access, true, undefined, data);
      }
    } catch (err: any) {
      setError(err.message || 'Facebook signup failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFacebookFail = (error: any) => {
    console.error('Facebook Signup Failed:', error);
    setIsLoading(false);
    setError('Facebook signup was cancelled or failed.');
  };

  

  // 2. Handle Input Changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ 
      ...formData, 
      [e.target.id]: e.target.value 
    });
    // Clear errors when user starts typing again
    if (error) setError('');
  };

  // 3. Handle Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Client-side Validation
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    setIsLoading(true);

    try {
      // Call the API (no username - will be set after email verification)
      await registerUser(formData.email, formData.password, formData.fullname);
      
      // If successful, pass email to parent to show OTP verification
      onSignUp(formData.email);
    } catch (err: any) {
      console.error("Signup failed:", err);
      // Display the error message from the backend (e.g., "Email already exists")
      setError(err.message || "Failed to create account. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-black flex items-center justify-center relative overflow-hidden">
      {/* Animated Background Gradients */}
      <div className="absolute inset-0">
        <motion.div
          animate={{
            opacity: [0.3, 0.6, 0.3],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute top-0 left-1/4 w-96 h-96 bg-[#00ff88] rounded-full blur-[120px]"
        />
        <motion.div
          animate={{
            opacity: [0.4, 0.7, 0.4],
            scale: [1.2, 1, 1.2],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#a855f7] rounded-full blur-[120px]"
        />
        <motion.div
          animate={{
            opacity: [0.2, 0.5, 0.2],
            scale: [1, 1.3, 1],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#3b82f6] rounded-full blur-[120px]"
        />
      </div>

      {/* Sign Up Card */}
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

          <h1 className="text-white text-center text-3xl mb-2">Create an Account</h1>
          <p className="text-gray-400 text-center mb-8">Join us and discover your next favorite song</p>

          {/* Social Sign Up Buttons */}
          <div className="space-y-3 mb-6">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                className="w-full bg-white hover:bg-gray-100 text-black gap-3 py-6 rounded-xl"
                type="button"
                onClick={() => googleLogin()}
                disabled={isLoading}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continue with Google
              </Button>
            </motion.div>

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

          {/* Divider */}
          <div className="flex items-center gap-4 mb-6">
            <Separator className="flex-1 bg-[#1a1a1a]" />
            <span className="text-gray-400 text-sm">or</span>
            <Separator className="flex-1 bg-[#1a1a1a]" />
          </div>

          {/* Sign Up Form */}
          <form className="space-y-4" onSubmit={handleSubmit}>
            {/* Error Message Display */}
            {error && (
              <div className="text-red-500 text-sm text-center bg-red-500/10 p-2 rounded border border-red-500/20">
                {error}
              </div>
            )}

            <div>
              <Label htmlFor="fullname" className="text-gray-300 mb-2 block">
                Full Name
              </Label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="fullname"
                  type="text"
                  placeholder="Xuan Mai"
                  className="w-full bg-[#1a1a1a] border-[#2a2a2a] rounded-xl pl-12 h-12 text-white placeholder:text-gray-500 focus-visible:ring-2 focus-visible:ring-[#00ff88]"
                  value={formData.fullname}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="email" className="text-gray-300 mb-2 block">
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  className="w-full bg-[#1a1a1a] border-[#2a2a2a] rounded-xl pl-12 h-12 text-white placeholder:text-gray-500 focus-visible:ring-2 focus-visible:ring-[#00ff88]"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="password" className="text-gray-300 mb-2 block">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="w-full bg-[#1a1a1a] border-[#2a2a2a] rounded-xl pl-12 pr-12 h-12 text-white placeholder:text-gray-500 focus-visible:ring-2 focus-visible:ring-[#00ff88]"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <Label htmlFor="confirmPassword" className="text-gray-300 mb-2 block">
                Confirm Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="w-full bg-[#1a1a1a] border-[#2a2a2a] rounded-xl pl-12 pr-12 h-12 text-white placeholder:text-gray-500 focus-visible:ring-2 focus-visible:ring-[#00ff88]"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <div className="text-sm space-y-2">
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  className="w-4 h-4 rounded border-gray-600 bg-[#1a1a1a]" 
                  required 
                />
                <label className="text-gray-400 cursor-pointer">
                  I agree to the{' '}
                  <span className="text-[#00ff88] hover:underline">
                    Terms of Service
                  </span>{' '}
                  and{' '}
                  <span className="text-[#00ff88] hover:underline">
                    Privacy Policy
                  </span>
                  .
                </label>
              </div>
              <p className="text-gray-500 text-xs leading-relaxed">
                By creating an account, you confirm that you are responsible for all activity on your account,
                will use the service lawfully for personal, non‑commercial use, will not upload or share content
                you do not have rights to, understand that content is owned by its respective rights holders,
                and accept that the service may change or be discontinued at any time.
              </p>
            </div>

            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-[#00ff88] to-[#00cc6e] hover:from-[#00ff88]/80 hover:to-[#00cc6e]/80 text-black py-6 rounded-xl disabled:opacity-50"
              >
                 {isLoading ? <Loader2 className="animate-spin" /> : "Create Account"}
              </Button>
            </motion.div>
          </form>

          {/* Login Link */}
          <p className="text-center text-gray-400 text-sm mt-6">
            Already have an account?{' '}
            <button onClick={onNavigateToLogin} className="text-[#00ff88] hover:underline">
              Sign in
            </button>
          </p>
        </div>

        {/* Footer */}
        <p className="text-center text-gray-500 text-xs mt-6">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
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
              if (onLogin) {
                onLogin(data.access, true, undefined, data);
              }
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