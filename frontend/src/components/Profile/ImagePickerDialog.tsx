import { X, Upload, Image as ImageIcon, Camera, Loader2, UserX } from 'lucide-react';
import { Button } from '../Login/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { useRef, useState } from 'react';
import { ImageWithFallback } from '../Login/img/ImageWithFallback';

interface ImagePickerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onImageSelect: (imageUrl: string) => Promise<void>;
  onRemoveAvatar?: () => Promise<void>;
  currentImageUrl?: string;
  isUploading?: boolean;
}

export function ImagePickerDialog({ isOpen, onClose, onImageSelect, onRemoveAvatar, currentImageUrl, isUploading = false }: ImagePickerDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);

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

  const handleUpload = async () => {
    if (previewUrl && !isUploading) {
      try {
        await onImageSelect(previewUrl);
        // Only close and reset after successful upload
        setPreviewUrl(null);
        onClose();
      } catch (error) {
        // Error is handled by parent component, keep dialog open
        console.error('Upload failed:', error);
      }
    }
  };

  const handleRemove = () => {
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveAvatar = async () => {
    if (onRemoveAvatar && !isRemoving && !isUploading) {
      try {
        setIsRemoving(true);
        await onRemoveAvatar();
        // Close dialog after successful removal
        onClose();
      } catch (error) {
        console.error('Failed to remove avatar:', error);
        // Keep dialog open on error
      } finally {
        setIsRemoving(false);
      }
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
            onClick={isUploading ? undefined : onClose}
            className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-50 ${isUploading ? 'cursor-wait' : ''}`}
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
                    disabled={isUploading}
                    className="w-8 h-8 rounded-full bg-[#1a1a1a] hover:bg-[#252525] flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                      <>
                        <ImageWithFallback
                          src={previewUrl}
                          alt="Preview"
                          className={`w-full h-full object-cover ${isUploading ? 'opacity-50' : ''}`}
                        />
                        {isUploading && (
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                            <div className="flex flex-col items-center gap-3">
                              <Loader2 className="w-8 h-8 text-[#00ff88] animate-spin" />
                              <span className="text-white text-sm font-medium">Uploading...</span>
                            </div>
                          </div>
                        )}
                      </>
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
                    disabled={isUploading || isRemoving}
                    className="w-full bg-[#00ff88] hover:bg-[#00ff88]/80 text-black gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Upload className="w-5 h-5" />
                    Choose New Photo
                  </Button>

                  {previewUrl && (
                    <>
                      <Button
                        onClick={handleUpload}
                        disabled={isUploading}
                        className="w-full bg-[#a855f7] hover:bg-[#a855f7]/80 text-white gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isUploading ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Camera className="w-5 h-5" />
                            Choose This Photo
                          </>
                        )}
                      </Button>
                      <Button
                        onClick={handleRemove}
                        disabled={isUploading}
                        variant="outline"
                        className="w-full border-[#1a1a1a] hover:bg-[#1a1a1a] text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Go Back
                      </Button>
                    </>
                  )}
                </div>

                {/* Remove Avatar Button */}
                {currentImageUrl && !previewUrl && (
                  <Button
                    onClick={handleRemoveAvatar}
                    disabled={isUploading || isRemoving}
                    variant="outline"
                    className="w-full border-red-500/50 hover:bg-red-500/10 hover:border-red-500 text-red-400 hover:text-red-300 gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isRemoving ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Removing...
                      </>
                    ) : (
                      <>
                        <UserX className="w-5 h-5" />
                        Remove Avatar
                      </>
                    )}
                  </Button>
                )}

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

