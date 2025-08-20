/**
 * Tests specific to table block functionality
 */

import { describe, it, expect } from 'vitest';
import { parseMarkdown, serializeBlocks } from '../../src/index';
import type { TableContent } from '../../src/types';

describe('Table Blocks', () => {
  describe('Parsing', () => {
    it('should parse simple tables', () => {
      const markdown = `| Name | Age | City |
| --- | --- | --- |
| Alice | 30 | New York |
| Bob | 25 | London |`;

      const blocks = parseMarkdown(markdown);
      expect(blocks).toHaveLength(1);
      expect(blocks[0].type).toBe('table');
      
      const content = blocks[0].content as TableContent;
      expect(content.headers).toHaveLength(3);
      expect(content.headers[0].text).toBe('Name');
      expect(content.headers[1].text).toBe('Age');
      expect(content.headers[2].text).toBe('City');
      
      expect(content.rows).toHaveLength(2);
      expect(content.rows[0]).toHaveLength(3);
      expect(content.rows[0][0].text).toBe('Alice');
      expect(content.rows[0][1].text).toBe('30');
      expect(content.rows[0][2].text).toBe('New York');
    });

    it('should parse tables with alignments', () => {
      const markdown = `| Left | Center | Right |
| :--- | :---: | ---: |
| L1 | C1 | R1 |
| L2 | C2 | R2 |`;

      const blocks = parseMarkdown(markdown);
      expect(blocks).toHaveLength(1);
      expect(blocks[0].type).toBe('table');
      
      const content = blocks[0].content as TableContent;
      expect(content.alignments).toEqual(['left', 'center', 'right']);
    });

    it('should handle tables with mixed alignments', () => {
      const markdown = `| Col1 | Col2 | Col3 | Col4 |
| :--- | --- | :---: | ---: |
| Left | None | Center | Right |`;

      const blocks = parseMarkdown(markdown);
      expect(blocks).toHaveLength(1);
      expect(blocks[0].type).toBe('table');
      
      const content = blocks[0].content as TableContent;
      expect(content.alignments).toEqual(['left', null, 'center', 'right']);
    });

    it('should handle empty table cells', () => {
      const markdown = `| Name | Age | City |
| --- | --- | --- |
| Alice |  | New York |
|  | 25 |  |`;

      const blocks = parseMarkdown(markdown);
      expect(blocks).toHaveLength(1);
      expect(blocks[0].type).toBe('table');
      
      const content = blocks[0].content as TableContent;
      expect(content.rows[0][1].text).toBe('');
      expect(content.rows[1][0].text).toBe('');
      expect(content.rows[1][2].text).toBe('');
    });
  });

  describe('Serialization', () => {
    it('should serialize simple tables correctly', () => {
      const markdown = `| Name | Age | City |
| --- | --- | --- |
| Alice | 30 | New York |
| Bob | 25 | London |`;

      const blocks = parseMarkdown(markdown);
      const serialized = serializeBlocks(blocks);
      
      expect(serialized).toContain('| Name | Age | City |');
      expect(serialized).toContain('| Alice | 30 | New York |');
      expect(serialized).toContain('| Bob | 25 | London |');
    });

    it('should serialize tables with alignments correctly', () => {
      const markdown = `| Left | Center | Right |
| :--- | :---: | ---: |
| L1 | C1 | R1 |`;

      const blocks = parseMarkdown(markdown);
      const serialized = serializeBlocks(blocks);
      
      expect(serialized).toContain('| :--- | :---: | ---: |');
      expect(serialized).toContain('| Left | Center | Right |');
      expect(serialized).toContain('| L1 | C1 | R1 |');
    });

    it('should handle single column tables', () => {
      const markdown = `| Single |
| --- |
| Row1 |
| Row2 |`;

      const blocks = parseMarkdown(markdown);
      const serialized = serializeBlocks(blocks);
      
      expect(serialized).toContain('| Single |');
      expect(serialized).toContain('| Row1 |');
      expect(serialized).toContain('| Row2 |');
    });
  });

  describe('Round-trip fidelity', () => {
    it('should maintain table structure through round trips', () => {
      const original = `| Product | Price | Stock |
| :--- | ---: | :---: |
| Apple | $1.50 | 100 |
| Banana | $0.75 | 50 |
| Orange | $2.00 | 25 |`;

      let current = original;
      
      // 3 round trips
      for (let i = 0; i < 3; i++) {
        const blocks = parseMarkdown(current);
        current = serializeBlocks(blocks);
      }

      const finalBlocks = parseMarkdown(current);
      expect(finalBlocks).toHaveLength(1);
      expect(finalBlocks[0].type).toBe('table');
      
      const content = finalBlocks[0].content as TableContent;
      expect(content.headers).toHaveLength(3);
      expect(content.rows).toHaveLength(3);
      expect(content.alignments).toEqual(['left', 'right', 'center']);
      
      // Check specific values
      expect(content.headers[0].text).toBe('Product');
      expect(content.rows[0][0].text).toBe('Apple');
      expect(content.rows[0][1].text).toBe('$1.50');
    });
  });

  describe('Mixed content scenarios', () => {
    it('should handle tables mixed with other content', () => {
      const markdown = `# Data Table

Here's the data:

| ID | Name | Value |
| --- | --- | --- |
| 1 | Item A | 100 |
| 2 | Item B | 200 |

End of table.`;

      const blocks = parseMarkdown(markdown);
      expect(blocks).toHaveLength(4);
      
      expect(blocks[0].type).toBe('heading');
      expect(blocks[1].type).toBe('paragraph');
      expect(blocks[2].type).toBe('table');
      expect(blocks[3].type).toBe('paragraph');
      
      const tableContent = blocks[2].content as TableContent;
      expect(tableContent.headers).toHaveLength(3);
      expect(tableContent.rows).toHaveLength(2);
    });
  });

  describe('Edge cases', () => {
    it('should handle tables with special characters', () => {
      const markdown = `| Symbol | Name | Code |
| --- | --- | --- |
| & | Ampersand | &amp; |
| < | Less than | &lt; |
| > | Greater than | &gt; |`;

      const blocks = parseMarkdown(markdown);
      expect(blocks).toHaveLength(1);
      expect(blocks[0].type).toBe('table');
      
      const content = blocks[0].content as TableContent;
      expect(content.rows[0][0].text).toBe('&');
      expect(content.rows[0][1].text).toBe('Ampersand');
    });

    it('should handle tables with formatting inside cells', () => {
      const markdown = `| Name | Description |
| --- | --- |
| **Bold** | This is *italic* text |
| \`Code\` | [Link](http://example.com) |`;

      const blocks = parseMarkdown(markdown);
      expect(blocks).toHaveLength(1);
      expect(blocks[0].type).toBe('table');
      
      const content = blocks[0].content as TableContent;
      // Note: In Phase 2, remark processes the formatting so the raw syntax may not be preserved
      expect(content.rows[0][0].text).toContain('Bold');
      expect(content.rows[0][1].text).toContain('italic');
      expect(content.rows[1][0].text).toContain('Code');
    });

    it('should handle malformed tables gracefully', () => {
      const markdown = `| Incomplete table
| --- |
| Missing cells |`;

      const blocks = parseMarkdown(markdown);
      // Should still parse what it can
      expect(blocks).toHaveLength(1);
      
      // The exact behavior depends on remark-gfm parsing
      // At minimum, it should not crash
    });

    it('should handle tables with pipe characters in content', () => {
      const markdown = `| Command | Description |
| --- | --- |
| grep "text\\|other" | Search for text OR other |
| awk '{print $1\\|$2}' | Print columns separated by pipe |`;

      const blocks = parseMarkdown(markdown);
      expect(blocks).toHaveLength(1);
      expect(blocks[0].type).toBe('table');
      
      const content = blocks[0].content as TableContent;
      expect(content.rows).toHaveLength(2);
      // The exact handling of escaped pipes depends on the parser
    });
  });
});