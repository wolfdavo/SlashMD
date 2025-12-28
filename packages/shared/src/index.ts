// Messaging protocol between UI (webview) and Host (extension)
import { z } from 'zod';

// =============================================================================
// ZOD SCHEMAS - Runtime validation
// =============================================================================

// Text edit schema with validation
export const TextEditSchema = z.object({
  start: z.number().int().min(0),
  end: z.number().int().min(0),
  newText: z.string().max(10_000_000), // 10MB limit for text content
});

// Code theme options
export const CodeThemeSchema = z.enum(['auto', 'dark', 'light', 'github-dark', 'github-light', 'monokai']);

// Image path resolution options
export const ImagePathResolutionSchema = z.enum(['document', 'workspace']);

// Theme overrides - CSS variable values sent to webview
export const ThemeOverridesSchema = z.record(z.string(), z.string());

// Settings schema
export const SlashMDSettingsSchema = z.object({
  assetsFolder: z.string().max(256),
  imagePathResolution: ImagePathResolutionSchema,
  formatWrap: z.number().int().min(0).max(1000),
  calloutsStyle: z.enum(['admonition', 'emoji']),
  togglesSyntax: z.enum(['details', 'list']),
  mathEnabled: z.boolean(),
  mermaidEnabled: z.boolean(),
  codeTheme: CodeThemeSchema,
  headingColor: z.string().max(64),
  h1Color: z.string().max(64),
  h2Color: z.string().max(64),
  h3Color: z.string().max(64),
  h4Color: z.string().max(64),
  h5Color: z.string().max(64),
  h1Indent: z.string().max(64),
  h2Indent: z.string().max(64),
  h3Indent: z.string().max(64),
  h4Indent: z.string().max(64),
  h5Indent: z.string().max(64),
  boldColor: z.string().max(64),
  italicColor: z.string().max(64),
});

// UI → Host message schemas
export const ApplyTextEditsMessageSchema = z.object({
  type: z.literal('APPLY_TEXT_EDITS'),
  edits: z.array(TextEditSchema).max(10000),
  reason: z.enum(['typing', 'drag', 'paste', 'format']),
});

export const WriteAssetMessageSchema = z.object({
  type: z.literal('WRITE_ASSET'),
  dataUri: z.string().max(50_000_000), // 50MB limit for data URIs
  suggestedName: z.string().max(256).optional(),
});

export const RequestInitMessageSchema = z.object({
  type: z.literal('REQUEST_INIT'),
});

export const RequestSettingsMessageSchema = z.object({
  type: z.literal('REQUEST_SETTINGS'),
});

export const UIToHostMessageSchema = z.discriminatedUnion('type', [
  ApplyTextEditsMessageSchema,
  WriteAssetMessageSchema,
  RequestInitMessageSchema,
  RequestSettingsMessageSchema,
]);

// Host → UI message schemas
export const DocInitMessageSchema = z.object({
  type: z.literal('DOC_INIT'),
  text: z.string(),
  settings: SlashMDSettingsSchema,
  assetBaseUri: z.string().optional(),
  documentDirUri: z.string().optional(),
  themeOverrides: ThemeOverridesSchema.optional(),
});

export const DocChangedMessageSchema = z.object({
  type: z.literal('DOC_CHANGED'),
  text: z.string(),
  range: z.object({
    start: z.number().int().min(0),
    end: z.number().int().min(0),
  }).optional(),
});

export const AssetWrittenMessageSchema = z.object({
  type: z.literal('ASSET_WRITTEN'),
  relPath: z.string().max(1024),
  webviewUri: z.string().optional(),
});

export const SettingsChangedMessageSchema = z.object({
  type: z.literal('SETTINGS_CHANGED'),
  settings: SlashMDSettingsSchema,
  themeOverrides: ThemeOverridesSchema.optional(),
});

export const ErrorMessageSchema = z.object({
  type: z.literal('ERROR'),
  message: z.string().max(10000),
});

export const HostToUIMessageSchema = z.discriminatedUnion('type', [
  DocInitMessageSchema,
  DocChangedMessageSchema,
  AssetWrittenMessageSchema,
  SettingsChangedMessageSchema,
  ErrorMessageSchema,
]);

// =============================================================================
// TYPESCRIPT TYPES - Inferred from schemas
// =============================================================================

export type TextEdit = z.infer<typeof TextEditSchema>;
export type CodeTheme = z.infer<typeof CodeThemeSchema>;
export type ImagePathResolution = z.infer<typeof ImagePathResolutionSchema>;
export type ThemeOverrides = z.infer<typeof ThemeOverridesSchema>;
export type SlashMDSettings = z.infer<typeof SlashMDSettingsSchema>;
export type UIToHostMessage = z.infer<typeof UIToHostMessageSchema>;
export type HostToUIMessage = z.infer<typeof HostToUIMessageSchema>;

// Individual message types
export type ApplyTextEditsMessage = z.infer<typeof ApplyTextEditsMessageSchema>;
export type WriteAssetMessage = z.infer<typeof WriteAssetMessageSchema>;
export type RequestInitMessage = z.infer<typeof RequestInitMessageSchema>;
export type RequestSettingsMessage = z.infer<typeof RequestSettingsMessageSchema>;
export type DocInitMessage = z.infer<typeof DocInitMessageSchema>;
export type DocChangedMessage = z.infer<typeof DocChangedMessageSchema>;
export type AssetWrittenMessage = z.infer<typeof AssetWrittenMessageSchema>;
export type SettingsChangedMessage = z.infer<typeof SettingsChangedMessageSchema>;
export type ErrorMessage = z.infer<typeof ErrorMessageSchema>;

// =============================================================================
// VALIDATION HELPERS
// =============================================================================

export function validateUIToHostMessage(data: unknown): UIToHostMessage | null {
  const result = UIToHostMessageSchema.safeParse(data);
  if (!result.success) {
    console.error('SlashMD: Invalid UI→Host message:', result.error.message);
    return null;
  }
  return result.data;
}

export function validateHostToUIMessage(data: unknown): HostToUIMessage | null {
  const result = HostToUIMessageSchema.safeParse(data);
  if (!result.success) {
    console.error('SlashMD: Invalid Host→UI message:', result.error.message);
    return null;
  }
  return result.data;
}

// =============================================================================
// OTHER TYPES
// =============================================================================

// Block types supported in the editor
export type BlockType =
  | 'paragraph'
  | 'heading1'
  | 'heading2'
  | 'heading3'
  | 'bulletList'
  | 'numberedList'
  | 'todoList'
  | 'quote'
  | 'code'
  | 'divider'
  | 'image'
  | 'table'
  | 'toggle'
  | 'callout'
  | 'link';

// Callout types
export type CalloutType = 'note' | 'tip' | 'warning' | 'important' | 'caution';
