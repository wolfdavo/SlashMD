import { useState, useCallback, useRef, useEffect } from 'react';

export interface ImageData {
  src: string;
  alt: string;
  isLocal: boolean;
  dataUri?: string;
}

interface ImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (data: ImageData) => void;
}

type TabType = 'url' | 'upload';

export function ImageModal({ isOpen, onClose, onInsert }: ImageModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('upload');
  const [url, setUrl] = useState('');
  const [alt, setAlt] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const selectedFileRef = useRef<{ dataUri: string; name: string } | null>(null);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setUrl('');
      setAlt('');
      setPreviewUrl(null);
      setError(null);
      setActiveTab('upload');
      selectedFileRef.current = null;
    }
  }, [isOpen]);

  // Focus trap and escape key handling
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Handle click outside to close
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    // Delay adding the listener to avoid immediate close
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 0);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const handleFileSelect = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUri = e.target?.result as string;
      selectedFileRef.current = { dataUri, name: file.name };
      setPreviewUrl(dataUri);
      setError(null);

      // Auto-generate alt text from filename (without extension)
      if (!alt) {
        const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
        setAlt(nameWithoutExt);
      }
    };
    reader.onerror = () => {
      setError('Failed to read file');
    };
    reader.readAsDataURL(file);
  }, [alt]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  const handleUrlChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value;
    setUrl(newUrl);
    setError(null);

    // Show preview for valid URLs
    if (newUrl && (newUrl.startsWith('http://') || newUrl.startsWith('https://'))) {
      setPreviewUrl(newUrl);
    } else {
      setPreviewUrl(null);
    }
  }, []);

  const handleInsert = useCallback(() => {
    if (activeTab === 'url') {
      if (!url) {
        setError('Please enter an image URL');
        return;
      }
      onInsert({
        src: url,
        alt: alt || '',
        isLocal: false,
      });
    } else {
      if (!selectedFileRef.current) {
        setError('Please select an image');
        return;
      }
      onInsert({
        src: '', // Will be set after upload
        alt: alt || '',
        isLocal: true,
        dataUri: selectedFileRef.current.dataUri,
      });
    }
    onClose();
  }, [activeTab, url, alt, onInsert, onClose]);

  const handleTabChange = useCallback((tab: TabType) => {
    setActiveTab(tab);
    setError(null);
    setPreviewUrl(null);
    if (tab === 'url') {
      selectedFileRef.current = null;
    }
  }, []);

  if (!isOpen) return null;

  return (
    <div className="image-modal-overlay">
      <div className="image-modal" ref={modalRef}>
        <div className="image-modal-header">
          <h3>Insert Image</h3>
          <button className="image-modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <div className="image-modal-tabs">
          <button
            className={`image-modal-tab ${activeTab === 'upload' ? 'active' : ''}`}
            onClick={() => handleTabChange('upload')}
          >
            Upload
          </button>
          <button
            className={`image-modal-tab ${activeTab === 'url' ? 'active' : ''}`}
            onClick={() => handleTabChange('url')}
          >
            URL
          </button>
        </div>

        <div className="image-modal-content">
          {activeTab === 'upload' ? (
            <div
              className={`image-modal-dropzone ${dragOver ? 'drag-over' : ''} ${previewUrl ? 'has-preview' : ''}`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
            >
              {previewUrl ? (
                <img src={previewUrl} alt="Preview" className="image-modal-preview" />
              ) : (
                <div className="image-modal-dropzone-content">
                  <span className="image-modal-dropzone-icon">🖼</span>
                  <span>Drop an image here or click to browse</span>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileInputChange}
                style={{ display: 'none' }}
              />
            </div>
          ) : (
            <div className="image-modal-url-section">
              <input
                type="url"
                className="image-modal-input"
                placeholder="https://example.com/image.png"
                value={url}
                onChange={handleUrlChange}
                autoFocus
              />
              {previewUrl && (
                <div className="image-modal-url-preview">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="image-modal-preview"
                    onError={() => setPreviewUrl(null)}
                  />
                </div>
              )}
            </div>
          )}

          <div className="image-modal-alt-section">
            <label htmlFor="image-alt" className="image-modal-label">
              Alt text (optional)
            </label>
            <input
              id="image-alt"
              type="text"
              className="image-modal-input"
              placeholder="Describe the image for accessibility"
              value={alt}
              onChange={(e) => setAlt(e.target.value)}
            />
          </div>

          {error && <div className="image-modal-error">{error}</div>}
        </div>

        <div className="image-modal-footer">
          <button className="image-modal-button secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="image-modal-button primary" onClick={handleInsert}>
            Insert
          </button>
        </div>
      </div>
    </div>
  );
}
