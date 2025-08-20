/**
 * Settings Manager for Phase 4: Commands, Settings & Asset Management
 * 
 * This service provides:
 * - Reactive VS Code settings integration
 * - Settings validation and type safety
 * - Configuration change notifications
 * - Settings migration and defaults handling
 * - Settings export/import functionality
 */

import * as vscode from 'vscode';
import { SlashMDSettings } from './types';

export interface SettingsChangeEvent {
  /** The affected setting keys */
  affectedKeys: string[];
  /** Previous settings values */
  previousSettings: SlashMDSettings;
  /** New settings values */
  currentSettings: SlashMDSettings;
  /** Configuration scope that changed */
  scope: vscode.ConfigurationTarget;
}

export class SettingsManager {
  private readonly changeEmitter = new vscode.EventEmitter<SettingsChangeEvent>();
  private previousSettings: SlashMDSettings;
  private readonly configSection = 'slashmd';

  /** Event fired when SlashMD settings change */
  public readonly onSettingsChange = this.changeEmitter.event;

  constructor(private readonly context: vscode.ExtensionContext) {
    this.previousSettings = this.getCurrentSettings();
    
    // Monitor configuration changes
    const configChangeSubscription = vscode.workspace.onDidChangeConfiguration(event => {
      this.handleConfigurationChange(event);
    });
    
    context.subscriptions.push(configChangeSubscription, this.changeEmitter);
    
    console.log('[SettingsManager] Initialized with settings:', this.previousSettings);
  }

  /**
   * Get current SlashMD settings with validation
   */
  getCurrentSettings(): SlashMDSettings {
    const config = vscode.workspace.getConfiguration(this.configSection);
    
    const settings: SlashMDSettings = {
      assetsFolder: this.validateAssetsFolder(config.get('assets.folder', 'assets')),
      wrapWidth: this.validateWrapWidth(config.get('format.wrap', 0)),
      calloutsStyle: this.validateCalloutsStyle(config.get('callouts.style', 'admonition')),
      togglesSyntax: this.validateTogglesSyntax(config.get('toggles.syntax', 'details')),
      themeDensity: this.validateThemeDensity(config.get('theme.density', 'comfortable')),
      mathEnabled: this.validateBoolean(config.get('math.enabled', false)),
      mermaidEnabled: this.validateBoolean(config.get('mermaid.enabled', false)),
      showLineNumbers: this.validateBoolean(config.get('showLineNumbers', false))
    };

    return settings;
  }

  /**
   * Update a specific setting with validation
   */
  async updateSetting<K extends keyof SlashMDSettings>(
    key: K,
    value: SlashMDSettings[K],
    scope: vscode.ConfigurationTarget = vscode.ConfigurationTarget.Global
  ): Promise<void> {
    try {
      // Validate the value before setting
      const validatedValue = this.validateSettingValue(key, value);
      
      // Convert setting key to configuration path
      const configKey = this.getConfigurationKey(key);
      
      const config = vscode.workspace.getConfiguration(this.configSection);
      await config.update(configKey, validatedValue, scope);
      
      console.log('[SettingsManager] Updated setting:', { key, value: validatedValue, scope });
    } catch (error) {
      console.error('[SettingsManager] Failed to update setting:', error);
      throw new Error(`Failed to update ${key}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Reset all settings to defaults
   */
  async resetToDefaults(scope: vscode.ConfigurationTarget = vscode.ConfigurationTarget.Global): Promise<void> {
    try {
      const config = vscode.workspace.getConfiguration(this.configSection);
      
      // Reset each setting by setting to undefined (removes custom value)
      await Promise.all([
        config.update('assets.folder', undefined, scope),
        config.update('format.wrap', undefined, scope),
        config.update('callouts.style', undefined, scope),
        config.update('toggles.syntax', undefined, scope),
        config.update('theme.density', undefined, scope),
        config.update('math.enabled', undefined, scope),
        config.update('mermaid.enabled', undefined, scope),
        config.update('showLineNumbers', undefined, scope)
      ]);
      
      console.log('[SettingsManager] Reset all settings to defaults');
    } catch (error) {
      console.error('[SettingsManager] Failed to reset settings:', error);
      throw new Error(`Failed to reset settings: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Export current settings as JSON
   */
  exportSettings(): string {
    const settings = this.getCurrentSettings();
    return JSON.stringify(settings, null, 2);
  }

  /**
   * Import settings from JSON
   */
  async importSettings(
    settingsJson: string,
    scope: vscode.ConfigurationTarget = vscode.ConfigurationTarget.Global
  ): Promise<void> {
    try {
      const settings = JSON.parse(settingsJson) as Partial<SlashMDSettings>;
      
      // Validate and update each setting
      for (const [key, value] of Object.entries(settings)) {
        if (key in this.getDefaultSettings()) {
          await this.updateSetting(key as keyof SlashMDSettings, value as any, scope);
        } else {
          console.warn('[SettingsManager] Skipping unknown setting:', key);
        }
      }
      
      console.log('[SettingsManager] Imported settings successfully');
    } catch (error) {
      console.error('[SettingsManager] Failed to import settings:', error);
      throw new Error(`Failed to import settings: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get setting schema for validation and UI generation
   */
  getSettingsSchema(): Record<keyof SlashMDSettings, {
    type: string;
    default: any;
    description: string;
    enum?: any[];
  }> {
    return {
      assetsFolder: {
        type: 'string',
        default: 'assets',
        description: 'Relative folder for pasted/dragged images'
      },
      wrapWidth: {
        type: 'integer',
        default: 0,
        description: 'Markdown wrap width (0 = no wrap)'
      },
      calloutsStyle: {
        type: 'string',
        default: 'admonition',
        description: 'Callout syntax style',
        enum: ['admonition', 'emoji']
      },
      togglesSyntax: {
        type: 'string',
        default: 'details',
        description: 'Toggle syntax preference',
        enum: ['details', 'list']
      },
      themeDensity: {
        type: 'string',
        default: 'comfortable',
        description: 'Theme density',
        enum: ['compact', 'comfortable']
      },
      mathEnabled: {
        type: 'boolean',
        default: false,
        description: 'Whether to enable math rendering'
      },
      mermaidEnabled: {
        type: 'boolean',
        default: false,
        description: 'Whether to enable Mermaid diagrams'
      },
      showLineNumbers: {
        type: 'boolean',
        default: false,
        description: 'Whether to show line numbers in code blocks'
      }
    };
  }

  /**
   * Handle VS Code configuration changes
   */
  private handleConfigurationChange(event: vscode.ConfigurationChangeEvent): void {
    if (!event.affectsConfiguration(this.configSection)) {
      return;
    }

    const currentSettings = this.getCurrentSettings();
    const affectedKeys = this.getAffectedKeys(this.previousSettings, currentSettings);
    
    if (affectedKeys.length > 0) {
      const changeEvent: SettingsChangeEvent = {
        affectedKeys,
        previousSettings: this.previousSettings,
        currentSettings,
        scope: vscode.ConfigurationTarget.Global // TODO: Detect actual scope
      };

      console.log('[SettingsManager] Settings changed:', changeEvent);
      
      this.previousSettings = currentSettings;
      this.changeEmitter.fire(changeEvent);
    }
  }

  /**
   * Get keys that changed between settings objects
   */
  private getAffectedKeys(previous: SlashMDSettings, current: SlashMDSettings): string[] {
    const affectedKeys: string[] = [];
    
    for (const key of Object.keys(current) as Array<keyof SlashMDSettings>) {
      if (previous[key] !== current[key]) {
        affectedKeys.push(key);
      }
    }
    
    return affectedKeys;
  }

  /**
   * Get default settings values
   */
  private getDefaultSettings(): SlashMDSettings {
    return {
      assetsFolder: 'assets',
      wrapWidth: 0,
      calloutsStyle: 'admonition',
      togglesSyntax: 'details',
      themeDensity: 'comfortable',
      mathEnabled: false,
      mermaidEnabled: false,
      showLineNumbers: false
    };
  }

  /**
   * Convert setting key to configuration path
   */
  private getConfigurationKey(key: keyof SlashMDSettings): string {
    const keyMap: Record<keyof SlashMDSettings, string> = {
      assetsFolder: 'assets.folder',
      wrapWidth: 'format.wrap',
      calloutsStyle: 'callouts.style',
      togglesSyntax: 'toggles.syntax',
      themeDensity: 'theme.density',
      mathEnabled: 'math.enabled',
      mermaidEnabled: 'mermaid.enabled',
      showLineNumbers: 'showLineNumbers'
    };
    
    return keyMap[key];
  }

  /**
   * Validate setting value based on type and constraints
   */
  private validateSettingValue<K extends keyof SlashMDSettings>(
    key: K,
    value: SlashMDSettings[K]
  ): SlashMDSettings[K] {
    switch (key) {
      case 'assetsFolder':
        return this.validateAssetsFolder(value as string) as SlashMDSettings[K];
      case 'wrapWidth':
        return this.validateWrapWidth(value as number) as SlashMDSettings[K];
      case 'calloutsStyle':
        return this.validateCalloutsStyle(value as string) as SlashMDSettings[K];
      case 'togglesSyntax':
        return this.validateTogglesSyntax(value as string) as SlashMDSettings[K];
      case 'themeDensity':
        return this.validateThemeDensity(value as string) as SlashMDSettings[K];
      case 'mathEnabled':
      case 'mermaidEnabled':
      case 'showLineNumbers':
        return this.validateBoolean(value as boolean) as SlashMDSettings[K];
      default:
        return value;
    }
  }

  // Validation methods
  private validateAssetsFolder(value: string): string {
    if (typeof value !== 'string' || value.trim() === '') {
      console.warn('[SettingsManager] Invalid assetsFolder, using default:', value);
      return 'assets';
    }
    
    // Sanitize folder path
    return value
      .trim()
      .replace(/[<>:"|?*]/g, '') // Remove invalid characters
      .replace(/^\/+|\/+$/g, '') // Remove leading/trailing slashes
      .replace(/\/+/g, '/') || 'assets'; // Collapse multiple slashes
  }

  private validateWrapWidth(value: number): number {
    if (typeof value !== 'number' || value < 0 || value > 1000) {
      console.warn('[SettingsManager] Invalid wrapWidth, using default:', value);
      return 0;
    }
    
    return Math.floor(value);
  }

  private validateCalloutsStyle(value: string): 'admonition' | 'emoji' {
    if (value === 'admonition' || value === 'emoji') {
      return value;
    }
    
    console.warn('[SettingsManager] Invalid calloutsStyle, using default:', value);
    return 'admonition';
  }

  private validateTogglesSyntax(value: string): 'details' | 'list' {
    if (value === 'details' || value === 'list') {
      return value;
    }
    
    console.warn('[SettingsManager] Invalid togglesSyntax, using default:', value);
    return 'details';
  }

  private validateThemeDensity(value: string): 'compact' | 'comfortable' {
    if (value === 'compact' || value === 'comfortable') {
      return value;
    }
    
    console.warn('[SettingsManager] Invalid themeDensity, using default:', value);
    return 'comfortable';
  }

  private validateBoolean(value: boolean): boolean {
    if (typeof value !== 'boolean') {
      console.warn('[SettingsManager] Invalid boolean value, using default:', value);
      return false;
    }
    
    return value;
  }

  /**
   * Dispose of resources
   */
  dispose(): void {
    this.changeEmitter.dispose();
    console.log('[SettingsManager] Disposed');
  }
}