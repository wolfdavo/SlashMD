/**
 * Tests for serialization and round-trip functionality (Phase 1)
 */

import { describe, it, expect } from 'vitest';
import { parseMarkdown, serializeBlocks } from '../src/index';

describe('Serializer (Phase 1)', () => {
  describe('serializeBlocks', () => {
    it('should serialize paragraphs', () => {
      const markdown = 'This is a simple paragraph.';
      const blocks = parseMarkdown(markdown);
      const serialized = serializeBlocks(blocks);

      expect(serialized).toBe('This is a simple paragraph.');
    });

    it('should serialize headings', () => {
      const blocks = parseMarkdown('# Heading 1');
      const serialized = serializeBlocks(blocks);

      expect(serialized).toBe('# Heading 1');
    });

    it('should serialize dividers', () => {
      const blocks = parseMarkdown('---');
      const serialized = serializeBlocks(blocks);

      expect(serialized).toBe('---');
    });

    it('should serialize mixed content with proper spacing', () => {
      const originalMarkdown = `# Introduction

This is a paragraph.

---

## Section 2

Another paragraph.`;

      const blocks = parseMarkdown(originalMarkdown);
      const serialized = serializeBlocks(blocks);

      // Should have proper line breaks between blocks
      const lines = serialized.split('\n');
      expect(lines).toContain('# Introduction');
      expect(lines).toContain('This is a paragraph.');
      expect(lines).toContain('---');
      expect(lines).toContain('## Section 2');
      expect(lines).toContain('Another paragraph.');
    });
  });

  describe('Round-trip tests', () => {
    const testCases = [
      'Simple paragraph',
      '# Heading 1',
      '## Heading 2',
      '### Heading 3',
      '---',
      `# Title

Content paragraph.`,
      `# Introduction

First paragraph.

---

## Section

Second paragraph.`
    ];

    testCases.forEach((markdown, index) => {
      it(`should maintain fidelity for test case ${index + 1}`, () => {
        const blocks = parseMarkdown(markdown);
        const serialized = serializeBlocks(blocks);
        const reparsed = parseMarkdown(serialized);

        // Block structure should be identical
        expect(reparsed).toHaveLength(blocks.length);
        
        for (let i = 0; i < blocks.length; i++) {
          expect(reparsed[i].type).toBe(blocks[i].type);
          // Content should be preserved (IDs may differ due to regeneration)
          expect(reparsed[i].content).toEqual(blocks[i].content);
        }
      });
    });

    it('should handle multiple round trips', () => {
      const original = `# Document

This is content.

---

## Section

More content here.`;

      let current = original;
      
      // Do 3 round trips
      for (let i = 0; i < 3; i++) {
        const blocks = parseMarkdown(current);
        current = serializeBlocks(blocks);
      }

      // Final result should parse to same block structure as original
      const originalBlocks = parseMarkdown(original);
      const finalBlocks = parseMarkdown(current);

      expect(finalBlocks).toHaveLength(originalBlocks.length);
      
      for (let i = 0; i < originalBlocks.length; i++) {
        expect(finalBlocks[i].type).toBe(originalBlocks[i].type);
        expect(finalBlocks[i].content).toEqual(originalBlocks[i].content);
      }
    });
  });
});