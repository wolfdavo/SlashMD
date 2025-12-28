import * as vscode from 'vscode';

export type CodeTheme = 'auto' | 'dark' | 'light' | 'github-dark' | 'github-light' | 'monokai';
export type ImagePathResolution = 'document' | 'workspace';

export interface SlashMDSettings {
  assetsFolder: string;
  imagePathResolution: ImagePathResolution;
  formatWrap: number;
  calloutsStyle: 'admonition' | 'emoji';
  togglesSyntax: 'details' | 'list';
  mathEnabled: boolean;
  mermaidEnabled: boolean;
  codeTheme: CodeTheme;
  headingColor: string;
  h1Color: string;
  h2Color: string;
  h3Color: string;
  h4Color: string;
  h5Color: string;
  h1Indent: string;
  h2Indent: string;
  h3Indent: string;
  h4Indent: string;
  h5Indent: string;
  boldColor: string;
  italicColor: string;
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
    imagePathResolution: config.get<ImagePathResolution>('assets.imagePathResolution', 'document'),
    formatWrap: config.get<number>('format.wrap', 0),
    calloutsStyle: config.get<'admonition' | 'emoji'>('callouts.style', 'admonition'),
    togglesSyntax: config.get<'details' | 'list'>('toggles.syntax', 'details'),
    mathEnabled: config.get<boolean>('math.enabled', false),
    mermaidEnabled: config.get<boolean>('mermaid.enabled', false),
    codeTheme: config.get<CodeTheme>('theme.codeTheme', 'auto'),
    headingColor: config.get<string>('theme.headingColor', ''),
    h1Color: config.get<string>('theme.h1Color', ''),
    h2Color: config.get<string>('theme.h2Color', ''),
    h3Color: config.get<string>('theme.h3Color', ''),
    h4Color: config.get<string>('theme.h4Color', ''),
    h5Color: config.get<string>('theme.h5Color', ''),
    h1Indent: config.get<string>('theme.h1Indent', ''),
    h2Indent: config.get<string>('theme.h2Indent', ''),
    h3Indent: config.get<string>('theme.h3Indent', ''),
    h4Indent: config.get<string>('theme.h4Indent', ''),
    h5Indent: config.get<string>('theme.h5Indent', ''),
    boldColor: config.get<string>('theme.boldColor', ''),
    italicColor: config.get<string>('theme.italicColor', ''),
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
  const overrides: ThemeOverrides = { ...(THEME_PRESETS[effectiveTheme] || THEME_PRESETS.dark) };

  // General heading color (kept for backwards compatibility)
  overrides['--slashmd-heading-color'] = settings.headingColor || 'inherit';

  // Per-level heading colors - specific color takes precedence, then general headingColor, then inherit
  overrides['--slashmd-h1-color'] = settings.h1Color || settings.headingColor || 'inherit';
  overrides['--slashmd-h2-color'] = settings.h2Color || settings.headingColor || 'inherit';
  overrides['--slashmd-h3-color'] = settings.h3Color || settings.headingColor || 'inherit';
  overrides['--slashmd-h4-color'] = settings.h4Color || settings.headingColor || 'inherit';
  overrides['--slashmd-h5-color'] = settings.h5Color || settings.headingColor || 'inherit';

  // Per-level heading indentation - use '0' as default to reset when cleared
  overrides['--slashmd-h1-indent'] = settings.h1Indent || '0';
  overrides['--slashmd-h2-indent'] = settings.h2Indent || '0';
  overrides['--slashmd-h3-indent'] = settings.h3Indent || '0';
  overrides['--slashmd-h4-indent'] = settings.h4Indent || '0';
  overrides['--slashmd-h5-indent'] = settings.h5Indent || '0';

  // Other typography colors
  overrides['--slashmd-bold-color'] = settings.boldColor || 'inherit';
  overrides['--slashmd-italic-color'] = settings.italicColor || 'inherit';

  return overrides;
}
