import { Mail, Sparkles, Loader2, ArrowLeft } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { verifySignupOTP } from '../../services/api';

interface OTPVerificationPageProps {
  email: string;
  onVerified: (data: any) => void;  // Changed to accept full data object
  onBack: () => void;
  onResend?: () => void;
}

export function OTPVerificationPage({ email, onVerified, onBack, onResend }: OTPVerificationPageProps) {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return; // Only allow single digit
    if (!/^\d*$/.test(value)) return; // Only allow digits

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }

    // Clear error when user types
    if (error) setError('');
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim().slice(0, 6);
    if (/^\d{6}$/.test(pastedData)) {
      const newOtp = pastedData.split('');
      setOtp(newOtp);
      // Focus last input
      document.getElementById(`otp-5`)?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join('');
    
    if (code.length !== 6) {
      setError('Please enter the complete 6-digit code');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const data = await verifySignupOTP(email, code);
      // Pass full data object to parent (may contain needs_username flag)
      onVerified(data);
    } catch (err: any) {
      console.error('OTP verification failed:', err);
      setError(err.message || 'Invalid or expired code. Please try again.');
      // Clear OTP on error
      setOtp(['', '', '', '', '', '']);
      document.getElementById('otp-0')?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-black flex items-center justify-center relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute inset-0">
        <motion.div
          animate={{ opacity: [0.3, 0.6, 0.3], scale: [1, 1.2, 1] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-0 left-1/4 w-96 h-96 bg-[#00ff88] rounded-full blur-[120px]"
        />
        <motion.div
          animate={{ opacity: [0.4, 0.7, 0.4], scale: [1.2, 1, 1.2] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
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
              <Sparkles className="w-8 h-8 text-black" />
            </div>
          </div>

          <h1 className="text-white text-center text-3xl mb-2">Verify Your Email</h1>
          <p className="text-gray-400 text-center mb-2">
            We've sent a 6-digit code to
          </p>
          <p className="text-[#00ff88] text-center mb-8 font-medium">{email}</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="text-red-500 text-sm text-center bg-red-500/10 p-2 rounded border border-red-500/20">
                {error}
              </div>
            )}

            {/* OTP Input Fields */}
            <div className="flex justify-center gap-3">
              {otp.map((digit, index) => (
                <Input
                  key={index}
                  id={`otp-${index}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={index === 0 ? handlePaste : undefined}
                  className="w-14 h-14 text-center text-2xl font-semibold bg-[#1a1a1a] border-[#2a2a2a] rounded-xl text-white focus-visible:ring-2 focus-visible:ring-[#00ff88] focus-visible:border-[#00ff88]"
                  autoFocus={index === 0}
                />
              ))}
            </div>

            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                type="submit"
                disabled={isLoading || otp.join('').length !== 6}
                className="w-full bg-gradient-to-r from-[#00ff88] to-[#00cc6e] hover:from-[#00ff88]/80 hover:to-[#00cc6e]/80 text-black py-6 rounded-xl disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin mr-2" />
                    Verifying...
                  </>
                ) : (
                  'Verify Email'
                )}
              </Button>
            </motion.div>
          </form>

          {/* Resend Code */}
          <div className="mt-6 text-center">
            <p className="text-gray-400 text-sm mb-2">Didn't receive the code?</p>
            {onResend ? (
              <button
                onClick={onResend}
                className="text-[#00ff88] hover:underline text-sm"
              >
                Resend code
              </button>
            ) : (
              <p className="text-gray-500 text-sm">Check your spam folder or try again later</p>
            )}
          </div>

          {/* Back Button */}
          <div className="mt-6 text-center">
            <button
              onClick={onBack}
              className="text-gray-400 hover:text-white text-sm flex items-center justify-center gap-2 mx-auto"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to sign up
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

