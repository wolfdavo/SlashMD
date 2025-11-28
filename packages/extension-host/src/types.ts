import * as vscode from 'vscode';

export interface SlashMDSettings {
  assetsFolder: string;
  formatWrap: number;
  calloutsStyle: 'admonition' | 'emoji';
  togglesSyntax: 'details' | 'list';
  mathEnabled: boolean;
  mermaidEnabled: boolean;
}

export function getSettings(): SlashMDSettings {
  const config = vscode.workspace.getConfiguration('slashmd');
  return {
    assetsFolder: config.get<string>('assets.folder', 'assets'),
    formatWrap: config.get<number>('format.wrap', 0),
    calloutsStyle: config.get<'admonition' | 'emoji'>('callouts.style', 'admonition'),
    togglesSyntax: config.get<'details' | 'list'>('toggles.syntax', 'details'),
    mathEnabled: config.get<boolean>('math.enabled', false),
    mermaidEnabled: config.get<boolean>('mermaid.enabled', false),
  };
}
