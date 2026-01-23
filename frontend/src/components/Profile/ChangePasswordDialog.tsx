import { X, Lock, Loader2 } from 'lucide-react';
import { Button } from '../Login/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { changePassword, verifyPasswordOTP } from '../../services/api';
import { storeTokens } from '../../services/api';

interface ChangePasswordDialogProps {
  isOpen: boolean;
  onClose: () => void;
  requiresOTP?: boolean;
  email?: string;
}

export function ChangePasswordDialog({ isOpen, onClose, requiresOTP: initialRequiresOTP, email: initialEmail }: ChangePasswordDialogProps) {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [requiresOTP, setRequiresOTP] = useState(initialRequiresOTP || false);
  const [email, setEmail] = useState(initialEmail || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChangePassword = async () => {
    setIsLoading(true);
    setError('');
    setSuccess(false);

    try {
      if (requiresOTP) {
        // Verify OTP and set password
        if (!otpCode || !newPassword || !confirmPassword) {
          setError('Please fill in all fields');
          setIsLoading(false);
          return;
        }

        const response = await verifyPasswordOTP(otpCode, newPassword, confirmPassword);
        
        // Store new tokens
        if (response.access && response.refresh) {
          storeTokens(response.access, response.refresh, true);
        }
        
        setSuccess(true);
        setTimeout(() => {
          onClose();
          // Reset form
          setOldPassword('');
          setNewPassword('');
          setConfirmPassword('');
          setOtpCode('');
          setRequiresOTP(false);
          setError('');
          setSuccess(false);
        }, 2000);
      } else {
        // Regular password change - try with old password first
        // If user doesn't have a password (OAuth), backend will return requires_otp
        if (!newPassword || !confirmPassword) {
          setError('Please fill in all fields');
          setIsLoading(false);
          return;
        }

        // For OAuth users without password, oldPassword can be empty
        const response = await changePassword(oldPassword || '', newPassword, confirmPassword);
        
        // Check if OTP is required (for OAuth users)
        if (response.requires_otp) {
          setRequiresOTP(true);
          setEmail(response.email || '');
          setError('');
          setIsLoading(false);
          return;
        }
        
        // Store new tokens
        if (response.access && response.refresh) {
          storeTokens(response.access, response.refresh, true);
        }
        
        setSuccess(true);
        setTimeout(() => {
          onClose();
          // Reset form
          setOldPassword('');
          setNewPassword('');
          setConfirmPassword('');
          setOtpCode('');
          setRequiresOTP(false);
          setError('');
          setSuccess(false);
        }, 2000);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to change password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
      // Reset form
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setOtpCode('');
      setRequiresOTP(initialRequiresOTP || false);
      setError('');
      setSuccess(false);
    }
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
            onClick={handleClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
              {/* Header */}
              <div className="p-6 border-b border-[#1a1a1a] flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#00ff88]/20 flex items-center justify-center">
                      <Lock className="w-5 h-5 text-[#00ff88]" />
                    </div>
                    <h2 className="text-white text-xl font-semibold">
                      {requiresOTP ? 'Verify OTP' : 'Change Password'}
                    </h2>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={handleClose}
                    disabled={isLoading}
                    className="w-8 h-8 rounded-full bg-[#1a1a1a] hover:bg-[#252525] flex items-center justify-center transition-colors disabled:opacity-50"
                  >
                    <X className="w-4 h-4 text-gray-400" />
                  </motion.button>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {success ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 rounded-full bg-[#00ff88]/20 flex items-center justify-center mx-auto mb-4">
                      <Lock className="w-8 h-8 text-[#00ff88]" />
                    </div>
                    <h3 className="text-white text-lg mb-2">Password Changed Successfully!</h3>
                    <p className="text-gray-400">Your password has been updated.</p>
                  </div>
                ) : (
                  <>
                    {requiresOTP ? (
                      <>
                        <p className="text-gray-400 text-sm mb-4">
                          We've sent a verification code to {email || 'your email'}. Please enter it below along with your new password.
                        </p>
                        <div className="space-y-4">
                          <div>
                            <label className="text-gray-300 text-sm mb-2 block">Verification Code</label>
                            <input
                              type="text"
                              value={otpCode}
                              onChange={(e) => setOtpCode(e.target.value)}
                              placeholder="Enter 6-digit code"
                              maxLength={6}
                              className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#00ff88] focus:border-[#00ff88]"
                            />
                          </div>
                          <div>
                            <label className="text-gray-300 text-sm mb-2 block">New Password</label>
                            <input
                              type="password"
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                              placeholder="Enter new password"
                              className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#00ff88] focus:border-[#00ff88]"
                            />
                          </div>
                          <div>
                            <label className="text-gray-300 text-sm mb-2 block">Confirm New Password</label>
                            <input
                              type="password"
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                              placeholder="Confirm new password"
                              className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#00ff88] focus:border-[#00ff88]"
                            />
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="space-y-4">
                        <div>
                          <label className="text-gray-300 text-sm mb-2 block">Old Password</label>
                          <input
                            type="password"
                            value={oldPassword}
                            onChange={(e) => setOldPassword(e.target.value)}
                            placeholder="Enter current password"
                            className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#00ff88] focus:border-[#00ff88]"
                          />
                        </div>
                        <div>
                          <label className="text-gray-300 text-sm mb-2 block">New Password</label>
                          <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Enter new password"
                            className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#00ff88] focus:border-[#00ff88]"
                          />
                        </div>
                        <div>
                          <label className="text-gray-300 text-sm mb-2 block">Confirm New Password</label>
                          <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Confirm new password"
                            className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#00ff88] focus:border-[#00ff88]"
                          />
                        </div>
                      </div>
                    )}

                    {error && (
                      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400 text-sm">
                        {error}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Footer */}
              {!success && (
                <div className="p-6 border-t border-[#1a1a1a] flex-shrink-0">
                  <Button
                    onClick={handleChangePassword}
                    disabled={isLoading}
                    className="w-full bg-[#00ff88] hover:bg-[#00ff88]/80 text-black gap-2"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      requiresOTP ? 'Verify & Set Password' : 'Change Password'
                    )}
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
