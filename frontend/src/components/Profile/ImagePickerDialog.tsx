import { X, Upload, Image as ImageIcon, Camera } from 'lucide-react';
import { Button } from '../Login/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { useRef, useState } from 'react';
import { ImageWithFallback } from '../Login/img/ImageWithFallback';

interface ImagePickerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onImageSelect: (imageUrl: string) => void;
  currentImageUrl?: string;
}

export function ImagePickerDialog({ isOpen, onClose, onImageSelect, currentImageUrl }: ImagePickerDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size should be less than 5MB');
        return;
      }

      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setPreviewUrl(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = () => {
    if (previewUrl) {
      // In a real app, you would upload the file to a server here
      // For now, we'll use the preview URL as the selected image
      onImageSelect(previewUrl);
      setPreviewUrl(null);
      onClose();
    }
  };

  const handleRemove = () => {
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleChooseFile = () => {
    fileInputRef.current?.click();
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
            <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
              {/* Header */}
              <div className="p-6 border-b border-[#1a1a1a]">
                <div className="flex items-center justify-between">
                  <h2 className="text-white text-xl font-semibold">Change Profile Picture</h2>
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

              {/* Content */}
              <div className="p-6 space-y-6">
                {/* Current/Preview Image */}
                <div className="flex justify-center">
                  <div className="relative w-48 h-48 rounded-full overflow-hidden border-4 border-[#00ff88] shadow-2xl ring-4 ring-[#00ff88]/20">
                    {previewUrl ? (
                      <ImageWithFallback
                        src={previewUrl}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : currentImageUrl ? (
                      <ImageWithFallback
                        src={currentImageUrl}
                        alt="Current"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-[#1a1a1a] flex items-center justify-center">
                        <ImageIcon className="w-16 h-16 text-gray-500" />
                      </div>
                    )}
                  </div>
                </div>

                {/* File Input (Hidden) */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                {/* Action Buttons */}
                <div className="space-y-3">
                  <Button
                    onClick={handleChooseFile}
                    className="w-full bg-[#00ff88] hover:bg-[#00ff88]/80 text-black gap-2"
                  >
                    <Upload className="w-5 h-5" />
                    Choose Photo
                  </Button>

                  {previewUrl && (
                    <>
                      <Button
                        onClick={handleUpload}
                        className="w-full bg-[#a855f7] hover:bg-[#a855f7]/80 text-white gap-2"
                      >
                        <Camera className="w-5 h-5" />
                        Upload Photo
                      </Button>
                      <Button
                        onClick={handleRemove}
                        variant="outline"
                        className="w-full border-[#1a1a1a] hover:bg-[#1a1a1a] text-gray-400 hover:text-white"
                      >
                        Remove
                      </Button>
                    </>
                  )}
                </div>

                {/* Info Text */}
                <p className="text-center text-gray-400 text-sm">
                  Supported formats: JPG, PNG, GIF (Max 5MB)
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

