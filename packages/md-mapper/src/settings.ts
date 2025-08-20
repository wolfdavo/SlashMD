/**
 * Settings system for configurable parser behavior
 * Phase 3: Custom syntax settings and preferences
 */

export interface MarkdownProcessorSettings {
  /** Callout syntax style preference */
  calloutsStyle: 'admonition' | 'emoji';
  /** Toggle syntax preference */
  togglesSyntax: 'details' | 'list';
  /** Line wrap width for serialization (0 = no wrap) */
  wrapWidth: number;
  /** Whether to preserve original formatting when possible */
  preserveFormatting: boolean;
}

/**
 * Default settings for the markdown processor
 */
export const DEFAULT_SETTINGS: MarkdownProcessorSettings = {
  calloutsStyle: 'admonition',
  togglesSyntax: 'details',
  wrapWidth: 0,
  preserveFormatting: true
};

/**
 * Settings manager for the parser and serializer
 */
export class SettingsManager {
  private settings: MarkdownProcessorSettings;

  constructor(settings: Partial<MarkdownProcessorSettings> = {}) {
    this.settings = { ...DEFAULT_SETTINGS, ...settings };
  }

  /**
   * Get current settings
   */
  getSettings(): MarkdownProcessorSettings {
    return { ...this.settings };
  }

  /**
   * Update settings
   */
  updateSettings(newSettings: Partial<MarkdownProcessorSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
  }

  /**
   * Get callout style preference
   */
  getCalloutStyle(): 'admonition' | 'emoji' {
    return this.settings.calloutsStyle;
  }

  /**
   * Get toggle syntax preference
   */
  getToggleSyntax(): 'details' | 'list' {
    return this.settings.togglesSyntax;
  }

  /**
   * Get wrap width for serialization
   */
  getWrapWidth(): number {
    return this.settings.wrapWidth;
  }

  /**
   * Should preserve original formatting
   */
  shouldPreserveFormatting(): boolean {
    return this.settings.preserveFormatting;
  }
}

/**
 * Global settings instance (can be overridden)
 */
export const globalSettings = new SettingsManager();

/**
 * Configure global settings
 */
export function configureSettings(settings: Partial<MarkdownProcessorSettings>): void {
  globalSettings.updateSettings(settings);
}

/**
 * Get current global settings
 */
export function getSettings(): MarkdownProcessorSettings {
  return globalSettings.getSettings();
}