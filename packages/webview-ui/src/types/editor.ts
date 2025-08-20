/**
 * Editor state and configuration types
 */

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

export interface TextEdit {
  /** Character offset in document */
  start: number;
  /** Character offset in document */
  end: number;
  /** Replacement text */
  newText: string;
}

export type Theme = 'light' | 'dark' | 'high-contrast';