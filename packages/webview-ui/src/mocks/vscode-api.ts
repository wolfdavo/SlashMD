/**
 * Mock VS Code API for standalone development
 * This simulates the VS Code WebView API to enable development without the extension host
 */

import type { Block, SlashMDSettings } from '../types/blocks';
import type { Theme } from '../types/editor';

export interface VSCodeAPI {
  postMessage: (data: any) => void;
  setState: (state: any) => void;
  getState: () => any;
}

// Sample block data for development
export const sampleDocument: Block[] = [
  {
    id: 'h1-1',
    type: 'heading',
    content: { level: 1, text: 'Sample Document' },
    sourceRange: { start: 0, end: 17 },
  },
  {
    id: 'p-1', 
    type: 'paragraph',
    content: { text: 'This is a paragraph with some text content for testing the basic editing functionality.' },
    sourceRange: { start: 18, end: 104 },
  },
  {
    id: 'h2-1',
    type: 'heading',
    content: { level: 2, text: 'Getting Started' },
    sourceRange: { start: 105, end: 125 },
  },
  {
    id: 'p-2',
    type: 'paragraph',
    content: { text: 'You can edit this text by clicking on it. Try typing some text to see how the editor responds.' },
    sourceRange: { start: 126, end: 221 },
  },
  {
    id: 'h3-1',
    type: 'heading',
    content: { level: 3, text: 'Features' },
    sourceRange: { start: 222, end: 235 },
  },
  {
    id: 'p-3',
    type: 'paragraph',
    content: { text: 'This is a basic implementation that will be extended in future phases.' },
    sourceRange: { start: 236, end: 305 },
  }
];

// Default settings for development
export const defaultSettings: SlashMDSettings = {
  assetsFolder: 'assets',
  wrapWidth: 80,
  calloutsStyle: 'admonition',
  togglesSyntax: 'details',
  themeDensity: 'comfortable',
  mathEnabled: true,
  mermaidEnabled: true,
  showLineNumbers: true
};

// Mock VS Code API implementation
export const createMockVSCodeAPI = (): VSCodeAPI => {
  const mockAPI: VSCodeAPI = {
    postMessage: (data: any) => {
      console.log('Mock postMessage:', data);
      
      // Simulate responses for specific message types
      setTimeout(() => {
        if (data.type === 'REQUEST_INIT') {
          // Simulate document initialization
          window.dispatchEvent(new CustomEvent('message', {
            detail: {
              type: 'DOC_INIT',
              payload: {
                blocks: sampleDocument,
                settings: defaultSettings,
                theme: (localStorage.getItem('theme') as Theme) || 'light'
              }
            }
          }));
        }
      }, 100);
    },
    
    setState: (state: any) => {
      localStorage.setItem('vscode-state', JSON.stringify(state));
    },
    
    getState: () => {
      const stored = localStorage.getItem('vscode-state');
      return stored ? JSON.parse(stored) : {};
    }
  };

  return mockAPI;
};

// Install mock API globally
export const installMockVSCodeAPI = () => {
  if (typeof window !== 'undefined' && !window.acquireVsCodeApi) {
    window.acquireVsCodeApi = () => createMockVSCodeAPI();
    
    // Add theme switcher for development
    window.switchTheme = (theme: Theme) => {
      localStorage.setItem('theme', theme);
      document.documentElement.setAttribute('data-theme', theme);
      
      // Notify the app of theme change
      window.dispatchEvent(new CustomEvent('message', {
        detail: {
          type: 'THEME_CHANGED',
          payload: { theme }
        }
      }));
    };
  }
};

// Type augmentation for development utilities
declare global {
  interface Window {
    acquireVsCodeApi?: () => VSCodeAPI;
    switchTheme?: (theme: Theme) => void;
  }
}