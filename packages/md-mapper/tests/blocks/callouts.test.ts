/**
 * Tests for callout block parsing and serialization
 * Phase 3: Comprehensive callout functionality testing
 */

import { describe, test, expect, beforeEach } from 'vitest';
import { parseMarkdown, serializeBlocks, configureSettings, getSettings } from '../../src';
import { Block, CalloutContent } from '../../src/types';

describe('Callout Blocks', () => {
  beforeEach(() => {
    // Reset to default settings before each test
    configureSettings({ calloutsStyle: 'admonition' });
  });

  describe('Admonition Style Parsing', () => {
    test('parses basic NOTE callout', () => {
      const markdown = `> [!NOTE]
> This is a note callout`;

      const blocks = parseMarkdown(markdown);
      
      expect(blocks).toHaveLength(1);
      expect(blocks[0].type).toBe('callout');
      
      const content = blocks[0].content as CalloutContent;
      expect(content.type).toBe('note');
      expect(content.title).toBeUndefined();
      expect(content.text).toBe('This is a note callout');
    });

    test('parses callout with title', () => {
      const markdown = `> [!TIP] Custom Title
> This is a tip with a custom title`;

      const blocks = parseMarkdown(markdown);
      
      expect(blocks).toHaveLength(1);
      expect(blocks[0].type).toBe('callout');
      
      const content = blocks[0].content as CalloutContent;
      expect(content.type).toBe('tip');
      expect(content.title).toBe('Custom Title');
      expect(content.text).toBe('This is a tip with a custom title');
    });

    test('parses different callout types', () => {
      const markdown1 = `> [!WARNING]
> This is a warning`;
      const markdown2 = `> [!DANGER]  
> This is dangerous`;
      const markdown3 = `> [!INFO]
> This is info`;

      const blocks1 = parseMarkdown(markdown1);
      const blocks2 = parseMarkdown(markdown2);
      const blocks3 = parseMarkdown(markdown3);
      
      expect(blocks1).toHaveLength(1);
      expect(blocks1[0].type).toBe('callout');
      expect((blocks1[0].content as CalloutContent).type).toBe('warning');
      
      expect(blocks2).toHaveLength(1);
      expect(blocks2[0].type).toBe('callout');
      expect((blocks2[0].content as CalloutContent).type).toBe('danger');
      
      expect(blocks3).toHaveLength(1);
      expect(blocks3[0].type).toBe('callout');
      expect((blocks3[0].content as CalloutContent).type).toBe('info');
    });

    test('parses multiline callout content', () => {
      const markdown = `> [!NOTE] Multi-line
> First line of content
> Second line of content
> Third line with bold text`;

      const blocks = parseMarkdown(markdown);
      
      expect(blocks).toHaveLength(1);
      expect(blocks[0].type).toBe('callout');
      
      const content = blocks[0].content as CalloutContent;
      expect(content.type).toBe('note');
      expect(content.title).toBe('Multi-line');
      expect(content.text).toBe('First line of content\nSecond line of content\nThird line with bold text');
    });

    test('handles case insensitive callout types', () => {
      const markdown = `> [!note]
> lowercase note

> [!Warning]
> Mixed case warning`;

      const blocks = parseMarkdown(markdown);
      
      expect(blocks).toHaveLength(2);
      expect((blocks[0].content as CalloutContent).type).toBe('note');
      expect((blocks[1].content as CalloutContent).type).toBe('warning');
    });
  });

  describe('Emoji Style Parsing', () => {
    test('parses emoji callouts', () => {
      const markdowns = [
        '> 💡 Note:\n> This is an info callout',
        '> 📝 Tip:\n> This is a tip callout', 
        '> ⚠️ Warning:\n> This is a warning',
        '> ❌ Danger:\n> This is dangerous',
        '> ℹ️ Info:\n> This is informational'
      ];

      const expectedTypes: Array<CalloutContent['type']> = ['info', 'tip', 'warning', 'danger', 'note'];

      markdowns.forEach((markdown, index) => {
        const blocks = parseMarkdown(markdown);
        expect(blocks).toHaveLength(1);
        expect(blocks[0].type).toBe('callout');
        expect((blocks[0].content as CalloutContent).type).toBe(expectedTypes[index]);
      });
    });

    test('parses emoji callouts with custom titles', () => {
      const markdown = `> 💡 Note: Custom Title
> This is content with a custom title`;

      const blocks = parseMarkdown(markdown);
      
      expect(blocks).toHaveLength(1);
      expect(blocks[0].type).toBe('callout');
      
      const content = blocks[0].content as CalloutContent;
      expect(content.type).toBe('info');
      expect(content.title).toBe('Custom Title');
      expect(content.text).toBe('This is content with a custom title');
    });

    test('handles emoji callouts without colons', () => {
      const markdown = `> 💡 Note Something
> Content without colon`;

      const blocks = parseMarkdown(markdown);
      
      expect(blocks).toHaveLength(1);
      expect(blocks[0].type).toBe('callout');
      
      const content = blocks[0].content as CalloutContent;
      expect(content.type).toBe('info');
      expect(content.title).toBe('Something');
    });
  });

  describe('Regular Blockquote Fallback', () => {
    test('treats non-callout blockquotes as regular quotes', () => {
      const markdown = `> This is just a regular blockquote
> without any callout syntax`;

      const blocks = parseMarkdown(markdown);
      
      expect(blocks).toHaveLength(1);
      expect(blocks[0].type).toBe('quote');
      expect(blocks[0].content).toHaveProperty('text');
    });

    test('treats malformed callouts as regular quotes', () => {
      const markdown = `> [NOTE] Missing exclamation
> This should be a regular quote`;

      const blocks = parseMarkdown(markdown);
      
      expect(blocks).toHaveLength(1);
      expect(blocks[0].type).toBe('quote');
    });
  });

  describe('Admonition Style Serialization', () => {
    test('serializes basic callout in admonition style', () => {
      configureSettings({ calloutsStyle: 'admonition' });
      
      const block: Block = {
        id: 'test-callout',
        type: 'callout',
        sourceRange: { start: 0, end: 20 },
        content: {
          type: 'note',
          text: 'This is a note callout'
        }
      };

      const markdown = serializeBlocks([block]);
      expect(markdown).toBe('> [!NOTE]\n> This is a note callout');
    });

    test('serializes callout with title in admonition style', () => {
      configureSettings({ calloutsStyle: 'admonition' });
      
      const block: Block = {
        id: 'test-callout',
        type: 'callout',
        sourceRange: { start: 0, end: 30 },
        content: {
          type: 'tip',
          title: 'Custom Title',
          text: 'This is content'
        }
      };

      const markdown = serializeBlocks([block]);
      expect(markdown).toBe('> [!TIP] Custom Title\n> This is content');
    });

    test('serializes multiline callout content', () => {
      configureSettings({ calloutsStyle: 'admonition' });
      
      const block: Block = {
        id: 'test-callout',
        type: 'callout',
        sourceRange: { start: 0, end: 40 },
        content: {
          type: 'warning',
          text: 'First line\nSecond line\nThird line'
        }
      };

      const markdown = serializeBlocks([block]);
      expect(markdown).toBe('> [!WARNING]\n> First line\n> Second line\n> Third line');
    });
  });

  describe('Emoji Style Serialization', () => {
    test('serializes basic callout in emoji style', () => {
      configureSettings({ calloutsStyle: 'emoji' });
      
      const block: Block = {
        id: 'test-callout',
        type: 'callout',
        sourceRange: { start: 0, end: 20 },
        content: {
          type: 'note',
          text: 'This is a note callout'
        }
      };

      const markdown = serializeBlocks([block]);
      expect(markdown).toBe('> ℹ️ Note:\n> This is a note callout');
    });

    test('serializes callout with title in emoji style', () => {
      configureSettings({ calloutsStyle: 'emoji' });
      
      const block: Block = {
        id: 'test-callout',
        type: 'callout',
        sourceRange: { start: 0, end: 30 },
        content: {
          type: 'tip',
          title: 'Custom Title',
          text: 'This is content'
        }
      };

      const markdown = serializeBlocks([block]);
      expect(markdown).toBe('> 📝 Tip: Custom Title\n> This is content');
    });

    test('uses correct emojis for each type', () => {
      configureSettings({ calloutsStyle: 'emoji' });
      
      const calloutTypes: Array<CalloutContent['type']> = ['note', 'info', 'tip', 'warning', 'danger'];
      const expectedEmojis = ['ℹ️', '💡', '📝', '⚠️', '❌'];
      const expectedNames = ['Note', 'Info', 'Tip', 'Warning', 'Danger'];

      calloutTypes.forEach((type, index) => {
        const block: Block = {
          id: `test-${type}`,
          type: 'callout',
          sourceRange: { start: 0, end: 20 },
          content: {
            type,
            text: 'Content'
          }
        };

        const markdown = serializeBlocks([block]);
        expect(markdown).toBe(`> ${expectedEmojis[index]} ${expectedNames[index]}:\n> Content`);
      });
    });
  });

  describe('Round-trip Fidelity', () => {
    test('maintains admonition style round-trip', () => {
      configureSettings({ calloutsStyle: 'admonition' });
      
      const original = `> [!NOTE] Test Title
> This is test content
> with multiple lines`;

      const blocks = parseMarkdown(original);
      const serialized = serializeBlocks(blocks);
      const reparsed = parseMarkdown(serialized);

      expect(blocks).toHaveLength(1);
      expect(reparsed).toHaveLength(1);
      expect(blocks[0].type).toBe('callout');
      expect(reparsed[0].type).toBe('callout');
      
      const originalContent = blocks[0].content as CalloutContent;
      const reparsedContent = reparsed[0].content as CalloutContent;
      
      expect(originalContent.type).toBe(reparsedContent.type);
      expect(originalContent.title).toBe(reparsedContent.title);
      expect(originalContent.text).toBe(reparsedContent.text);
    });

    test('converts between styles based on settings', () => {
      // Parse in admonition style
      configureSettings({ calloutsStyle: 'admonition' });
      const admonitionMarkdown = '> [!TIP] Test\n> Content';
      const blocks = parseMarkdown(admonitionMarkdown);
      
      // Serialize in emoji style
      configureSettings({ calloutsStyle: 'emoji' });
      const emojiMarkdown = serializeBlocks(blocks);
      expect(emojiMarkdown).toBe('> 📝 Tip: Test\n> Content');
      
      // Parse emoji style
      const emojiBlocks = parseMarkdown('> 💡 Info:\n> Different content');
      
      // Serialize back in admonition style
      configureSettings({ calloutsStyle: 'admonition' });
      const backToAdmonition = serializeBlocks(emojiBlocks);
      expect(backToAdmonition).toBe('> [!INFO]\n> Different content');
    });
  });

  describe('Edge Cases', () => {
    test('handles empty callout content', () => {
      const markdown = '> [!NOTE]';
      const blocks = parseMarkdown(markdown);
      
      expect(blocks).toHaveLength(1);
      expect(blocks[0].type).toBe('callout');
      expect((blocks[0].content as CalloutContent).text).toBe('');
    });

    test('handles callout without space after type', () => {
      const markdown = '> [!NOTE]Title\n> Content';
      const blocks = parseMarkdown(markdown);
      
      expect(blocks).toHaveLength(1);
      expect(blocks[0].type).toBe('callout');
      expect((blocks[0].content as CalloutContent).title).toBe('Title');
    });

    test('preserves source ranges correctly', () => {
      const markdown = `First paragraph

> [!NOTE]
> Callout content

Last paragraph`;

      const blocks = parseMarkdown(markdown);
      
      expect(blocks).toHaveLength(3);
      expect(blocks[1].type).toBe('callout');
      expect(blocks[1].sourceRange.start).toBeGreaterThan(blocks[0].sourceRange.end);
      expect(blocks[1].sourceRange.end).toBeLessThan(blocks[2].sourceRange.start);
    });
  });
});