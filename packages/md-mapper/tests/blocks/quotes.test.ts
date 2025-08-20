/**
 * Tests specific to quote block functionality
 */

import { describe, it, expect } from 'vitest';
import { parseMarkdown, serializeBlocks } from '../../src/index';
import type { QuoteContent } from '../../src/types';

describe('Quote Blocks', () => {
  describe('Parsing', () => {
    it('should parse simple blockquotes', () => {
      const markdown = `> This is a quote`;

      const blocks = parseMarkdown(markdown);
      expect(blocks).toHaveLength(1);
      expect(blocks[0].type).toBe('quote');
      
      const content = blocks[0].content as QuoteContent;
      expect(content.text).toBe('This is a quote');
    });

    it('should parse multi-line blockquotes', () => {
      const markdown = `> This is the first line of a quote
> This is the second line
> And this is the third line`;

      const blocks = parseMarkdown(markdown);
      expect(blocks).toHaveLength(1);
      expect(blocks[0].type).toBe('quote');
      
      const content = blocks[0].content as QuoteContent;
      expect(content.text).toContain('This is the first line');
      expect(content.text).toContain('This is the second line');
      expect(content.text).toContain('And this is the third line');
    });

    it('should handle empty blockquotes', () => {
      const markdown = `> `;

      const blocks = parseMarkdown(markdown);
      expect(blocks).toHaveLength(1);
      expect(blocks[0].type).toBe('quote');
      
      const content = blocks[0].content as QuoteContent;
      expect(content.text).toBe('');
    });
  });

  describe('Serialization', () => {
    it('should serialize simple quotes correctly', () => {
      const markdown = `> This is a quote`;

      const blocks = parseMarkdown(markdown);
      const serialized = serializeBlocks(blocks);
      
      expect(serialized).toBe(markdown);
    });

    it('should serialize multi-line quotes correctly', () => {
      const markdown = `> First line
> Second line
> Third line`;

      const blocks = parseMarkdown(markdown);
      const serialized = serializeBlocks(blocks);
      
      // The exact formatting might differ slightly due to parsing
      expect(serialized).toContain('> First line');
      expect(serialized).toContain('> Second line');
      expect(serialized).toContain('> Third line');
    });

    it('should handle quotes with empty lines', () => {
      const markdown = `> Quote with content
> 
> More content after empty line`;

      const blocks = parseMarkdown(markdown);
      const serialized = serializeBlocks(blocks);
      
      expect(serialized).toContain('Quote with content');
      expect(serialized).toContain('More content after empty line');
    });
  });

  describe('Round-trip fidelity', () => {
    it('should maintain quote structure through round trips', () => {
      const original = `> This is a famous quote
> that spans multiple lines
> and should be preserved`;

      let current = original;
      
      // 3 round trips
      for (let i = 0; i < 3; i++) {
        const blocks = parseMarkdown(current);
        current = serializeBlocks(blocks);
      }

      const finalBlocks = parseMarkdown(current);
      expect(finalBlocks).toHaveLength(1);
      expect(finalBlocks[0].type).toBe('quote');
      
      const content = finalBlocks[0].content as QuoteContent;
      expect(content.text).toContain('famous quote');
      expect(content.text).toContain('multiple lines');
      expect(content.text).toContain('preserved');
    });
  });

  describe('Mixed content scenarios', () => {
    it('should handle quotes mixed with other content', () => {
      const markdown = `# Introduction

> This is an important quote
> that illustrates the point

Here is a paragraph following the quote.`;

      const blocks = parseMarkdown(markdown);
      expect(blocks).toHaveLength(3);
      
      expect(blocks[0].type).toBe('heading');
      expect(blocks[1].type).toBe('quote');
      expect(blocks[2].type).toBe('paragraph');
      
      const quoteContent = blocks[1].content as QuoteContent;
      expect(quoteContent.text).toContain('important quote');
      expect(quoteContent.text).toContain('illustrates the point');
    });
  });

  describe('Edge cases', () => {
    it('should handle quotes with special characters', () => {
      const markdown = `> Quote with *italic* text
> and **bold** text
> and \`code\` text`;

      const blocks = parseMarkdown(markdown);
      expect(blocks).toHaveLength(1);
      expect(blocks[0].type).toBe('quote');
      
      const content = blocks[0].content as QuoteContent;
      // Note: In Phase 2, remark processes the formatting so the raw syntax may not be preserved
      expect(content.text).toContain('italic');
      expect(content.text).toContain('bold');
      expect(content.text).toContain('code');
    });

    it('should handle nested quote-like content', () => {
      const markdown = `> Someone said:
> > "This is a nested quote"
> That's what they said.`;

      const blocks = parseMarkdown(markdown);
      expect(blocks).toHaveLength(1);
      expect(blocks[0].type).toBe('quote');
      
      const content = blocks[0].content as QuoteContent;
      expect(content.text).toContain('Someone said');
      expect(content.text).toContain('nested quote');
      expect(content.text).toContain("That's what they said");
    });

    it('should handle quotes with URLs and links', () => {
      const markdown = `> Check out https://example.com
> or [this link](https://example.org)
> for more information.`;

      const blocks = parseMarkdown(markdown);
      expect(blocks).toHaveLength(1);
      expect(blocks[0].type).toBe('quote');
      
      const content = blocks[0].content as QuoteContent;
      expect(content.text).toContain('https://example.com');
      expect(content.text).toContain('this link');
      expect(content.text).toContain('more information');
    });
  });
});