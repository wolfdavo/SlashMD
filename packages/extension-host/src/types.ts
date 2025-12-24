import * as vscode from 'vscode';

export type CodeTheme = 'auto' | 'dark' | 'light' | 'github-dark' | 'github-light' | 'monokai';

export interface SlashMDSettings {
  assetsFolder: string;
  formatWrap: number;
  calloutsStyle: 'admonition' | 'emoji';
  togglesSyntax: 'details' | 'list';
  mathEnabled: boolean;
  mermaidEnabled: boolean;
  codeTheme: CodeTheme;
}

export type ThemeOverrides = Record<string, string>;

// Theme color presets for syntax highlighting
const THEME_PRESETS: Record<string, ThemeOverrides> = {
  dark: {
    '--slashmd-token-comment': '#6a9955',
    '--slashmd-token-punctuation': '#d4d4d4',
    '--slashmd-token-property': '#9cdcfe',
    '--slashmd-token-selector': '#ce9178',
    '--slashmd-token-operator': '#d4d4d4',
    '--slashmd-token-keyword': '#569cd6',
    '--slashmd-token-variable': '#4ec9b0',
    '--slashmd-token-function': '#dcdcaa',
  },
  light: {
    '--slashmd-token-comment': '#008000',
    '--slashmd-token-punctuation': '#000000',
    '--slashmd-token-property': '#001080',
    '--slashmd-token-selector': '#a31515',
    '--slashmd-token-operator': '#000000',
    '--slashmd-token-keyword': '#0000ff',
    '--slashmd-token-variable': '#267f99',
    '--slashmd-token-function': '#795e26',
  },
  'github-dark': {
    '--slashmd-token-comment': '#8b949e',
    '--slashmd-token-punctuation': '#c9d1d9',
    '--slashmd-token-property': '#79c0ff',
    '--slashmd-token-selector': '#a5d6ff',
    '--slashmd-token-operator': '#c9d1d9',
    '--slashmd-token-keyword': '#ff7b72',
    '--slashmd-token-variable': '#7ee787',
    '--slashmd-token-function': '#d2a8ff',
  },
  'github-light': {
    '--slashmd-token-comment': '#6e7781',
    '--slashmd-token-punctuation': '#24292f',
    '--slashmd-token-property': '#0550ae',
    '--slashmd-token-selector': '#0a3069',
    '--slashmd-token-operator': '#24292f',
    '--slashmd-token-keyword': '#cf222e',
    '--slashmd-token-variable': '#116329',
    '--slashmd-token-function': '#8250df',
  },
  monokai: {
    '--slashmd-token-comment': '#88846f',
    '--slashmd-token-punctuation': '#f8f8f2',
    '--slashmd-token-property': '#66d9ef',
    '--slashmd-token-selector': '#e6db74',
    '--slashmd-token-operator': '#f92672',
    '--slashmd-token-keyword': '#f92672',
    '--slashmd-token-variable': '#a6e22e',
    '--slashmd-token-function': '#a6e22e',
  },
};

export function getSettings(): SlashMDSettings {
  const config = vscode.workspace.getConfiguration('slashmd');
  return {
    assetsFolder: config.get<string>('assets.folder', 'assets'),
    formatWrap: config.get<number>('format.wrap', 0),
    calloutsStyle: config.get<'admonition' | 'emoji'>('callouts.style', 'admonition'),
    togglesSyntax: config.get<'details' | 'list'>('toggles.syntax', 'details'),
    mathEnabled: config.get<boolean>('math.enabled', false),
    mermaidEnabled: config.get<boolean>('mermaid.enabled', false),
    codeTheme: config.get<CodeTheme>('theme.codeTheme', 'auto'),
  };
}

/**
 * Get the effective theme based on settings and VS Code's active color theme
 */
function getEffectiveTheme(codeTheme: CodeTheme): 'dark' | 'light' | 'github-dark' | 'github-light' | 'monokai' {
  if (codeTheme === 'auto') {
    // Detect VS Code theme type
    const colorThemeKind = vscode.window.activeColorTheme.kind;
    // ColorThemeKind: 1 = Light, 2 = Dark, 3 = HighContrast, 4 = HighContrastLight
    if (colorThemeKind === vscode.ColorThemeKind.Light || colorThemeKind === vscode.ColorThemeKind.HighContrastLight) {
      return 'light';
    }
    return 'dark';
  }
  return codeTheme;
}

/**
 * Generate theme CSS variable overrides based on settings
 */
export function getThemeOverrides(settings: SlashMDSettings): ThemeOverrides {
  const effectiveTheme = getEffectiveTheme(settings.codeTheme);
  return THEME_PRESETS[effectiveTheme] || THEME_PRESETS.dark;
}
