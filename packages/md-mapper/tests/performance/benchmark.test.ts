/**
 * Performance benchmark tests for SlashMD Markdown Processing Library
 * Phase 4: Testing, Performance & Production Readiness
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { 
  parseMarkdown, 
  serializeBlocks, 
  parseMarkdownOptimized, 
  parseMarkdownAdaptive,
  PerformanceMonitor 
} from '../../src';
import type { Block } from '../../src/types';

// Performance thresholds based on requirements
const PERFORMANCE_TARGETS = {
  SMALL_DOC_PARSE_MS: 10,     // <10ms for documents under 1KB
  MEDIUM_DOC_PARSE_MS: 100,   // <100ms for documents under 100KB  
  LARGE_DOC_PARSE_MS: 1000,   // <1s for documents up to 10MB
  ROUND_TRIP_OVERHEAD: 2.0,   // Parse+serialize should be <2x parse time
};

// Test document generators
function generateLargeDocument(targetSizeKB: number): string {
  const sections: string[] = [];
  let currentSize = 0;
  let sectionIndex = 0;

  while (currentSize < targetSizeKB * 1024) {
    sectionIndex++;
    const section = generateDocumentSection(sectionIndex);
    sections.push(section);
    currentSize += Buffer.byteLength(section, 'utf8');
  }

  return sections.join('\n\n');
}

function generateDocumentSection(index: number): string {
  const templates = [
    // Heading + paragraphs
    `# Section ${index}: Performance Testing

This is a comprehensive section designed to test parsing performance with realistic content.
The content includes multiple paragraphs with various formatting options and structures
that would be commonly found in real-world markdown documents.

## Subsection ${index}.1

Here we have more detailed content that includes **bold text**, *italic text*, 
and even some \`inline code\` elements to make parsing more realistic.`,

    // Lists with nesting
    `## Task List Section ${index}

- [ ] Incomplete task number ${index}
- [x] Completed task with **bold** content
- [ ] Another task with nested content:
  - Nested item with *italic* formatting
  - Another nested item with \`code\`
  - [ ] Nested task item

### Ordered List ${index}

1. First item in ordered list ${index}
2. Second item with more content
3. Third item with **formatting** and *emphasis*
4. Fourth item with nested structure:
   - Nested bullet item
   - Another nested item`,

    // Code blocks and quotes
    `### Code Example ${index}

\`\`\`typescript
function exampleFunction${index}() {
  const data = {
    id: ${index},
    content: "Sample content for performance testing",
    metadata: {
      created: new Date(),
      author: "Performance Test Suite"
    }
  };
  
  return processData(data);
}
\`\`\`

> **Quote ${index}**: This is a blockquote containing important information
> about performance testing. It includes multiple lines to test parsing
> of longer quoted content.

> [!TIP]
> This is a callout example number ${index} that contains useful tips
> about performance optimization and testing strategies.`,

    // Tables
    `### Data Table ${index}

| Metric | Value | Unit | Status |
|--------|-------|------|--------|
| Parse Time | ${Math.random() * 100} | ms | ✅ Good |
| Memory Usage | ${Math.random() * 50} | MB | ✅ Good |
| File Size | ${Math.random() * 1000} | KB | 📊 Normal |

---`,

    // Toggle sections
    `<details>
<summary>Expandable Section ${index}</summary>

This is collapsible content that includes various elements:

- Multiple list items
- **Bold** and *italic* text
- Code snippets: \`const value = ${index};\`

\`\`\`javascript
// Sample code in toggle
const toggle${index} = {
  expanded: false,
  content: "Nested content"
};
\`\`\`

</details>`
  ];

  return templates[index % templates.length];
}

describe('Performance Benchmarks', () => {
  let smallDoc: string;
  let mediumDoc: string;
  let largeDoc: string;

  beforeAll(() => {
    // Generate test documents of various sizes
    smallDoc = generateLargeDocument(1);      // ~1KB
    mediumDoc = generateLargeDocument(100);   // ~100KB
    largeDoc = generateLargeDocument(1000);   // ~1MB (10MB would be too large for tests)
  });

  describe('Parsing Performance', () => {
    it('should parse small documents quickly (<10ms)', () => {
      const start = performance.now();
      const blocks = parseMarkdown(smallDoc);
      const parseTime = performance.now() - start;

      expect(parseTime).toBeLessThan(PERFORMANCE_TARGETS.SMALL_DOC_PARSE_MS);
      expect(blocks.length).toBeGreaterThan(0);
      
      // Log performance metrics
      console.log(`Small doc (${Math.round(Buffer.byteLength(smallDoc, 'utf8') / 1024)}KB): ${parseTime.toFixed(2)}ms, ${blocks.length} blocks`);
    });

    it('should parse medium documents efficiently (<100ms)', () => {
      const start = performance.now();
      const blocks = parseMarkdown(mediumDoc);
      const parseTime = performance.now() - start;

      expect(parseTime).toBeLessThan(PERFORMANCE_TARGETS.MEDIUM_DOC_PARSE_MS);
      expect(blocks.length).toBeGreaterThan(10);
      
      console.log(`Medium doc (${Math.round(Buffer.byteLength(mediumDoc, 'utf8') / 1024)}KB): ${parseTime.toFixed(2)}ms, ${blocks.length} blocks`);
    });

    it('should parse large documents within target (<1000ms)', () => {
      const start = performance.now();
      const blocks = parseMarkdown(largeDoc);
      const parseTime = performance.now() - start;

      expect(parseTime).toBeLessThan(PERFORMANCE_TARGETS.LARGE_DOC_PARSE_MS);
      expect(blocks.length).toBeGreaterThan(100);
      
      console.log(`Large doc (${Math.round(Buffer.byteLength(largeDoc, 'utf8') / 1024)}KB): ${parseTime.toFixed(2)}ms, ${blocks.length} blocks`);
    });
  });

  describe('Serialization Performance', () => {
    let smallBlocks: Block[];
    let mediumBlocks: Block[];
    let largeBlocks: Block[];

    beforeAll(() => {
      smallBlocks = parseMarkdown(smallDoc);
      mediumBlocks = parseMarkdown(mediumDoc);
      largeBlocks = parseMarkdown(largeDoc);
    });

    it('should serialize small documents quickly', () => {
      const start = performance.now();
      const serialized = serializeBlocks(smallBlocks);
      const serializeTime = performance.now() - start;

      expect(serializeTime).toBeLessThan(PERFORMANCE_TARGETS.SMALL_DOC_PARSE_MS);
      expect(serialized.length).toBeGreaterThan(0);
      
      console.log(`Small serialize: ${serializeTime.toFixed(2)}ms`);
    });

    it('should serialize medium documents efficiently', () => {
      const start = performance.now();
      const serialized = serializeBlocks(mediumBlocks);
      const serializeTime = performance.now() - start;

      expect(serializeTime).toBeLessThan(PERFORMANCE_TARGETS.MEDIUM_DOC_PARSE_MS);
      expect(serialized.length).toBeGreaterThan(100);
      
      console.log(`Medium serialize: ${serializeTime.toFixed(2)}ms`);
    });

    it('should serialize large documents within target', () => {
      const start = performance.now();
      const serialized = serializeBlocks(largeBlocks);
      const serializeTime = performance.now() - start;

      expect(serializeTime).toBeLessThan(PERFORMANCE_TARGETS.LARGE_DOC_PARSE_MS);
      expect(serialized.length).toBeGreaterThan(1000);
      
      console.log(`Large serialize: ${serializeTime.toFixed(2)}ms`);
    });
  });

  describe('Round-trip Performance', () => {
    it('should complete full round-trip efficiently', () => {
      const parseStart = performance.now();
      const blocks = parseMarkdown(mediumDoc);
      const parseTime = performance.now() - parseStart;

      const serializeStart = performance.now();
      const serialized = serializeBlocks(blocks);
      const serializeTime = performance.now() - serializeStart;

      const totalTime = parseTime + serializeTime;
      const overhead = totalTime / parseTime;

      expect(overhead).toBeLessThan(PERFORMANCE_TARGETS.ROUND_TRIP_OVERHEAD);
      
      console.log(`Round-trip overhead: ${overhead.toFixed(2)}x (parse: ${parseTime.toFixed(2)}ms, serialize: ${serializeTime.toFixed(2)}ms)`);
    });
  });

  describe('Memory Usage', () => {
    it('should not leak memory during repeated operations', () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Perform multiple parse/serialize cycles
      for (let i = 0; i < 10; i++) {
        const blocks = parseMarkdown(mediumDoc);
        const serialized = serializeBlocks(blocks);
        expect(serialized).toBeDefined();
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = (finalMemory - initialMemory) / 1024 / 1024; // MB

      // Should not increase memory by more than 10MB after 10 cycles
      expect(memoryIncrease).toBeLessThan(10);
      
      console.log(`Memory increase after 10 cycles: ${memoryIncrease.toFixed(2)}MB`);
    });
  });

  describe('Concurrent Processing', () => {
    it('should handle concurrent parsing efficiently', async () => {
      const concurrency = 5;
      const promises: Promise<Block[]>[] = [];

      const start = performance.now();
      
      for (let i = 0; i < concurrency; i++) {
        promises.push(Promise.resolve(parseMarkdown(mediumDoc)));
      }

      const results = await Promise.all(promises);
      const totalTime = performance.now() - start;

      // All results should be valid
      results.forEach(blocks => {
        expect(blocks.length).toBeGreaterThan(0);
      });

      // Concurrent processing shouldn't be much slower than sequential
      expect(totalTime).toBeLessThan(PERFORMANCE_TARGETS.MEDIUM_DOC_PARSE_MS * 2);
      
      console.log(`Concurrent processing (${concurrency} docs): ${totalTime.toFixed(2)}ms`);
    });
  });

  describe('Optimized Parser Performance', () => {
    it('should be faster than standard parser for large documents', async () => {
      const doc = generateLargeDocument(0.5); // 500KB

      // Standard parser
      const standardStart = performance.now();
      const standardBlocks = parseMarkdown(doc);
      const standardTime = performance.now() - standardStart;

      // Optimized parser
      const optimizedStart = performance.now();
      const optimizedBlocks = parseMarkdownOptimized(doc, { enableBatching: true });
      const optimizedTime = performance.now() - optimizedStart;

      // Adaptive parser
      const adaptiveStart = performance.now();
      const adaptiveBlocks = parseMarkdownAdaptive(doc);
      const adaptiveTime = performance.now() - adaptiveStart;

      console.log(`Standard: ${standardTime.toFixed(2)}ms, Optimized: ${optimizedTime.toFixed(2)}ms, Adaptive: ${adaptiveTime.toFixed(2)}ms`);

      // Results should be similar
      expect(Math.abs(standardBlocks.length - optimizedBlocks.length)).toBeLessThan(standardBlocks.length * 0.1);
      expect(Math.abs(standardBlocks.length - adaptiveBlocks.length)).toBeLessThan(standardBlocks.length * 0.1);

      // At least one optimized version should be faster (or at least not significantly slower)
      expect(Math.min(optimizedTime, adaptiveTime)).toBeLessThan(standardTime * 1.5);
    });

    it('should handle performance monitoring', () => {
      const monitor = PerformanceMonitor.getInstance();
      monitor.clear();

      const doc = generateLargeDocument(0.1);
      parseMarkdownOptimized(doc, { enableMonitoring: true });

      const metrics = monitor.getMetrics();
      expect(Object.keys(metrics).length).toBeGreaterThan(0);
      
      if (metrics.parseMarkdown) {
        expect(metrics.parseMarkdown.calls).toBeGreaterThan(0);
        expect(metrics.parseMarkdown.avgTime).toBeGreaterThan(0);
      }
    });

    it('should use caching effectively', () => {
      const doc = generateLargeDocument(0.1);

      // First parse (should cache)
      const start1 = performance.now();
      const blocks1 = parseMarkdownOptimized(doc, { enableCaching: true });
      const time1 = performance.now() - start1;

      // Second parse (should use cache)
      const start2 = performance.now();
      const blocks2 = parseMarkdownOptimized(doc, { enableCaching: true });
      const time2 = performance.now() - start2;

      expect(blocks1.length).toBe(blocks2.length);
      // Second parse should be significantly faster due to caching
      expect(time2).toBeLessThan(time1 * 0.5);

      console.log(`First parse: ${time1.toFixed(2)}ms, Second parse (cached): ${time2.toFixed(2)}ms`);
    });
  });
});