/**
 * SlashMD VS Code Extension - Phase 4: Commands, Settings & Asset Management - COMPLETE
 * 
 * This is the main entry point for the VS Code extension.
 * Phase 4 COMPLETE: Production-ready extension with all functionality implemented.
 */

import * as vscode from 'vscode';
import { SlashMDSettings } from './types';
import { SlashMDEditorProvider } from './customEditor';
import { CommandManager } from './commands';
import { AssetService } from './assetService';
import { SettingsManager } from './settings';
import { TelemetryService } from './telemetry';

/**
 * Get current SlashMD settings from VS Code configuration
 */
function getSlashMDSettings(): SlashMDSettings {
  const config = vscode.workspace.getConfiguration('slashmd');
  
  return {
    assetsFolder: config.get('assets.folder', 'assets'),
    wrapWidth: config.get('format.wrap', 0),
    calloutsStyle: config.get('callouts.style', 'admonition'),
    togglesSyntax: config.get('toggles.syntax', 'details'),
    themeDensity: config.get('theme.density', 'comfortable'),
    mathEnabled: config.get('math.enabled', false),
    mermaidEnabled: config.get('mermaid.enabled', false),
    showLineNumbers: config.get('showLineNumbers', false),
  };
}

// Global service instances for Phase 4
let assetService: AssetService | null = null;
let commandManager: CommandManager | null = null;
let settingsManager: SettingsManager | null = null;
let telemetryService: TelemetryService | null = null;

/**
 * Setup global error handling for the extension
 */
function setupGlobalErrorHandling(telemetry: TelemetryService): void {
  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    console.error('[SlashMD] Uncaught exception:', error);
    telemetry.trackError(error, 'uncaught_exception', false);
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason) => {
    console.error('[SlashMD] Unhandled promise rejection:', reason);
    telemetry.trackError(
      reason instanceof Error ? reason : new Error(String(reason)),
      'unhandled_promise_rejection',
      true
    );
  });

  console.log('[SlashMD] Global error handling setup complete');
}

/**
 * Extension activation function - called when VS Code loads the extension
 * Phase 4 COMPLETE: All services integrated and production ready
 */
export function activate(context: vscode.ExtensionContext) {
  const activationStartTime = Date.now();
  console.log('SlashMD extension is now active! (Phase 4: Commands, Settings & Asset Management - COMPLETE)');

  try {
    // Initialize telemetry first for error tracking
    telemetryService = new TelemetryService(context);
    telemetryService.trackUserAction('extension_activation_started');

    // Setup global error handling
    setupGlobalErrorHandling(telemetryService);

    // Initialize core services
    assetService = new AssetService(context);
    settingsManager = new SettingsManager(context);
    commandManager = new CommandManager(context, assetService);

    // Register all commands
    commandManager.registerCommands();
    
    // Register the custom text editor provider with all Phase 4 integrations
    const provider = new SlashMDEditorProvider(context, assetService, settingsManager);
    const providerRegistration = vscode.window.registerCustomEditorProvider(
      'slashmd.editor',
      provider,
      {
        // Enable custom backup for hot-exit functionality
        supportsMultipleEditorsPerDocument: false,
        webviewOptions: {
          retainContextWhenHidden: true,
        },
      }
    );

    // Add to subscriptions for cleanup
    context.subscriptions.push(providerRegistration);

    // Clean up services when extension deactivates
    context.subscriptions.push({
      dispose: () => {
        provider.dispose();
        telemetryService?.dispose();
        settingsManager?.dispose();
        assetService = null;
        commandManager = null;
        settingsManager = null;
        telemetryService = null;
      }
    });

    console.log('SlashMD Phase 4 services initialized:', {
      assetService: !!assetService,
      settingsManager: !!settingsManager,
      commandManager: !!commandManager,
      telemetryService: !!telemetryService,
      customEditorProvider: 'registered'
    });

    // Track successful activation
    telemetryService.trackUserAction('extension_activation_completed', {
      duration: Date.now() - activationStartTime
    });

    // Show activation message with interactive options
    vscode.window.showInformationMessage(
      'SlashMD extension activated! Phase 4 COMPLETE - All features ready. Open any .md file to start editing.',
      'Open Settings',
      'View Commands'
    ).then(selection => {
      if (selection === 'Open Settings') {
        vscode.commands.executeCommand('slashmd.openSettings');
        telemetryService?.trackUserAction('activation_message_settings_clicked');
      } else if (selection === 'View Commands') {
        vscode.commands.executeCommand('workbench.action.showCommands', 'slashmd');
        telemetryService?.trackUserAction('activation_message_commands_clicked');
      }
    });

  } catch (error) {
    console.error('SlashMD activation failed:', error);
    
    // Track activation failure
    telemetryService?.trackError(error as Error, 'extension_activation', false);
    
    vscode.window.showErrorMessage(
      `SlashMD failed to activate: ${error instanceof Error ? error.message : String(error)}`,
      'View Logs',
      'Report Issue'
    ).then(selection => {
      if (selection === 'View Logs') {
        vscode.commands.executeCommand('workbench.action.toggleDevTools');
      } else if (selection === 'Report Issue') {
        vscode.env.openExternal(vscode.Uri.parse('https://github.com/your-username/slashmd/issues'));
      }
    });
  }
}

/**
 * Extension deactivation function - called when VS Code unloads the extension
 */
export function deactivate() {
  console.log('SlashMD extension is being deactivated.');
  
  try {
    // Track deactivation
    telemetryService?.trackUserAction('extension_deactivation');
    
    // Dispose services
    telemetryService?.dispose();
    settingsManager?.dispose();
    
    // Clear global references
    telemetryService = null;
    settingsManager = null;
    assetService = null;
    commandManager = null;
    
    console.log('SlashMD extension deactivated successfully');
  } catch (error) {
    console.error('Error during SlashMD deactivation:', error);
  }
}