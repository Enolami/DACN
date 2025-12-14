import { X, Save, User } from 'lucide-react';
import { Button } from '../Login/ui/button';
import { Input } from '../Login/ui/input';
import { Label } from '../Login/ui/label';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';

interface EditProfileDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, bio: string) => void;
  currentName: string;
  currentBio: string;
}

export function EditProfileDialog({ 
  isOpen, 
  onClose, 
  onSave, 
  currentName, 
  currentBio 
}: EditProfileDialogProps) {
  const [name, setName] = useState(currentName);
  const [bio, setBio] = useState(currentBio);

  // Update form when current values change
  useEffect(() => {
    setName(currentName);
    setBio(currentBio);
  }, [currentName, currentBio, isOpen]);

  const handleSave = () => {
    if (name.trim()) {
      onSave(name.trim(), bio.trim());
      onClose();
    }
  };

  const handleCancel = () => {
    // Reset to original values
    setName(currentName);
    setBio(currentBio);
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
            onClick={handleCancel}
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
            <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
              {/* Header */}
              <div className="p-6 border-b border-[#1a1a1a]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#00ff88]/20 flex items-center justify-center">
                      <User className="w-5 h-5 text-[#00ff88]" />
                    </div>
                    <h2 className="text-white text-xl font-semibold">Edit Profile</h2>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={handleCancel}
                    className="w-8 h-8 rounded-full bg-[#1a1a1a] hover:bg-[#252525] flex items-center justify-center transition-colors"
                  >
                    <X className="w-4 h-4 text-gray-400" />
                  </motion.button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {/* Name Input */}
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-gray-300">
                    Name
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    className="bg-[#1a1a1a] border-[#2a2a2a] text-white placeholder:text-gray-500 focus-visible:ring-2 focus-visible:ring-[#00ff88] focus-visible:border-[#00ff88]"
                    maxLength={50}
                  />
                  <p className="text-gray-500 text-xs">{name.length}/50</p>
                </div>

                {/* Bio Input */}
                <div className="space-y-2">
                  <Label htmlFor="bio" className="text-gray-300">
                    About
                  </Label>
                  <textarea
                    id="bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell us about yourself..."
                    rows={5}
                    className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-md px-3 py-2 text-white placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00ff88] focus-visible:border-[#00ff88] resize-none"
                    maxLength={160}
                  />
                  <p className="text-gray-500 text-xs">{bio.length}/160</p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={handleCancel}
                    variant="outline"
                    className="flex-1 border-[#1a1a1a] hover:bg-[#1a1a1a] text-gray-400 hover:text-white"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={!name.trim()}
                    className="flex-1 bg-[#00ff88] hover:bg-[#00ff88]/80 text-black gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Save className="w-4 h-4" />
                    Save Changes
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

