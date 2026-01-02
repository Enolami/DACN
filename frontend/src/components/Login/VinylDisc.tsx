import { motion } from 'framer-motion';
import { ImageWithFallback } from './img/ImageWithFallback';

interface VinylDiscProps {
  imageUrl: string;
  alt?: string;
  size?: number;
  isPlaying?: boolean;
  className?: string;
}

export function VinylDisc({ 
  imageUrl, 
  alt = "Album Cover", 
  size = 500, 
  isPlaying = true,
  className = ""
}: VinylDiscProps) {
  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      {/* Outer glow */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#00ff88]/30 to-[#a855f7]/30 blur-3xl -z-10" />
      
      {/* Main vinyl disc */}
      <motion.div
        animate={{ 
          rotate: isPlaying ? 360 : 0 
        }}
        transition={{
          duration: 3,
          repeat: isPlaying ? Infinity : 0,
          ease: "linear"
        }}
        className="relative w-full h-full"
      >
        {/* Outer ring - vinyl edge */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#1a1a1a] via-[#2a2a2a] to-[#0a0a0a] shadow-2xl">
          {/* Vinyl grooves effect */}
          <div className="absolute inset-0 rounded-full opacity-40">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="absolute inset-0 rounded-full border border-black/20"
                style={{
                  margin: `${i * 3}%`,
                }}
              />
            ))}
          </div>
        </div>

        {/* Album artwork circle */}
        <div 
          className="absolute inset-0 rounded-full overflow-hidden flex items-center justify-center"
          style={{
            margin: '8%',
          }}
        >
          {/* Circular gradient overlay for depth */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-transparent via-transparent to-black/20" />
          
          <img
            src={imageUrl}
            alt={alt}
            className="w-full h-full object-cover rounded-full"
          />
        </div>

        {/* Center label/hub */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[15%] h-[15%] rounded-full bg-gradient-to-br from-[#0a0a0a] via-[#1a1a1a] to-[#0a0a0a] shadow-inner border-2 border-black/50">
          {/* Inner center hole */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[30%] h-[30%] rounded-full bg-black shadow-xl" />
          
          {/* Reflection/shine effect */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/10 via-transparent to-transparent" />
        </div>

        {/* Glass reflection on disc */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none" />
        
        {/* Subtle shine animation when playing */}
        {isPlaying && (
          <motion.div
            animate={{
              opacity: [0.1, 0.3, 0.1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute inset-0 rounded-full bg-gradient-to-br from-white/20 via-transparent to-transparent pointer-events-none"
          />
        )}
        
        {/* Clickable overlay - ensures entire disc is clickable */}
        <div className="absolute inset-0 rounded-full pointer-events-auto cursor-pointer" />
      </motion.div>
    </div>
  );
}