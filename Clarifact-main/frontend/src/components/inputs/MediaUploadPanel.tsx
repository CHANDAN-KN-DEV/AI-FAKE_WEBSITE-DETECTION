import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Image, Video, CheckCircle2, AlertCircle, Loader2, X } from 'lucide-react';

interface Props {
  onSubmit: (file: File, base64: string) => void;
}

export default function MediaUploadPanel({ onSubmit }: Props) {
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<File | null>(null);
  const base64Ref = useRef<string | null>(null);

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    if (!isImage && !isVideo) {
      setError('Please upload an image (PNG, JPG, WEBP) or video file.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('File must be under 10MB.');
      return;
    }

    setError(null);
    setIsConverting(true);
    setFileName(file.name);
    fileRef.current = file;

    // Show preview for images
    if (isImage) {
      const objectUrl = URL.createObjectURL(file);
      setPreview(objectUrl);
    } else {
      setPreview(null);
    }

    // For images: resize to max 1024px longest side before base64 to keep payload small
    if (isImage) {
      const img = new window.Image();
      const objectUrlForResize = URL.createObjectURL(file);
      img.onload = () => {
        const MAX = 1024;
        let { width, height } = img;
        if (width > MAX || height > MAX) {
          if (width >= height) {
            height = Math.round((height / width) * MAX);
            width = MAX;
          } else {
            width = Math.round((width / height) * MAX);
            height = MAX;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, width, height);
        // Use JPEG at 85% quality for compact size
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        base64Ref.current = dataUrl.split(',')[1];
        URL.revokeObjectURL(objectUrlForResize);
        setIsConverting(false);
      };
      img.onerror = () => {
        setError('Failed to process image.');
        setIsConverting(false);
      };
      img.src = objectUrlForResize;
    } else {
      // For video: just read raw (no resize possible client-side easily)
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        base64Ref.current = result.split(',')[1];
        setIsConverting(false);
      };
      reader.onerror = () => {
        setError('Failed to read file.');
        setIsConverting(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = () => {
    if (!fileRef.current || !base64Ref.current) return;
    onSubmit(fileRef.current, base64Ref.current);
  };

  const handleClear = () => {
    setPreview(null);
    setFileName(null);
    setError(null);
    fileRef.current = null;
    base64Ref.current = null;
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      {/* Drop zone */}
      <label
        htmlFor="media-upload"
        className={`flex flex-col items-center justify-center gap-4 border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
          fileName ? 'border-primary/50 bg-primary/5' : 'border-border hover:border-primary/40 hover:bg-secondary/30'
        }`}
      >
        <input
          type="file"
          id="media-upload"
          accept="image/*,video/*"
          onChange={handleChange}
          className="hidden"
        />

        {!fileName ? (
          <>
            <div className="flex justify-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <Image className="w-6 h-6 text-blue-400" />
              </div>
              <div className="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center">
                <Video className="w-6 h-6 text-violet-400" />
              </div>
            </div>
            <div>
              <p className="text-sm font-medium">Drop an image or short video</p>
              <p className="text-xs text-foreground/40 mt-1">PNG, JPG, WEBP, MP4 · Max 10MB</p>
            </div>
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-secondary rounded-xl text-sm font-medium"
            >
              <Upload className="w-4 h-4" /> Browse Files
            </motion.div>
          </>
        ) : (
          <div className="w-full space-y-3">
            {/* Image preview */}
            {preview && (
              <div className="relative mx-auto max-w-xs">
                <img
                  src={preview}
                  alt="Preview"
                  className="rounded-xl w-full max-h-48 object-cover border border-border"
                />
              </div>
            )}
            <div className="flex items-center justify-center gap-2 text-sm">
              {isConverting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  <span className="text-foreground/60">Reading file…</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-foreground/70 truncate max-w-[200px]">{fileName}</span>
                </>
              )}
            </div>
            <p className="text-xs text-foreground/40">Click to change file</p>
          </div>
        )}
      </label>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400"
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Analyse + Clear buttons */}
      {fileName && !isConverting && !error && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex gap-3"
        >
          <button
            onClick={handleClear}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-secondary text-foreground/60 hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" /> Clear
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-blue-600 to-violet-600 text-white hover:opacity-90 transition-opacity"
          >
            <Image className="w-4 h-4" /> Analyse Image for Fake News
          </button>
        </motion.div>
      )}
    </motion.div>
  );
}
