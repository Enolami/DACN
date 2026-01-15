import { Home, Library, Heart, Disc3, User, ListMusic } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { ChevronDown } from 'lucide-react';

interface LeftSidebarProps {
  onNavigate: (page: string) => void;
  currentPage: string;
}

export function LeftSidebar({ onNavigate, currentPage }: LeftSidebarProps) {
  const [isLibraryOpen, setIsLibraryOpen] = useState(true);

  const mainNavItems = [
    { icon: Home, label: 'Home', page: 'home' },
  ];

  const libraryItems = [
    { icon: ListMusic, label: 'Playlists', page: 'library' },
    { icon: Heart, label: 'Songs', page: 'liked' },
    { icon: User, label: 'Artists', page: 'artists' },
    { icon: Disc3, label: 'Albums', page: 'albums' },
  ];

  return (
    <div className="w-64 bg-black h-full flex flex-col p-4 border-r border-[#1a1a1a] overflow-y-auto">
      {/* Logo */}
      <div className="flex items-center gap-2 mb-8 px-3 cursor-pointer" onClick={() => onNavigate('home')}>
        <div className="w-8 h-8 bg-gradient-to-br from-[#00ff88] to-[#a855f7] rounded-lg flex items-center justify-center">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-black">
            <path d="M8 0L10.5 5.5L16 8L10.5 10.5L8 16L5.5 10.5L0 8L5.5 5.5L8 0Z" fill="currentColor"/>
          </svg>
        </div>
        <span className="text-white">Soundly</span>
      </div>

      {/* Main Navigation */}
      <nav className="space-y-1 mb-6">
        {mainNavItems.map((item) => (
          <motion.button
            key={item.label}
            whileHover={{ x: 2 }}
            onClick={() => onNavigate(item.page)}
            className={`w-full flex items-center gap-4 px-3 py-3 rounded-lg transition-all ${
              currentPage === item.page
                ? 'bg-[#1a1a1a] text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <item.icon className="w-5 h-5" strokeWidth={1.5} />
            <span>{item.label}</span>
          </motion.button>
        ))}
      </nav>

      {/* Your Library Collapsible */}
      <Collapsible open={isLibraryOpen} onOpenChange={setIsLibraryOpen} className="flex-1">
        <CollapsibleTrigger asChild>
          <motion.button
            whileHover={{ x: 2 }}
            className="w-full flex items-center justify-between px-3 py-3 rounded-lg text-gray-400 hover:text-white transition-all mb-1"
          >
            <div className="flex items-center gap-4">
              <Library className="w-5 h-5" strokeWidth={1.5} />
              <span>Your Library</span>
            </div>
            <motion.div
              animate={{ rotate: isLibraryOpen ? 0 : -90 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="w-4 h-4" />
            </motion.div>
          </motion.button>
        </CollapsibleTrigger>

        <CollapsibleContent className="space-y-1">
          {libraryItems.map((item) => (
            <motion.button
              key={item.label}
              whileHover={{ x: 2 }}
              onClick={() => onNavigate(item.page)}
              className={`w-full flex items-center gap-4 px-3 py-2.5 pl-12 rounded-lg transition-all ${
                currentPage === item.page
                  ? 'bg-[#1a1a1a] text-[#00ff88]'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <item.icon className="w-4 h-4" strokeWidth={1.5} />
              <span className="text-sm">{item.label}</span>
            </motion.button>
          ))}
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}