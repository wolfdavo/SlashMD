/**
 * Sync Engine for SlashMD Integration
 * 
 * This engine handles the bidirectional sync between VS Code TextDocument and Block[] data
 * using the @slashmd/md-mapper library for parsing and serialization.
 */

import * as vscode from 'vscode';
import { parseMarkdown, serializeBlocks, updateBlocks, textEditToDocumentChange } from '@slashmd/md-mapper';
import type { 
  Block, 
  TextEdit, 
  DocumentChange, 
  SlashMDSettings,
  HostToUIMessage,
  SyncEngine as ISyncEngine,
  CustomEditorContext,
  SyncConflictError 
} from '../../../SHARED_TYPES';

export class SyncEngine implements ISyncEngine {
  private context: CustomEditorContext | null = null;
  private currentBlocks: Block[] = [];
  private lastKnownDocumentVersion: number = 0;
  private pendingEdits: TextEdit[] = [];
  private isApplyingEdits = false;

  constructor(private readonly getSettings: () => SlashMDSettings) {}

  /**
   * Initialize with document and WebView context
   */
  initialize(context: CustomEditorContext): void {
    this.context = context;
    
    // Parse initial document content
    const text = context.document.getText();
    this.currentBlocks = parseMarkdown(text);
    this.lastKnownDocumentVersion = context.document.version;
    
    console.log('[SyncEngine] Initialized with', this.currentBlocks.length, 'blocks');
  }

  /**
   * Handle changes from the WebView UI
   */
  async handleUIChange(message: any): Promise<void> {
    if (!this.context) {
      throw new Error('SyncEngine not initialized');
    }

    switch (message.type) {
      case 'APPLY_TEXT_EDITS':
        await this.applyUITextEdits(message.payload);
        break;
      
      case 'BLOCKS_CHANGED':
        await this.applyBlockChanges(message.payload.blocks);
        break;
        
      default:
        console.warn('[SyncEngine] Unknown UI message type:', message.type);
    }
  }

  /**
   * Handle external document changes
   */
  async handleDocumentChange(changes: DocumentChange[]): Promise<void> {
    if (!this.context || this.isApplyingEdits) {
      return; // Don't process external changes while we're applying our own edits
    }

    try {
      // Update blocks based on document changes
      this.currentBlocks = updateBlocks(this.currentBlocks, changes);
      this.lastKnownDocumentVersion = this.context.document.version;
      
      // Notify WebView of the changes
      await this.notifyWebViewOfBlockChanges(true);
      
      console.log('[SyncEngine] Handled external document changes, updated to', this.currentBlocks.length, 'blocks');
    } catch (error) {
      console.error('[SyncEngine] Failed to handle document changes:', error);
      // Fall back to full reparse
      await this.forceResync();
    }
  }

  /**
   * Get current block state
   */
  getCurrentBlocks(): Block[] {
    return [...this.currentBlocks];
  }

  /**
   * Force full resync between document and blocks
   */
  async forceResync(): Promise<void> {
    if (!this.context) {
      throw new Error('SyncEngine not initialized');
    }

    try {
      const text = this.context.document.getText();
      this.currentBlocks = parseMarkdown(text);
      this.lastKnownDocumentVersion = this.context.document.version;
      
      await this.notifyWebViewOfBlockChanges(false);
      
      console.log('[SyncEngine] Force resync completed with', this.currentBlocks.length, 'blocks');
    } catch (error) {
      console.error('[SyncEngine] Force resync failed:', error);
      throw error;
    }
  }

  /**
   * Apply text edits from the WebView
   */
  private async applyUITextEdits(payload: {
    edits: TextEdit[];
    reason: string;
    affectedBlocks: string[];
  }): Promise<void> {
    if (!this.context) return;

    try {
      this.isApplyingEdits = true;
      
      // Create VS Code WorkspaceEdit
      const workspaceEdit = new vscode.WorkspaceEdit();
      
      // Convert TextEdit[] to VS Code TextEdits and apply
      for (const edit of payload.edits) {
        const startPos = this.context.document.positionAt(edit.start);
        const endPos = this.context.document.positionAt(edit.end);
        const range = new vscode.Range(startPos, endPos);
        
        workspaceEdit.replace(this.context.document.uri, range, edit.newText);
      }
      
      // Apply the edit
      const success = await vscode.workspace.applyEdit(workspaceEdit);
      
      if (success) {
        // Update our internal state
        const documentChanges = payload.edits.map(textEditToDocumentChange);
        this.currentBlocks = updateBlocks(this.currentBlocks, documentChanges);
        this.lastKnownDocumentVersion = this.context.document.version;
        
        console.log('[SyncEngine] Applied', payload.edits.length, 'text edits successfully');
      } else {
        throw new Error('Failed to apply workspace edit');
      }
    } catch (error) {
      console.error('[SyncEngine] Failed to apply UI text edits:', error);
      throw error;
    } finally {
      this.isApplyingEdits = false;
    }
  }

  /**
   * Apply block changes from the WebView
   */
  private async applyBlockChanges(newBlocks: Block[]): Promise<void> {
    if (!this.context) return;

    try {
      this.isApplyingEdits = true;
      
      // Serialize new blocks to markdown
      const newMarkdown = serializeBlocks(newBlocks);
      
      // Replace entire document content
      // TODO: In the future, compute minimal text edits for better performance
      const fullRange = new vscode.Range(
        this.context.document.positionAt(0),
        this.context.document.positionAt(this.context.document.getText().length)
      );
      
      const workspaceEdit = new vscode.WorkspaceEdit();
      workspaceEdit.replace(this.context.document.uri, fullRange, newMarkdown);
      
      const success = await vscode.workspace.applyEdit(workspaceEdit);
      
      if (success) {
        this.currentBlocks = newBlocks;
        this.lastKnownDocumentVersion = this.context.document.version;
        
        console.log('[SyncEngine] Applied block changes successfully');
      } else {
        throw new Error('Failed to apply block changes to document');
      }
    } catch (error) {
      console.error('[SyncEngine] Failed to apply block changes:', error);
      throw error;
    } finally {
      this.isApplyingEdits = false;
    }
  }

  /**
   * Notify WebView of block changes
   */
  private async notifyWebViewOfBlockChanges(preserveSelection: boolean): Promise<void> {
    if (!this.context?.webviewPanel) return;

    const message: HostToUIMessage = {
      type: 'DOC_CHANGED',
      payload: {
        blocks: this.currentBlocks,
        preserveSelection
      }
    };

    try {
      await this.context.webviewPanel.webview.postMessage(message);
      console.log('[SyncEngine] Notified WebView of block changes');
    } catch (error) {
      console.error('[SyncEngine] Failed to notify WebView:', error);
    }
  }

  /**
   * Send initial blocks to WebView
   */
  async sendInitialBlocks(): Promise<void> {
    if (!this.context?.webviewPanel) return;

    const settings = this.getSettings();
    const theme = this.getVSCodeTheme();

    const message: HostToUIMessage = {
      type: 'DOC_INIT',
      payload: {
        blocks: this.currentBlocks,
        settings,
        theme
      }
    };

    try {
      await this.context.webviewPanel.webview.postMessage(message);
      console.log('[SyncEngine] Sent initial blocks to WebView:', this.currentBlocks.length, 'blocks');
    } catch (error) {
      console.error('[SyncEngine] Failed to send initial blocks:', error);
    }
  }

  /**
   * Handle sync conflicts (future enhancement)
   */
  private handleSyncConflict(error: SyncConflictError): void {
    console.error('[SyncEngine] Sync conflict detected:', error);
    
    // For now, just force a resync
    // In the future, we could show a dialog to let the user choose resolution
    this.forceResync().catch(resyncError => {
      console.error('[SyncEngine] Failed to resolve sync conflict:', resyncError);
    });
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
}