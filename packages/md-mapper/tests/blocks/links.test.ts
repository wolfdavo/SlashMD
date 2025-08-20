/**
 * Tests specific to link block functionality
 */

import { describe, it, expect } from 'vitest';
import { parseMarkdown, serializeBlocks } from '../../src/index';
import type { LinkContent } from '../../src/types';

describe('Link Blocks', () => {
  describe('Parsing', () => {
    it('should parse standalone links', () => {
      const markdown = `[Example Link](https://example.com)`;

      const blocks = parseMarkdown(markdown);
      expect(blocks).toHaveLength(1);
      expect(blocks[0].type).toBe('link');
      
      const content = blocks[0].content as LinkContent;
      expect(content.text).toBe('Example Link');
      expect(content.href).toBe('https://example.com');
      expect(content.title).toBeUndefined();
    });

    it('should parse links with titles', () => {
      const markdown = `[Example Link](https://example.com "Example title")`;

      const blocks = parseMarkdown(markdown);
      expect(blocks).toHaveLength(1);
      expect(blocks[0].type).toBe('link');
      
      const content = blocks[0].content as LinkContent;
      expect(content.text).toBe('Example Link');
      expect(content.href).toBe('https://example.com');
      expect(content.title).toBe('Example title');
    });

    it('should parse links with empty text', () => {
      const markdown = `[](https://example.com)`;

      const blocks = parseMarkdown(markdown);
      expect(blocks).toHaveLength(1);
      expect(blocks[0].type).toBe('link');
      
      const content = blocks[0].content as LinkContent;
      expect(content.text).toBe('');
      expect(content.href).toBe('https://example.com');
    });

    it('should treat inline links as paragraph content, not link blocks', () => {
      const markdown = `This paragraph contains a [link](https://example.com) within it.`;

      const blocks = parseMarkdown(markdown);
      expect(blocks).toHaveLength(1);
      expect(blocks[0].type).toBe('paragraph'); // Should be paragraph, not link
    });

    it('should parse various URL formats as standalone links', () => {
      const testCases = [
        { href: 'https://example.com', desc: 'HTTPS URL' },
        { href: 'http://example.com', desc: 'HTTP URL' },
        { href: 'mailto:user@example.com', desc: 'mailto URL' },
        { href: 'tel:+1234567890', desc: 'tel URL' },
        { href: 'ftp://files.example.com', desc: 'FTP URL' },
        { href: '#section', desc: 'hash fragment' },
        { href: './page.html', desc: 'relative path' },
        { href: '/absolute/path', desc: 'absolute path' },
      ];

      testCases.forEach(({ href, desc }) => {
        const markdown = `[${desc}](${href})`;
        const blocks = parseMarkdown(markdown);
        
        expect(blocks).toHaveLength(1);
        expect(blocks[0].type).toBe('link');
        
        const content = blocks[0].content as LinkContent;
        expect(content.href).toBe(href);
        expect(content.text).toBe(desc);
      });
    });
  });

  describe('Serialization', () => {
    it('should serialize simple links correctly', () => {
      const markdown = `[Example Link](https://example.com)`;

      const blocks = parseMarkdown(markdown);
      const serialized = serializeBlocks(blocks);
      
      expect(serialized).toBe(markdown);
    });

    it('should serialize links with titles correctly', () => {
      const markdown = `[Example Link](https://example.com "Example title")`;

      const blocks = parseMarkdown(markdown);
      const serialized = serializeBlocks(blocks);
      
      expect(serialized).toBe(markdown);
    });

    it('should serialize links with empty text correctly', () => {
      const markdown = `[](https://example.com)`;

      const blocks = parseMarkdown(markdown);
      const serialized = serializeBlocks(blocks);
      
      expect(serialized).toBe(markdown);
    });

    it('should handle special characters in link text and URLs', () => {
      const markdown = `[Link with spaces & symbols!](https://example.com/path?query=value&other=123 "Title with quotes")`;

      const blocks = parseMarkdown(markdown);
      const serialized = serializeBlocks(blocks);
      
      expect(serialized).toContain('Link with spaces & symbols!');
      expect(serialized).toContain('https://example.com/path?query=value&other=123');
      expect(serialized).toContain('Title with quotes');
    });
  });

  describe('Round-trip fidelity', () => {
    it('should maintain link structure through round trips', () => {
      const original = `[GitHub Repository](https://github.com/user/repo "Visit the repository")`;

      let current = original;
      
      // 3 round trips
      for (let i = 0; i < 3; i++) {
        const blocks = parseMarkdown(current);
        current = serializeBlocks(blocks);
      }

      const finalBlocks = parseMarkdown(current);
      expect(finalBlocks).toHaveLength(1);
      expect(finalBlocks[0].type).toBe('link');
      
      const content = finalBlocks[0].content as LinkContent;
      expect(content.text).toBe('GitHub Repository');
      expect(content.href).toBe('https://github.com/user/repo');
      expect(content.title).toBe('Visit the repository');
    });
  });

  describe('Mixed content scenarios', () => {
    it('should handle standalone links mixed with other content', () => {
      const markdown = `# Links

Here are some useful links:

[Google](https://google.com)

[GitHub](https://github.com "Code repository")

Visit these sites for more information.`;

      const blocks = parseMarkdown(markdown);
      expect(blocks).toHaveLength(5);
      
      expect(blocks[0].type).toBe('heading');
      expect(blocks[1].type).toBe('paragraph');
      expect(blocks[2].type).toBe('link');
      expect(blocks[3].type).toBe('link');
      expect(blocks[4].type).toBe('paragraph');
      
      const link1Content = blocks[2].content as LinkContent;
      expect(link1Content.text).toBe('Google');
      expect(link1Content.href).toBe('https://google.com');
      
      const link2Content = blocks[3].content as LinkContent;
      expect(link2Content.text).toBe('GitHub');
      expect(link2Content.title).toBe('Code repository');
    });

    it('should not treat inline links as link blocks', () => {
      const markdown = `Check out [this link](https://example.com) and [this other link](https://other.com) in this paragraph.`;

      const blocks = parseMarkdown(markdown);
      expect(blocks).toHaveLength(1);
      expect(blocks[0].type).toBe('paragraph');
      
      // The links should be preserved in the paragraph text
      // Note: In Phase 2, we don't extract inline formatting/links yet
      const paragraphText = (blocks[0].content as any).text;
      expect(paragraphText).toContain('this link');
      expect(paragraphText).toContain('this other link');
    });
  });

  describe('Edge cases', () => {
    it('should handle links with complex URLs', () => {
      const markdown = `[API Endpoint](https://api.example.com/v1/users?limit=50&sort=name&filter=active)`;

      const blocks = parseMarkdown(markdown);
      expect(blocks).toHaveLength(1);
      expect(blocks[0].type).toBe('link');
      
      const content = blocks[0].content as LinkContent;
      expect(content.href).toContain('api.example.com');
      expect(content.href).toContain('limit=50');
      expect(content.href).toContain('sort=name');
    });

    it('should handle links with parentheses in URLs', () => {
      const markdown = `[Wikipedia](https://en.wikipedia.org/wiki/Example_(disambiguation))`;

      const blocks = parseMarkdown(markdown);
      expect(blocks).toHaveLength(1);
      expect(blocks[0].type).toBe('link');
      
      const content = blocks[0].content as LinkContent;
      expect(content.href).toContain('wikipedia.org');
      expect(content.href).toContain('disambiguation');
    });

    it('should handle links with Unicode characters', () => {
      const markdown = `[中文链接](https://example.com/中文路径 "中文标题")`;

      const blocks = parseMarkdown(markdown);
      expect(blocks).toHaveLength(1);
      expect(blocks[0].type).toBe('link');
      
      const content = blocks[0].content as LinkContent;
      expect(content.text).toBe('中文链接');
      expect(content.href).toBe('https://example.com/中文路径');
      expect(content.title).toBe('中文标题');
    });

    it('should handle links with markdown-like characters in text', () => {
      const markdown = `[Link with *asterisks* and **bold** text](https://example.com)`;

      const blocks = parseMarkdown(markdown);
      expect(blocks).toHaveLength(1);
      expect(blocks[0].type).toBe('link');
      
      const content = blocks[0].content as LinkContent;
      // The link text should preserve the essential words
      expect(content.text).toContain('asterisks');
      expect(content.text).toContain('bold');
    });

    it('should handle links with encoded URLs', () => {
      const markdown = `[Encoded URL](https://example.com/search?q=hello%20world&type=exact)`;

      const blocks = parseMarkdown(markdown);
      expect(blocks).toHaveLength(1);
      expect(blocks[0].type).toBe('link');
      
      const content = blocks[0].content as LinkContent;
      expect(content.href).toContain('hello%20world');
      expect(content.href).toContain('type=exact');
    });

    it('should handle very long URLs', () => {
      const longUrl = 'https://example.com/very/long/path/with/many/segments/and/query/parameters?param1=value1&param2=value2&param3=value3&param4=value4&param5=value5&param6=value6';
      const markdown = `[Long URL](${longUrl})`;

      const blocks = parseMarkdown(markdown);
      expect(blocks).toHaveLength(1);
      expect(blocks[0].type).toBe('link');
      
      const content = blocks[0].content as LinkContent;
      expect(content.href).toBe(longUrl);
      expect(content.text).toBe('Long URL');
    });
  });
});