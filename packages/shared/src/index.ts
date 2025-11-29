// Messaging protocol between UI (webview) and Host (extension)

export interface TextEdit {
  start: number;
  end: number;
  newText: string;
}

// UI → Host messages
export type UIToHostMessage =
  | { type: 'APPLY_TEXT_EDITS'; edits: TextEdit[]; reason: 'typing' | 'drag' | 'paste' | 'format' }
  | { type: 'WRITE_ASSET'; dataUri: string; suggestedName?: string }
  | { type: 'REQUEST_INIT' }
  | { type: 'REQUEST_SETTINGS' };

// Host → UI messages
export type HostToUIMessage =
  | { type: 'DOC_INIT'; text: string; settings: SlashMDSettings; assetBaseUri?: string }
  | { type: 'DOC_CHANGED'; text: string; range?: { start: number; end: number } }
  | { type: 'ASSET_WRITTEN'; relPath: string; webviewUri?: string }
  | { type: 'SETTINGS_CHANGED'; settings: SlashMDSettings }
  | { type: 'ERROR'; message: string };

// Extension settings
export interface SlashMDSettings {
  assetsFolder: string;
  formatWrap: number;
  calloutsStyle: 'admonition' | 'emoji';
  togglesSyntax: 'details' | 'list';
  mathEnabled: boolean;
  mermaidEnabled: boolean;
}

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
