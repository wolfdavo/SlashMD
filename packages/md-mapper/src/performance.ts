/**
 * Performance optimization utilities for SlashMD Markdown Processing
 * Phase 4: Performance tuning to meet 10MB <1s target
 */

import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import { Block } from './types';

/**
 * Performance monitoring and optimization utilities
 */
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, { totalTime: number; calls: number }> = new Map();

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  time<T>(label: string, fn: () => T): T {
    const start = performance.now();
    try {
      const result = fn();
      this.recordTime(label, performance.now() - start);
      return result;
    } catch (error) {
      this.recordTime(label, performance.now() - start);
      throw error;
    }
  }

  async timeAsync<T>(label: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now();
    try {
      const result = await fn();
      this.recordTime(label, performance.now() - start);
      return result;
    } catch (error) {
      this.recordTime(label, performance.now() - start);
      throw error;
    }
  }

  private recordTime(label: string, time: number): void {
    const existing = this.metrics.get(label) || { totalTime: 0, calls: 0 };
    this.metrics.set(label, {
      totalTime: existing.totalTime + time,
      calls: existing.calls + 1
    });
  }

  getMetrics(): Record<string, { avgTime: number; totalTime: number; calls: number }> {
    const result: Record<string, { avgTime: number; totalTime: number; calls: number }> = {};
    
    for (const [label, data] of this.metrics.entries()) {
      result[label] = {
        avgTime: data.totalTime / data.calls,
        totalTime: data.totalTime,
        calls: data.calls
      };
    }

    return result;
  }

  clear(): void {
    this.metrics.clear();
  }
}

/**
 * Optimized parser configurations for different document sizes
 */
export const PARSER_CONFIGS = {
  small: {
    maxNodes: 100,
    enableGfm: true,
    enableFrontmatter: true
  },
  medium: {
    maxNodes: 1000,
    enableGfm: true,
    enableFrontmatter: true
  },
  large: {
    maxNodes: 10000,
    enableGfm: true,
    enableFrontmatter: false // Skip frontmatter for large docs
  }
} as const;

/**
 * Create optimized processor based on document characteristics
 */
export function createOptimizedProcessor(
  markdown: string,
  config?: { enableGfm?: boolean; enableFrontmatter?: boolean; maxNodes?: number }
) {
  // Auto-detect optimal configuration based on document size
  const docSize = markdown.length;
  let baseConfig: { enableGfm: boolean; enableFrontmatter: boolean; maxNodes: number };
  
  if (docSize < 10000) { // < 10KB
    baseConfig = { ...PARSER_CONFIGS.small };
  } else if (docSize < 1000000) { // < 1MB
    baseConfig = { ...PARSER_CONFIGS.medium };
  } else { // >= 1MB
    baseConfig = { ...PARSER_CONFIGS.large };
  }
  
  const finalConfig = { ...baseConfig, ...config };
  
  const processor = unified().use(remarkParse);
  
  if (finalConfig.enableGfm) {
    processor.use(remarkGfm);
  }
  
  if (finalConfig.enableFrontmatter) {
    const remarkFrontmatter = require('remark-frontmatter');
    processor.use(remarkFrontmatter);
  }
  
  return processor;
}

/**
 * Batch processing utilities for large documents
 */
export class BatchProcessor {
  private chunkSize: number;
  private overlapSize: number;

  constructor(chunkSize: number = 100000, overlapSize: number = 1000) {
    this.chunkSize = chunkSize;
    this.overlapSize = overlapSize;
  }

  /**
   * Split markdown into chunks that can be processed independently
   */
  createChunks(markdown: string): Array<{ content: string; offset: number }> {
    if (markdown.length <= this.chunkSize) {
      return [{ content: markdown, offset: 0 }];
    }

    const chunks: Array<{ content: string; offset: number }> = [];
    let offset = 0;

    while (offset < markdown.length) {
      const end = Math.min(offset + this.chunkSize, markdown.length);
      let actualEnd = end;

      // If not at the end of the document, try to break at a good boundary
      if (end < markdown.length) {
        // Look for double newline (paragraph break) within overlap region
        const searchStart = Math.max(end - this.overlapSize, offset);
        const breakPoint = markdown.lastIndexOf('\n\n', end);
        
        if (breakPoint > searchStart) {
          actualEnd = breakPoint + 2;
        } else {
          // Fall back to single newline
          const singleBreak = markdown.lastIndexOf('\n', end);
          if (singleBreak > searchStart) {
            actualEnd = singleBreak + 1;
          }
        }
      }

      chunks.push({
        content: markdown.slice(offset, actualEnd),
        offset
      });

      offset = actualEnd;
    }

    return chunks;
  }

  /**
   * Process chunks in parallel and merge results
   */
  async processChunks<T>(
    chunks: Array<{ content: string; offset: number }>,
    processor: (chunk: string, offset: number) => T | Promise<T>
  ): Promise<T[]> {
    const promises = chunks.map(chunk => 
      Promise.resolve(processor(chunk.content, chunk.offset))
    );

    return Promise.all(promises);
  }
}

/**
 * Memory-efficient block processing
 */
export class MemoryOptimizer {
  private static weakRefs: WeakRef<any>[] = [];

  /**
   * Create a memory-conscious version of an object
   */
  static optimize<T extends object>(obj: T): T {
    // For large objects, consider using WeakRef
    if (this.isLargeObject(obj)) {
      this.weakRefs.push(new WeakRef(obj));
    }

    return obj;
  }

  /**
   * Check if an object should be optimized for memory
   */
  private static isLargeObject(obj: any): boolean {
    if (!obj || typeof obj !== 'object') return false;
    
    // Rough heuristic for "large" objects
    const str = JSON.stringify(obj);
    return str.length > 10000; // > 10KB serialized
  }

  /**
   * Clean up weak references
   */
  static cleanup(): void {
    this.weakRefs = this.weakRefs.filter(ref => ref.deref() !== undefined);
  }

  /**
   * Get current memory usage statistics
   */
  static getMemoryStats(): { 
    heapUsed: number; 
    heapTotal: number; 
    external: number;
    weakRefs: number;
  } {
    const memUsage = process.memoryUsage();
    return {
      heapUsed: memUsage.heapUsed,
      heapTotal: memUsage.heapTotal,
      external: memUsage.external,
      weakRefs: this.weakRefs.length
    };
  }
}

/**
 * Streaming parser for extremely large documents
 */
export class StreamingParser {
  private buffer: string = '';
  private onBlock: (block: Block) => void;
  private bufferLimit: number;

  constructor(
    onBlock: (block: Block) => void,
    bufferLimit: number = 1000000 // 1MB buffer limit
  ) {
    this.onBlock = onBlock;
    this.bufferLimit = bufferLimit;
  }

  /**
   * Add more content to the streaming parser
   */
  write(chunk: string): void {
    this.buffer += chunk;

    // Process complete blocks when buffer gets large
    if (this.buffer.length > this.bufferLimit) {
      this.flush();
    }
  }

  /**
   * Flush any remaining content
   */
  flush(): void {
    if (this.buffer.trim()) {
      try {
        // Import here to avoid circular dependencies
        const { parseMarkdown } = require('./parser');
        const blocks = parseMarkdown(this.buffer);
        
        blocks.forEach((block: Block) => {
          this.onBlock(block);
        });

        this.buffer = '';
      } catch (error) {
        console.error('Streaming parser error:', error);
      }
    }
  }

  /**
   * End the stream and process any remaining content
   */
  end(): void {
    this.flush();
  }
}

/**
 * Performance optimization strategies
 */
export const OPTIMIZATION_STRATEGIES = {
  /**
   * Skip expensive operations for large documents
   */
  simplifyForLargeDocuments: (markdown: string): boolean => {
    const size = markdown.length;
    const lines = markdown.split('\n').length;
    
    // If document is > 1MB or > 10k lines, use simplified parsing
    return size > 1024 * 1024 || lines > 10000;
  },

  /**
   * Pre-filter content to reduce parsing overhead
   */
  prefilterContent: (markdown: string): string => {
    // Remove excessive whitespace that doesn't affect structure
    return markdown
      .replace(/\n\s*\n\s*\n/g, '\n\n') // Collapse multiple empty lines
      .replace(/[ \t]+$/gm, ''); // Remove trailing whitespace
  },

  /**
   * Estimate parsing complexity
   */
  estimateComplexity: (markdown: string): 'low' | 'medium' | 'high' => {
    const size = markdown.length;
    const lines = markdown.split('\n').length;
    const blocks = (markdown.match(/^[#\-\*\+>|`]/gm) || []).length;
    
    // Scoring system
    let score = 0;
    score += Math.floor(size / 10000); // +1 per 10KB
    score += Math.floor(lines / 1000); // +1 per 1K lines
    score += Math.floor(blocks / 100);  // +1 per 100 blocks
    
    if (score <= 5) return 'low';
    if (score <= 20) return 'medium';
    return 'high';
  },

  /**
   * Choose optimal processing strategy
   */
  chooseStrategy: (markdown: string): {
    useStreaming: boolean;
    useBatching: boolean;
    useSimplified: boolean;
    chunkSize?: number;
  } => {
    const complexity = OPTIMIZATION_STRATEGIES.estimateComplexity(markdown);
    const size = markdown.length;

    switch (complexity) {
      case 'low':
        return { useStreaming: false, useBatching: false, useSimplified: false };
      
      case 'medium':
        return { 
          useStreaming: false, 
          useBatching: size > 500000, 
          useSimplified: false,
          chunkSize: 100000
        };
      
      case 'high':
        return { 
          useStreaming: size > 5000000, 
          useBatching: size <= 5000000, 
          useSimplified: true,
          chunkSize: 50000
        };
    }
  }
};

/**
 * Cache for frequently accessed operations
 */
export class OperationCache {
  private static cache = new Map<string, { value: any; timestamp: number }>();
  private static readonly TTL = 300000; // 5 minutes

  static get<T>(key: string): T | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;

    if (Date.now() - entry.timestamp > this.TTL) {
      this.cache.delete(key);
      return undefined;
    }

    return entry.value as T;
  }

  static set<T>(key: string, value: T): void {
    this.cache.set(key, { value, timestamp: Date.now() });
  }

  static has(key: string): boolean {
    return this.get(key) !== undefined;
  }

  static clear(): void {
    this.cache.clear();
  }

  static cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.TTL) {
        this.cache.delete(key);
      }
    }
  }

  static size(): number {
    return this.cache.size;
  }
}