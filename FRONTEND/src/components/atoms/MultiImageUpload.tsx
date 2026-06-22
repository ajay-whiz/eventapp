import React, { useRef, useState, useEffect, useCallback, useMemo, type ChangeEvent, type DragEvent } from 'react';
import { Plus, X } from 'lucide-react';

export interface ImageFile {
  id: string;
  name: string;
  preview?: string;
  file?: File;
  url?: string;
  uploaded?: boolean;
}

interface MultiImageUploadProps {
  className?: string;
  disabled?: boolean;
  isSingleMode?: boolean;
  acceptedFormats?: string[];
  onImagesChange?: (images: ImageFile[]) => void;
  disableClick?: boolean;
  initialImages?: ImageFile[];
}

const readFileAsDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = () => reject(new Error(`Failed to read ${file.name}`));
    reader.readAsDataURL(file);
  });

const MultiImageUpload: React.FC<MultiImageUploadProps> = ({
  className = '',
  disabled = false,
  isSingleMode = false,
  acceptedFormats = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  onImagesChange,
  disableClick = false,
  initialImages = [],
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imagesRef = useRef<ImageFile[]>(initialImages);
  const [dragActive, setDragActive] = useState(false);
  const [images, setImages] = useState<ImageFile[]>(initialImages);
  const [errors, setErrors] = useState<string[]>([]);

  const memoizedInitialImages = useMemo(() => initialImages, [JSON.stringify(initialImages)]);

  useEffect(() => {
    imagesRef.current = images;
  }, [images]);

  useEffect(() => {
    setImages(memoizedInitialImages);
    imagesRef.current = memoizedInitialImages;
  }, [memoizedInitialImages]);

  const notifyChange = useCallback((nextImages: ImageFile[]) => {
    onImagesChange?.(nextImages);
  }, [onImagesChange]);

  const applyImageUpdate = useCallback((getNextImages: (prev: ImageFile[]) => ImageFile[]) => {
    const nextImages = getNextImages(imagesRef.current);
    imagesRef.current = nextImages;
    setImages(nextImages);
    notifyChange(nextImages);
  }, [notifyChange]);

  const processFiles = useCallback(async (files: File[]) => {
    const newErrors: string[] = [];
    const validFiles: File[] = [];

    files.forEach((file) => {
      if (!acceptedFormats.includes(file.type)) {
        newErrors.push(`${file.name}: Unsupported file format`);
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        newErrors.push(`${file.name}: File too large (max 5MB)`);
        return;
      }

      validFiles.push(file);
    });

    setErrors(newErrors);
    if (validFiles.length === 0) return;

    try {
      const newImages = await Promise.all(
        validFiles.map(async (file) => ({
          id: Math.random().toString(36).substr(2, 9),
          name: file.name,
          preview: await readFileAsDataUrl(file),
          file,
        })),
      );

      applyImageUpdate((prev) =>
        isSingleMode ? newImages.slice(0, 1) : [...prev, ...newImages],
      );
    } catch {
      setErrors((prev) => [...prev, 'Failed to read selected file(s)']);
    }
  }, [acceptedFormats, isSingleMode, applyImageUpdate]);

  const openFilePicker = useCallback((event?: React.MouseEvent) => {
    event?.stopPropagation();
    if (!disabled && !disableClick) {
      fileInputRef.current?.click();
    }
  }, [disabled, disableClick]);

  const handleDragIn = useCallback((event: DragEvent<HTMLDivElement>): void => {
    event.preventDefault();
    event.stopPropagation();
    if (!disabled) {
      setDragActive(true);
    }
  }, [disabled]);

  const handleDragOut = useCallback((event: DragEvent<HTMLDivElement>): void => {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(false);
  }, []);

  const handleDrag = useCallback((event: DragEvent<HTMLDivElement>): void => {
    event.preventDefault();
    event.stopPropagation();
  }, []);

  const handleDrop = useCallback((event: DragEvent<HTMLDivElement>): void => {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(false);

    if (disabled) return;

    const files = Array.from(event.dataTransfer.files);
    void processFiles(files);
  }, [disabled, processFiles]);

  const handleFileInputChange = useCallback((event: ChangeEvent<HTMLInputElement>): void => {
    if (disabled) return;

    const files = Array.from(event.target.files || []);
    void processFiles(files);
    event.target.value = '';
  }, [disabled, processFiles]);

  const removeImage = useCallback((id: string, event: React.MouseEvent): void => {
    event.stopPropagation();
    if (disabled) return;

    applyImageUpdate((prev) => prev.filter((img) => img.id !== id));
  }, [disabled, applyImageUpdate]);

  const previewSizeClasses = 'w-20 h-20 flex-shrink-0';

  return (
    <div className={`w-full ${className}`}>
      <div
        className={`
          border-2 border-dashed border-gray-300 rounded-lg p-4 bg-white
          ${dragActive ? 'border-sky-500 bg-sky-50' : ''}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        onDragEnter={handleDragIn}
        onDragLeave={handleDragOut}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedFormats.join(',')}
          multiple={!isSingleMode}
          onChange={handleFileInputChange}
          className="hidden"
          disabled={disabled}
        />

        <div className="flex gap-4 overflow-x-auto">
          {images.map((img) => (
            <div
              key={img.id}
              className={`relative rounded-md border border-gray-200 overflow-hidden ${previewSizeClasses}`}
            >
              <img
                src={img.url || img.preview}
                alt={img.name}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={(event) => removeImage(img.id, event)}
                className="absolute top-1 right-1 text-white text-xs hover:bg-red-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={openFilePicker}
            disabled={disabled || disableClick}
            className={`flex items-center justify-center border-2 border-dashed border-gray-300 rounded-md cursor-pointer ${previewSizeClasses} hover:border-sky-400 disabled:cursor-not-allowed`}
          >
            <Plus className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        <p className="mt-3 text-sm text-gray-600 text-center">Upload Images</p>
      </div>

      {errors.length > 0 && (
        <div className="mt-3 rounded-md border border-red-200 bg-red-50 p-3">
          <p className="text-sm font-semibold text-red-700 mb-2">Upload Errors</p>
          <ul className="list-disc pl-5 text-sm text-red-700 space-y-1">
            {errors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default MultiImageUpload;
