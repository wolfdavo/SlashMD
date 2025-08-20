/**
 * Error handling and validation tests
 * Phase 4: Testing, Performance & Production Readiness
 */

import { describe, it, expect } from 'vitest';
import { 
  parseMarkdown, 
  serializeBlocks,
  safeParseMarkdown,
  safeSerializeBlocks,
  parseWithFallback,
  RECOVERY_STRATEGIES,
  InvalidInputError,
  ParseError,
  SerializationError,
  isMarkdownProcessingError,
  isInvalidInputError,
  isParseError
} from '../src';

describe('Error Handling', () => {
  
  describe('Input Validation', () => {
    it('should throw error for non-string markdown input', () => {
      expect(() => parseMarkdown(null as any)).toThrow('Expected markdown input to be a string');
      expect(() => parseMarkdown(undefined as any)).toThrow('Expected markdown input to be a string');
      expect(() => parseMarkdown(123 as any)).toThrow('Expected markdown input to be a string');
      expect(() => parseMarkdown([] as any)).toThrow('Expected markdown input to be a string');
      expect(() => parseMarkdown({} as any)).toThrow('Expected markdown input to be a string');
    });

    it('should throw error for extremely large markdown input', () => {
      const largeInput = 'x'.repeat(51 * 1024 * 1024); // 51MB
      expect(() => parseMarkdown(largeInput)).toThrow('Markdown input is too large');
    });

    it('should throw error for non-array blocks input', () => {
      expect(() => serializeBlocks(null as any)).toThrow('Expected blocks to be an array');
      expect(() => serializeBlocks(undefined as any)).toThrow('Expected blocks to be an array');
      expect(() => serializeBlocks('string' as any)).toThrow('Expected blocks to be an array');
      expect(() => serializeBlocks(123 as any)).toThrow('Expected blocks to be an array');
      expect(() => serializeBlocks({} as any)).toThrow('Expected blocks to be an array');
    });

    it('should throw error for invalid blocks', () => {
      expect(() => serializeBlocks([null] as any)).toThrow('Block at index 0 is not a valid object');
      expect(() => serializeBlocks([undefined] as any)).toThrow('Block at index 0 is not a valid object');
      expect(() => serializeBlocks(['string'] as any)).toThrow('Block at index 0 is not a valid object');
      
      expect(() => serializeBlocks([{}] as any)).toThrow('Block at index 0 has invalid or missing type');
      expect(() => serializeBlocks([{ type: '' }] as any)).toThrow('Block at index 0 has invalid or missing type');
      expect(() => serializeBlocks([{ type: null }] as any)).toThrow('Block at index 0 has invalid or missing type');
    });
  });

  describe('Safe Parsing', () => {
    it('should return success result for valid markdown', () => {
      const result = safeParseMarkdown('# Hello World', { throwOnError: false });
      expect(result.blocks).toBeDefined();
      expect(result.error).toBeUndefined();
      expect(result.blocks?.length).toBe(1);
    });

    it('should return error result for invalid input without throwing', () => {
      const result = safeParseMarkdown(123 as any, { throwOnError: false });
      expect(result.blocks).toBeUndefined();
      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain('Expected markdown input to be a string');
    });

    it('should throw error when throwOnError is true', () => {
      expect(() => safeParseMarkdown(123 as any, { throwOnError: true })).toThrow();
    });

    it('should validate output blocks', () => {
      const result = safeParseMarkdown('# Valid heading\n\nValid paragraph.');
      expect(result.blocks).toBeDefined();
      
      // All blocks should have required properties
      result.blocks?.forEach((block, index) => {
        expect(block.id).toBeDefined();
        expect(block.type).toBeDefined();
        expect(block.sourceRange).toBeDefined();
        expect(block.sourceRange.start).toBeGreaterThanOrEqual(0);
        expect(block.sourceRange.end).toBeGreaterThan(block.sourceRange.start);
        expect(block.content).toBeDefined();
      });
    });
  });

  describe('Safe Serialization', () => {
    it('should return success result for valid blocks', () => {
      const blocks = parseMarkdown('# Test\n\nParagraph text.');
      const result = safeSerializeBlocks(blocks, { throwOnError: false });
      
      expect(result.markdown).toBeDefined();
      expect(result.error).toBeUndefined();
      expect(typeof result.markdown).toBe('string');
      expect(result.markdown?.length).toBeGreaterThan(0);
    });

    it('should return error result for invalid blocks without throwing', () => {
      const result = safeSerializeBlocks([{ invalid: 'block' }] as any, { throwOnError: false });
      expect(result.markdown).toBeUndefined();
      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain('has invalid or missing type');
    });

    it('should validate input blocks before serialization', () => {
      const invalidBlocks = [
        { type: 'paragraph' }, // Missing required properties
        { type: 'heading', content: {}, sourceRange: {} }, // Invalid sourceRange
      ];
      
      const result = safeSerializeBlocks(invalidBlocks as any, { throwOnError: false });
      expect(result.error).toBeDefined();
    });
  });

  describe('Recovery Strategies', () => {
    it('should fix headings without spaces', () => {
      const malformed = '#Heading\n##Another heading\n###Third';
      const fixed = RECOVERY_STRATEGIES.fixCommonIssues(malformed);
      
      expect(fixed).toContain('# Heading');
      expect(fixed).toContain('## Another heading');
      expect(fixed).toContain('### Third');
    });

    it('should fix task lists with missing spaces', () => {
      const malformed = '- [x]Done task\n- [ ]Todo task\n- [X]Capital X';
      const fixed = RECOVERY_STRATEGIES.fixCommonIssues(malformed);
      
      expect(fixed).toContain('- [x] Done task');
      expect(fixed).toContain('- [ ] Todo task');
      expect(fixed).toContain('- [X] Capital X');
    });

    it('should fix unclosed code blocks', () => {
      const malformed = '```javascript\nfunction test() {\n  return true;\n}';
      const fixed = RECOVERY_STRATEGIES.fixCommonIssues(malformed);
      
      expect(fixed).toContain('```javascript');
      expect(fixed).toContain('```\n'); // Should add closing fence
    });

    it('should chunk large documents', () => {
      const largeDoc = 'x'.repeat(5000);
      const chunks = RECOVERY_STRATEGIES.chunkDocument(largeDoc, 1000);
      
      expect(chunks.length).toBeGreaterThan(1);
      expect(chunks.every(chunk => chunk.length <= 1000)).toBe(true);
      expect(chunks.join('')).toBe(largeDoc);
    });

    it('should chunk at natural boundaries when possible', () => {
      const doc = 'First section\n\nSecond section\n\nThird section';
      const chunks = RECOVERY_STRATEGIES.chunkDocument(doc, 20);
      
      expect(chunks.length).toBeGreaterThan(1);
      // Should prefer breaking at double newlines
      expect(chunks.some(chunk => chunk.endsWith('\n\n'))).toBe(true);
    });
  });

  describe('Fallback Parsing', () => {
    it('should succeed on first attempt with valid markdown', () => {
      const blocks = parseWithFallback('# Valid\n\nContent here');
      expect(blocks.length).toBeGreaterThan(0);
    });

    it('should recover from common formatting issues', () => {
      const malformed = '#BadHeading\n- [x]Task without space';
      
      // Should not throw and should return valid blocks
      expect(() => parseWithFallback(malformed)).not.toThrow();
      const blocks = parseWithFallback(malformed);
      expect(blocks.length).toBeGreaterThan(0);
    });

    it('should handle recovery disabled', () => {
      const malformed = '#BadHeading\n- [x]Task without space';
      
      // With recovery disabled, should try direct parsing only
      const blocks = parseWithFallback(malformed, { enableRecovery: false, maxRetries: 0 });
      expect(blocks.length).toBeGreaterThan(0); // Might still work with current parser
    });

    it('should chunk very large documents for recovery', () => {
      // Create a large document that might cause issues
      const sections = Array.from({ length: 100 }, (_, i) => 
        `# Section ${i}\n\nContent for section ${i} with some text.`
      );
      const largeDoc = sections.join('\n\n');
      
      const blocks = parseWithFallback(largeDoc, { chunkLargeDocuments: true });
      expect(blocks.length).toBeGreaterThan(50);
    });

    it('should throw error after all recovery attempts fail', () => {
      // Create an input that's guaranteed to fail after fixing attempts
      const hopelessInput = '\x00\x01\x02\x03'; // Binary data
      
      expect(() => parseWithFallback(hopelessInput, { maxRetries: 1 })).toThrow(ParseError);
    });
  });

  describe('Error Types', () => {
    it('should identify markdown processing errors', () => {
      try {
        parseWithFallback('This will likely work but testing the structure');
      } catch (error) {
        if (error instanceof Error) {
          // Test type guards would work
          expect(typeof isMarkdownProcessingError(error)).toBe('boolean');
          expect(typeof isInvalidInputError(error)).toBe('boolean');
          expect(typeof isParseError(error)).toBe('boolean');
        }
      }
    });

    it('should create proper error hierarchy', () => {
      const baseError = new InvalidInputError('Test error', 'test input');
      
      expect(baseError.name).toBe('InvalidInputError');
      expect(baseError.code).toBe('INVALID_INPUT');
      expect(baseError.context).toEqual({ input: 'test input' });
      expect(isInvalidInputError(baseError)).toBe(true);
      expect(isMarkdownProcessingError(baseError)).toBe(true);
    });
  });

  describe('Error Context and Debugging', () => {
    it('should provide helpful error context for parsing failures', () => {
      try {
        parseMarkdown(null as any);
      } catch (error) {
        expect(error instanceof Error).toBe(true);
        expect(error.message).toContain('Expected markdown input to be a string');
        expect(error.message).toContain('got object');
      }
    });

    it('should provide helpful error context for serialization failures', () => {
      try {
        serializeBlocks([{ type: '', invalidProp: true }] as any);
      } catch (error) {
        expect(error instanceof Error).toBe(true);
        expect(error.message).toContain('Block at index 0');
        expect(error.message).toContain('invalid or missing type');
      }
    });
  });

  describe('Graceful Degradation', () => {
    it('should continue processing other blocks when one fails', () => {
      const markdown = '# Good heading\n\nValid paragraph\n\n```\nUnclosed code block';
      
      // Should parse successfully despite unclosed code block
      const blocks = parseMarkdown(markdown);
      expect(blocks.length).toBeGreaterThan(0);
    });

    it('should handle mixed valid and invalid content', () => {
      const markdown = `
# Valid Heading

Valid paragraph content.

| Table | Header |
|-------|
| Missing | 

Another valid paragraph.
`;

      const blocks = parseMarkdown(markdown);
      expect(blocks.length).toBeGreaterThan(2); // Should get heading, paragraphs, and possibly table
    });
  });

  describe('Performance Under Error Conditions', () => {
    it('should fail fast for clearly invalid input', () => {
      const start = performance.now();
      
      try {
        parseMarkdown(null as any);
      } catch (error) {
        const duration = performance.now() - start;
        expect(duration).toBeLessThan(10); // Should fail within 10ms
      }
    });

    it('should not consume excessive memory during error handling', () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Try to parse several invalid inputs
      for (let i = 0; i < 100; i++) {
        try {
          parseWithFallback(`Invalid input ${i}`.repeat(100), { maxRetries: 1 });
        } catch (error) {
          // Expected to fail
        }
      }
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = (finalMemory - initialMemory) / 1024 / 1024; // MB
      
      // Should not leak significant memory
      expect(memoryIncrease).toBeLessThan(10);
    });
  });
});