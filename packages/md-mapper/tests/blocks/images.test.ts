/**
 * Tests specific to image block functionality
 */

import { describe, it, expect } from 'vitest';
import { parseMarkdown, serializeBlocks } from '../../src/index';
import type { ImageContent } from '../../src/types';

describe('Image Blocks', () => {
  describe('Parsing', () => {
    it('should parse simple images', () => {
      const markdown = `![Alt text](image.jpg)`;

      const blocks = parseMarkdown(markdown);
      expect(blocks).toHaveLength(1);
      expect(blocks[0].type).toBe('image');
      
      const content = blocks[0].content as ImageContent;
      expect(content.alt).toBe('Alt text');
      expect(content.src).toBe('image.jpg');
      expect(content.title).toBeUndefined();
    });

    it('should parse images with titles', () => {
      const markdown = `![Alt text](image.jpg "Image title")`;

      const blocks = parseMarkdown(markdown);
      expect(blocks).toHaveLength(1);
      expect(blocks[0].type).toBe('image');
      
      const content = blocks[0].content as ImageContent;
      expect(content.alt).toBe('Alt text');
      expect(content.src).toBe('image.jpg');
      expect(content.title).toBe('Image title');
    });

    it('should parse images with empty alt text', () => {
      const markdown = `![](image.jpg)`;

      const blocks = parseMarkdown(markdown);
      expect(blocks).toHaveLength(1);
      expect(blocks[0].type).toBe('image');
      
      const content = blocks[0].content as ImageContent;
      expect(content.alt).toBe('');
      expect(content.src).toBe('image.jpg');
    });

    it('should parse images with various URL formats', () => {
      const testCases = [
        { src: 'image.jpg', desc: 'relative path' },
        { src: './assets/image.png', desc: 'relative path with directory' },
        { src: '/absolute/path/image.gif', desc: 'absolute path' },
        { src: 'https://example.com/image.jpg', desc: 'HTTP URL' },
        { src: 'https://cdn.example.com/images/photo.png', desc: 'CDN URL' },
        { src: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==', desc: 'data URL' },
      ];

      testCases.forEach(({ src, desc }) => {
        const markdown = `![Test image](${src})`;
        const blocks = parseMarkdown(markdown);
        
        expect(blocks).toHaveLength(1);
        expect(blocks[0].type).toBe('image');
        
        const content = blocks[0].content as ImageContent;
        expect(content.src).toBe(src);
        expect(content.alt).toBe('Test image');
      });
    });
  });

  describe('Serialization', () => {
    it('should serialize simple images correctly', () => {
      const markdown = `![Alt text](image.jpg)`;

      const blocks = parseMarkdown(markdown);
      const serialized = serializeBlocks(blocks);
      
      expect(serialized).toBe(markdown);
    });

    it('should serialize images with titles correctly', () => {
      const markdown = `![Alt text](image.jpg "Image title")`;

      const blocks = parseMarkdown(markdown);
      const serialized = serializeBlocks(blocks);
      
      expect(serialized).toBe(markdown);
    });

    it('should serialize images with empty alt text correctly', () => {
      const markdown = `![](image.jpg)`;

      const blocks = parseMarkdown(markdown);
      const serialized = serializeBlocks(blocks);
      
      expect(serialized).toBe(markdown);
    });

    it('should handle special characters in alt text and URLs', () => {
      const markdown = `![Alt with spaces & symbols!](path/with%20spaces/image.jpg "Title with quotes")`;

      const blocks = parseMarkdown(markdown);
      const serialized = serializeBlocks(blocks);
      
      expect(serialized).toContain('Alt with spaces & symbols!');
      expect(serialized).toContain('path/with%20spaces/image.jpg');
      expect(serialized).toContain('Title with quotes');
    });
  });

  describe('Round-trip fidelity', () => {
    it('should maintain image structure through round trips', () => {
      const original = `![Screenshot of the application](./assets/screenshots/app-main.png "Main application interface")`;

      let current = original;
      
      // 3 round trips
      for (let i = 0; i < 3; i++) {
        const blocks = parseMarkdown(current);
        current = serializeBlocks(blocks);
      }

      const finalBlocks = parseMarkdown(current);
      expect(finalBlocks).toHaveLength(1);
      expect(finalBlocks[0].type).toBe('image');
      
      const content = finalBlocks[0].content as ImageContent;
      expect(content.alt).toBe('Screenshot of the application');
      expect(content.src).toBe('./assets/screenshots/app-main.png');
      expect(content.title).toBe('Main application interface');
    });
  });

  describe('Mixed content scenarios', () => {
    it('should handle images mixed with other content', () => {
      const markdown = `# Gallery

Here are some photos:

![Photo 1](photo1.jpg)

![Photo 2](photo2.jpg "Second photo")

That's all the photos.`;

      const blocks = parseMarkdown(markdown);
      expect(blocks).toHaveLength(5);
      
      expect(blocks[0].type).toBe('heading');
      expect(blocks[1].type).toBe('paragraph');
      expect(blocks[2].type).toBe('image');
      expect(blocks[3].type).toBe('image');
      expect(blocks[4].type).toBe('paragraph');
      
      const image1Content = blocks[2].content as ImageContent;
      expect(image1Content.src).toBe('photo1.jpg');
      expect(image1Content.alt).toBe('Photo 1');
      
      const image2Content = blocks[3].content as ImageContent;
      expect(image2Content.src).toBe('photo2.jpg');
      expect(image2Content.title).toBe('Second photo');
    });
  });

  describe('Edge cases', () => {
    it('should handle images with complex URLs', () => {
      const markdown = `![Complex URL](https://api.example.com/images/generate?id=123&size=large&format=png&timestamp=2023-01-01T12:00:00Z)`;

      const blocks = parseMarkdown(markdown);
      expect(blocks).toHaveLength(1);
      expect(blocks[0].type).toBe('image');
      
      const content = blocks[0].content as ImageContent;
      expect(content.src).toContain('api.example.com');
      expect(content.src).toContain('id=123');
      expect(content.src).toContain('format=png');
    });

    it('should handle images with parentheses in URLs', () => {
      const markdown = `![Wikipedia image](https://en.wikipedia.org/wiki/File:Example_(disambiguation).jpg)`;

      const blocks = parseMarkdown(markdown);
      expect(blocks).toHaveLength(1);
      expect(blocks[0].type).toBe('image');
      
      const content = blocks[0].content as ImageContent;
      expect(content.src).toContain('wikipedia.org');
      expect(content.src).toContain('disambiguation');
    });

    it('should handle images with Unicode characters', () => {
      const markdown = `![图片描述](./图片/示例.jpg "图片标题")`;

      const blocks = parseMarkdown(markdown);
      expect(blocks).toHaveLength(1);
      expect(blocks[0].type).toBe('image');
      
      const content = blocks[0].content as ImageContent;
      expect(content.alt).toBe('图片描述');
      expect(content.src).toBe('./图片/示例.jpg');
      expect(content.title).toBe('图片标题');
    });

    it('should handle images with markdown-like characters in alt text', () => {
      const markdown = `![Image with *asterisks* and **bold** and [brackets]](image.jpg)`;

      const blocks = parseMarkdown(markdown);
      expect(blocks).toHaveLength(1);
      expect(blocks[0].type).toBe('image');
      
      const content = blocks[0].content as ImageContent;
      // The alt text should preserve the essential words (remark may process some formatting)
      expect(content.alt).toContain('asterisks');
      expect(content.alt).toContain('bold');
      expect(content.alt).toContain('brackets');
    });

    it('should handle images with long data URLs', () => {
      const dataUrl = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSI0MCIgZmlsbD0iYmx1ZSIgLz4KPC9zdmc+';
      const markdown = `![SVG Circle](${dataUrl})`;

      const blocks = parseMarkdown(markdown);
      expect(blocks).toHaveLength(1);
      expect(blocks[0].type).toBe('image');
      
      const content = blocks[0].content as ImageContent;
      expect(content.src).toBe(dataUrl);
      expect(content.alt).toBe('SVG Circle');
    });
  });
});