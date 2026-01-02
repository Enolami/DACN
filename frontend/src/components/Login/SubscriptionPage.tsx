import * as React from 'react';
import { Check, Sparkles, Music, Zap, Headphones, Star, Crown } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { motion } from 'framer-motion';

interface SubscriptionPageProps {
  onSelectPlan: (plan: 'free' | 'premium') => void;
}

export function SubscriptionPage({ onSelectPlan }: SubscriptionPageProps) {
  const freeBenefits = [
    'Basic streaming quality',
    'Ad-supported listening',
    '5 skips per hour',
    'Standard playlists',
  ];

  const premiumBenefits = [
    { icon: Music, text: 'Ad-Free listening', highlight: true },
    { icon: Zap, text: 'Unlimited Skips', highlight: true },
    { icon: Sparkles, text: 'AI Personalized Studio', highlight: true },
    { icon: Headphones, text: 'HQ Audio (320kbps)', highlight: true },
    { icon: Star, text: 'Exclusive releases', highlight: false },
    { icon: Crown, text: 'Download & offline mode', highlight: false },
  ];

  return (
    <div className="min-h-screen w-full bg-black flex items-center justify-center relative overflow-hidden py-12">
      {/* Animated Background Gradients */}
      <div className="absolute inset-0">
        <motion.div
          animate={{
            opacity: [0.2, 0.4, 0.2],
            scale: [1, 1.3, 1],
            x: [-50, 50, -50],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute top-0 left-0 w-[600px] h-[600px] bg-[#00ff88] rounded-full blur-[150px]"
        />
        <motion.div
          animate={{
            opacity: [0.3, 0.5, 0.3],
            scale: [1.2, 1, 1.2],
            x: [50, -50, 50],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-[#a855f7] rounded-full blur-[150px]"
        />
        <motion.div
          animate={{
            opacity: [0.2, 0.6, 0.2],
            scale: [1, 1.4, 1],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#3b82f6] rounded-full blur-[150px]"
        />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-6xl mx-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="w-8 h-8 text-[#00ff88]" />
            <h1 className="text-white text-5xl">Choose Your Plan</h1>
          </div>
          <p className="text-gray-400 text-xl">
            Start free, upgrade to unlock premium AI features
          </p>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Free Plan */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            whileHover={{ y: -8 }}
            className="relative"
          >
            <div className="bg-black/40 backdrop-blur-xl border border-[#1a1a1a] rounded-3xl p-8 h-full flex flex-col">
              <div className="mb-6">
                <h3 className="text-white text-2xl mb-2">Free</h3>
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-white text-5xl">$0</span>
                  <span className="text-gray-400">/month</span>
                </div>
                <p className="text-gray-400">Perfect for casual listeners</p>
              </div>

              <div className="flex-1 space-y-4 mb-8">
                {freeBenefits.map((benefit, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                    className="flex items-center gap-3"
                  >
                    <div className="w-5 h-5 rounded-full bg-[#1a1a1a] flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-gray-400" />
                    </div>
                    <span className="text-gray-400">{benefit}</span>
                  </motion.div>
                ))}
              </div>

              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  onClick={() => onSelectPlan('free')}
                  className="w-full bg-[#1a1a1a] hover:bg-[#252525] text-white border border-[#2a2a2a] py-6 rounded-xl"
                >
                  Get Started Free
                </Button>
              </motion.div>
            </div>
          </motion.div>

          {/* Premium Plan */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            whileHover={{ y: -8 }}
            className="relative"
          >
            {/* Glowing Border Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#00ff88] via-[#a855f7] to-[#3b82f6] rounded-3xl blur-xl opacity-50" />
            <motion.div
              animate={{
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="absolute inset-0 bg-gradient-to-r from-[#00ff88] via-[#a855f7] to-[#3b82f6] rounded-3xl blur-2xl"
            />

            <div className="relative bg-black/60 backdrop-blur-xl border-2 border-[#00ff88] rounded-3xl p-8 h-full flex flex-col">
              {/* Popular Badge */}
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <Badge className="bg-gradient-to-r from-[#00ff88] to-[#a855f7] text-black border-none px-6 py-1.5">
                  <Sparkles className="w-4 h-4 mr-1" />
                  Most Popular
                </Badge>
              </div>

              <div className="mb-6">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-white text-2xl">Premium</h3>
                  <motion.div
                    animate={{
                      rotate: [0, 10, -10, 10, 0],
                      scale: [1, 1.1, 1],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      repeatDelay: 3,
                    }}
                  >
                    <Crown className="w-6 h-6 text-[#00ff88]" />
                  </motion.div>
                </div>
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-white text-5xl">$9.99</span>
                  <span className="text-gray-400">/month</span>
                </div>
                <p className="text-gray-400">Unlock the full AI experience</p>
              </div>

              <div className="flex-1 space-y-4 mb-8">
                {premiumBenefits.map((benefit, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                    className="flex items-center gap-3"
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      benefit.highlight
                        ? 'bg-gradient-to-br from-[#00ff88] to-[#00cc6e]'
                        : 'bg-[#1a1a1a]'
                    }`}>
                      {benefit.highlight ? (
                        <benefit.icon className="w-4 h-4 text-black" />
                      ) : (
                        <Check className="w-4 h-4 text-[#00ff88]" />
                      )}
                    </div>
                    <span className={benefit.highlight ? 'text-white' : 'text-gray-300'}>
                      {benefit.text}
                    </span>
                  </motion.div>
                ))}
              </div>

              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  onClick={() => onSelectPlan('premium')}
                  className="w-full bg-gradient-to-r from-[#00ff88] to-[#00cc6e] hover:from-[#00ff88]/80 hover:to-[#00cc6e]/80 text-black py-6 rounded-xl shadow-lg shadow-[#00ff88]/20"
                >
                  <Crown className="w-5 h-5 mr-2" />
                  Get Premium Now
                </Button>
              </motion.div>

              <p className="text-center text-gray-400 text-sm mt-4">
                Cancel anytime • 7-day free trial
              </p>
            </div>
          </motion.div>
        </div>

        {/* Footer Features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-12 text-center"
        >
          <p className="text-gray-500 text-sm">
            All plans include access to millions of songs and personalized recommendations
          </p>
        </motion.div>
      </div>
    </div>
  );
}
