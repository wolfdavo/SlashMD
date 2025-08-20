/**
 * Edge case testing for malformed and problematic content
 * Phase 4: Testing, Performance & Production Readiness
 */

import { describe, it, expect } from 'vitest';
import { parseMarkdown, serializeBlocks } from '../../src';

describe('Edge Cases - Malformed Content', () => {
  
  describe('Empty and Whitespace-only Content', () => {
    it('should handle empty strings', () => {
      expect(() => parseMarkdown('')).not.toThrow();
      const blocks = parseMarkdown('');
      expect(blocks).toEqual([]);
    });

    it('should handle whitespace-only strings', () => {
      const whitespaceVariants = [
        '   ',
        '\n\n\n',
        '\t\t\t',
        ' \n \t \n ',
        '\r\n\r\n',
      ];

      whitespaceVariants.forEach(content => {
        expect(() => parseMarkdown(content)).not.toThrow();
        const blocks = parseMarkdown(content);
        expect(Array.isArray(blocks)).toBe(true);
      });
    });

    it('should serialize empty block arrays', () => {
      expect(() => serializeBlocks([])).not.toThrow();
      expect(serializeBlocks([])).toBe('');
    });
  });

  describe('Malformed Headings', () => {
    it('should handle headings without space after hash', () => {
      const malformedHeadings = [
        '#NoSpace',
        '##AlsoNoSpace',
        '###StillNoSpace',
      ];

      malformedHeadings.forEach(heading => {
        expect(() => parseMarkdown(heading)).not.toThrow();
        const blocks = parseMarkdown(heading);
        expect(blocks.length).toBeGreaterThanOrEqual(1);
      });
    });

    it('should handle headings with excessive hashes', () => {
      const excessiveHeadings = [
        '#### Too deep (level 4)',
        '##### Way too deep (level 5)',
        '###### Extremely deep (level 6)',
        '####### Beyond markdown spec',
      ];

      excessiveHeadings.forEach(heading => {
        expect(() => parseMarkdown(heading)).not.toThrow();
        const blocks = parseMarkdown(heading);
        // Should either parse as heading or paragraph
        expect(blocks.length).toBeGreaterThan(0);
      });
    });

    it('should handle mixed heading formats', () => {
      const mixedHeadings = `
# Valid heading
##Invalid no space
### Valid heading with space
####Another invalid
## Valid heading
`;

      expect(() => parseMarkdown(mixedHeadings)).not.toThrow();
      const blocks = parseMarkdown(mixedHeadings);
      expect(blocks.length).toBeGreaterThan(3);
    });
  });

  describe('Malformed Lists', () => {
    it('should handle inconsistent list markers', () => {
      const inconsistentList = `
- First item (dash)
* Second item (asterisk) 
+ Third item (plus)
- Fourth item (dash again)
`;

      expect(() => parseMarkdown(inconsistentList)).not.toThrow();
      const blocks = parseMarkdown(inconsistentList);
      expect(blocks.length).toBeGreaterThan(0);
    });

    it('should handle malformed task lists', () => {
      const malformedTasks = `
- [x] Valid completed task
- [ ] Valid incomplete task
- [X] Capital X task
- [] Missing space
- [?] Invalid marker
- [x Missing closing bracket
`;

      expect(() => parseMarkdown(malformedTasks)).not.toThrow();
      const blocks = parseMarkdown(malformedTasks);
      expect(blocks.length).toBeGreaterThan(0);
    });

    it('should handle deeply nested lists with inconsistent indentation', () => {
      const irregularNesting = `
- Level 1
  - Level 2 (2 spaces)
    - Level 3 (4 spaces)
      - Level 4 (6 spaces)
        - Level 5 (8 spaces)
          - Level 6 (10 spaces)
- Back to level 1
   - Level 2 (3 spaces - irregular)
     - Level 3 (5 spaces - irregular)
`;

      expect(() => parseMarkdown(irregularNesting)).not.toThrow();
      const blocks = parseMarkdown(irregularNesting);
      expect(blocks.length).toBeGreaterThan(0);
    });
  });

  describe('Malformed Code Blocks', () => {
    it('should handle unclosed code blocks', () => {
      const unclosedCode = `
\`\`\`javascript
function unclosed() {
  console.log("This code block is never closed");
  return true;

Some text after unclosed code block
`;

      expect(() => parseMarkdown(unclosedCode)).not.toThrow();
      const blocks = parseMarkdown(unclosedCode);
      expect(blocks.length).toBeGreaterThan(0);
    });

    it('should handle code blocks with mismatched fence lengths', () => {
      const mismatchedFences = `
\`\`\`javascript
console.log("3 backticks to open");
\`\`\`\`
// 4 backticks to close - mismatched

\`\`\`\`python
print("4 backticks to open")
\`\`\`
# 3 backticks to close - also mismatched
`;

      expect(() => parseMarkdown(mismatchedFences)).not.toThrow();
      const blocks = parseMarkdown(mismatchedFences);
      expect(blocks.length).toBeGreaterThan(0);
    });

    it('should handle inline code with various quote combinations', () => {
      const weirdInlineCode = `
This has \`single backtick code\`
This has \`\`double backtick code\`\`
This has \`\`\`triple backtick code\`\`\`
This has unmatched \` backtick
This has unmatched \`\` double backticks
`;

      expect(() => parseMarkdown(weirdInlineCode)).not.toThrow();
      const blocks = parseMarkdown(weirdInlineCode);
      expect(blocks.length).toBeGreaterThan(0);
    });
  });

  describe('Malformed Tables', () => {
    it('should handle tables with inconsistent column counts', () => {
      const inconsistentTable = `
| Header 1 | Header 2 | Header 3 |
|----------|----------|----------|
| Cell 1 | Cell 2 |
| Cell 1 | Cell 2 | Cell 3 | Cell 4 |
| Cell 1 |
|
`;

      expect(() => parseMarkdown(inconsistentTable)).not.toThrow();
      const blocks = parseMarkdown(inconsistentTable);
      expect(blocks.length).toBeGreaterThan(0);
    });

    it('should handle tables with malformed separators', () => {
      const malformedSeparators = `
| Header 1 | Header 2 |
|----------|
| Cell 1 | Cell 2 |

| Header 1 | Header 2 |
| -------- | -------- |
| Cell 1 | Cell 2 |

| Header 1 | Header 2 |
|   :---   |   ---:   |
| Cell 1 | Cell 2 |
`;

      expect(() => parseMarkdown(malformedSeparators)).not.toThrow();
      const blocks = parseMarkdown(malformedSeparators);
      expect(blocks.length).toBeGreaterThan(0);
    });
  });

  describe('Malformed Links and Images', () => {
    it('should handle malformed link syntax', () => {
      const malformedLinks = `
[Valid link](https://example.com)
[Link without closing parenthesis](https://example.com
[Link without URL]()
[Link with spaces in URL]( https://example.com )
Link without brackets](https://example.com)
[Link without opening bracket(https://example.com)
`;

      expect(() => parseMarkdown(malformedLinks)).not.toThrow();
      const blocks = parseMarkdown(malformedLinks);
      expect(blocks.length).toBeGreaterThan(0);
    });

    it('should handle malformed image syntax', () => {
      const malformedImages = `
![Valid image](image.jpg)
![Image without closing](image.jpg
![Image without URL]()
Image without opening bracket](image.jpg)
![Image without closing bracket(image.jpg)
![](empty-alt-but-valid.jpg)
`;

      expect(() => parseMarkdown(malformedImages)).not.toThrow();
      const blocks = parseMarkdown(malformedImages);
      expect(blocks.length).toBeGreaterThan(0);
    });
  });

  describe('Malformed Quotes and Callouts', () => {
    it('should handle quotes with inconsistent markers', () => {
      const inconsistentQuotes = `
> Normal quote line 1
  > Indented quote line 2
>> Double marker line 3
> > Space between markers line 4
Normal text that looks > like quote but isn't
> Back to normal quote
`;

      expect(() => parseMarkdown(inconsistentQuotes)).not.toThrow();
      const blocks = parseMarkdown(inconsistentQuotes);
      expect(blocks.length).toBeGreaterThan(0);
    });

    it('should handle malformed callouts', () => {
      const malformedCallouts = `
> [!NOTE]
> Valid callout

> [!INVALID]
> Invalid callout type

> [!NOTE
> Missing closing bracket

> !NOTE]
> Missing opening bracket

> [NOTE]
> Missing exclamation mark

> 💡 emoji callout without colon
> 📝 Note: emoji callout with colon
`;

      expect(() => parseMarkdown(malformedCallouts)).not.toThrow();
      const blocks = parseMarkdown(malformedCallouts);
      expect(blocks.length).toBeGreaterThan(0);
    });
  });

  describe('Malformed Toggles/Details', () => {
    it('should handle malformed HTML details elements', () => {
      const malformedToggles = `
<details>
<summary>Valid toggle</summary>
Content here
</details>

<details>
<summary>Unclosed toggle</summary>
Content here

<details
<summary>Malformed opening tag</summary>
Content
</details>

<details>
summary>Missing opening bracket</summary>
Content
</details>

<details>
<summaryMissing space>Content</summary>
Content
</details>
`;

      expect(() => parseMarkdown(malformedToggles)).not.toThrow();
      const blocks = parseMarkdown(malformedToggles);
      expect(blocks.length).toBeGreaterThan(0);
    });
  });

  describe('Mixed Malformed Content', () => {
    it('should handle document with multiple types of malformed content', () => {
      const messyDocument = `
#MalformedHeading
##Another one

- [ ] Valid task
- [x Malformed task
- [] Another malformed

> Valid quote
>> Nested quote
> [!INVALID] callout

\`\`\`javascript
function unclosed() {
  console.log("never closed");

| Header 1 | Header 2 |
|----------|
| Cell 1 | Cell 2 | Too many cells |

[Malformed link](
![Malformed image](

<details>
<summary>Unclosed toggle</summary>
Content without closing
`;

      expect(() => parseMarkdown(messyDocument)).not.toThrow();
      const blocks = parseMarkdown(messyDocument);
      expect(blocks.length).toBeGreaterThan(5);
      
      // Should be able to serialize despite malformed input
      expect(() => serializeBlocks(blocks)).not.toThrow();
      const serialized = serializeBlocks(blocks);
      expect(serialized.length).toBeGreaterThan(0);
    });

    it('should maintain round-trip stability even with malformed input', () => {
      const problematicContent = `
# Heading with trailing spaces   

- [ ] Task with **unclosed bold

> Quote with *unclosed italic

\`\`\`
Unclosed code block content

| Table | With |
|-------|------|
| Missing | 

[Link with spaces]( https://example.com )
`;

      const blocks = parseMarkdown(problematicContent);
      const serialized = serializeBlocks(blocks);
      const reparsed = parseMarkdown(serialized);
      
      // Should maintain structure stability
      expect(reparsed.length).toBe(blocks.length);
      
      // Should be able to serialize again
      const reserialized = serializeBlocks(reparsed);
      expect(reserialized.length).toBeGreaterThan(0);
    });
  });

  describe('Unicode and Special Characters', () => {
    it('should handle various Unicode content', () => {
      const unicodeContent = `
# Héading with áccénts

- 🎯 Task with emoji
- [ ] Task with unicode: ñ, ü, ß, 中文, 日本語

> Blockquote with special chars: ™, ©, ®, €, £

\`\`\`
Code with unicode: "smart quotes", em—dash, ellipsis…
\`\`\`

| Unicode | Content |
|---------|---------|
| 中文 | Chinese |
| 한글 | Korean |
| العربية | Arabic |
`;

      expect(() => parseMarkdown(unicodeContent)).not.toThrow();
      const blocks = parseMarkdown(unicodeContent);
      expect(blocks.length).toBeGreaterThan(3);

      // Should preserve Unicode in round-trip
      const serialized = serializeBlocks(blocks);
      expect(serialized).toContain('中文');
      expect(serialized).toContain('🎯');
    });

    it('should handle zero-width and control characters', () => {
      const weirdChars = `
# Heading\u200B\u200C\u200D

- List item with\u00A0non-breaking space
- Item with\ttab\tcharacters
- Item with\rcarriage\rreturn

> Quote with\u2028line separator
`;

      expect(() => parseMarkdown(weirdChars)).not.toThrow();
      const blocks = parseMarkdown(weirdChars);
      expect(blocks.length).toBeGreaterThan(0);
    });
  });

  describe('Extreme Nesting', () => {
    it('should handle extremely deep list nesting', () => {
      let deepList = '';
      const maxDepth = 20; // Very deep nesting
      
      for (let i = 0; i < maxDepth; i++) {
        const indent = '  '.repeat(i);
        deepList += `${indent}- Level ${i + 1} item\n`;
      }

      expect(() => parseMarkdown(deepList)).not.toThrow();
      const blocks = parseMarkdown(deepList);
      expect(blocks.length).toBeGreaterThan(0);
    });

    it('should handle nested quotes and callouts', () => {
      const nestedContent = `
> Level 1 quote
> > Level 2 quote
> > > Level 3 quote
> > > > Level 4 quote
> > > > > Level 5 quote
> > > > > > [!NOTE]
> > > > > > Deeply nested callout
> > > > > > with multiple lines
> > > > > > > Even deeper quote
`;

      expect(() => parseMarkdown(nestedContent)).not.toThrow();
      const blocks = parseMarkdown(nestedContent);
      expect(blocks.length).toBeGreaterThan(0);
    });
  });
});