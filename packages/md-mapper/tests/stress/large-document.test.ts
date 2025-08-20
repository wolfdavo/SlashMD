/**
 * Stress tests for large document processing
 * Phase 4: Testing, Performance & Production Readiness
 * Target: Parse 10MB documents in <1 second
 */

import { describe, it, expect } from 'vitest';
import { parseMarkdown, serializeBlocks } from '../../src';

const MB = 1024 * 1024;
const TARGET_PARSE_TIME_MS = 1000; // <1 second for 10MB

/**
 * Efficient large document generator for stress testing
 */
function generateLargeDocument(targetSizeMB: number): string {
  const targetBytes = targetSizeMB * MB;
  const sections: string[] = [];
  let currentSize = 0;
  
  // Template sections that will be repeated
  const templates = [
    // Heading + paragraphs (efficient content)
    (index: number) => `# Section ${index}

This is section ${index} of the stress test document. It contains realistic markdown content 
to test parsing performance at scale. The content includes various formatting elements 
that would be found in real-world documents.

## Subsection ${index}.1

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt 
ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation 
ullamco laboris nisi ut aliquip ex ea commodo consequat.

### Performance Testing ${index}

**Bold text** and *italic text* and \`inline code\` are included to test inline formatting 
performance. This section contains approximately 500-800 bytes of content for predictable sizing.`,

    // List structures (moderate complexity)
    (index: number) => `## List Section ${index}

1. First ordered item ${index}
2. Second ordered item with longer content to increase document size
3. Third ordered item with **formatting** and *emphasis*
4. Fourth item with nested content:
   - Nested bullet item A
   - Nested bullet item B
   - Nested bullet item C

### Task List ${index}

- [ ] Incomplete task ${index}
- [x] Completed task ${index}
- [ ] Another incomplete task with more content
- [x] Another completed task`,

    // Code blocks (efficient for size)
    (index: number) => `### Code Block ${index}

\`\`\`typescript
// Example function ${index}
function processData${index}(input: any): any {
  const result = {
    id: ${index},
    processed: true,
    timestamp: Date.now(),
    data: input
  };
  
  return result;
}

// Usage example
const output = processData${index}({ value: ${index} });
console.log('Processed:', output);
\`\`\``,

    // Tables (content-heavy)
    (index: number) => `### Data Table ${index}

| ID | Name | Value | Status | Description |
|----|------|-------|--------|-------------|
| ${index}01 | Item A | ${index * 10} | Active | Description for item A in section ${index} |
| ${index}02 | Item B | ${index * 20} | Inactive | Description for item B in section ${index} |
| ${index}03 | Item C | ${index * 30} | Pending | Description for item C in section ${index} |
| ${index}04 | Item D | ${index * 40} | Active | Description for item D in section ${index} |

---`,

    // Quotes and callouts (moderate size)
    (index: number) => `### Quote Section ${index}

> This is a blockquote in section ${index}. It contains important information
> that spans multiple lines to test quote parsing performance. The content
> is designed to be realistic while maintaining predictable sizing.

> [!TIP]
> This is a tip callout in section ${index}. Callouts add complexity to parsing
> and are important to test at scale for performance characteristics.`,
  ];

  // Generate sections until we reach target size
  let sectionIndex = 0;
  while (currentSize < targetBytes) {
    const templateIndex = sectionIndex % templates.length;
    const content = templates[templateIndex](sectionIndex);
    sections.push(content);
    currentSize += Buffer.byteLength(content, 'utf8');
    sectionIndex++;
    
    // Add progress for very large documents
    if (sectionIndex % 1000 === 0) {
      const currentMB = currentSize / MB;
      console.log(`Generated ${currentMB.toFixed(1)}MB (${sectionIndex} sections)...`);
    }
  }

  const result = sections.join('\n\n');
  const finalSize = Buffer.byteLength(result, 'utf8');
  console.log(`Generated document: ${(finalSize / MB).toFixed(2)}MB with ${sectionIndex} sections`);
  
  return result;
}

describe('Large Document Stress Tests', () => {
  // Note: These tests are expensive and may be skipped in CI
  const SKIP_EXPENSIVE_TESTS = process.env.SKIP_STRESS_TESTS === 'true';

  describe('Target Performance Tests', () => {
    it('should parse 1MB document quickly', async () => {
      const doc1MB = generateLargeDocument(1);
      
      const start = performance.now();
      const blocks = parseMarkdown(doc1MB);
      const parseTime = performance.now() - start;
      
      expect(blocks.length).toBeGreaterThan(100);
      expect(parseTime).toBeLessThan(100); // Should be very fast for 1MB
      
      console.log(`1MB document: ${blocks.length} blocks, ${parseTime.toFixed(2)}ms`);
    });

    it('should parse 5MB document within reasonable time', async () => {
      if (SKIP_EXPENSIVE_TESTS) {
        console.log('Skipping 5MB test (SKIP_STRESS_TESTS=true)');
        return;
      }

      const doc5MB = generateLargeDocument(5);
      
      const start = performance.now();
      const blocks = parseMarkdown(doc5MB);
      const parseTime = performance.now() - start;
      
      expect(blocks.length).toBeGreaterThan(500);
      expect(parseTime).toBeLessThan(500); // Should be reasonable for 5MB
      
      console.log(`5MB document: ${blocks.length} blocks, ${parseTime.toFixed(2)}ms`);
    });

    it('should parse 10MB document within target time', async () => {
      if (SKIP_EXPENSIVE_TESTS) {
        console.log('Skipping 10MB test (SKIP_STRESS_TESTS=true)');
        return;
      }

      const doc10MB = generateLargeDocument(10);
      
      console.log('Starting 10MB parse test...');
      const start = performance.now();
      const blocks = parseMarkdown(doc10MB);
      const parseTime = performance.now() - start;
      
      // This is the key performance target
      expect(blocks.length).toBeGreaterThan(1000);
      expect(parseTime).toBeLessThan(TARGET_PARSE_TIME_MS);
      
      console.log(`🎯 10MB TARGET: ${blocks.length} blocks, ${parseTime.toFixed(2)}ms (target: <${TARGET_PARSE_TIME_MS}ms)`);
      
      // Additional validation - ensure blocks are valid
      let blockWithChildren = 0;
      blocks.forEach(block => {
        expect(block.id).toBeDefined();
        expect(block.type).toBeDefined();
        expect(block.sourceRange).toBeDefined();
        if (block.children) blockWithChildren++;
      });
      
      console.log(`Validation passed: ${blockWithChildren} blocks with children`);
    });
  });

  describe('Serialization Performance', () => {
    it('should serialize large documents efficiently', async () => {
      if (SKIP_EXPENSIVE_TESTS) {
        console.log('Skipping large serialization test');
        return;
      }

      const doc5MB = generateLargeDocument(5);
      const blocks = parseMarkdown(doc5MB);
      
      const start = performance.now();
      const serialized = serializeBlocks(blocks);
      const serializeTime = performance.now() - start;
      
      expect(serialized.length).toBeGreaterThan(1000000); // At least 1MB
      expect(serializeTime).toBeLessThan(500); // Should be fast
      
      console.log(`5MB serialization: ${(Buffer.byteLength(serialized, 'utf8') / MB).toFixed(2)}MB, ${serializeTime.toFixed(2)}ms`);
    });
  });

  describe('Memory Management', () => {
    it('should not consume excessive memory for large documents', async () => {
      if (SKIP_EXPENSIVE_TESTS) {
        console.log('Skipping memory test');
        return;
      }

      const initialMemory = process.memoryUsage().heapUsed;
      
      // Process multiple large documents sequentially
      for (let i = 0; i < 3; i++) {
        const doc = generateLargeDocument(2); // 2MB each
        const blocks = parseMarkdown(doc);
        const serialized = serializeBlocks(blocks);
        
        expect(blocks.length).toBeGreaterThan(0);
        expect(serialized.length).toBeGreaterThan(0);
        
        // Clear references
        blocks.length = 0;
      }
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = (finalMemory - initialMemory) / MB;
      
      // Should not retain excessive memory after processing
      expect(memoryIncrease).toBeLessThan(50); // Less than 50MB retained
      
      console.log(`Memory increase after 3x2MB documents: ${memoryIncrease.toFixed(2)}MB`);
    });
  });

  describe('Robustness with Large Documents', () => {
    it('should handle malformed content in large documents', async () => {
      // Create a large document with some malformed elements
      const sections: string[] = [];
      
      for (let i = 0; i < 100; i++) {
        if (i % 10 === 0) {
          // Add some malformed content every 10 sections
          sections.push(`# Section ${i}

This section contains malformed elements:
- Unclosed **bold text
- Missing closing bracket in [link](
- Unmatched quote marks "text
- Invalid table | missing | cells |

\`\`\`unknown-language
Code block with unknown language
\`\`\`

Normal content continues here...`);
        } else {
          sections.push(`# Section ${i}

Normal content in section ${i} with proper formatting.

- List item 1
- List item 2
- List item 3

Regular paragraph text continues here.`);
        }
      }
      
      const malformedDoc = sections.join('\n\n');
      
      // Should not throw errors, even with malformed content
      expect(() => {
        const blocks = parseMarkdown(malformedDoc);
        expect(blocks.length).toBeGreaterThan(50);
      }).not.toThrow();
    });

    it('should maintain source ranges for large documents', async () => {
      const doc = generateLargeDocument(1);
      const blocks = parseMarkdown(doc);
      
      // Verify all source ranges are valid
      blocks.forEach((block, index) => {
        expect(block.sourceRange.start).toBeGreaterThanOrEqual(0);
        expect(block.sourceRange.end).toBeGreaterThan(block.sourceRange.start);
        expect(block.sourceRange.end).toBeLessThanOrEqual(doc.length);
        
        // Check that source ranges make sense relative to each other
        if (index > 0) {
          const previousBlock = blocks[index - 1];
          // Current block should start at or after the previous block
          expect(block.sourceRange.start).toBeGreaterThanOrEqual(previousBlock.sourceRange.start);
        }
      });
      
      console.log(`Source range validation passed for ${blocks.length} blocks`);
    });
  });

  describe('Performance Regression Prevention', () => {
    it('should maintain consistent performance across document sizes', async () => {
      const sizes = [0.1, 0.5, 1]; // MB
      const results: Array<{ size: number; timePerMB: number }> = [];
      
      for (const sizeMB of sizes) {
        const doc = generateLargeDocument(sizeMB);
        
        const start = performance.now();
        const blocks = parseMarkdown(doc);
        const parseTime = performance.now() - start;
        
        const timePerMB = parseTime / sizeMB;
        results.push({ size: sizeMB, timePerMB });
        
        expect(blocks.length).toBeGreaterThan(0);
        console.log(`${sizeMB}MB: ${parseTime.toFixed(2)}ms (${timePerMB.toFixed(2)}ms/MB)`);
      }
      
      // Performance should scale roughly linearly (not exponentially)
      const [small, medium, large] = results;
      const scaleFactor = large.timePerMB / small.timePerMB;
      
      // Should not be more than 3x slower per MB for larger documents
      expect(scaleFactor).toBeLessThan(3);
      
      console.log(`Performance scaling factor: ${scaleFactor.toFixed(2)}x`);
    });
  });
});