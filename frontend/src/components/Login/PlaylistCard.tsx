import { ImageWithFallback } from './img/ImageWithFallback';
import { Play } from 'lucide-react';
import { motion } from 'framer-motion';

interface PlaylistCardProps {
  title: string;
  description: string;
  imageUrl: string;
  onNavigate?: (page: string, data?: any) => void;
}

export function PlaylistCard({ title, description, imageUrl, onNavigate }: PlaylistCardProps) {
  const handleClick = () => {
    if (onNavigate) {
      onNavigate('playlist', { title, description, imageUrl });
    }
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      onClick={handleClick}
      className="group bg-[#1a1a1a] p-4 rounded-xl cursor-pointer transition-all hover:bg-[#252525] relative"
    >
      <div className="relative mb-4">
        <ImageWithFallback
          src={imageUrl}
          alt={title}
          className="w-full aspect-square object-cover rounded-lg shadow-2xl"
        />
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          whileHover={{ scale: 1.1 }}
          className="absolute bottom-2 right-2 bg-[#00ff88] w-12 h-12 rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Play className="w-5 h-5 text-black fill-black ml-1" />
        </motion.button>
      </div>
      <h3 className="text-white mb-1 truncate">{title}</h3>
      <p className="text-gray-400 text-sm truncate">{description}</p>
    </motion.div>
  );
}
