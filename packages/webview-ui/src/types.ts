// VS Code API type for webview
import { z } from 'zod';

declare global {
  interface Window {
    acquireVsCodeApi: () => VsCodeApi;
  }
}

export interface VsCodeApi {
  postMessage(message: UIToHostMessage): void;
  getState(): unknown;
  setState(state: unknown): void;
}

// =============================================================================
// ZOD SCHEMAS - Runtime validation
// =============================================================================

export const TextEditSchema = z.object({
  start: z.number().int().min(0),
  end: z.number().int().min(0),
  newText: z.string().max(10_000_000),
});

// Code theme options
export const CodeThemeSchema = z.enum(['auto', 'dark', 'light', 'github-dark', 'github-light', 'monokai']);

// Image path resolution options
export const ImagePathResolutionSchema = z.enum(['document', 'workspace']);

// Theme overrides - CSS variable values
export const ThemeOverridesSchema = z.record(z.string(), z.string());

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
// TYPESCRIPT TYPES
// =============================================================================

export type TextEdit = z.infer<typeof TextEditSchema>;
export type CodeTheme = z.infer<typeof CodeThemeSchema>;
export type ImagePathResolution = z.infer<typeof ImagePathResolutionSchema>;
export type ThemeOverrides = z.infer<typeof ThemeOverridesSchema>;
export type SlashMDSettings = z.infer<typeof SlashMDSettingsSchema>;
export type HostToUIMessage = z.infer<typeof HostToUIMessageSchema>;

// UI → Host messages (outgoing, don't need validation)
export type UIToHostMessage =
  | { type: 'APPLY_TEXT_EDITS'; edits: TextEdit[]; reason: 'typing' | 'drag' | 'paste' | 'format' }
  | { type: 'WRITE_ASSET'; dataUri: string; suggestedName?: string }
  | { type: 'REQUEST_INIT' }
  | { type: 'REQUEST_SETTINGS' }
  | { type: 'OPEN_LINK'; url: string };

// =============================================================================
// VALIDATION HELPER
// =============================================================================

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
