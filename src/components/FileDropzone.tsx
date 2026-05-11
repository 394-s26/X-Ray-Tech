import { useRef, useState } from 'react';
import { UploadIcon, FileIcon, ImageIcon, XIcon } from '../services/svgIcons';

interface FileDropzoneProps {
  file: File | null;
  onFileChange: (file: File | null) => void;
  accept?: string;
  disabled?: boolean;
  helperText?: string;
}

const ACCEPTED_DEFAULT = 'image/*,application/pdf';

const isAccepted = (file: File, accept: string): boolean => {
  const tokens = accept.split(',').map(t => t.trim()).filter(Boolean);
  return tokens.some(token => {
    if (token.endsWith('/*')) {
      const prefix = token.slice(0, -1);
      return file.type.startsWith(prefix);
    }
    return file.type === token;
  });
};

export const FileDropzone = ({
  file,
  onFileChange,
  accept = ACCEPTED_DEFAULT,
  disabled = false,
  helperText,
}: FileDropzoneProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleFiles = (files: FileList | null) => {
    setLocalError(null);
    if (!files || files.length === 0) return;
    if (files.length > 1) {
      setLocalError('Please upload only one file at a time.');
      return;
    }
    const next = files[0];
    if (!isAccepted(next, accept)) {
      setLocalError('Unsupported file type. Use an image or PDF.');
      return;
    }
    onFileChange(next);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    handleFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (disabled) return;
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const openPicker = () => {
    if (disabled) return;
    inputRef.current?.click();
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onFileChange(null);
    setLocalError(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  if (file) {
    const isImage = file.type.startsWith('image/');
    return (
      <div className="card card--md">
        <div className="flex items-center gap-3">
          <div className="text-primary dark:text-secondary shrink-0">
            {isImage ? <ImageIcon size={28} /> : <FileIcon size={28} />}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-medium text-sm text-gray-800 dark:text-slate-100 truncate">
              {file.name}
            </p>
            <p className="text-xs text-gray-500 dark:text-slate-400">
              {(file.size / 1024).toFixed(1)} KB · {file.type || 'unknown'}
            </p>
          </div>
          <button
            type="button"
            aria-label="Remove file"
            onClick={handleClear}
            disabled={disabled}
            className="p-2 rounded-full text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
          >
            <XIcon size={18} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled}
      onClick={openPicker}
      onKeyDown={e => {
        if (disabled) return;
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openPicker();
        }
      }}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className={`card card--md flex flex-col items-center justify-center text-center cursor-pointer transition-colors ${
        isDragging ? 'border-primary ring-2 ring-primary/20' : ''
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <div className="text-primary dark:text-secondary mb-3">
        <UploadIcon size={32} />
      </div>
      <p className="font-medium text-gray-800 dark:text-slate-100">
        Drop a file here, or tap to choose
      </p>
      <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
        {helperText ?? 'Image or PDF · 1 file at a time'}
      </p>
      {localError && (
        <p className="text-xs text-red-600 dark:text-red-400 mt-3">{localError}</p>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        disabled={disabled}
        onChange={e => handleFiles(e.target.files)}
      />
    </div>
  );
};
