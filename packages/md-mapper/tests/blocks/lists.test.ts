/**
 * Tests specific to list block functionality
 */

import { describe, it, expect } from 'vitest';
import { parseMarkdown, serializeBlocks } from '../../src/index';
import type { ListContent, ListItemContent } from '../../src/types';

describe('List Blocks', () => {
  describe('Unordered Lists', () => {
    it('should parse simple unordered lists', () => {
      const markdown = `- Item 1
- Item 2
- Item 3`;

      const blocks = parseMarkdown(markdown);
      expect(blocks).toHaveLength(1);
      expect(blocks[0].type).toBe('list');
      
      const content = blocks[0].content as ListContent;
      expect(content.ordered).toBe(false);
      
      expect(blocks[0].children).toHaveLength(3);
      expect(blocks[0].children?.[0].type).toBe('listItem');
      expect((blocks[0].children?.[0].content as ListItemContent).text).toBe('Item 1');
    });

    it('should parse nested unordered lists', () => {
      const markdown = `- Level 1 Item 1
  - Level 2 Item 1
  - Level 2 Item 2
- Level 1 Item 2`;

      const blocks = parseMarkdown(markdown);
      expect(blocks).toHaveLength(1);
      expect(blocks[0].type).toBe('list');
      
      // Should have 2 top-level items
      expect(blocks[0].children).toHaveLength(2);
      
      // First item should have nested list
      const firstItem = blocks[0].children?.[0];
      expect(firstItem?.children).toHaveLength(1);
      expect(firstItem?.children?.[0].type).toBe('list');
      expect(firstItem?.children?.[0].children).toHaveLength(2);
    });
  });

  describe('Ordered Lists', () => {
    it('should parse simple ordered lists', () => {
      const markdown = `1. First item
2. Second item
3. Third item`;

      const blocks = parseMarkdown(markdown);
      expect(blocks).toHaveLength(1);
      expect(blocks[0].type).toBe('list');
      
      const content = blocks[0].content as ListContent;
      expect(content.ordered).toBe(true);
      expect(content.startNumber).toBe(1);
      
      expect(blocks[0].children).toHaveLength(3);
      expect((blocks[0].children?.[0].content as ListItemContent).text).toBe('First item');
    });

    it('should handle ordered lists with custom start numbers', () => {
      const markdown = `5. Fifth item
6. Sixth item
7. Seventh item`;

      const blocks = parseMarkdown(markdown);
      expect(blocks).toHaveLength(1);
      
      const content = blocks[0].content as ListContent;
      expect(content.ordered).toBe(true);
      expect(content.startNumber).toBe(5);
    });
  });

  describe('Serialization', () => {
    it('should serialize unordered lists correctly', () => {
      const markdown = `- Item 1
- Item 2
- Item 3`;

      const blocks = parseMarkdown(markdown);
      const serialized = serializeBlocks(blocks);
      
      expect(serialized).toBe(markdown);
    });

    it('should serialize ordered lists correctly', () => {
      const markdown = `1. First item
2. Second item
3. Third item`;

      const blocks = parseMarkdown(markdown);
      const serialized = serializeBlocks(blocks);
      
      expect(serialized).toBe(markdown);
    });

    it('should maintain custom start numbers', () => {
      const markdown = `5. Fifth item
6. Sixth item`;

      const blocks = parseMarkdown(markdown);
      const serialized = serializeBlocks(blocks);
      
      expect(serialized).toBe(markdown);
    });
  });

  describe('Round-trip fidelity', () => {
    it('should maintain list structure through round trips', () => {
      const original = `- Unordered item 1
- Unordered item 2

1. Ordered item 1
2. Ordered item 2`;

      let current = original;
      
      // 3 round trips
      for (let i = 0; i < 3; i++) {
        const blocks = parseMarkdown(current);
        current = serializeBlocks(blocks);
      }

      const finalBlocks = parseMarkdown(current);
      expect(finalBlocks).toHaveLength(2);
      expect(finalBlocks[0].type).toBe('list');
      expect(finalBlocks[1].type).toBe('list');
      
      expect((finalBlocks[0].content as ListContent).ordered).toBe(false);
      expect((finalBlocks[1].content as ListContent).ordered).toBe(true);
    });
  });

  describe('Edge cases', () => {
    it('should handle empty list items', () => {
      const markdown = `- 
- Item with content
- `;

      const blocks = parseMarkdown(markdown);
      expect(blocks).toHaveLength(1);
      expect(blocks[0].children).toHaveLength(3);
      
      expect((blocks[0].children?.[0].content as ListItemContent).text).toBe('');
      expect((blocks[0].children?.[1].content as ListItemContent).text).toBe('Item with content');
      expect((blocks[0].children?.[2].content as ListItemContent).text).toBe('');
    });

    it('should handle lists with special characters', () => {
      const markdown = `- Item with *italic* text
- Item with **bold** text
- Item with \`code\` text`;

      const blocks = parseMarkdown(markdown);
      expect(blocks).toHaveLength(1);
      expect(blocks[0].children).toHaveLength(3);
      
      // Note: In Phase 2, remark processes the formatting so the raw syntax may not be preserved
      expect((blocks[0].children?.[0].content as ListItemContent).text).toContain('italic');
    });
  });
});