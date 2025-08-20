/**
 * Block data structures and types for SlashMD editor
 * Adapted from SHARED_TYPES.ts for Phase 1 implementation
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

// Block Content Definitions
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

export interface ListContent {
  ordered: boolean;
  /** Starting number for ordered lists */
  startNumber?: number;
}

export interface ListItemContent {
  text: string;
  formatting?: InlineFormatting[];
  /** Nesting level (0-based) */
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
  /** Whether to show line numbers */
  showLineNumbers?: boolean;
}

export interface DividerContent {
  // No properties - just a horizontal rule
}

export interface TableContent {
  headers: TableCell[];
  rows: TableCell[][];
  /** Column alignments */
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
  /** Width/height if specified */
  dimensions?: { width?: number; height?: number };
}

export interface LinkContent {
  text: string;
  href: string;
  title?: string;
}

export interface CalloutContent {
  type: 'note' | 'tip' | 'warning' | 'danger' | 'info';
  /** Title text (optional) */
  title?: string;
  text: string;
  formatting?: InlineFormatting[];
}

export interface ToggleContent {
  /** Summary text (always visible) */
  summary: string;
  /** Whether toggle is collapsed in UI (not persisted to Markdown) */
  collapsed?: boolean;
}

export type BlockContent = 
  | ParagraphContent
  | HeadingContent
  | ListContent
  | ListItemContent
  | TaskListContent
  | TaskItemContent
  | QuoteContent
  | CodeContent
  | DividerContent
  | TableContent
  | ImageContent
  | LinkContent
  | CalloutContent
  | ToggleContent;

// Additional types needed by the application
export interface TextEdit {
  /** Character offset in document */
  start: number;
  /** Character offset in document */
  end: number;
  /** Replacement text */
  newText: string;
}

export interface SlashMDSettings {
  /** Folder for storing pasted/dropped images */
  assetsFolder: string;
  /** Markdown line wrap width (0 = no wrap) */
  wrapWidth: number;
  /** Callout syntax style */
  calloutsStyle: 'admonition' | 'emoji';
  /** Toggle syntax preference */
  togglesSyntax: 'details' | 'list';
  /** Theme density */
  themeDensity: 'compact' | 'comfortable';
  /** Whether to enable math rendering */
  mathEnabled: boolean;
  /** Whether to enable Mermaid diagrams */
  mermaidEnabled: boolean;
  /** Whether to show line numbers in code blocks */
  showLineNumbers: boolean;
}

// Inline Formatting
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