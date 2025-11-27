import { X, Check, Music2, ListPlus, UserPlus } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

interface Notification {
  id: string;
  type: 'ai-recommendation' | 'playlist-update' | 'artist-release';
  title: string;
  message: string;
  time: string;
  read: boolean;
}

interface NotificationsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationsPanel({ isOpen, onClose }: NotificationsPanelProps) {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      type: 'ai-recommendation',
      title: 'New AI Recommendation',
      message: 'We created a new playlist just for you: "Morning Energy"',
      time: '2h ago',
      read: false,
    },
    {
      id: '2',
      type: 'artist-release',
      title: 'New Release',
      message: 'Nova Pulse just released "Cosmic Dreams" - Check it out!',
      time: '5h ago',
      read: false,
    },
    {
      id: '3',
      type: 'playlist-update',
      title: 'Playlist Updated',
      message: '12 new songs added to "Discover Weekly"',
      time: '1d ago',
      read: false,
    },
    {
      id: '4',
      type: 'ai-recommendation',
      title: 'AI Music Discovery',
      message: 'Based on your listening, try "Electronic Dreams" playlist',
      time: '2d ago',
      read: true,
    },
    {
      id: '5',
      type: 'artist-release',
      title: 'Artist You Follow',
      message: 'Synthwave uploaded a new album',
      time: '3d ago',
      read: true,
    },
  ]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const markAsRead = (id: string) => {
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'ai-recommendation':
        return <Music2 className="w-5 h-5 text-[#a855f7]" />;
      case 'playlist-update':
        return <ListPlus className="w-5 h-5 text-[#00ff88]" />;
      case 'artist-release':
        return <UserPlus className="w-5 h-5 text-[#3b82f6]" />;
      default:
        return <Music2 className="w-5 h-5 text-gray-400" />;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-96 bg-[#0a0a0a] border-l border-[#1a1a1a] z-50 flex flex-col"
          >
            {/* Header */}
            <div className="p-6 border-b border-[#1a1a1a]">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <h2 className="text-white text-xl">Notifications</h2>
                  {unreadCount > 0 && (
                    <Badge className="bg-[#a855f7] text-white border-none">
                      {unreadCount}
                    </Badge>
                  )}
                </div>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-[#1a1a1a] hover:bg-[#252525] flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </motion.button>
              </div>

              {unreadCount > 0 && (
                <Button
                  onClick={markAllAsRead}
                  className="w-full bg-[#1a1a1a] hover:bg-[#252525] text-white gap-2"
                >
                  <Check className="w-4 h-4" />
                  Mark All as Read
                </Button>
              )}
            </div>

            {/* Notifications List */}
            <ScrollArea className="flex-1">
              <div className="p-4 space-y-3">
                {notifications.map((notification) => (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ scale: 1.02 }}
                    onClick={() => !notification.read && markAsRead(notification.id)}
                    className={`p-4 rounded-xl cursor-pointer transition-all ${
                      notification.read
                        ? 'bg-[#0a0a0a]'
                        : 'bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] border border-[#00ff88]/20'
                    }`}
                  >
                    <div className="flex gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                        notification.type === 'ai-recommendation'
                          ? 'bg-[#a855f7]/20'
                          : notification.type === 'playlist-update'
                          ? 'bg-[#00ff88]/20'
                          : 'bg-[#3b82f6]/20'
                      }`}>
                        {getIcon(notification.type)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h3 className="text-white text-sm truncate">{notification.title}</h3>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-[#00ff88] rounded-full flex-shrink-0 mt-1" />
                          )}
                        </div>
                        <p className="text-gray-400 text-sm mb-2">{notification.message}</p>
                        <span className="text-gray-500 text-xs">{notification.time}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}

                {notifications.length === 0 && (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-[#1a1a1a] rounded-full flex items-center justify-center mx-auto mb-4">
                      <Music2 className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-400">No notifications yet</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
