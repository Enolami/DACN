import { X, Settings, User, Bell, Lock, Globe, LogOut, Moon, Sun } from 'lucide-react';
import { Button } from '../Login/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { getProfile, updateProfile } from '../../services/api';
import { ChangePasswordDialog } from './ChangePasswordDialog';

interface SettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout?: () => void;
}

export function SettingsDialog({ isOpen, onClose, onLogout }: SettingsDialogProps) {
  const [notifications, setNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [privateProfile, setPrivateProfile] = useState(false);
  const [language, setLanguage] = useState('en');
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    // Load theme from localStorage
    const savedTheme = localStorage.getItem('theme') as 'dark' | 'light' | null;
    return savedTheme || 'dark';
  });
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Load profile data on mount
  useEffect(() => {
    if (isOpen) {
      const loadProfile = async () => {
        try {
          const profile = await getProfile();
          setPrivateProfile(profile.is_private || false);
        } catch (err) {
          console.error('Failed to load profile:', err);
        }
      };
      loadProfile();
    }
  }, [isOpen]);

  // Apply theme to document
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Save privacy setting
  const handlePrivacyChange = async (value: boolean) => {
    setPrivateProfile(value);
    setIsLoading(true);
    try {
      await updateProfile(undefined, undefined, value);
    } catch (err) {
      console.error('Failed to update privacy:', err);
      // Revert on error
      setPrivateProfile(!value);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    }
    onClose();
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
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
              {/* Header */}
              <div className="p-6 border-b border-[#1a1a1a] flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#00ff88]/20 flex items-center justify-center">
                      <Settings className="w-5 h-5 text-[#00ff88]" />
                    </div>
                    <h2 className="text-white text-xl font-semibold">Settings</h2>
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
              </div>

              {/* Content - Scrollable */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Notifications */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Bell className="w-5 h-5 text-[#00ff88]" />
                    <h3 className="text-white font-medium">Notifications</h3>
                  </div>
                  <div className="bg-[#1a1a1a] rounded-xl p-4 space-y-3">
                    <label className="flex items-center justify-between p-3 rounded-lg cursor-pointer hover:bg-[#252525] transition-colors">
                      <div className="flex items-center gap-3">
                        <span className="text-gray-300">Push Notifications</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={notifications}
                        onChange={(e) => setNotifications(e.target.checked)}
                        className="w-5 h-5 rounded bg-[#1a1a1a] border-[#2a2a2a] text-[#00ff88] focus:ring-[#00ff88] focus:ring-2"
                      />
                    </label>
                    <label className="flex items-center justify-between p-3 rounded-lg cursor-pointer hover:bg-[#252525] transition-colors">
                      <div className="flex items-center gap-3">
                        <span className="text-gray-300">Email Notifications</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={emailNotifications}
                        onChange={(e) => setEmailNotifications(e.target.checked)}
                        className="w-5 h-5 rounded bg-[#1a1a1a] border-[#2a2a2a] text-[#00ff88] focus:ring-[#00ff88] focus:ring-2"
                      />
                    </label>
                  </div>
                </div>

                {/* Privacy */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Lock className="w-5 h-5 text-[#00ff88]" />
                    <h3 className="text-white font-medium">Privacy</h3>
                  </div>
                  <div className="bg-[#1a1a1a] rounded-xl p-4">
                    <label className="flex items-center justify-between p-3 rounded-lg cursor-pointer hover:bg-[#252525] transition-colors">
                      <div className="flex items-center gap-3">
                        <span className="text-gray-300">Private Profile</span>
                        <span className="text-xs text-gray-500">Only you can see your activity</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={privateProfile}
                        onChange={(e) => handlePrivacyChange(e.target.checked)}
                        disabled={isLoading}
                        className="w-5 h-5 rounded bg-[#1a1a1a] border-[#2a2a2a] text-[#00ff88] focus:ring-[#00ff88] focus:ring-2 disabled:opacity-50"
                      />
                    </label>
                  </div>
                </div>

                {/* Language */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Globe className="w-5 h-5 text-[#00ff88]" />
                    <h3 className="text-white font-medium">Language</h3>
                  </div>
                  <div className="bg-[#1a1a1a] rounded-xl p-4">
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#00ff88] focus:border-[#00ff88]"
                    >
                      <option value="en">English</option>
                      <option value="es">Spanish</option>
                      <option value="fr">French</option>
                      <option value="de">German</option>
                      <option value="ja">Japanese</option>
                      <option value="zh">Chinese</option>
                    </select>
                  </div>
                </div>

                {/* Theme */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    {theme === 'dark' ? (
                      <Moon className="w-5 h-5 text-[#00ff88]" />
                    ) : (
                      <Sun className="w-5 h-5 text-[#00ff88]" />
                    )}
                    <h3 className="text-white font-medium">Theme</h3>
                  </div>
                  <div className="bg-[#1a1a1a] rounded-xl p-4 space-y-2">
                    {(['dark', 'light'] as const).map((themeOption) => (
                      <label
                        key={themeOption}
                        className="flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-[#252525] transition-colors"
                      >
                        <input
                          type="radio"
                          name="theme"
                          value={themeOption}
                          checked={theme === themeOption}
                          onChange={(e) => {
                            const newTheme = e.target.value as 'dark' | 'light';
                            setTheme(newTheme);
                            localStorage.setItem('theme', newTheme);
                          }}
                          className="w-4 h-4 text-[#00ff88] bg-[#1a1a1a] border-[#2a2a2a] focus:ring-[#00ff88] focus:ring-2"
                        />
                        <span className="text-gray-300 capitalize">{themeOption}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Account */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-[#00ff88]" />
                    <h3 className="text-white font-medium">Account</h3>
                  </div>
                  <div className="bg-[#1a1a1a] rounded-xl p-4 space-y-2">
                    <Button
                      variant="outline"
                      onClick={() => setIsChangePasswordOpen(true)}
                      className="w-full border-[#2a2a2a] hover:bg-[#252525] text-gray-300 hover:text-white justify-start"
                    >
                      Change Password
                    </Button>
                  </div>
                </div>

                {/* Logout */}
                <div className="pt-4 border-t border-[#1a1a1a]">
                  <Button
                    onClick={handleLogout}
                    className="w-full bg-[#dc3545] hover:bg-[#dc3545]/80 text-white gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    Log Out
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
      <ChangePasswordDialog
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
      />
    </AnimatePresence>
  );
}
