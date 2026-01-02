import { Search, Mic, Bell, ChevronLeft, ChevronRight } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { NotificationsPanel } from './NotificationsPanel';

interface TopNavigationProps {
  onNavigate: (page: string, data?: any) => void;
  currentPage: string;
  onBack?: () => void;
  onForward?: () => void;
  canGoBack?: boolean;
  canGoForward?: boolean;
}

export function TopNavigation({ onNavigate, currentPage, onBack, onForward, canGoBack = false, canGoForward = false }: TopNavigationProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const unreadCount = 3;

  return (
    <>
      <div className="bg-black/50 backdrop-blur-lg border-b border-[#1a1a1a] px-6 py-3 flex items-center justify-between sticky top-0 z-10">
        {/* Navigation Arrows */}
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <motion.button
              whileHover={canGoBack ? { scale: 1.1, backgroundColor: 'rgba(26, 26, 26, 1)' } : {}}
              whileTap={canGoBack ? { scale: 0.95 } : {}}
              onClick={canGoBack ? onBack : undefined}
              disabled={!canGoBack}
              className={`w-9 h-9 bg-[#0a0a0a] rounded-full flex items-center justify-center transition-colors ${
                canGoBack 
                  ? 'cursor-pointer hover:bg-[#1a1a1a]' 
                  : 'cursor-not-allowed opacity-40'
              }`}
            >
              <ChevronLeft className={`w-5 h-5 ${canGoBack ? 'text-white' : 'text-gray-500'}`} strokeWidth={1.5} />
            </motion.button>
            <motion.button
              whileHover={canGoForward ? { scale: 1.1, backgroundColor: 'rgba(26, 26, 26, 1)' } : {}}
              whileTap={canGoForward ? { scale: 0.95 } : {}}
              onClick={canGoForward ? onForward : undefined}
              disabled={!canGoForward}
              className={`w-9 h-9 bg-[#0a0a0a] rounded-full flex items-center justify-center transition-colors ${
                canGoForward 
                  ? 'cursor-pointer hover:bg-[#1a1a1a]' 
                  : 'cursor-not-allowed opacity-40'
              }`}
            >
              <ChevronRight className={`w-5 h-5 ${canGoForward ? 'text-white' : 'text-gray-500'}`} strokeWidth={1.5} />
            </motion.button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex-1 max-w-2xl mx-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" strokeWidth={2} />
            <Input
              placeholder="What do you want to listen to?"
              className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-full pl-11 pr-11 h-10 text-white placeholder:text-gray-500 focus-visible:ring-2 focus-visible:ring-[#00ff88] focus-visible:border-[#00ff88] text-sm"
              onClick={() => onNavigate('search')}
            />
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#00ff88] transition-colors p-1.5 rounded-full hover:bg-[#1a1a1a]"
            >
              <Mic className="w-4 h-4" strokeWidth={2} />
            </motion.button>
          </div>
        </div>

        {/* User Actions */}
        <div className="flex items-center gap-3">
          <motion.div 
            whileHover={{ scale: 1.1 }} 
            className="relative cursor-pointer"
            onClick={() => setShowNotifications(true)}
          >
            <Bell className="w-6 h-6 text-gray-400 hover:text-white transition-colors" strokeWidth={1.5} />
            {unreadCount > 0 && (
              <Badge className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-gradient-to-r from-[#a855f7] to-[#00ff88] border-2 border-black p-0 flex items-center justify-center text-[10px] text-white">
                {unreadCount}
              </Badge>
            )}
          </motion.div>

          <motion.div 
            whileHover={{ scale: 1.05 }} 
            className="cursor-pointer"
            onClick={() => onNavigate('profile')}
          >
            <Avatar className={`w-9 h-9 border-2 ${
              currentPage === 'profile' ? 'border-[#00ff88]' : 'border-[#2a2a2a] hover:border-[#00ff88]'
            } transition-colors`}>
              <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=user" alt="User" />
              <AvatarFallback className="bg-[#1a1a1a] text-white">U</AvatarFallback>
            </Avatar>
          </motion.div>
        </div>
      </div>

      {/* Notifications Panel */}
      <NotificationsPanel 
        isOpen={showNotifications} 
        onClose={() => setShowNotifications(false)} 
      />
    </>
  );
}