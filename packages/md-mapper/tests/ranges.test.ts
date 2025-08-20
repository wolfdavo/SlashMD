/**
 * Tests for source range tracking functionality
 */

import { describe, it, expect } from 'vitest';
import { 
  containsRange, 
  rangesOverlap, 
  mergeRanges, 
  adjustRangeAfterEdit,
  offsetToPosition,
  extractRangeText
} from '../src/ranges';
import { parseMarkdown } from '../src/index';
import type { SourceRange } from '../src/types';

describe('Source Range Tracking', () => {
  describe('Range utilities', () => {
    it('should detect range containment', () => {
      const container: SourceRange = { start: 0, end: 10 };
      const contained: SourceRange = { start: 2, end: 8 };
      const notContained: SourceRange = { start: 5, end: 15 };

      expect(containsRange(container, contained)).toBe(true);
      expect(containsRange(container, notContained)).toBe(false);
    });

    it('should detect range overlaps', () => {
      const rangeA: SourceRange = { start: 0, end: 10 };
      const rangeB: SourceRange = { start: 5, end: 15 }; // Overlaps
      const rangeC: SourceRange = { start: 15, end: 20 }; // No overlap

      expect(rangesOverlap(rangeA, rangeB)).toBe(true);
      expect(rangesOverlap(rangeA, rangeC)).toBe(false);
    });

    it('should merge ranges correctly', () => {
      const range1: SourceRange = { start: 5, end: 10 };
      const range2: SourceRange = { start: 0, end: 7 };
      const range3: SourceRange = { start: 12, end: 15 };

      const merged = mergeRanges(range1, range2, range3);
      expect(merged).toEqual({ start: 0, end: 15 });
    });

    it('should adjust ranges after edits', () => {
      // Range before edit - should be unchanged
      const rangeBefore: SourceRange = { start: 0, end: 5 };
      const adjustedBefore = adjustRangeAfterEdit(rangeBefore, 10, 15, 3);
      expect(adjustedBefore).toEqual(rangeBefore);

      // Range after edit - should be shifted
      const rangeAfter: SourceRange = { start: 20, end: 25 };
      const adjustedAfter = adjustRangeAfterEdit(rangeAfter, 10, 15, 3); // Delete 5, insert 3 = -2 delta
      expect(adjustedAfter).toEqual({ start: 18, end: 23 });
    });

    it('should convert offset to line/column position', () => {
      const text = 'Line 1\nLine 2\nLine 3';
      
      expect(offsetToPosition(text, 0)).toEqual({ line: 1, column: 1 });
      expect(offsetToPosition(text, 7)).toEqual({ line: 2, column: 1 }); // Start of line 2
      expect(offsetToPosition(text, 10)).toEqual({ line: 2, column: 4 }); // 'e' in "Line"
    });

    it('should extract text from ranges', () => {
      const text = 'Hello world, this is a test.';
      const range: SourceRange = { start: 6, end: 11 };
      
      expect(extractRangeText(text, range)).toBe('world');
    });
  });

  describe('Source ranges in parsed blocks', () => {
    it('should assign source ranges to blocks', () => {
      const markdown = `# Heading

Paragraph content.

---`;

      const blocks = parseMarkdown(markdown);

      expect(blocks).toHaveLength(3);
      
      // All blocks should have source ranges
      blocks.forEach(block => {
        expect(block.sourceRange).toBeDefined();
        expect(block.sourceRange.start).toBeGreaterThanOrEqual(0);
        expect(block.sourceRange.end).toBeGreaterThan(block.sourceRange.start);
      });

      // Ranges should be in order and not overlap improperly
      for (let i = 0; i < blocks.length - 1; i++) {
        expect(blocks[i].sourceRange.start).toBeLessThan(blocks[i + 1].sourceRange.start);
      }
    });

    it('should have accurate source ranges for different block types', () => {
      const markdown = 'Simple paragraph.';
      const blocks = parseMarkdown(markdown);

      expect(blocks).toHaveLength(1);
      const block = blocks[0];
      
      // Should span the entire input
      expect(block.sourceRange.start).toBe(0);
      expect(block.sourceRange.end).toBe(markdown.length);
    });
  });
});