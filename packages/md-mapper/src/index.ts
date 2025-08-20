/**
 * @slashmd/md-mapper - Standalone Markdown to Block conversion library
 * Phase 1: Foundation & Core Infrastructure
 */

// Core types
export * from './types';

// Main API functions
export { parseMarkdown } from './parser';
export { serializeBlocks, escapeMarkdownText, needsEscaping } from './serializer';

// Phase 4: Performance-optimized parsing
export { 
  parseMarkdownOptimized, 
  parseMarkdownAdaptive, 
  benchmarkParsing 
} from './parser-optimized';
export * from './performance';

// Utilities
export { 
  createSourceRange,
  containsRange,
  rangesOverlap,
  mergeRanges,
  adjustRangeAfterEdit,
  offsetToPosition,
  extractRangeText
} from './ranges';

export { 
  generateBlockId,
  ensureUniqueId,
  assignBlockIds
} from './ids';

// Phase 3: Full incremental updates implementation
export { updateBlocks, textEditToDocumentChange, batchTextEdits } from './incremental';
export * from './settings';

// Phase 4: Enhanced error handling and validation
export {
  MarkdownProcessingError,
  InvalidInputError,
  ParseError,
  SerializationError,
  ValidationError,
  safeParseMarkdown,
  safeSerializeBlocks,
  parseWithFallback,
  RECOVERY_STRATEGIES,
  isMarkdownProcessingError,
  isInvalidInputError,
  isParseError,
  isSerializationError,
  isValidationError
} from './errors';

/**
 * Library version and metadata
 */
export const VERSION = '0.4.0';
export const SUPPORTED_BLOCK_TYPES = [
  'paragraph', 
  'heading', 
  'divider',
  'list',
  'listItem',
  'taskList', 
  'taskItem',
  'quote',
  'code',
  'table',
  'image',
  'link',
  'callout',
  'toggle'
] as const;

/**
 * Phase 3 completion notes
 */
export const PHASE3_NOTES = {
  supportedBlocks: [
    'paragraph', 
    'heading (1-3)', 
    'divider',
    'ordered and unordered lists with nesting',
    'task lists (GFM syntax)',
    'blockquotes',
    'fenced code blocks with language detection',
    'tables with alignment support',
    'images',
    'links',
    'callouts (admonition and emoji styles)',
    'toggles (<details><summary> syntax)'
  ],
  newFeatures: [
    'Callout parsing and serialization with configurable styles',
    'Toggle support with HTML details/summary syntax',
    'Configurable settings system for parser behavior',
    'Incremental updateBlocks() function implementation',
    'Enhanced stable ID generation'
  ],
  limitations: [
    'Inline formatting extraction still pending (Phase 4+)',
    'Full document context needed for optimal incremental updates',
    'Some edge cases in complex nested structures'
  ],
  nextPhase: 'Phase 4 will add comprehensive testing, performance optimization, and production polish'
} as const;