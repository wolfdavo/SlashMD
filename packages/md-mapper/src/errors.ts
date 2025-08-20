/**
 * Error handling and validation utilities for SlashMD Markdown Processing
 * Phase 4: Production readiness with comprehensive error handling
 */

/**
 * Custom error classes for specific error scenarios
 */
export class MarkdownProcessingError extends Error {
  public readonly code: string;
  public readonly context?: any;

  constructor(message: string, code: string, context?: any) {
    super(message);
    this.name = 'MarkdownProcessingError';
    this.code = code;
    this.context = context;
  }
}

export class InvalidInputError extends MarkdownProcessingError {
  constructor(message: string, input?: any) {
    super(message, 'INVALID_INPUT', { input });
    this.name = 'InvalidInputError';
  }
}

export class ParseError extends MarkdownProcessingError {
  constructor(message: string, position?: number, markdown?: string) {
    super(message, 'PARSE_ERROR', { position, markdownLength: markdown?.length });
    this.name = 'ParseError';
  }
}

export class SerializationError extends MarkdownProcessingError {
  constructor(message: string, block?: any) {
    super(message, 'SERIALIZATION_ERROR', { blockType: block?.type, blockId: block?.id });
    this.name = 'SerializationError';
  }
}

export class ValidationError extends MarkdownProcessingError {
  constructor(message: string, validationTarget?: any) {
    super(message, 'VALIDATION_ERROR', { validationTarget });
    this.name = 'ValidationError';
  }
}

/**
 * Input validation utilities
 */
export function validateMarkdownInput(input: unknown): asserts input is string {
  if (typeof input !== 'string') {
    throw new InvalidInputError(
      `Expected markdown input to be a string, got ${typeof input}`,
      input
    );
  }

  // Check for extremely large inputs that might cause performance issues
  const MAX_SIZE = 50 * 1024 * 1024; // 50MB limit
  if (input.length > MAX_SIZE) {
    throw new InvalidInputError(
      `Markdown input is too large: ${input.length} bytes (max: ${MAX_SIZE} bytes)`,
      { inputSize: input.length, maxSize: MAX_SIZE }
    );
  }
}

export function validateBlocksInput(input: unknown): asserts input is any[] {
  if (!Array.isArray(input)) {
    throw new InvalidInputError(
      `Expected blocks to be an array, got ${typeof input}`,
      input
    );
  }
}

export function validateBlock(block: any, index?: number): void {
  if (!block || typeof block !== 'object') {
    throw new ValidationError(
      `Block at index ${index ?? 'unknown'} is not a valid object`,
      block
    );
  }

  if (typeof block.id !== 'string' || !block.id) {
    throw new ValidationError(
      `Block at index ${index ?? 'unknown'} has invalid or missing id`,
      block
    );
  }

  if (typeof block.type !== 'string' || !block.type) {
    throw new ValidationError(
      `Block at index ${index ?? 'unknown'} has invalid or missing type`,
      block
    );
  }

  if (!block.sourceRange || typeof block.sourceRange !== 'object') {
    throw new ValidationError(
      `Block at index ${index ?? 'unknown'} has invalid or missing sourceRange`,
      block
    );
  }

  const { sourceRange } = block;
  if (typeof sourceRange.start !== 'number' || 
      typeof sourceRange.end !== 'number' ||
      sourceRange.start < 0 ||
      sourceRange.end < sourceRange.start) {
    throw new ValidationError(
      `Block at index ${index ?? 'unknown'} has invalid sourceRange: start=${sourceRange.start}, end=${sourceRange.end}`,
      block
    );
  }

  if (block.content === undefined || block.content === null) {
    throw new ValidationError(
      `Block at index ${index ?? 'unknown'} has missing content`,
      block
    );
  }
}

/**
 * Safe parsing wrapper that provides better error context
 */
export function safeParseMarkdown(
  markdown: string, 
  options: { throwOnError?: boolean; maxRetries?: number } = {}
): { blocks?: any[]; error?: Error } {
  const { throwOnError = true } = options;
  
  try {
    validateMarkdownInput(markdown);
    
    // Import here to avoid circular dependencies
    const { parseMarkdown } = require('./parser');
    const blocks = parseMarkdown(markdown);
    
    // Validate the output
    validateBlocksInput(blocks);
    blocks.forEach((block, index) => validateBlock(block, index));
    
    return { blocks };
  } catch (error) {
    const enhancedError = enhanceError(error, { markdown, operation: 'parse' });
    
    if (throwOnError) {
      throw enhancedError;
    }
    
    return { error: enhancedError };
  }
}

/**
 * Safe serialization wrapper with error handling
 */
export function safeSerializeBlocks(
  blocks: any[], 
  options: { throwOnError?: boolean } = {}
): { markdown?: string; error?: Error } {
  const { throwOnError = true } = options;
  
  try {
    validateBlocksInput(blocks);
    blocks.forEach((block, index) => validateBlock(block, index));
    
    // Import here to avoid circular dependencies
    const { serializeBlocks } = require('./serializer');
    const markdown = serializeBlocks(blocks);
    
    if (typeof markdown !== 'string') {
      throw new SerializationError(
        `Serialization produced invalid output: expected string, got ${typeof markdown}`
      );
    }
    
    return { markdown };
  } catch (error) {
    const enhancedError = enhanceError(error, { blocks, operation: 'serialize' });
    
    if (throwOnError) {
      throw enhancedError;
    }
    
    return { error: enhancedError };
  }
}

/**
 * Enhance errors with additional context information
 */
function enhanceError(error: unknown, context: any): Error {
  if (error instanceof Error) {
    // Add context to existing error
    if (error instanceof MarkdownProcessingError) {
      (error as any).context = { ...error.context, ...context };
      return error;
    }
    
    // Wrap other errors in MarkdownProcessingError
    return new MarkdownProcessingError(
      error.message,
      'WRAPPED_ERROR',
      { originalError: error, ...context }
    );
  }
  
  // Handle non-Error objects
  return new MarkdownProcessingError(
    `Unknown error occurred: ${String(error)}`,
    'UNKNOWN_ERROR',
    { originalError: error, ...context }
  );
}

/**
 * Recovery strategies for common parsing issues
 */
export const RECOVERY_STRATEGIES = {
  /**
   * Attempt to fix common markdown formatting issues
   */
  fixCommonIssues(markdown: string): string {
    let fixed = markdown;
    
    // Fix headings without spaces after #
    fixed = fixed.replace(/^(#+)([^\s#])/gm, '$1 $2');
    
    // Fix task lists with missing spaces
    fixed = fixed.replace(/^(\s*-)\s*\[([xX\s])\]([^\s])/gm, '$1 [$2] $3');
    
    // Fix unclosed code blocks by adding closing fence
    const openCodeBlocks = (fixed.match(/```/g) || []).length;
    if (openCodeBlocks % 2 !== 0) {
      fixed += '\n```\n';
    }
    
    // Fix malformed table separators
    fixed = fixed.replace(/^\|[\s-]*\|$/gm, (match) => {
      const cols = (match.match(/\|/g) || []).length - 1;
      return '|' + ' --- |'.repeat(cols);
    });
    
    return fixed;
  },

  /**
   * Split document into smaller chunks for processing
   */
  chunkDocument(markdown: string, maxChunkSize: number = 1024 * 1024): string[] {
    if (markdown.length <= maxChunkSize) {
      return [markdown];
    }
    
    const chunks: string[] = [];
    let current = 0;
    
    while (current < markdown.length) {
      let end = Math.min(current + maxChunkSize, markdown.length);
      
      // Try to break at a natural boundary (double newline)
      if (end < markdown.length) {
        const lastBreak = markdown.lastIndexOf('\n\n', end);
        if (lastBreak > current + maxChunkSize / 2) {
          end = lastBreak + 2;
        }
      }
      
      chunks.push(markdown.slice(current, end));
      current = end;
    }
    
    return chunks;
  }
};

/**
 * Graceful degradation for parsing failures
 */
export function parseWithFallback(
  markdown: string,
  options: { 
    enableRecovery?: boolean; 
    maxRetries?: number;
    chunkLargeDocuments?: boolean;
  } = {}
): any[] {
  const { 
    enableRecovery = true, 
    maxRetries = 2,
    chunkLargeDocuments = true 
  } = options;
  
  // First attempt - direct parsing
  const directResult = safeParseMarkdown(markdown, { throwOnError: false });
  if (directResult.blocks) {
    return directResult.blocks;
  }
  
  if (!enableRecovery) {
    throw directResult.error;
  }
  
  let attempts = 0;
  let lastError = directResult.error;
  
  // Recovery attempt 1: Fix common issues
  if (attempts < maxRetries) {
    attempts++;
    try {
      const fixedMarkdown = RECOVERY_STRATEGIES.fixCommonIssues(markdown);
      const recoveryResult = safeParseMarkdown(fixedMarkdown, { throwOnError: false });
      if (recoveryResult.blocks) {
        console.warn(`Markdown parsing recovered after fixing common issues (attempt ${attempts})`);
        return recoveryResult.blocks;
      }
      lastError = recoveryResult.error || lastError;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
    }
  }
  
  // Recovery attempt 2: Chunk large documents
  if (attempts < maxRetries && chunkLargeDocuments && markdown.length > 1024 * 1024) {
    attempts++;
    try {
      const chunks = RECOVERY_STRATEGIES.chunkDocument(markdown);
      const allBlocks: any[] = [];
      
      for (const chunk of chunks) {
        const chunkResult = safeParseMarkdown(chunk, { throwOnError: false });
        if (chunkResult.blocks) {
          allBlocks.push(...chunkResult.blocks);
        } else {
          // If any chunk fails, abandon this strategy
          throw chunkResult.error;
        }
      }
      
      console.warn(`Markdown parsing recovered using document chunking (${chunks.length} chunks, attempt ${attempts})`);
      return allBlocks;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
    }
  }
  
  // All recovery attempts failed
  throw new ParseError(
    `Failed to parse markdown after ${attempts} recovery attempts. Last error: ${lastError?.message}`,
    undefined,
    markdown
  );
}

/**
 * Type guards for error checking
 */
export function isMarkdownProcessingError(error: unknown): error is MarkdownProcessingError {
  return error instanceof MarkdownProcessingError;
}

export function isInvalidInputError(error: unknown): error is InvalidInputError {
  return error instanceof InvalidInputError;
}

export function isParseError(error: unknown): error is ParseError {
  return error instanceof ParseError;
}

export function isSerializationError(error: unknown): error is SerializationError {
  return error instanceof SerializationError;
}

export function isValidationError(error: unknown): error is ValidationError {
  return error instanceof ValidationError;
}