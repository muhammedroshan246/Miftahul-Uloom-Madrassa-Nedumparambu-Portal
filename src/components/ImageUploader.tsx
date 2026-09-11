'use client';

import React, { useState, useRef } from 'react';
import { 
  UploadCloud, 
  Image as ImageIcon, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Maximize2,
  RefreshCw,
  Trash2
} from 'lucide-react';

interface ImageUploaderProps {
  category: 'branding' | 'hero' | 'principal' | 'gallery' | 'events' | 'teachers' | 'students' | 'achievements';
  value?: string;
  onChange: (url: string) => void;
  onUploadComplete?: (data: any) => void;
  label?: string;
  helperText?: string;
  aspectRatio?: 'square' | 'banner' | 'portrait' | 'auto';
  studentId?: number;
  maxSizeMB?: number;
  className?: string;
}

export default function ImageUploader({
  category,
  value = '',
  onChange,
  onUploadComplete,
  label = 'Upload Image',
  helperText = 'JPG, PNG, or WebP up to 5MB (Auto-optimized)',
  aspectRatio = 'auto',
  studentId,
  maxSizeMB = 5,
  className = ''
}: ImageUploaderProps) {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [previewUrl, setPreviewUrl] = useState(value);
  const [showModal, setShowModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update preview if value changes externally
  React.useEffect(() => {
    setPreviewUrl(value);
  }, [value]);

  // Client-Side Canvas Image Optimization / Compression
  const compressImage = async (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const maxDim = category === 'hero' ? 1600 : category === 'gallery' || category === 'events' ? 1200 : 800;
          let width = img.width;
          let height = img.height;

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(file);
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);

          // Export as optimized WebP or JPEG
          const outputType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
          canvas.toBlob((blob) => {
            if (blob) resolve(blob);
            else resolve(file);
          }, outputType, 0.88);
        };
        img.onerror = () => resolve(file);
      };
      reader.onerror = () => resolve(file);
    });
  };

  const handleUpload = async (file: File) => {
    setError('');

    // Format check
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type.toLowerCase())) {
      setError('Please select a valid image file (JPG, PNG, or WebP).');
      return;
    }

    // Size check
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`File exceeds maximum allowed size of ${maxSizeMB}MB.`);
      return;
    }

    // Show instant local preview
    const localPreview = URL.createObjectURL(file);
    setPreviewUrl(localPreview);
    setUploading(true);

    try {
      // Compress
      const optimizedBlob = await compressImage(file);

      const formData = new FormData();
      formData.append('file', optimizedBlob, file.name);
      formData.append('category', category);
      if (studentId) formData.append('studentId', String(studentId));

      const res = await fetch('/api/media/upload', {
        method: 'POST',
        body: formData
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');

      setPreviewUrl(data.url);
      onChange(data.url);
      if (onUploadComplete) onUploadComplete(data);
    } catch (err: any) {
      setError(err.message || 'Image upload failed. Please try again.');
      setPreviewUrl(value); // Revert
    } finally {
      setUploading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleUpload(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleUpload(e.target.files[0]);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreviewUrl('');
    onChange('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const ratioClass = 
    aspectRatio === 'square' ? 'aspect-square max-w-[200px]' :
    aspectRatio === 'portrait' ? 'aspect-[3/4] max-w-[200px]' :
    aspectRatio === 'banner' ? 'aspect-[21/9] w-full' :
    'min-h-[140px] w-full';

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <div className="flex items-center justify-between">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
            {label}
          </label>
          {previewUrl && (
            <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Image Selected
            </span>
          )}
        </div>
      )}

      {/* Upload Dropzone */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative group border-2 border-dashed rounded-2xl p-4 transition-all cursor-pointer flex flex-col items-center justify-center text-center overflow-hidden bg-slate-50/70 hover:bg-slate-100/80 ${
          dragActive 
            ? 'border-emerald-600 bg-emerald-50/50 scale-[0.99]' 
            : previewUrl 
            ? 'border-emerald-300' 
            : 'border-slate-300 hover:border-emerald-500'
        } ${ratioClass}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={handleChange}
          className="hidden"
        />

        {previewUrl ? (
          <div className="relative w-full h-full min-h-[120px] flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="Preview"
              className="max-h-full max-w-full rounded-xl object-contain shadow-sm"
            />

            {/* Hover Actions Overlay */}
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowModal(true);
                }}
                title="Zoom Preview"
                className="p-2 rounded-xl bg-white/90 text-slate-800 hover:bg-white transition-all shadow"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                title="Replace Image"
                className="p-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition-all shadow"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleRemove}
                title="Remove Image"
                className="p-2 rounded-xl bg-rose-600 text-white hover:bg-rose-700 transition-all shadow"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2 py-3 px-2">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100/80 text-emerald-800 flex items-center justify-center mx-auto shadow-sm group-hover:scale-110 transition-transform">
              <UploadCloud className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800">
                <span className="text-emerald-800">Click to upload</span> or drag and drop
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">{helperText}</p>
            </div>
          </div>
        )}

        {/* Uploading Overlay */}
        {uploading && (
          <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center z-10 space-y-2">
            <Loader2 className="w-7 h-7 text-emerald-700 animate-spin" />
            <span className="text-xs font-bold text-slate-800">Optimizing & Uploading...</span>
          </div>
        )}
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Fullsize Modal Preview */}
      {showModal && previewUrl && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative max-w-3xl max-h-[90vh] bg-white rounded-3xl p-4 shadow-2xl overflow-hidden flex flex-col items-center">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="text-xs font-bold text-slate-500 mb-3 uppercase tracking-wider">
              {label} Preview
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="Full Preview"
              className="max-h-[75vh] max-w-full rounded-2xl object-contain shadow"
            />
          </div>
        </div>
      )}
    </div>
  );
}