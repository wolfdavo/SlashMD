/**
 * Message Handler for bidirectional WebView ↔ Extension communication
 * Phase 4: Complete message handling with DocumentManager and AssetService integration
 */

import * as vscode from 'vscode';
import { UIToHostMessage, HostToUIMessage, SlashMDSettings } from './types';
import { DocumentManager } from './documentManager';
import { AssetService } from './assetService';

export class MessageHandler {
  private webview: vscode.Webview | null = null;
  private document: vscode.TextDocument | null = null;

  constructor(
    private readonly context: vscode.ExtensionContext,
    private readonly getSettings: () => SlashMDSettings,
    private readonly documentManager?: DocumentManager,
    private readonly assetService?: AssetService
  ) {}

  /**
   * Initialize message handler with webview and document
   */
  initialize(webview: vscode.Webview, document: vscode.TextDocument): void {
    this.webview = webview;
    this.document = document;

    // Set up message listener
    webview.onDidReceiveMessage(
      (message: UIToHostMessage) => this.handleUIMessage(message),
      undefined,
      this.context.subscriptions
    );

    console.log('[MessageHandler] Initialized with document:', document.uri.toString());
  }

  /**
   * Handle messages from the WebView UI
   */
  private async handleUIMessage(message: UIToHostMessage): Promise<void> {
    try {
      console.log('[MessageHandler] Received UI message:', message.type, message.payload);

      switch (message.type) {
        case 'REQUEST_INIT':
          await this.handleRequestInit();
          break;

        case 'REQUEST_SETTINGS':
          await this.handleRequestSettings();
          break;

        case 'APPLY_TEXT_EDITS':
          await this.handleApplyTextEdits(message.payload);
          break;

        case 'WRITE_ASSET':
          await this.handleWriteAsset(message.payload);
          break;

        case 'LOG_ERROR':
          this.handleLogError(message.payload);
          break;

        default:
          console.warn('[MessageHandler] Unknown UI message type:', (message as any).type);
          this.sendErrorToUI(`Unknown message type: ${(message as any).type}`, true);
      }
    } catch (error) {
      console.error('[MessageHandler] Error handling UI message:', error);
      this.sendErrorToUI(
        `Failed to handle ${message.type}: ${error instanceof Error ? error.message : String(error)}`,
        true
      );
    }
  }

  /**
   * Handle initialization request from WebView
   */
  private async handleRequestInit(): Promise<void> {
    if (!this.document || !this.webview) {
      this.sendErrorToUI('Document or WebView not available for initialization', false);
      return;
    }

    const settings = this.getSettings();
    const theme = this.getVSCodeTheme();
    const documentText = this.document.getText();

    const initMessage: HostToUIMessage = {
      type: 'DOC_INIT',
      payload: {
        text: documentText,
        settings,
        theme
      }
    };

    this.sendToUI(initMessage);
    console.log('[MessageHandler] Sent DOC_INIT with', documentText.length, 'characters');
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
    console.log('[MessageHandler] Sent settings update');
  }

  /**
   * Handle text edit requests from WebView (Phase 3: Full implementation with DocumentManager)
   */
  private async handleApplyTextEdits(payload: {
    edits: Array<{ start: number; end: number; newText: string }>;
    reason: string;
    affectedBlocks: string[];
  }): Promise<void> {
    if (!this.document) {
      this.sendErrorToUI('No document available for text edits', true);
      return;
    }

    if (!this.documentManager) {
      this.sendErrorToUI('Document manager not available for text edits', true);
      return;
    }

    console.log('[MessageHandler] Text edits requested:', {
      editCount: payload.edits.length,
      reason: payload.reason,
      affectedBlocks: payload.affectedBlocks?.length || 0
    });

    try {
      // Apply text edits using DocumentManager
      const success = await this.documentManager.applyTextEdits(
        this.document,
        payload.edits,
        payload.reason,
        payload.affectedBlocks || []
      );

      if (success) {
        console.log('[MessageHandler] Successfully applied text edits');
        
        // Optionally show success message for user feedback
        if (payload.reason !== 'typing') { // Don't spam for typing changes
          vscode.window.showInformationMessage(
            `SlashMD: Applied ${payload.edits.length} edit(s) (${payload.reason})`
          );
        }
      } else {
        throw new Error('DocumentManager failed to apply edits');
      }
    } catch (error) {
      console.error('[MessageHandler] Failed to apply text edits:', error);
      this.sendErrorToUI(
        `Failed to apply text edits: ${error instanceof Error ? error.message : String(error)}`,
        true
      );
      
      // Show error to user
      vscode.window.showErrorMessage(
        `SlashMD: Failed to apply text edits - ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Handle asset write requests from WebView (Phase 4: Full AssetService integration)
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

    console.log('[MessageHandler] Asset write requested:', {
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

      console.log('[MessageHandler] Asset written successfully:', {
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
      console.error('[MessageHandler] Failed to write asset:', error);
      
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
    console.error('[MessageHandler] WebView error:', payload.error);
    
    if (payload.context) {
      console.error('[MessageHandler] Error context:', payload.context);
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

    const documentText = this.document.getText();

    const changeMessage: HostToUIMessage = {
      type: 'DOC_CHANGED',
      payload: {
        text: documentText,
        preserveSelection
      }
    };

    this.sendToUI(changeMessage);
    console.log('[MessageHandler] Sent DOC_CHANGED with', documentText.length, 'characters');
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
    console.log('[MessageHandler] Sent SETTINGS_CHANGED notification');
  }

  /**
   * Send a message to the WebView UI
   */
  private sendToUI(message: HostToUIMessage): void {
    if (!this.webview) {
      console.error('[MessageHandler] Cannot send message - no webview available');
      return;
    }

    this.webview.postMessage(message);
    console.log('[MessageHandler] Sent message to UI:', message.type);
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
    console.error('[MessageHandler] Sent error to UI:', message);
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