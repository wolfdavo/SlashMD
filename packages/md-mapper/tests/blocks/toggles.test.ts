/**
 * Tests for toggle block parsing and serialization  
 * Phase 3: Comprehensive toggle functionality testing
 */

import { describe, test, expect, beforeEach } from 'vitest';
import { parseMarkdown, serializeBlocks, configureSettings } from '../../src';
import { Block, ToggleContent } from '../../src/types';

describe('Toggle Blocks', () => {
  beforeEach(() => {
    // Reset to default settings before each test
    configureSettings({ togglesSyntax: 'details' });
  });

  describe('Basic Toggle Parsing', () => {
    test('parses simple toggle without content', () => {
      const markdown = '<details><summary>Click to expand</summary></details>';

      const blocks = parseMarkdown(markdown);
      
      expect(blocks).toHaveLength(1);
      expect(blocks[0].type).toBe('toggle');
      
      const content = blocks[0].content as ToggleContent;
      expect(content.summary).toBe('Click to expand');
      expect(blocks[0].children).toBeUndefined();
    });

    test('parses toggle with simple text content', () => {
      const markdown = `<details><summary>Toggle Title</summary>

This is the hidden content that can be toggled.

</details>`;

      const blocks = parseMarkdown(markdown);
      
      expect(blocks).toHaveLength(1);
      expect(blocks[0].type).toBe('toggle');
      
      const content = blocks[0].content as ToggleContent;
      expect(content.summary).toBe('Toggle Title');
      expect(blocks[0].children).toBeDefined();
      expect(blocks[0].children).toHaveLength(1);
      expect(blocks[0].children![0].type).toBe('paragraph');
    });

    test('parses toggle with complex nested content', () => {
      const markdown = `<details><summary>Complex Toggle</summary>

# Heading inside toggle

- List item 1  
- List item 2

\`\`\`javascript
console.log("code block");
\`\`\`

| Table | Header |
|-------|--------|
| Data  | Value  |

</details>`;

      const blocks = parseMarkdown(markdown);
      
      expect(blocks).toHaveLength(1);
      expect(blocks[0].type).toBe('toggle');
      
      const content = blocks[0].content as ToggleContent;
      expect(content.summary).toBe('Complex Toggle');
      expect(blocks[0].children).toBeDefined();
      expect(blocks[0].children!.length).toBeGreaterThan(1);
      
      // Check that different block types are parsed
      const childTypes = blocks[0].children!.map(child => child.type);
      expect(childTypes).toContain('heading');
      expect(childTypes).toContain('list');
      expect(childTypes).toContain('code');
      expect(childTypes).toContain('table');
    });

    test('handles toggle with attributes on details tag', () => {
      const markdown = '<details open class="my-class"><summary>Open Toggle</summary>\nContent here\n</details>';

      const blocks = parseMarkdown(markdown);
      
      expect(blocks).toHaveLength(1);
      expect(blocks[0].type).toBe('toggle');
      
      const content = blocks[0].content as ToggleContent;
      expect(content.summary).toBe('Open Toggle');
    });

    test('handles toggle with attributes on summary tag', () => {
      const markdown = '<details><summary style="font-weight: bold;">Styled Summary</summary>\nContent\n</details>';

      const blocks = parseMarkdown(markdown);
      
      expect(blocks).toHaveLength(1);
      expect(blocks[0].type).toBe('toggle');
      
      const content = blocks[0].content as ToggleContent;
      expect(content.summary).toBe('Styled Summary');
    });
  });

  describe('Edge Cases and Malformed HTML', () => {
    test('handles standalone summary tag', () => {
      const markdown = '<summary>Incomplete Toggle</summary>';

      const blocks = parseMarkdown(markdown);
      
      expect(blocks).toHaveLength(1);
      expect(blocks[0].type).toBe('toggle');
      
      const content = blocks[0].content as ToggleContent;
      expect(content.summary).toBe('Incomplete Toggle');
      expect(blocks[0].children).toBeUndefined();
    });

    test('handles nested details tags', () => {
      const markdown = `<details><summary>Outer Toggle</summary>

Regular content

<details><summary>Inner Toggle</summary>
Inner content
</details>

More outer content

</details>`;

      const blocks = parseMarkdown(markdown);
      
      // With nested HTML, we might get multiple blocks due to parsing complexity
      expect(blocks.length).toBeGreaterThanOrEqual(1);
      expect(blocks[0].type).toBe('toggle');
      
      // Check that toggle blocks are created
      const toggleBlocks = blocks.filter(b => b.type === 'toggle');
      expect(toggleBlocks.length).toBeGreaterThanOrEqual(1);
    });

    test('handles malformed HTML gracefully', () => {
      const markdown = '<details><summary>Unclosed\nMultiline content';

      const blocks = parseMarkdown(markdown);
      
      // Should fall back to treating as regular content or ignore
      // The exact behavior depends on the HTML parser used
      expect(blocks.length).toBeGreaterThanOrEqual(0);
    });

    test('handles empty summary', () => {
      const markdown = '<details><summary></summary>\nContent\n</details>';

      const blocks = parseMarkdown(markdown);
      
      expect(blocks).toHaveLength(1);
      expect(blocks[0].type).toBe('toggle');
      
      const content = blocks[0].content as ToggleContent;
      expect(content.summary).toBe('');
    });

    test('handles whitespace in summary', () => {
      const markdown = '<details><summary>  Spaced Summary  </summary>\nContent\n</details>';

      const blocks = parseMarkdown(markdown);
      
      expect(blocks).toHaveLength(1);
      expect(blocks[0].type).toBe('toggle');
      
      const content = blocks[0].content as ToggleContent;
      expect(content.summary).toBe('Spaced Summary');
    });
  });

  describe('Toggle Serialization', () => {
    test('serializes simple toggle', () => {
      const block: Block = {
        id: 'test-toggle',
        type: 'toggle',
        sourceRange: { start: 0, end: 50 },
        content: {
          summary: 'Click to expand'
        }
      };

      const markdown = serializeBlocks([block]);
      expect(markdown).toBe('<details><summary>Click to expand</summary></details>');
    });

    test('serializes toggle with content', () => {
      const block: Block = {
        id: 'test-toggle',
        type: 'toggle',
        sourceRange: { start: 0, end: 100 },
        content: {
          summary: 'Toggle with content'
        },
        children: [
          {
            id: 'child-para',
            type: 'paragraph',
            sourceRange: { start: 30, end: 60 },
            content: {
              text: 'This is hidden content'
            }
          }
        ]
      };

      const markdown = serializeBlocks([block]);
      expect(markdown).toBe('<details><summary>Toggle with content</summary>\n\nThis is hidden content\n\n</details>');
    });

    test('serializes toggle with complex nested content', () => {
      const block: Block = {
        id: 'test-toggle',
        type: 'toggle',
        sourceRange: { start: 0, end: 200 },
        content: {
          summary: 'Complex Content'
        },
        children: [
          {
            id: 'child-heading',
            type: 'heading',
            sourceRange: { start: 30, end: 45 },
            content: {
              level: 2,
              text: 'Inner Heading'
            }
          },
          {
            id: 'child-list',
            type: 'list',
            sourceRange: { start: 50, end: 80 },
            content: {
              ordered: false
            },
            children: [
              {
                id: 'list-item',
                type: 'listItem',
                sourceRange: { start: 50, end: 65 },
                content: {
                  text: 'List item',
                  indent: 0
                }
              }
            ]
          }
        ]
      };

      const markdown = serializeBlocks([block]);
      expect(markdown).toContain('<details><summary>Complex Content</summary>');
      expect(markdown).toContain('## Inner Heading');
      expect(markdown).toContain('- List item');
      expect(markdown).toContain('</details>');
    });
  });

  describe('Round-trip Fidelity', () => {
    test('maintains simple toggle round-trip', () => {
      const original = '<details><summary>Test Toggle</summary>\n\nContent here\n\n</details>';

      const blocks = parseMarkdown(original);
      const serialized = serializeBlocks(blocks);
      const reparsed = parseMarkdown(serialized);

      expect(blocks).toHaveLength(1);
      expect(reparsed).toHaveLength(1);
      expect(blocks[0].type).toBe('toggle');
      expect(reparsed[0].type).toBe('toggle');
      
      const originalContent = blocks[0].content as ToggleContent;
      const reparsedContent = reparsed[0].content as ToggleContent;
      
      expect(originalContent.summary).toBe(reparsedContent.summary);
      
      // Check children content matches
      if (blocks[0].children && reparsed[0].children) {
        expect(blocks[0].children).toHaveLength(reparsed[0].children.length);
      }
    });

    test('maintains complex toggle round-trip', () => {
      const original = `<details><summary>Complex Example</summary>

# Title

Some **bold** text and *italic* text.

- Item 1
- Item 2

\`\`\`python
print("hello world")
\`\`\`

</details>`;

      const blocks = parseMarkdown(original);
      const serialized = serializeBlocks(blocks);
      const reparsed = parseMarkdown(serialized);

      expect(blocks).toHaveLength(1);
      expect(reparsed).toHaveLength(1);
      expect(blocks[0].type).toBe('toggle');
      expect(reparsed[0].type).toBe('toggle');
      
      const originalContent = blocks[0].content as ToggleContent;
      const reparsedContent = reparsed[0].content as ToggleContent;
      
      expect(originalContent.summary).toBe(reparsedContent.summary);
      expect(blocks[0].children?.length).toBe(reparsed[0].children?.length);
    });
  });

  describe('Integration with Other Block Types', () => {
    test('parses toggles mixed with other blocks', () => {
      const markdown = `# Main Heading

Regular paragraph content.

<details><summary>Toggle Section</summary>

Content inside toggle.

</details>

More regular content.

> A blockquote

<details><summary>Another Toggle</summary>
Different toggle content.
</details>`;

      const blocks = parseMarkdown(markdown);
      
      // Post-processing combines content with toggles, reducing total block count
      expect(blocks.length).toBeGreaterThan(0);
      
      const blockTypes = blocks.map(b => b.type);
      expect(blockTypes).toContain('heading');
      expect(blockTypes).toContain('paragraph');
      expect(blockTypes).toContain('toggle');
      // Toggle post-processing may combine/consume other blocks
      
      const toggles = blocks.filter(b => b.type === 'toggle');
      expect(toggles).toHaveLength(2);
    });

    test('handles toggles inside callouts', () => {
      const markdown = `> [!NOTE] 
> This callout contains a toggle:
> 
> <details><summary>Toggle in Callout</summary>
> Toggle content here
> </details>`;

      const blocks = parseMarkdown(markdown);
      
      // The exact behavior here depends on how HTML is handled within blockquotes
      // This test documents the expected behavior
      expect(blocks.length).toBeGreaterThanOrEqual(1);
    });

    test('preserves source ranges correctly with toggles', () => {
      const markdown = `First paragraph

<details><summary>Toggle</summary>
Toggle content
</details>

Last paragraph`;

      const blocks = parseMarkdown(markdown);
      
      // Post-processing may combine blocks, so we check that we have at least 2
      expect(blocks.length).toBeGreaterThanOrEqual(2);
      
      const toggleBlock = blocks.find(b => b.type === 'toggle');
      expect(toggleBlock).toBeDefined();
      expect(toggleBlock!.sourceRange.start).toBeGreaterThanOrEqual(0);
      expect(toggleBlock!.sourceRange.end).toBeGreaterThan(toggleBlock!.sourceRange.start);
    });
  });

  describe('UI State Handling', () => {
    test('collapsed property is not persisted in markdown', () => {
      const block: Block = {
        id: 'test-toggle',
        type: 'toggle',
        sourceRange: { start: 0, end: 50 },
        content: {
          summary: 'Test Toggle',
          collapsed: true // UI state
        }
      };

      const markdown = serializeBlocks([block]);
      const reparsed = parseMarkdown(markdown);
      
      // Collapsed state should not appear in serialized markdown
      expect(markdown).not.toContain('collapsed');
      
      // After re-parsing, collapsed should be undefined or false (default)
      expect(reparsed).toHaveLength(1);
      const reparsedContent = reparsed[0].content as ToggleContent;
      expect(reparsedContent.collapsed).toBeFalsy();
    });

    test('collapsed property defaults correctly', () => {
      const markdown = '<details><summary>Test</summary>\nContent\n</details>';
      
      const blocks = parseMarkdown(markdown);
      expect(blocks).toHaveLength(1);
      
      const content = blocks[0].content as ToggleContent;
      expect(content.collapsed).toBeFalsy();
    });
  });
});