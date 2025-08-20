/**
 * Basic test for useBlocks hook
 * Demonstrates testing foundation for Phase 1
 */

import { describe, it, expect } from 'vitest';
import type { Block } from '../types/blocks';

// Mock test - will be expanded in Phase 4
describe('useBlocks hook', () => {
  it('should have block type definitions', () => {
    const sampleBlock: Block = {
      id: 'test-1',
      type: 'paragraph',
      content: { text: 'Hello world' },
      sourceRange: { start: 0, end: 11 }
    };

    expect(sampleBlock.type).toBe('paragraph');
    expect(sampleBlock.id).toBe('test-1');
    expect('text' in sampleBlock.content).toBe(true);
  });

  it('should support heading blocks', () => {
    const headingBlock: Block = {
      id: 'test-2',
      type: 'heading',
      content: { level: 1 as const, text: 'Title' },
      sourceRange: { start: 0, end: 5 }
    };

    expect(headingBlock.type).toBe('heading');
    expect('level' in headingBlock.content).toBe(true);
  });
});