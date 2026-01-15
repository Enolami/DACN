import { motion, AnimatePresence } from 'framer-motion';
import { X, Lock, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useState } from 'react';

interface AccountLinkingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onLink: (password: string) => Promise<void>;
  email: string;
  provider: 'google' | 'facebook';
  message: string;
}

export function AccountLinkingDialog({
  isOpen,
  onClose,
  onLink,
  email,
  provider,
  message
}: AccountLinkingDialogProps) {
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!password) {
      setError('Please enter your password');
      return;
    }

    setIsLoading(true);
    try {
      await onLink(password);
      // onLink will handle navigation, so we don't need to close here
    } catch (err: any) {
      setError(err.message || 'Failed to link account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setPassword('');
    setError('');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleCancel}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
              {/* Header */}
              <div className="p-6 border-b border-[#1a1a1a]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#00ff88]/20 flex items-center justify-center">
                      <AlertCircle className="w-5 h-5 text-[#00ff88]" />
                    </div>
                    <h2 className="text-white text-xl font-semibold">Link Account</h2>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={handleCancel}
                    disabled={isLoading}
                    className="text-gray-400 hover:text-white transition-colors disabled:opacity-50"
                  >
                    <X className="w-5 h-5" />
                  </motion.button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {/* Message */}
                <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-4">
                  <p className="text-gray-300 text-sm">{message}</p>
                </div>

                {/* Email Display */}
                <div>
                  <Label className="text-gray-400 text-sm mb-2 block">Account Email</Label>
                  <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-4 py-3">
                    <p className="text-white font-medium">{email}</p>
                  </div>
                </div>

                {/* Password Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="password" className="text-gray-300 mb-2 block">
                      Enter your password to confirm
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input
                        id="password"
                        type="password"
                        placeholder="Your account password"
                        className="w-full bg-[#1a1a1a] border-[#2a2a2a] rounded-xl pl-12 h-12 text-white placeholder:text-gray-500 focus-visible:ring-2 focus-visible:ring-[#00ff88]"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={isLoading}
                        required
                      />
                    </div>
                  </div>

                  {/* Error Message */}
                  {error && (
                    <div className="text-red-500 text-sm bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                      {error}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-2">
                    <Button
                      type="button"
                      onClick={handleCancel}
                      disabled={isLoading}
                      variant="outline"
                      className="flex-1 border-[#2a2a2a] hover:bg-[#1a1a1a] text-gray-400 hover:text-white disabled:opacity-50"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={isLoading || !password}
                      className="flex-1 bg-gradient-to-r from-[#00ff88] to-[#a855f7] hover:from-[#00ff88]/80 hover:to-[#a855f7]/80 text-black font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Linking...
                        </>
                      ) : (
                        `Link ${provider === 'google' ? 'Google' : 'Facebook'} Account`
                      )}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

