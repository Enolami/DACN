import { Mail, Sparkles, ArrowLeft } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { motion } from 'framer-motion';

interface ForgotPasswordPageProps {
  onSendResetLink: () => void;
  onBackToLogin: () => void;
}

export function ForgotPasswordPage({ onSendResetLink, onBackToLogin }: ForgotPasswordPageProps) {
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

      {/* Forgot Password Card */}
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

          <h1 className="text-white text-center text-3xl mb-2">Forgot Password</h1>
          <p className="text-gray-400 text-center mb-8">Enter your email to receive a password reset link</p>

          {/* Email Form */}
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); onSendResetLink(); }}>
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
                />
              </div>
            </div>

            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-[#00ff88] to-[#00cc6e] hover:from-[#00ff88]/80 hover:to-[#00cc6e]/80 text-black py-6 rounded-xl"
              >
                Send Reset Link
              </Button>
            </motion.div>
          </form>

          {/* Back to Login Link */}
          <motion.div 
            whileHover={{ scale: 1.02 }} 
            whileTap={{ scale: 0.98 }}
            className="mt-4"
          >
            <Button
              onClick={onBackToLogin}
              variant="ghost"
              className="w-full text-gray-400 hover:text-white hover:bg-[#1a1a1a] py-6 rounded-xl gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Login
            </Button>
          </motion.div>
        </div>

        {/* Footer */}
        <p className="text-center text-gray-500 text-xs mt-6">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </motion.div>
    </div>
  );
}
