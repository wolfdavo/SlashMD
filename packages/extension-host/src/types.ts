/**
 * Type definitions for VS Code Extension - Integration Phase
 * Now using shared types from SHARED_TYPES.ts for consistency across chunks
 */

// Re-export shared types for consistency
export type {
  Block,
  BlockType,
  BlockContent,
  SourceRange,
  TextEdit,
  UIToHostMessage,
  HostToUIMessage,
  SlashMDSettings,
  InlineFormatting,
  DocumentChange,
  SyncEngine,
  CustomEditorContext,
  SyncConflictError
} from '../../../SHARED_TYPES';