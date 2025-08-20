/**
 * Shared TypeScript interfaces for SlashMD cross-chunk compatibility
 * This file defines the contracts between chunks to ensure they integrate properly
 */

// ============================================================================
// CORE BLOCK DATA STRUCTURES (Used by all chunks)
// ============================================================================

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
// BLOCK CONTENT DEFINITIONS
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
// MESSAGING PROTOCOL (WebView ↔ Extension Host)
// ============================================================================

export interface TextEdit {
  /** Character offset in document */
  start: number;
  /** Character offset in document */
  end: number;
  /** Replacement text */
  newText: string;
}

// Messages from WebView to Extension Host
export type UIToHostMessage =
  | {
      type: 'APPLY_TEXT_EDITS';
      payload: {
        edits: TextEdit[];
        reason: 'typing' | 'drag' | 'paste' | 'format' | 'convert';
        /** Block IDs that were affected */
        affectedBlocks: string[];
      };
    }
  | {
      type: 'WRITE_ASSET';
      payload: {
        dataUri: string;
        suggestedName?: string;
        /** Block ID that will receive the image */
        targetBlockId?: string;
      };
    }
  | {
      type: 'REQUEST_INIT';
      payload: {};
    }
  | {
      type: 'REQUEST_SETTINGS';
      payload: {};
    }
  | {
      type: 'LOG_ERROR';
      payload: {
        error: string;
        context?: any;
      };
    };

// Messages from Extension Host to WebView
export type HostToUIMessage =
  | {
      type: 'DOC_INIT';
      payload: {
        blocks: Block[];
        settings: SlashMDSettings;
        theme: 'light' | 'dark' | 'high-contrast';
      };
    }
  | {
      type: 'DOC_CHANGED';
      payload: {
        blocks: Block[];
        /** Ranges that changed in the document */
        changeRanges?: Array<{ start: number; end: number }>;
        /** Whether to preserve current selection */
        preserveSelection: boolean;
      };
    }
  | {
      type: 'ASSET_WRITTEN';
      payload: {
        /** Relative path to the written asset */
        relPath: string;
        /** Block ID that requested the asset */
        targetBlockId?: string;
      };
    }
  | {
      type: 'SETTINGS_CHANGED';
      payload: {
        settings: SlashMDSettings;
      };
    }
  | {
      type: 'ERROR';
      payload: {
        message: string;
        recoverable: boolean;
      };
    };

// ============================================================================
// SETTINGS CONFIGURATION
// ============================================================================

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

// ============================================================================
// MARKDOWN PROCESSOR API (Chunk 1)
// ============================================================================

export interface MarkdownProcessor {
  /** Parse Markdown text into block structure */
  parseMarkdown(markdown: string): Block[];
  
  /** Serialize blocks back to Markdown text */
  serializeBlocks(blocks: Block[]): string;
  
  /** Update blocks based on external document changes */
  updateBlocks(blocks: Block[], changes: DocumentChange[]): Block[];
  
  /** Get settings for parser behavior */
  getSettings(): MarkdownProcessorSettings;
}

export interface DocumentChange {
  /** Range in the original document that changed */
  range: SourceRange;
  /** New text for this range */
  text: string;
}

export interface MarkdownProcessorSettings {
  /** Callout syntax style */
  calloutsStyle: 'admonition' | 'emoji';
  /** Toggle syntax preference */
  togglesSyntax: 'details' | 'list';
  /** Line wrap width */
  wrapWidth: number;
}

// ============================================================================
// LEXICAL EDITOR API (Chunk 2)  
// ============================================================================

export interface LexicalEditorProps {
  /** Initial block data */
  blocks: Block[];
  /** Configuration settings */
  settings: SlashMDSettings;
  /** Theme preference */
  theme: 'light' | 'dark' | 'high-contrast';
  /** Callback when blocks change */
  onChange: (blocks: Block[], edits: TextEdit[]) => void;
  /** Callback for asset requests */
  onAssetRequest: (dataUri: string, suggestedName?: string) => void;
}

export interface BlockTransform {
  /** Source block ID */
  blockId: string;
  /** New block type */
  targetType: BlockType;
  /** Additional data for the transformation */
  data?: any;
}

// ============================================================================
// VS CODE EXTENSION API (Chunk 3)
// ============================================================================

export interface CustomEditorContext {
  /** VS Code TextDocument */
  document: any; // vscode.TextDocument
  /** WebView panel */
  webviewPanel: any; // vscode.WebviewPanel  
  /** Extension context */
  extensionContext: any; // vscode.ExtensionContext
}

export interface AssetWriteResult {
  /** Relative path to written file */
  relPath: string;
  /** Full URI to written file */
  fullUri: string;
  /** Whether this was a duplicate (deduplicated) */
  wasDuplicate: boolean;
}

// ============================================================================
// INTEGRATION SYNC ENGINE API (Chunk 4)
// ============================================================================

export interface SyncEngine {
  /** Initialize with document and WebView */
  initialize(context: CustomEditorContext): void;
  
  /** Handle changes from the WebView */
  handleUIChange(message: UIToHostMessage): Promise<void>;
  
  /** Handle external document changes */  
  handleDocumentChange(changes: DocumentChange[]): Promise<void>;
  
  /** Get current block state */
  getCurrentBlocks(): Block[];
  
  /** Force full resync */
  forceResync(): Promise<void>;
}

export interface SyncConflictError extends Error {
  /** The conflicting changes */
  conflicts: Array<{
    blockId: string;
    uiChange: any;
    docChange: any;
  }>;
  
  /** Suggested resolution strategy */
  suggestedResolution: 'prefer-ui' | 'prefer-doc' | 'manual';
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export interface Position {
  line: number;
  character: number;
}

export interface Range {
  start: Position;
  end: Position;
}

/** Converts character offset to line/character position */
export function offsetToPosition(text: string, offset: number): Position {
  const lines = text.substring(0, offset).split('\n');
  return {
    line: lines.length - 1,
    character: lines[lines.length - 1].length
  };
}

/** Converts line/character position to character offset */
export function positionToOffset(text: string, position: Position): number {
  const lines = text.split('\n');
  let offset = 0;
  
  for (let i = 0; i < position.line && i < lines.length; i++) {
    offset += lines[i].length + 1; // +1 for newline
  }
  
  return offset + Math.min(position.character, lines[position.line]?.length || 0);
}