/**
 * Core types for the SlashMD Markdown Processing Library
 * Based on SHARED_TYPES.ts for cross-chunk compatibility
 */

export interface SourceRange {
  /** Character offset from start of document */
  start: number;
  /** Character offset from start of document */
  end: number;
}

export interface Block {
  /** Stable ID for UI binding and cross-references */
  id: string;
  /** Block type identifier */
  type: BlockType;
  /** Position in source Markdown document */
  sourceRange: SourceRange;
  /** Type-specific content data */
  content: BlockContent;
  /** Nested blocks (for lists, toggles, etc.) */
  children?: Block[];
}

export type BlockType = 
  | 'paragraph'
  | 'heading'
  | 'list'
  | 'listItem' 
  | 'taskList'
  | 'taskItem'
  | 'quote'
  | 'code'
  | 'divider'
  | 'table'
  | 'image'
  | 'link'
  | 'callout'
  | 'toggle';

// ============================================================================
// BLOCK CONTENT DEFINITIONS (Phase 1: Focus on paragraph, heading, divider)
// ============================================================================

export interface ParagraphContent {
  text: string;
  /** Inline formatting markers */
  formatting?: InlineFormatting[];
}

export interface HeadingContent {
  level: 1 | 2 | 3;
  text: string;
  formatting?: InlineFormatting[];
}

export interface DividerContent {
  // No properties - just a horizontal rule
}

// Placeholder interfaces for future phases
export interface ListContent {
  ordered: boolean;
  startNumber?: number;
}

export interface ListItemContent {
  text: string;
  formatting?: InlineFormatting[];
  indent: number;
}

export interface TaskListContent {
  // No additional properties, uses children
}

export interface TaskItemContent {
  checked: boolean;
  text: string;
  formatting?: InlineFormatting[];
  indent: number;
}

export interface QuoteContent {
  text: string;
  formatting?: InlineFormatting[];
}

export interface CodeContent {
  language: string;
  code: string;
  showLineNumbers?: boolean;
}

export interface TableContent {
  headers: TableCell[];
  rows: TableCell[][];
  alignments?: Array<'left' | 'center' | 'right' | null>;
}

export interface TableCell {
  text: string;
  formatting?: InlineFormatting[];
}

export interface ImageContent {
  src: string;
  alt: string;
  title?: string;
  dimensions?: { width?: number; height?: number };
}

export interface LinkContent {
  text: string;
  href: string;
  title?: string;
}

export interface CalloutContent {
  type: 'note' | 'tip' | 'warning' | 'danger' | 'info';
  title?: string;
  text: string;
  formatting?: InlineFormatting[];
}

export interface ToggleContent {
  summary: string;
  collapsed?: boolean;
}

export type BlockContent = 
  | ParagraphContent
  | HeadingContent
  | DividerContent
  | ListContent
  | ListItemContent
  | TaskListContent
  | TaskItemContent
  | QuoteContent
  | CodeContent
  | TableContent
  | ImageContent
  | LinkContent
  | CalloutContent
  | ToggleContent;

// ============================================================================
// INLINE FORMATTING
// ============================================================================

export interface InlineFormatting {
  /** Start position within text content */
  start: number;
  /** End position within text content */
  end: number;
  /** Formatting type */
  type: 'bold' | 'italic' | 'strikethrough' | 'code' | 'link';
  /** Additional data for links */
  data?: {
    href?: string;
    title?: string;
  };
}

// ============================================================================
// DOCUMENT CHANGE TRACKING
// ============================================================================

export interface TextEdit {
  /** Character offset in document */
  start: number;
  /** Character offset in document */
  end: number;
  /** Replacement text */
  newText: string;
}

export interface DocumentChange {
  /** Range in the original document that changed */
  range: SourceRange;
  /** New text for this range */
  text: string;
}