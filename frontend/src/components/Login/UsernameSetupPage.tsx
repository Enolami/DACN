import { AtSign, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { setUsername, storeTokens } from '../../services/api';

interface UsernameSetupPageProps {
  email: string;
  onComplete: (access: string, refresh: string) => void;
  onBack?: () => void;
}

export function UsernameSetupPage({ email, onComplete, onBack }: UsernameSetupPageProps) {
  const [username, setUsernameValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'valid' | 'invalid'>('idle');

  // Validate username format
  const validateUsername = (value: string): boolean => {
    if (value.length < 3) return false;
    if (value.length > 150) return false;
    return /^[a-zA-Z0-9_-]+$/.test(value);
  };

  // Handle username input change
  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase();
    setUsernameValue(value);
    setError('');
    setUsernameStatus('idle');

    if (value.length > 0) {
      if (validateUsername(value)) {
        setUsernameStatus('valid');
      } else {
        setUsernameStatus('invalid');
      }
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Client-side validation
    if (!username || username.length < 3) {
      setError('Username must be at least 3 characters long');
      return;
    }

    if (!validateUsername(username)) {
      setError('Username can only contain letters, numbers, underscores, and hyphens');
      return;
    }

    setIsLoading(true);
    setIsChecking(true);

    try {
      const data = await setUsername(username);
      
      // Store the new tokens
      storeTokens(data.access, data.refresh, true);
      
      // Complete the setup
      onComplete(data.access, data.refresh);
    } catch (err: any) {
      console.error('Set username failed:', err);
      setError(err.message || 'Failed to set username. Please try again.');
      setUsernameStatus('invalid');
    } finally {
      setIsLoading(false);
      setIsChecking(false);
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
              <AtSign className="w-8 h-8 text-black" />
            </div>
          </div>

          <h1 className="text-white text-center text-3xl mb-2">Choose Your Username</h1>
          <p className="text-gray-400 text-center mb-2">
            This will be your unique identifier
          </p>
          <p className="text-gray-500 text-center text-sm mb-8">
            You'll use this to log in: <span className="text-[#00ff88]">{email}</span>
          </p>

          {/* Form */}
          <form className="space-y-4" onSubmit={handleSubmit}>
            {/* Error Message Display */}
            {error && (
              <div className="text-red-500 text-sm text-center bg-red-500/10 p-2 rounded border border-red-500/20">
                {error}
              </div>
            )}

            <div>
              <Label htmlFor="username" className="text-gray-300 mb-2 block">
                Username
              </Label>
              <div className="relative">
                <AtSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="username"
                  type="text"
                  placeholder="username123"
                  className={`w-full bg-[#1a1a1a] border-[#2a2a2a] rounded-xl pl-12 pr-12 h-12 text-white placeholder:text-gray-500 focus-visible:ring-2 ${
                    usernameStatus === 'valid' 
                      ? 'border-[#00ff88] focus-visible:ring-[#00ff88]' 
                      : usernameStatus === 'invalid'
                      ? 'border-red-500 focus-visible:ring-red-500'
                      : 'focus-visible:ring-[#00ff88]'
                  }`}
                  value={username}
                  onChange={handleUsernameChange}
                  disabled={isLoading}
                  required
                />
                {usernameStatus === 'valid' && (
                  <CheckCircle2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#00ff88]" />
                )}
                {usernameStatus === 'invalid' && username.length > 0 && (
                  <XCircle className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-red-500" />
                )}
              </div>
              <p className="text-gray-500 text-xs mt-1 ml-1">
                {username.length > 0 && username.length < 3 && 'Username must be at least 3 characters'}
                {username.length >= 3 && !validateUsername(username) && 'Only letters, numbers, underscores, and hyphens allowed'}
                {validateUsername(username) && 'Username is available!'}
              </p>
            </div>

            <Button
              type="submit"
              disabled={isLoading || !validateUsername(username)}
              className="w-full bg-gradient-to-r from-[#00ff88] to-[#a855f7] hover:from-[#00ff88]/80 hover:to-[#a855f7]/80 text-black font-semibold py-6 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Setting Username...
                </>
              ) : (
                'Continue'
              )}
            </Button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}

