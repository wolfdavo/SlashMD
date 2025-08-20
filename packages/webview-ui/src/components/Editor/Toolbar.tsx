/**
 * Inline Formatting Toolbar Component for Phase 3
 * Appears on text selection with formatting options
 */

import React, { useRef, useEffect, useState } from 'react';
import type { InlineFormatting } from '../../types/blocks';

interface ToolbarButton {
  id: string;
  label: string;
  icon: string;
  shortcut: string;
  format: InlineFormatting['type'] | 'link';
}

const TOOLBAR_BUTTONS: ToolbarButton[] = [
  {
    id: 'bold',
    label: 'Bold',
    icon: 'B',
    shortcut: 'Cmd+B',
    format: 'bold'
  },
  {
    id: 'italic',
    label: 'Italic',
    icon: 'I',
    shortcut: 'Cmd+I',
    format: 'italic'
  },
  {
    id: 'code',
    label: 'Code',
    icon: '</>',
    shortcut: 'Cmd+E',
    format: 'code'
  },
  {
    id: 'strikethrough',
    label: 'Strikethrough',
    icon: 'S',
    shortcut: 'Cmd+Shift+X',
    format: 'strikethrough'
  },
  {
    id: 'link',
    label: 'Link',
    icon: '🔗',
    shortcut: 'Cmd+K',
    format: 'link'
  }
];

interface InlineToolbarProps {
  isVisible: boolean;
  position: { x: number; y: number };
  selectedText: string;
  activeFormats: Set<InlineFormatting['type']>;
  onFormat: (format: InlineFormatting['type']) => void;
  onLink: (href: string) => void;
  onClose: () => void;
}

export const InlineToolbar: React.FC<InlineToolbarProps> = ({
  isVisible,
  position,
  selectedText,
  activeFormats,
  onFormat,
  onLink,
  onClose
}) => {
  const toolbarRef = useRef<HTMLDivElement>(null);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const linkInputRef = useRef<HTMLInputElement>(null);

  // Handle clicks outside toolbar
  useEffect(() => {
    if (!isVisible) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (toolbarRef.current && !toolbarRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isVisible, onClose]);

  // Handle keyboard shortcuts
  useEffect(() => {
    if (!isVisible) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (showLinkInput) {
        // Handle link input
        if (event.key === 'Enter') {
          event.preventDefault();
          handleLinkSubmit();
        } else if (event.key === 'Escape') {
          event.preventDefault();
          setShowLinkInput(false);
          setLinkUrl('');
        }
        return;
      }

      // Handle toolbar shortcuts
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const cmdKey = isMac ? event.metaKey : event.ctrlKey;

      if (!cmdKey) return;

      switch (event.key.toLowerCase()) {
        case 'b':
          event.preventDefault();
          onFormat('bold');
          break;
        case 'i':
          event.preventDefault();
          onFormat('italic');
          break;
        case 'e':
          event.preventDefault();
          onFormat('code');
          break;
        case 'k':
          event.preventDefault();
          handleLinkClick();
          break;
        case 'x':
          if (event.shiftKey) {
            event.preventDefault();
            onFormat('strikethrough');
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isVisible, showLinkInput, onFormat]);

  // Focus link input when it appears
  useEffect(() => {
    if (showLinkInput && linkInputRef.current) {
      linkInputRef.current.focus();
      linkInputRef.current.select();
    }
  }, [showLinkInput]);

  const handleButtonClick = (button: ToolbarButton) => {
    if (button.format === 'link') {
      handleLinkClick();
    } else {
      onFormat(button.format as InlineFormatting['type']);
    }
  };

  const handleLinkClick = () => {
    if (activeFormats.has('link')) {
      // Remove existing link
      onFormat('link');
    } else {
      // Show link input
      setShowLinkInput(true);
      // Pre-fill with selected text if it looks like a URL
      if (selectedText && (selectedText.startsWith('http') || selectedText.includes('.'))) {
        setLinkUrl(selectedText);
      } else {
        setLinkUrl('');
      }
    }
  };

  const handleLinkSubmit = () => {
    if (linkUrl.trim()) {
      onLink(linkUrl.trim());
    }
    setShowLinkInput(false);
    setLinkUrl('');
  };

  const handleLinkCancel = () => {
    setShowLinkInput(false);
    setLinkUrl('');
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div
      ref={toolbarRef}
      className="inline-toolbar"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
    >
      {showLinkInput ? (
        <div className="inline-toolbar-link-input">
          <input
            ref={linkInputRef}
            type="url"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="Paste or type a link..."
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleLinkSubmit();
              } else if (e.key === 'Escape') {
                e.preventDefault();
                handleLinkCancel();
              }
            }}
          />
          <button
            type="button"
            className="inline-toolbar-button"
            onClick={handleLinkSubmit}
            title="Apply link"
          >
            ✓
          </button>
          <button
            type="button"
            className="inline-toolbar-button"
            onClick={handleLinkCancel}
            title="Cancel"
          >
            ✕
          </button>
        </div>
      ) : (
        <>
          {TOOLBAR_BUTTONS.map((button, index) => (
            <React.Fragment key={button.id}>
              {index === 4 && <div className="inline-toolbar-separator" />}
              <button
                type="button"
                className={`inline-toolbar-button ${
                  activeFormats.has(button.format as InlineFormatting['type']) ? 'active' : ''
                }`}
                onClick={() => handleButtonClick(button)}
                title={`${button.label} (${button.shortcut})`}
                aria-label={button.label}
              >
                {button.icon}
              </button>
            </React.Fragment>
          ))}
        </>
      )}
    </div>
  );
};