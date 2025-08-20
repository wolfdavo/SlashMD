/**
 * Test setup for Vitest
 * Configures testing environment for React components and Lexical editor
 */

import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock VS Code API for tests
Object.defineProperty(window, 'acquireVsCodeApi', {
  writable: true,
  value: () => ({
    postMessage: vi.fn(),
    setState: vi.fn(),
    getState: vi.fn(() => ({}))
  })
});

// Mock clipboard API
Object.defineProperty(navigator, 'clipboard', {
  writable: true,
  value: {
    writeText: vi.fn().mockResolvedValue(undefined),
    readText: vi.fn().mockResolvedValue('')
  }
});

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
}));

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn()
  }))
});

// Mock scrollIntoView
Element.prototype.scrollIntoView = vi.fn();

// Mock getSelection
Object.defineProperty(window, 'getSelection', {
  writable: true,
  value: vi.fn().mockImplementation(() => ({
    removeAllRanges: vi.fn(),
    addRange: vi.fn(),
    toString: vi.fn().mockReturnValue(''),
    rangeCount: 0
  }))
});

// Increase timeout for longer-running tests
vi.setConfig({ testTimeout: 10000 });