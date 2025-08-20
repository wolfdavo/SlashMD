/**
 * Accessibility hook for Phase 4
 * Manages keyboard navigation, ARIA attributes, and screen reader support
 */

import { useEffect, useCallback, useRef } from 'react';

interface AccessibilityOptions {
  enableKeyboardNavigation?: boolean;
  enableFocusTrapping?: boolean;
  announceChanges?: boolean;
  enableHighContrast?: boolean;
}

export const useAccessibility = (options: AccessibilityOptions = {}) => {
  const {
    enableKeyboardNavigation = true,
    enableFocusTrapping = false,
    announceChanges = true,
    enableHighContrast = true
  } = options;

  const announceRef = useRef<HTMLDivElement | null>(null);
  const focusTrapRef = useRef<HTMLElement | null>(null);

  // Create live region for screen reader announcements
  useEffect(() => {
    if (!announceChanges) return;

    const announceElement = document.createElement('div');
    announceElement.setAttribute('aria-live', 'polite');
    announceElement.setAttribute('aria-atomic', 'true');
    announceElement.setAttribute('class', 'sr-only');
    announceElement.style.cssText = `
      position: absolute !important;
      width: 1px !important;
      height: 1px !important;
      padding: 0 !important;
      margin: -1px !important;
      overflow: hidden !important;
      clip: rect(0, 0, 0, 0) !important;
      white-space: nowrap !important;
      border: 0 !important;
    `;
    
    document.body.appendChild(announceElement);
    announceRef.current = announceElement;

    return () => {
      if (announceRef.current) {
        document.body.removeChild(announceRef.current);
      }
    };
  }, [announceChanges]);

  // Announce message to screen readers
  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (!announceRef.current) return;

    announceRef.current.setAttribute('aria-live', priority);
    announceRef.current.textContent = message;

    // Clear after announcement
    setTimeout(() => {
      if (announceRef.current) {
        announceRef.current.textContent = '';
      }
    }, 1000);
  }, []);

  // Focus management utilities
  const focusElement = useCallback((element: HTMLElement | null) => {
    if (!element) return false;

    try {
      element.focus({ preventScroll: false });
      return document.activeElement === element;
    } catch {
      return false;
    }
  }, []);

  // Get focusable elements within a container
  const getFocusableElements = useCallback((container: HTMLElement): HTMLElement[] => {
    const focusableSelector = [
      'button:not([disabled])',
      'input:not([disabled]):not([type="hidden"])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]'
    ].join(', ');

    return Array.from(container.querySelectorAll(focusableSelector));
  }, []);

  // Setup focus trap
  useEffect(() => {
    if (!enableFocusTrapping || !focusTrapRef.current) return;

    const container = focusTrapRef.current;
    const focusableElements = getFocusableElements(container);
    
    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          focusElement(lastElement);
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          focusElement(firstElement);
        }
      }
    };

    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // Allow custom escape handling
        const escapeEvent = new CustomEvent('focustrap:escape');
        container.dispatchEvent(escapeEvent);
      }
    };

    container.addEventListener('keydown', handleTabKey);
    container.addEventListener('keydown', handleEscapeKey);

    // Focus first element
    focusElement(firstElement);

    return () => {
      container.removeEventListener('keydown', handleTabKey);
      container.removeEventListener('keydown', handleEscapeKey);
    };
  }, [enableFocusTrapping, getFocusableElements, focusElement]);

  // Keyboard navigation handler
  const handleKeyboardNavigation = useCallback((event: KeyboardEvent) => {
    if (!enableKeyboardNavigation) return;

    const { key, ctrlKey, metaKey, altKey, shiftKey } = event;
    const activeElement = document.activeElement as HTMLElement;

    // Block navigation commands
    if (altKey) {
      switch (key) {
        case 'ArrowUp':
          event.preventDefault();
          announce('Moving block up');
          // Dispatch custom event for block movement
          document.dispatchEvent(new CustomEvent('accessibility:moveBlockUp'));
          break;
        
        case 'ArrowDown':
          event.preventDefault();
          announce('Moving block down');
          document.dispatchEvent(new CustomEvent('accessibility:moveBlockDown'));
          break;
      }
    }

    // Focus management
    if (key === 'Tab' && !ctrlKey && !metaKey && !altKey) {
      // Let default tab behavior work, but announce focused element
      setTimeout(() => {
        const newActiveElement = document.activeElement as HTMLElement;
        if (newActiveElement && newActiveElement !== activeElement) {
          announceElementFocus(newActiveElement);
        }
      }, 0);
    }

    // Quick access commands
    if (ctrlKey || metaKey) {
      switch (key) {
        case '/':
          event.preventDefault();
          announce('Opening command menu');
          document.dispatchEvent(new CustomEvent('accessibility:openSlashMenu'));
          break;
        
        case 'Enter':
          if (shiftKey) {
            event.preventDefault();
            announce('Creating new block');
            document.dispatchEvent(new CustomEvent('accessibility:createBlock'));
          }
          break;
      }
    }
  }, [enableKeyboardNavigation, announce]);

  // Announce element focus for screen readers
  const announceElementFocus = useCallback((element: HTMLElement) => {
    const role = element.getAttribute('role');
    const label = element.getAttribute('aria-label') || 
                  element.getAttribute('title') || 
                  element.textContent?.slice(0, 50);

    if (element.classList.contains('block-container')) {
      const blockType = element.getAttribute('data-block-type') || 'block';
      announce(`Focused on ${blockType} block. ${label || ''}`);
    } else if (role === 'button') {
      announce(`Button: ${label || 'unlabeled button'}`);
    } else if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
      announce(`Input field: ${label || 'text input'}`);
    } else if (element.contentEditable === 'true') {
      announce(`Editable text: ${label || 'text editor'}`);
    }
  }, [announce]);

  // Setup global keyboard navigation
  useEffect(() => {
    if (!enableKeyboardNavigation) return;

    document.addEventListener('keydown', handleKeyboardNavigation);
    return () => {
      document.removeEventListener('keydown', handleKeyboardNavigation);
    };
  }, [enableKeyboardNavigation, handleKeyboardNavigation]);

  // High contrast mode detection and handling
  useEffect(() => {
    if (!enableHighContrast) return;

    const mediaQuery = window.matchMedia('(prefers-contrast: high)');
    const handleContrastChange = (e: MediaQueryListEvent) => {
      document.body.classList.toggle('high-contrast', e.matches);
      if (e.matches) {
        announce('High contrast mode enabled');
      }
    };

    mediaQuery.addEventListener('change', handleContrastChange);
    handleContrastChange({ matches: mediaQuery.matches } as MediaQueryListEvent);

    return () => {
      mediaQuery.removeEventListener('change', handleContrastChange);
    };
  }, [enableHighContrast, announce]);

  // ARIA attributes helpers
  const getAriaAttributes = useCallback((type: string, props: any = {}) => {
    const baseAttrs: Record<string, any> = {};

    switch (type) {
      case 'block':
        baseAttrs.role = 'article';
        baseAttrs['aria-label'] = `${props.blockType || 'Block'} content`;
        break;
      
      case 'button':
        baseAttrs.role = 'button';
        if (props.pressed !== undefined) {
          baseAttrs['aria-pressed'] = props.pressed;
        }
        break;
      
      case 'menu':
        baseAttrs.role = 'menu';
        baseAttrs['aria-orientation'] = 'vertical';
        break;
      
      case 'menuitem':
        baseAttrs.role = 'menuitem';
        if (props.selected) {
          baseAttrs['aria-selected'] = 'true';
        }
        break;
      
      case 'textbox':
        baseAttrs.role = 'textbox';
        if (props.multiline) {
          baseAttrs['aria-multiline'] = 'true';
        }
        break;
      
      case 'toggle':
        baseAttrs['aria-expanded'] = props.expanded || false;
        break;
      
      case 'live':
        baseAttrs['aria-live'] = props.priority || 'polite';
        baseAttrs['aria-atomic'] = 'true';
        break;
    }

    return baseAttrs;
  }, []);

  // Skip link functionality
  const createSkipLink = useCallback((targetId: string, label: string) => {
    const skipLink = document.createElement('a');
    skipLink.href = `#${targetId}`;
    skipLink.className = 'skip-link';
    skipLink.textContent = label;
    skipLink.style.cssText = `
      position: absolute !important;
      top: -40px !important;
      left: 6px !important;
      width: auto !important;
      height: auto !important;
      padding: 8px !important;
      background: var(--vscode-editor-background) !important;
      color: var(--vscode-editor-foreground) !important;
      border: 2px solid var(--vscode-focusBorder) !important;
      border-radius: 3px !important;
      text-decoration: none !important;
      font-size: 14px !important;
      z-index: 10000 !important;
      transition: top 0.3s !important;
    `;

    skipLink.addEventListener('focus', () => {
      skipLink.style.top = '6px';
    });

    skipLink.addEventListener('blur', () => {
      skipLink.style.top = '-40px';
    });

    return skipLink;
  }, []);

  return {
    announce,
    focusElement,
    getFocusableElements,
    getAriaAttributes,
    createSkipLink,
    focusTrapRef,
    announceElementFocus
  };
};