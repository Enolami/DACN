import { motion } from 'framer-motion';

export function WaveformAnimation() {
  const bars = Array.from({ length: 40 });

  return (
    <div className="flex items-center gap-[2px] h-8">
      {bars.map((_, i) => (
        <motion.div
          key={i}
          className="w-[3px] bg-gradient-to-t from-[#00ff88] to-[#a855f7] rounded-full"
          animate={{
            height: ['20%', '100%', '30%', '80%', '40%'],
          }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            delay: i * 0.03,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}
