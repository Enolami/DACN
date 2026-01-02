import * as React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { motion } from 'framer-motion';

interface ArtistCardProps {
  name: string;
  imageUrl: string;
  genre: string;
}

export function ArtistCard({ name, imageUrl, genre }: ArtistCardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      className="flex flex-col items-center cursor-pointer group"
    >
      <div className="relative mb-3">
        <Avatar className="w-32 h-32 border-4 border-transparent group-hover:border-[#00ff88] transition-all">
          <AvatarImage src={imageUrl} alt={name} className="object-cover" />
          <AvatarFallback className="bg-[#1a1a1a] text-white">{name[0]}</AvatarFallback>
        </Avatar>
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 rounded-full transition-all" />
      </div>
      <h3 className="text-white text-center mb-1">{name}</h3>
      <p className="text-gray-400 text-sm">{genre}</p>
    </motion.div>
  );
}
