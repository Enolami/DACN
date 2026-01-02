import * as React from 'react';
import { Lock, Sparkles, Eye, EyeOff } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { motion } from 'framer-motion';
import { useState } from 'react';

interface ResetPasswordPageProps {
  onResetPassword: () => void;
  mode?: 'reset' | 'verify';
}

export function ResetPasswordPage({ onResetPassword, mode = 'reset' }: ResetPasswordPageProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', '']);

  const handleCodeChange = (index: number, value: string) => {
    if (value.length > 1) return;
    const newCode = [...verificationCode];
    newCode[index] = value;
    setVerificationCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`code-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !verificationCode[index] && index > 0) {
      const prevInput = document.getElementById(`code-${index - 1}`);
      prevInput?.focus();
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

      {/* Reset/Verify Card */}
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

          {mode === 'reset' ? (
            <>
              <h1 className="text-white text-center text-3xl mb-2">Reset Your Password</h1>
              <p className="text-gray-400 text-center mb-8">Enter your new password below</p>

              {/* Reset Password Form */}
              <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); onResetPassword(); }}>
                <div>
                  <Label htmlFor="newPassword" className="text-gray-300 mb-2 block">
                    New Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      id="newPassword"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="w-full bg-[#1a1a1a] border-[#2a2a2a] rounded-xl pl-12 pr-12 h-12 text-white placeholder:text-gray-500 focus-visible:ring-2 focus-visible:ring-[#00ff88]"
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

                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-[#00ff88] to-[#00cc6e] hover:from-[#00ff88]/80 hover:to-[#00cc6e]/80 text-black py-6 rounded-xl"
                  >
                    Update Password
                  </Button>
                </motion.div>
              </form>
            </>
          ) : (
            <>
              <h1 className="text-white text-center text-3xl mb-2">Verify Your Account</h1>
              <p className="text-gray-400 text-center mb-8">Enter the 6-digit code sent to your email</p>

              {/* Verification Code Form */}
              <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); onResetPassword(); }}>
                <div>
                  <Label className="text-gray-300 mb-4 block text-center">
                    Verification Code
                  </Label>
                  <div className="flex gap-2 justify-center">
                    {verificationCode.map((digit, index) => (
                      <Input
                        key={index}
                        id={`code-${index}`}
                        type="text"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleCodeChange(index, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(index, e)}
                        className="w-12 h-12 text-center bg-[#1a1a1a] border-[#2a2a2a] rounded-xl text-white placeholder:text-gray-500 focus-visible:ring-2 focus-visible:ring-[#00ff88]"
                      />
                    ))}
                  </div>
                </div>

                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-[#00ff88] to-[#00cc6e] hover:from-[#00ff88]/80 hover:to-[#00cc6e]/80 text-black py-6 rounded-xl"
                  >
                    Verify
                  </Button>
                </motion.div>

                {/* Resend Code */}
                <p className="text-center text-gray-400 text-sm">
                  Didn't receive the code?{' '}
                  <button onClick={(e) => { e.preventDefault(); }} className="text-[#00ff88] hover:underline">
                    Resend Code
                  </button>
                </p>
              </form>
            </>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-gray-500 text-xs mt-6">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </motion.div>
    </div>
  );
}
