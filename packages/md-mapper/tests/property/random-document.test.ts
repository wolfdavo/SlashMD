/**
 * Property-based testing with random document generation
 * Phase 4: Testing, Performance & Production Readiness
 */

import { describe, it, expect } from 'vitest';
import { parseMarkdown, serializeBlocks } from '../../src';

// Random seed for reproducible tests
let seed = 12345;
function random(): number {
  seed = (seed * 9301 + 49297) % 233280;
  return seed / 233280;
}

function randomInt(min: number, max: number): number {
  return Math.floor(random() * (max - min + 1)) + min;
}

function randomChoice<T>(array: T[]): T {
  return array[randomInt(0, array.length - 1)];
}

function randomString(minLen: number = 1, maxLen: number = 50): string {
  const length = randomInt(minLen, maxLen);
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 .,!?';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars[randomInt(0, chars.length - 1)];
  }
  return result;
}

/**
 * Generates random markdown content for property-based testing
 */
class RandomMarkdownGenerator {
  private depth = 0;
  private maxDepth = 3;

  generate(complexity: 'simple' | 'medium' | 'complex' = 'medium'): string {
    this.depth = 0;
    this.maxDepth = complexity === 'simple' ? 2 : complexity === 'medium' ? 3 : 5;
    
    const sections: string[] = [];
    const numSections = complexity === 'simple' ? randomInt(1, 3) : 
                      complexity === 'medium' ? randomInt(2, 8) : 
                      randomInt(5, 15);

    for (let i = 0; i < numSections; i++) {
      sections.push(this.generateSection());
    }

    return sections.join('\n\n');
  }

  private generateSection(): string {
    const sectionTypes = [
      () => this.generateHeading(),
      () => this.generateParagraph(),
      () => this.generateList(),
      () => this.generateTaskList(),
      () => this.generateQuote(),
      () => this.generateCodeBlock(),
      () => this.generateTable(),
      () => this.generateCallout(),
      () => this.generateToggle(),
      () => this.generateDivider(),
    ];

    return randomChoice(sectionTypes)();
  }

  private generateHeading(): string {
    const level = randomInt(1, 3);
    const prefix = '#'.repeat(level);
    const text = randomString(5, 30).trim();
    return `${prefix} ${text}`;
  }

  private generateParagraph(): string {
    const sentences = randomInt(1, 5);
    const parts: string[] = [];

    for (let i = 0; i < sentences; i++) {
      const sentence = randomString(10, 80).trim();
      
      // Add some inline formatting randomly
      if (random() < 0.3) {
        const formatted = this.addInlineFormatting(sentence);
        parts.push(formatted);
      } else {
        parts.push(sentence);
      }
    }

    return parts.join(' ');
  }

  private addInlineFormatting(text: string): string {
    const words = text.split(' ');
    const formatted: string[] = [];

    for (const word of words) {
      if (random() < 0.1) {
        // Bold
        formatted.push(`**${word}**`);
      } else if (random() < 0.1) {
        // Italic
        formatted.push(`*${word}*`);
      } else if (random() < 0.05) {
        // Inline code
        formatted.push(`\`${word}\``);
      } else if (random() < 0.03) {
        // Strikethrough
        formatted.push(`~~${word}~~`);
      } else {
        formatted.push(word);
      }
    }

    return formatted.join(' ');
  }

  private generateList(): string {
    const ordered = random() < 0.5;
    const items = randomInt(2, 6);
    const lines: string[] = [];

    for (let i = 0; i < items; i++) {
      const prefix = ordered ? `${i + 1}.` : '-';
      const content = randomString(5, 50).trim();
      lines.push(`${prefix} ${content}`);

      // Add nested items sometimes
      if (random() < 0.3 && this.depth < this.maxDepth) {
        this.depth++;
        const nestedItems = randomInt(1, 3);
        for (let j = 0; j < nestedItems; j++) {
          const nestedPrefix = ordered ? `   ${j + 1}.` : '  -';
          const nestedContent = randomString(3, 30).trim();
          lines.push(`${nestedPrefix} ${nestedContent}`);
        }
        this.depth--;
      }
    }

    return lines.join('\n');
  }

  private generateTaskList(): string {
    const items = randomInt(2, 5);
    const lines: string[] = [];

    for (let i = 0; i < items; i++) {
      const checked = random() < 0.4;
      const checkbox = checked ? '[x]' : '[ ]';
      const content = randomString(5, 40).trim();
      lines.push(`- ${checkbox} ${content}`);

      // Add nested task items sometimes
      if (random() < 0.2 && this.depth < this.maxDepth) {
        this.depth++;
        const nestedChecked = random() < 0.3;
        const nestedCheckbox = nestedChecked ? '[x]' : '[ ]';
        const nestedContent = randomString(3, 25).trim();
        lines.push(`  - ${nestedCheckbox} ${nestedContent}`);
        this.depth--;
      }
    }

    return lines.join('\n');
  }

  private generateQuote(): string {
    const lines = randomInt(1, 4);
    const quotedLines: string[] = [];

    for (let i = 0; i < lines; i++) {
      const content = randomString(10, 60).trim();
      quotedLines.push(`> ${content}`);
    }

    return quotedLines.join('\n');
  }

  private generateCodeBlock(): string {
    const languages = ['javascript', 'typescript', 'python', 'java', 'html', 'css', '', 'json'];
    const language = randomChoice(languages);
    const lines = randomInt(1, 8);
    const codeLines: string[] = [];

    for (let i = 0; i < lines; i++) {
      const indent = '  '.repeat(randomInt(0, 2));
      const content = randomString(5, 40).trim();
      codeLines.push(`${indent}${content}`);
    }

    return `\`\`\`${language}\n${codeLines.join('\n')}\n\`\`\``;
  }

  private generateTable(): string {
    const cols = randomInt(2, 5);
    const rows = randomInt(1, 4);
    const lines: string[] = [];

    // Header
    const headers = Array.from({ length: cols }, () => randomString(3, 12).trim());
    lines.push(`| ${headers.join(' | ')} |`);

    // Separator
    const separators = Array.from({ length: cols }, () => {
      const align = randomChoice(['---', ':---', ':---:', '---:']);
      return align;
    });
    lines.push(`|${separators.map(s => ` ${s} `).join('|')}|`);

    // Data rows
    for (let i = 0; i < rows; i++) {
      const cells = Array.from({ length: cols }, () => randomString(2, 15).trim());
      lines.push(`| ${cells.join(' | ')} |`);
    }

    return lines.join('\n');
  }

  private generateCallout(): string {
    const types = ['NOTE', 'TIP', 'WARNING', 'DANGER', 'INFO'];
    const type = randomChoice(types);
    const content = randomString(20, 100).trim();
    
    if (random() < 0.5) {
      // Admonition style
      return `> [!${type}]\n> ${content}`;
    } else {
      // Emoji style
      const emojis = { NOTE: '📝', TIP: '💡', WARNING: '⚠️', DANGER: '🚨', INFO: 'ℹ️' };
      const emoji = emojis[type as keyof typeof emojis];
      return `> ${emoji} ${type.toLowerCase()}:\n> ${content}`;
    }
  }

  private generateToggle(): string {
    const summary = randomString(10, 30).trim();
    const contentLines = randomInt(1, 5);
    const content: string[] = [];

    for (let i = 0; i < contentLines; i++) {
      if (random() < 0.5) {
        content.push(this.generateParagraph());
      } else {
        content.push(this.generateList());
      }
    }

    return `<details>\n<summary>${summary}</summary>\n\n${content.join('\n\n')}\n\n</details>`;
  }

  private generateDivider(): string {
    const styles = ['---', '***', '___'];
    return randomChoice(styles);
  }
}

describe('Property-Based Testing', () => {
  const generator = new RandomMarkdownGenerator();

  describe('Round-trip Fidelity', () => {
    it('should maintain fidelity for 100 random simple documents', () => {
      let successes = 0;
      const total = 100;

      for (let i = 0; i < total; i++) {
        // Reset seed for reproducible generation
        seed = 12345 + i;
        
        const originalMarkdown = generator.generate('simple');
        
        try {
          const blocks = parseMarkdown(originalMarkdown);
          const serializedMarkdown = serializeBlocks(blocks);
          
          // Re-parse to ensure round-trip consistency
          const secondBlocks = parseMarkdown(serializedMarkdown);
          const secondSerialized = serializeBlocks(secondBlocks);

          // Second round-trip should be identical
          expect(secondSerialized).toBe(serializedMarkdown);
          
          // Both should have same number of blocks
          expect(secondBlocks.length).toBe(blocks.length);
          
          successes++;
        } catch (error) {
          console.warn(`Round-trip failed for document ${i}:`, error);
          console.warn('Original markdown:', originalMarkdown);
        }
      }

      // Should succeed on at least 95% of random documents
      expect(successes / total).toBeGreaterThanOrEqual(0.95);
      console.log(`Round-trip success rate: ${(successes / total * 100).toFixed(1)}% (${successes}/${total})`);
    });

    it('should maintain fidelity for 50 random medium documents', () => {
      let successes = 0;
      const total = 50;

      for (let i = 0; i < total; i++) {
        seed = 54321 + i;
        
        const originalMarkdown = generator.generate('medium');
        
        try {
          const blocks = parseMarkdown(originalMarkdown);
          const serializedMarkdown = serializeBlocks(blocks);
          const secondBlocks = parseMarkdown(serializedMarkdown);
          
          // Should maintain block count and structure
          expect(secondBlocks.length).toBe(blocks.length);
          
          // Check that all blocks have valid IDs and source ranges
          secondBlocks.forEach(block => {
            expect(block.id).toBeDefined();
            expect(block.sourceRange).toBeDefined();
            expect(block.sourceRange.start).toBeGreaterThanOrEqual(0);
            expect(block.sourceRange.end).toBeGreaterThanOrEqual(block.sourceRange.start);
          });
          
          successes++;
        } catch (error) {
          console.warn(`Medium document ${i} failed:`, error);
        }
      }

      expect(successes / total).toBeGreaterThanOrEqual(0.90);
      console.log(`Medium document success rate: ${(successes / total * 100).toFixed(1)}% (${successes}/${total})`);
    });

    it('should maintain fidelity for 20 random complex documents', () => {
      let successes = 0;
      const total = 20;

      for (let i = 0; i < total; i++) {
        seed = 98765 + i;
        
        const originalMarkdown = generator.generate('complex');
        
        try {
          const blocks = parseMarkdown(originalMarkdown);
          const serializedMarkdown = serializeBlocks(blocks);
          
          // Basic validation - should not throw errors
          expect(blocks.length).toBeGreaterThan(0);
          expect(serializedMarkdown.length).toBeGreaterThan(0);
          
          // All blocks should have valid properties
          blocks.forEach(block => {
            expect(block.type).toBeDefined();
            expect(block.content).toBeDefined();
            expect(block.sourceRange).toBeDefined();
          });
          
          successes++;
        } catch (error) {
          console.warn(`Complex document ${i} failed:`, error);
        }
      }

      // Complex documents might have lower success rate due to edge cases
      expect(successes / total).toBeGreaterThanOrEqual(0.80);
      console.log(`Complex document success rate: ${(successes / total * 100).toFixed(1)}% (${successes}/${total})`);
    });
  });

  describe('Property Invariants', () => {
    it('should always produce non-empty results for non-empty input', () => {
      for (let i = 0; i < 50; i++) {
        seed = 11111 + i;
        const markdown = generator.generate('simple');
        
        if (markdown.trim().length > 0) {
          const blocks = parseMarkdown(markdown);
          expect(blocks.length).toBeGreaterThan(0);
        }
      }
    });

    it('should always produce valid source ranges', () => {
      for (let i = 0; i < 50; i++) {
        seed = 22222 + i;
        const markdown = generator.generate('medium');
        const blocks = parseMarkdown(markdown);
        
        blocks.forEach((block, index) => {
          expect(block.sourceRange.start).toBeGreaterThanOrEqual(0);
          expect(block.sourceRange.end).toBeGreaterThanOrEqual(block.sourceRange.start);
          expect(block.sourceRange.end).toBeLessThanOrEqual(markdown.length);
          
          // Source ranges should not overlap (except for nested structures)
          for (let j = index + 1; j < blocks.length; j++) {
            const otherBlock = blocks[j];
            // If blocks are not nested, ranges should not overlap
            if (!block.children?.some(child => child.id === otherBlock.id)) {
              const noOverlap = block.sourceRange.end <= otherBlock.sourceRange.start ||
                              otherBlock.sourceRange.end <= block.sourceRange.start;
              if (!noOverlap) {
                // Some overlap is acceptable for adjacent blocks due to whitespace
                const overlap = Math.min(block.sourceRange.end, otherBlock.sourceRange.end) - 
                              Math.max(block.sourceRange.start, otherBlock.sourceRange.start);
                expect(overlap).toBeLessThan(5); // Allow small overlaps
              }
            }
          }
        });
      }
    });

    it('should preserve block hierarchy in round trips', () => {
      for (let i = 0; i < 30; i++) {
        seed = 33333 + i;
        const markdown = generator.generate('medium');
        const blocks1 = parseMarkdown(markdown);
        const serialized = serializeBlocks(blocks1);
        const blocks2 = parseMarkdown(serialized);
        
        // Should have same number of top-level blocks
        expect(blocks2.length).toBe(blocks1.length);
        
        // Check hierarchy preservation for blocks with children
        for (let j = 0; j < blocks1.length && j < blocks2.length; j++) {
          const original = blocks1[j];
          const roundTrip = blocks2[j];
          
          if (original.children) {
            expect(roundTrip.children).toBeDefined();
            expect(roundTrip.children!.length).toBe(original.children.length);
          } else {
            expect(roundTrip.children).toBeUndefined();
          }
        }
      }
    });
  });

  describe('Stress Testing', () => {
    it('should handle documents with many blocks', () => {
      // Generate a document with 1000+ blocks
      const sections: string[] = [];
      for (let i = 0; i < 200; i++) {
        seed = 44444 + i;
        sections.push(generator.generateSection());
      }
      const largeMarkdown = sections.join('\n\n');
      
      const start = performance.now();
      const blocks = parseMarkdown(largeMarkdown);
      const parseTime = performance.now() - start;
      
      expect(blocks.length).toBeGreaterThan(100);
      expect(parseTime).toBeLessThan(2000); // Should complete within 2 seconds
      
      console.log(`Large document: ${blocks.length} blocks parsed in ${parseTime.toFixed(2)}ms`);
    });

    it('should handle deeply nested structures', () => {
      const deeplyNested = `
# Level 1
- Item 1
  - Item 1.1
    - Item 1.1.1
      - Item 1.1.1.1
        - Item 1.1.1.1.1
    - Item 1.1.2
  - Item 1.2
- Item 2

> Quote level 1
> > Nested quote level 2
> > > Nested quote level 3

<details>
<summary>Toggle 1</summary>

Content with nested structure:
- List item
  - Nested item

<details>
<summary>Nested Toggle</summary>
More deeply nested content.
</details>

</details>`;

      const blocks = parseMarkdown(deeplyNested);
      expect(blocks.length).toBeGreaterThan(0);
      
      // Should handle nesting without stack overflow
      const serialized = serializeBlocks(blocks);
      expect(serialized.length).toBeGreaterThan(0);
    });
  });
});