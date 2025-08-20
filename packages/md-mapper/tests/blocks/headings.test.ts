/**
 * Tests specific to heading block functionality
 */

import { describe, it, expect } from 'vitest';
import { parseMarkdown, serializeBlocks } from '../../src/index';
import type { HeadingContent } from '../../src/types';

describe('Heading Blocks', () => {
  describe('Parsing', () => {
    it('should parse different heading levels', () => {
      const testCases = [
        { markdown: '# Level 1', level: 1, text: 'Level 1' },
        { markdown: '## Level 2', level: 2, text: 'Level 2' },
        { markdown: '### Level 3', level: 3, text: 'Level 3' },
      ];

      testCases.forEach(({ markdown, level, text }) => {
        const blocks = parseMarkdown(markdown);
        expect(blocks).toHaveLength(1);
        expect(blocks[0].type).toBe('heading');
        
        const content = blocks[0].content as HeadingContent;
        expect(content.level).toBe(level);
        expect(content.text).toBe(text);
      });
    });

    it('should clamp heading levels to 1-3 range', () => {
      // Test very deep headings get clamped to level 3
      const deepHeading = '##### Level 5 becomes 3';
      const blocks = parseMarkdown(deepHeading);
      
      expect(blocks).toHaveLength(1);
      const content = blocks[0].content as HeadingContent;
      expect(content.level).toBe(3);
      expect(content.text).toBe('Level 5 becomes 3');
    });

    it('should handle headings with various text content', () => {
      const testCases = [
        'Simple heading',
        'Heading with numbers 123',
        'Heading with special chars !@#',
        'Multiple    spaces   in   heading',
        '', // Empty heading
      ];

      testCases.forEach(text => {
        const markdown = `# ${text}`;
        const blocks = parseMarkdown(markdown);
        
        expect(blocks).toHaveLength(1);
        expect(blocks[0].type).toBe('heading');
        expect((blocks[0].content as HeadingContent).text).toBe(text);
      });
    });
  });

  describe('Serialization', () => {
    it('should serialize headings with correct prefix', () => {
      const testCases = [
        { level: 1, text: 'Heading 1', expected: '# Heading 1' },
        { level: 2, text: 'Heading 2', expected: '## Heading 2' },
        { level: 3, text: 'Heading 3', expected: '### Heading 3' },
      ];

      testCases.forEach(({ level, text, expected }) => {
        const markdown = `${'#'.repeat(level)} ${text}`;
        const blocks = parseMarkdown(markdown);
        const serialized = serializeBlocks(blocks);
        
        expect(serialized).toBe(expected);
      });
    });

    it('should handle empty heading text', () => {
      const blocks = parseMarkdown('# ');
      const serialized = serializeBlocks(blocks);
      
      expect(serialized).toBe('# ');
    });
  });

  describe('Round-trip fidelity', () => {
    it('should maintain heading structure through multiple round trips', () => {
      const original = `# Main Title
## Subsection
### Details
# Another Main Section`;

      let current = original;
      
      // 3 round trips
      for (let i = 0; i < 3; i++) {
        const blocks = parseMarkdown(current);
        current = serializeBlocks(blocks);
      }

      const finalBlocks = parseMarkdown(current);
      expect(finalBlocks).toHaveLength(4);

      const levels = finalBlocks.map(b => (b.content as HeadingContent).level);
      expect(levels).toEqual([1, 2, 3, 1]);

      const texts = finalBlocks.map(b => (b.content as HeadingContent).text);
      expect(texts).toEqual(['Main Title', 'Subsection', 'Details', 'Another Main Section']);
    });
  });

  describe('ID generation', () => {
    it('should generate consistent IDs for identical headings', () => {
      const blocks1 = parseMarkdown('# Same Heading');
      const blocks2 = parseMarkdown('# Same Heading');

      expect(blocks1[0].id).toBe(blocks2[0].id);
    });

    it('should generate different IDs for different headings', () => {
      const markdown = `# Heading 1
## Heading 2
### Heading 3`;

      const blocks = parseMarkdown(markdown);
      const ids = blocks.map(b => b.id);

      expect(new Set(ids).size).toBe(3); // All unique
    });

    it('should generate different IDs for same text but different levels', () => {
      const markdown = `# Same Text
## Same Text
### Same Text`;

      const blocks = parseMarkdown(markdown);
      const ids = blocks.map(b => b.id);

      expect(new Set(ids).size).toBe(3); // All unique despite same text
    });
  });
});