/**
 * Keyboard Shortcuts Hook for Phase 3
 * Handles global keyboard shortcuts and navigation
 */

import { useEffect, useCallback } from 'react';
import type { BlockType } from '../types/blocks';

interface UseKeyboardProps {
  onFormat?: (format: 'bold' | 'italic' | 'strikethrough' | 'code') => void;
  onLink?: () => void;
  onSlashCommand?: () => void;
  onBlockNavigation?: (direction: 'up' | 'down') => void;
  onBlockIndent?: (direction: 'in' | 'out') => void;
  onNewBlock?: (type?: BlockType) => void;
  onDeleteBlock?: () => void;
  onConvertBlock?: (type: BlockType) => void;
  enabled?: boolean;
}

export const useKeyboard = ({
  onFormat,
  onLink,
  onSlashCommand,
  onBlockNavigation,
  onBlockIndent,
  onNewBlock,
  onDeleteBlock,
  onConvertBlock,
  enabled = true
}: UseKeyboardProps = {}) => {
  const isMac = typeof navigator !== 'undefined' 
    ? navigator.platform.toUpperCase().indexOf('MAC') >= 0
    : false;

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;

    const cmdKey = isMac ? event.metaKey : event.ctrlKey;
    const altKey = event.altKey;
    const shiftKey = event.shiftKey;

    // Block-level shortcuts (when no modifier keys or only Alt)
    if (!cmdKey && !shiftKey) {
      switch (event.key) {
        case '/':
          // Trigger slash menu (handled by parent component)
          onSlashCommand?.();
          break;
        
        case 'Enter':
          // Create new block
          if (altKey) {
            event.preventDefault();
            onNewBlock?.();
          }
          break;
        
        case 'Backspace':
          // Delete empty block
          if (altKey) {
            event.preventDefault();
            onDeleteBlock?.();
          }
          break;
        
        case 'Tab':
          // Indent/Outdent
          event.preventDefault();
          if (shiftKey) {
            onBlockIndent?.('out');
          } else {
            onBlockIndent?.('in');
          }
          break;
      }
    }

    // Alt + Arrow keys for block navigation and movement
    if (altKey && !cmdKey) {
      switch (event.key) {
        case 'ArrowUp':
          event.preventDefault();
          onBlockNavigation?.('up');
          break;
        
        case 'ArrowDown':
          event.preventDefault();
          onBlockNavigation?.('down');
          break;
      }
    }

    // Cmd/Ctrl shortcuts for formatting and actions
    if (cmdKey && !altKey) {
      switch (event.key.toLowerCase()) {
        case 'b':
          event.preventDefault();
          onFormat?.('bold');
          break;
        
        case 'i':
          event.preventDefault();
          onFormat?.('italic');
          break;
        
        case 'e':
          event.preventDefault();
          onFormat?.('code');
          break;
        
        case 'k':
          event.preventDefault();
          onLink?.();
          break;
        
        case 'x':
          if (shiftKey) {
            event.preventDefault();
            onFormat?.('strikethrough');
          }
          break;
        
        // Block type shortcuts
        case '1':
          if (shiftKey) {
            event.preventDefault();
            onConvertBlock?.('heading');
          }
          break;
        
        case '2':
          if (shiftKey) {
            event.preventDefault();
            onConvertBlock?.('heading');
          }
          break;
        
        case '3':
          if (shiftKey) {
            event.preventDefault();
            onConvertBlock?.('heading');
          }
          break;
        
        case 'p':
          if (shiftKey) {
            event.preventDefault();
            onConvertBlock?.('paragraph');
          }
          break;
        
        case 'l':
          if (shiftKey) {
            event.preventDefault();
            onConvertBlock?.('list');
          }
          break;
        
        case 't':
          if (shiftKey) {
            event.preventDefault();
            onConvertBlock?.('taskList');
          }
          break;
        
        case 'q':
          if (shiftKey) {
            event.preventDefault();
            onConvertBlock?.('quote');
          }
          break;
        
        case 'c':
          if (shiftKey) {
            event.preventDefault();
            onConvertBlock?.('code');
          }
          break;
      }
    }
  }, [
    enabled,
    isMac,
    onFormat,
    onLink,
    onSlashCommand,
    onBlockNavigation,
    onBlockIndent,
    onNewBlock,
    onDeleteBlock,
    onConvertBlock
  ]);

  useEffect(() => {
    if (!enabled) return;

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [enabled, handleKeyDown]);

  // Return utility functions for external use
  return {
    isMac,
    
    // Helper to format keyboard shortcuts for display
    formatShortcut: (shortcut: string) => {
      return shortcut.replace('Cmd', isMac ? '⌘' : 'Ctrl');
    },
    
    // Check if a key combination matches a shortcut
    matchesShortcut: (event: KeyboardEvent, shortcut: string) => {
      const parts = shortcut.toLowerCase().split('+');
      const key = parts[parts.length - 1];
      const needsCmd = parts.includes('cmd');
      const needsShift = parts.includes('shift');
      const needsAlt = parts.includes('alt');
      
      const hasCmd = isMac ? event.metaKey : event.ctrlKey;
      
      return event.key.toLowerCase() === key &&
             hasCmd === needsCmd &&
             event.shiftKey === needsShift &&
             event.altKey === needsAlt;
    }
  };
};