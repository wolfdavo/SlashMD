/**
 * Tests for basic parsing functionality (Phase 1)
 */

import { describe, it, expect } from 'vitest';
import { parseMarkdown, serializeBlocks } from '../src/index';
import type { Block, HeadingContent, ParagraphContent, DividerContent } from '../src/types';

describe('Parser (Phase 1)', () => {
  describe('parseMarkdown', () => {
    it('should parse a simple paragraph', () => {
      const markdown = 'This is a simple paragraph.';
      const blocks = parseMarkdown(markdown);

      expect(blocks).toHaveLength(1);
      expect(blocks[0].type).toBe('paragraph');
      expect(blocks[0].id).toBeDefined();
      expect(blocks[0].sourceRange).toBeDefined();
      expect((blocks[0].content as ParagraphContent).text).toBe('This is a simple paragraph.');
    });

    it('should parse headings of different levels', () => {
      const markdown = `# Heading 1
## Heading 2
### Heading 3`;
      
      const blocks = parseMarkdown(markdown);

      expect(blocks).toHaveLength(3);

      // Check heading 1
      expect(blocks[0].type).toBe('heading');
      expect((blocks[0].content as HeadingContent).level).toBe(1);
      expect((blocks[0].content as HeadingContent).text).toBe('Heading 1');

      // Check heading 2
      expect(blocks[1].type).toBe('heading');
      expect((blocks[1].content as HeadingContent).level).toBe(2);
      expect((blocks[1].content as HeadingContent).text).toBe('Heading 2');

      // Check heading 3
      expect(blocks[2].type).toBe('heading');
      expect((blocks[2].content as HeadingContent).level).toBe(3);
      expect((blocks[2].content as HeadingContent).text).toBe('Heading 3');
    });

    it('should parse horizontal dividers', () => {
      const markdown = '---';
      const blocks = parseMarkdown(markdown);

      expect(blocks).toHaveLength(1);
      expect(blocks[0].type).toBe('divider');
      expect(blocks[0].content).toEqual({});
    });

    it('should parse mixed content', () => {
      const markdown = `# Introduction

This is a paragraph explaining the content.

---

## Section 2

Another paragraph here.`;

      const blocks = parseMarkdown(markdown);

      expect(blocks).toHaveLength(5);
      expect(blocks[0].type).toBe('heading');
      expect(blocks[1].type).toBe('paragraph');
      expect(blocks[2].type).toBe('divider');
      expect(blocks[3].type).toBe('heading');
      expect(blocks[4].type).toBe('paragraph');
    });

    it('should assign unique IDs to blocks', () => {
      const markdown = `# Title

Paragraph one.

Paragraph two.`;

      const blocks = parseMarkdown(markdown);
      const ids = blocks.map(b => b.id);

      // All IDs should be defined and unique
      expect(ids.every(id => id && id.length > 0)).toBe(true);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it('should generate consistent IDs for identical content', () => {
      const markdown = 'Same paragraph content.';
      
      const blocks1 = parseMarkdown(markdown);
      const blocks2 = parseMarkdown(markdown);

      expect(blocks1[0].id).toBe(blocks2[0].id);
    });

    it('should handle empty input', () => {
      const blocks = parseMarkdown('');
      expect(blocks).toHaveLength(0);
    });

    it('should handle whitespace-only input', () => {
      const blocks = parseMarkdown('   \n   \n   ');
      expect(blocks).toHaveLength(0);
    });
  });
});