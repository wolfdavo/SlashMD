/**
 * Integrated Message Handler for bidirectional WebView ↔ Extension communication
 * Integration Phase: Uses SyncEngine and sends Block[] data instead of raw text
 */

import * as vscode from 'vscode';
import { UIToHostMessage, HostToUIMessage, SlashMDSettings } from './types';
import { DocumentManager } from './documentManager';
import { AssetService } from './assetService';
import { SyncEngine } from './syncEngine';

export class IntegratedMessageHandler {
  private webview: vscode.Webview | null = null;
  private document: vscode.TextDocument | null = null;
  private syncEngine: SyncEngine;

  constructor(
    private readonly context: vscode.ExtensionContext,
    private readonly getSettings: () => SlashMDSettings,
    private readonly documentManager?: DocumentManager,
    private readonly assetService?: AssetService
  ) {
    // Create sync engine with settings provider
    this.syncEngine = new SyncEngine(this.getSettings);
  }

  /**
   * Initialize message handler with webview and document
   */
  initialize(webview: vscode.Webview, document: vscode.TextDocument): void {
    this.webview = webview;
    this.document = document;

    // Initialize sync engine
    this.syncEngine.initialize({
      document,
      webviewPanel: { webview } as any, // Type assertion for now
      extensionContext: this.context
    });

    // Set up message listener
    webview.onDidReceiveMessage(
      (message: UIToHostMessage) => this.handleUIMessage(message),
      undefined,
      this.context.subscriptions
    );

    console.log('[IntegratedMessageHandler] Initialized with SyncEngine for document:', document.uri.toString());
  }

  /**
   * Handle messages from the WebView UI
   */
  private async handleUIMessage(message: UIToHostMessage): Promise<void> {
    try {
      console.log('[IntegratedMessageHandler] Received UI message:', message.type);

      switch (message.type) {
        case 'REQUEST_INIT':
          await this.handleRequestInit();
          break;

        case 'REQUEST_SETTINGS':
          await this.handleRequestSettings();
          break;

        case 'APPLY_TEXT_EDITS':
          // Forward to sync engine for handling
          await this.syncEngine.handleUIChange(message);
          break;

        case 'WRITE_ASSET':
          await this.handleWriteAsset(message.payload);
          break;

        case 'LOG_ERROR':
          this.handleLogError(message.payload);
          break;

        default:
          console.warn('[IntegratedMessageHandler] Unknown UI message type:', (message as any).type);
          this.sendErrorToUI(`Unknown message type: ${(message as any).type}`, true);
      }
    } catch (error) {
      console.error('[IntegratedMessageHandler] Error handling UI message:', error);
      this.sendErrorToUI(
        `Failed to handle ${message.type}: ${error instanceof Error ? error.message : String(error)}`,
        true
      );
    }
  }

  /**
   * Handle initialization request from WebView - sends Block[] data
   */
  private async handleRequestInit(): Promise<void> {
    if (!this.document || !this.webview) {
      this.sendErrorToUI('Document or WebView not available for initialization', false);
      return;
    }

    try {
      // Use sync engine to send initial blocks
      await this.syncEngine.sendInitialBlocks();
      console.log('[IntegratedMessageHandler] Sent initial blocks via SyncEngine');
    } catch (error) {
      console.error('[IntegratedMessageHandler] Failed to send initial blocks:', error);
      this.sendErrorToUI('Failed to initialize document blocks', false);
    }
  }

  /**
   * Handle settings request from WebView
   */
  private async handleRequestSettings(): Promise<void> {
    const settings = this.getSettings();

    const settingsMessage: HostToUIMessage = {
      type: 'SETTINGS_CHANGED',
      payload: { settings }
    };

    this.sendToUI(settingsMessage);
    console.log('[IntegratedMessageHandler] Sent settings update');
  }

  /**
   * Handle asset write requests from WebView
   */
  private async handleWriteAsset(payload: {
    dataUri: string;
    suggestedName?: string;
    targetBlockId?: string;
  }): Promise<void> {
    if (!this.document) {
      this.sendErrorToUI('No document available for asset write', true);
      return;
    }

    if (!this.assetService) {
      this.sendErrorToUI('Asset service not available', false);
      return;
    }

    console.log('[IntegratedMessageHandler] Asset write requested:', {
      dataUriPrefix: payload.dataUri.substring(0, 50) + '...',
      suggestedName: payload.suggestedName,
      targetBlockId: payload.targetBlockId
    });

    try {
      // Get workspace folder for the document
      const workspaceFolder = this.assetService.getWorkspaceFolder(this.document);
      
      // Use AssetService to write the asset
      const result = await this.assetService.writeAsset(
        {
          dataUri: payload.dataUri,
          suggestedName: payload.suggestedName,
          targetBlockId: payload.targetBlockId
        },
        workspaceFolder
      );

      console.log('[IntegratedMessageHandler] Asset written successfully:', {
        relPath: result.relPath,
        fileSize: result.fileSize,
        wasDuplicate: result.wasDuplicate
      });

      // Send success response to WebView
      const assetResponse: HostToUIMessage = {
        type: 'ASSET_WRITTEN',
        payload: {
          relPath: result.relPath,
          targetBlockId: payload.targetBlockId
        }
      };

      this.sendToUI(assetResponse);

      // Show user feedback
      const message = result.wasDuplicate
        ? `Asset already exists: ${result.relPath}`
        : `Asset saved: ${result.relPath}`;
        
      vscode.window.showInformationMessage(`SlashMD: ${message}`);

    } catch (error) {
      console.error('[IntegratedMessageHandler] Failed to write asset:', error);
      
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.sendErrorToUI(`Failed to write asset: ${errorMessage}`, true);
      
      // Show error to user
      vscode.window.showErrorMessage(`SlashMD: Failed to save asset - ${errorMessage}`);
    }
  }

  /**
   * Handle error logging from WebView
   */
  private handleLogError(payload: { error: string; context?: any }): void {
    console.error('[IntegratedMessageHandler] WebView error:', payload.error);
    
    if (payload.context) {
      console.error('[IntegratedMessageHandler] Error context:', payload.context);
    }

    // Show error in VS Code if it's serious
    if (payload.error.includes('Failed to') || payload.error.includes('Error:')) {
      vscode.window.showWarningMessage(
        `SlashMD WebView Error: ${payload.error.substring(0, 100)}${payload.error.length > 100 ? '...' : ''}`
      );
    }
  }

  /**
   * Send document change notification to WebView (called from extension when document changes externally)
   */
  async notifyDocumentChanged(preserveSelection: boolean = false): Promise<void> {
    if (!this.document || !this.webview) return;

    // Use sync engine to handle the document change
    try {
      // Get current document changes and let sync engine handle them
      // For now, we'll trigger a force resync - in a more sophisticated version,
      // we would compute the actual changes and pass them to handleDocumentChange
      await this.syncEngine.forceResync();
      console.log('[IntegratedMessageHandler] Document change handled via SyncEngine');
    } catch (error) {
      console.error('[IntegratedMessageHandler] Failed to handle document change:', error);
      this.sendErrorToUI('Failed to sync document changes', true);
    }
  }

  /**
   * Send settings change notification to WebView
   */
  async notifySettingsChanged(): Promise<void> {
    const settings = this.getSettings();

    const settingsMessage: HostToUIMessage = {
      type: 'SETTINGS_CHANGED',
      payload: { settings }
    };

    this.sendToUI(settingsMessage);
    console.log('[IntegratedMessageHandler] Sent SETTINGS_CHANGED notification');
  }

  /**
   * Send a message to the WebView UI
   */
  private sendToUI(message: HostToUIMessage): void {
    if (!this.webview) {
      console.error('[IntegratedMessageHandler] Cannot send message - no webview available');
      return;
    }

    this.webview.postMessage(message);
    console.log('[IntegratedMessageHandler] Sent message to UI:', message.type);
  }

  /**
   * Send error message to WebView UI
   */
  private sendErrorToUI(message: string, recoverable: boolean): void {
    const errorMessage: HostToUIMessage = {
      type: 'ERROR',
      payload: { message, recoverable }
    };

    this.sendToUI(errorMessage);
    console.error('[IntegratedMessageHandler] Sent error to UI:', message);
  }

  /**
   * Get current VS Code theme
   */
  private getVSCodeTheme(): 'light' | 'dark' | 'high-contrast' {
    const colorTheme = vscode.window.activeColorTheme;
    
    switch (colorTheme.kind) {
      case vscode.ColorThemeKind.Light:
        return 'light';
      case vscode.ColorThemeKind.Dark:
        return 'dark';
      case vscode.ColorThemeKind.HighContrast:
        return 'high-contrast';
      default:
        return 'dark';
    }
  }

  /**
   * Cleanup resources
   */
  dispose(): void {
    this.webview = null;
    this.document = null;
  }
}