/**
 * Document Manager for Phase 3: Document Management & Text Editing
 *
 * This class handles:
 * - Document text synchronization between VS Code and WebView
 * - External change detection and notification
 * - Text edit application using VS Code WorkspaceEdit
 * - Edit coalescing for smooth undo/redo experience
 * - Document backup and restore for hot-exit functionality
 */

import * as vscode from "vscode";
import { TextEdit } from "./types";

export interface DocumentChangeEvent {
  /** The document that changed */
  document: vscode.TextDocument;
  /** Array of content changes */
  contentChanges: readonly vscode.TextDocumentContentChangeEvent[];
  /** Whether this change originated from our extension */
  isExternalChange: boolean;
}

export interface EditBatch {
  /** Array of text edits to apply */
  edits: TextEdit[];
  /** Reason for the edits (for undo/redo labeling) */
  reason: string;
  /** Block IDs affected by these edits */
  affectedBlocks: string[];
  /** Timestamp when batch was created */
  timestamp: number;
}

export class DocumentManager {
  private readonly changeEmitter =
    new vscode.EventEmitter<DocumentChangeEvent>();
  private readonly pendingEdits = new Map<string, EditBatch[]>();
  private readonly editCoalesceTimeout = new Map<string, NodeJS.Timeout>();
  private isApplyingEdits = false;

  // Configuration for edit coalescing
  private readonly COALESCE_DELAY_MS = 100; // Wait 100ms to batch rapid edits
  private readonly MAX_BATCH_SIZE = 50; // Maximum edits per batch

  /** Event fired when document changes externally */
  public readonly onDocumentChange = this.changeEmitter.event;

  constructor(private readonly context: vscode.ExtensionContext) {
    // Monitor all text document changes
    const documentChangeSubscription = vscode.workspace.onDidChangeTextDocument(
      (event) => {
        this.handleDocumentChange(event);
      }
    );

    context.subscriptions.push(documentChangeSubscription, this.changeEmitter);
  }

  /**
   * Apply text edits to a document using VS Code WorkspaceEdit
   * Includes edit coalescing for better undo/redo experience
   */
  async applyTextEdits(
    document: vscode.TextDocument,
    edits: TextEdit[],
    reason: string,
    affectedBlocks: string[] = []
  ): Promise<boolean> {
    try {
      const documentUri = document.uri.toString();

      // Add edits to pending batch
      this.addToPendingBatch(documentUri, {
        edits,
        reason,
        affectedBlocks,
        timestamp: Date.now()
      });

      // Coalesce rapid edits
      await this.coalesceEdits(documentUri, document);

      return true;
    } catch (error) {
      console.error("[DocumentManager] Failed to apply text edits:", error);
      return false;
    }
  }

  /**
   * Get current document content as string
   */
  getDocumentText(document: vscode.TextDocument): string {
    return document.getText();
  }

  /**
   * Check if document has unsaved changes
   */
  hasUnsavedChanges(document: vscode.TextDocument): boolean {
    return document.isDirty;
  }

  /**
   * Force save document
   */
  async saveDocument(document: vscode.TextDocument): Promise<boolean> {
    try {
      return await document.save();
    } catch (error) {
      console.error("[DocumentManager] Failed to save document:", error);
      return false;
    }
  }

  /**
   * Create a backup of the current document state for hot-exit
   */
  async createBackup(
    document: vscode.TextDocument,
    backupContext: vscode.CustomDocumentBackupContext
  ): Promise<vscode.CustomDocumentBackup> {
    try {
      const content = document.getText();
      const backup = Buffer.from(content, "utf8");

      // Write backup to the destination provided by VS Code
      await vscode.workspace.fs.writeFile(backupContext.destination, backup);

      return {
        id: backupContext.destination.toString(),
        delete: async () => {
          try {
            await vscode.workspace.fs.delete(backupContext.destination);
          } catch (error) {
            console.warn("[DocumentManager] Failed to delete backup:", error);
          }
        }
      };
    } catch (error) {
      console.error("[DocumentManager] Failed to create backup:", error);
      throw error;
    }
  }

  /**
   * Restore document from backup for hot-exit recovery
   */
  async restoreFromBackup(backupUri: vscode.Uri): Promise<string> {
    try {
      const backupContent = await vscode.workspace.fs.readFile(backupUri);
      return Buffer.from(backupContent).toString("utf8");
    } catch (error) {
      console.error("[DocumentManager] Failed to restore from backup:", error);
      throw error;
    }
  }

  /**
   * Convert VS Code text edits to our TextEdit format
   */
  convertFromVSCodeEdits(
    document: vscode.TextDocument,
    changes: readonly vscode.TextDocumentContentChangeEvent[]
  ): TextEdit[] {
    const edits: TextEdit[] = [];

    for (const change of changes) {
      if ("range" in change && change.range) {
        const start = document.offsetAt(change.range.start);
        const end = document.offsetAt(change.range.end);

        edits.push({
          start,
          end,
          newText: change.text
        });
      } else {
        // Full document change
        edits.push({
          start: 0,
          end: document.getText().length,
          newText: change.text
        });
      }
    }

    return edits;
  }

  /**
   * Handle document change events from VS Code
   */
  private handleDocumentChange(event: vscode.TextDocumentChangeEvent): void {
    // Skip changes we're applying ourselves to avoid infinite loops
    if (this.isApplyingEdits) {
      return;
    }

    // Only handle markdown documents
    if (event.document.languageId !== "markdown") {
      return;
    }

    const changeEvent: DocumentChangeEvent = {
      document: event.document,
      contentChanges: event.contentChanges,
      isExternalChange: !this.isApplyingEdits
    };

    console.log("[DocumentManager] External document change detected:", {
      uri: event.document.uri.toString(),
      changeCount: event.contentChanges.length
    });

    this.changeEmitter.fire(changeEvent);
  }

  /**
   * Add edits to pending batch for coalescing
   */
  private addToPendingBatch(documentUri: string, batch: EditBatch): void {
    if (!this.pendingEdits.has(documentUri)) {
      this.pendingEdits.set(documentUri, []);
    }

    const batches = this.pendingEdits.get(documentUri)!;
    batches.push(batch);

    // Limit batch size to prevent memory issues
    if (batches.length > this.MAX_BATCH_SIZE) {
      batches.splice(0, batches.length - this.MAX_BATCH_SIZE);
    }
  }

  /**
   * Coalesce rapid edits and apply them as a single WorkspaceEdit
   */
  private async coalesceEdits(
    documentUri: string,
    document: vscode.TextDocument
  ): Promise<void> {
    // Clear existing timeout
    const existingTimeout = this.editCoalesceTimeout.get(documentUri);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Set new timeout for coalescing
    const timeout = setTimeout(async () => {
      await this.flushPendingEdits(documentUri, document);
    }, this.COALESCE_DELAY_MS);

    this.editCoalesceTimeout.set(documentUri, timeout);
  }

  /**
   * Apply all pending edits for a document
   */
  private async flushPendingEdits(
    documentUri: string,
    document: vscode.TextDocument
  ): Promise<void> {
    const batches = this.pendingEdits.get(documentUri);
    if (!batches || batches.length === 0) {
      return;
    }

    try {
      this.isApplyingEdits = true;

      // Combine all edits from batches
      const allEdits: TextEdit[] = [];
      let combinedReason = "";
      const allAffectedBlocks = new Set<string>();

      for (const batch of batches) {
        allEdits.push(...batch.edits);
        if (combinedReason) {
          combinedReason += ", ";
        }
        combinedReason += batch.reason;
        batch.affectedBlocks.forEach((id) => allAffectedBlocks.add(id));
      }

      // Convert to VS Code TextEdit format and apply
      const workspaceEdit = new vscode.WorkspaceEdit();
      const vsCodeEdits = this.convertToVSCodeEdits(document, allEdits);

      workspaceEdit.set(document.uri, vsCodeEdits);

      console.log(
        "[DocumentManager] Applying workspace edit with",
        vsCodeEdits.length,
        "edits"
      );

      const success = await vscode.workspace.applyEdit(workspaceEdit);
      if (!success) {
        throw new Error("Failed to apply workspace edit");
      }

      console.log("[DocumentManager] Successfully applied edits:", {
        editCount: allEdits.length,
        reason: combinedReason,
        affectedBlocks: Array.from(allAffectedBlocks)
      });
    } catch (error) {
      console.error("[DocumentManager] Failed to flush pending edits:", error);
      throw error;
    } finally {
      // Clear pending edits and timeout
      this.pendingEdits.delete(documentUri);
      this.editCoalesceTimeout.delete(documentUri);
      this.isApplyingEdits = false;
    }
  }

  /**
   * Convert our TextEdit format to VS Code TextEdit format
   */
  private convertToVSCodeEdits(
    document: vscode.TextDocument,
    edits: TextEdit[]
  ): vscode.TextEdit[] {
    return edits.map((edit) => {
      const startPosition = document.positionAt(edit.start);
      const endPosition = document.positionAt(edit.end);
      const range = new vscode.Range(startPosition, endPosition);

      return new vscode.TextEdit(range, edit.newText);
    });
  }

  /**
   * Dispose of resources
   */
  dispose(): void {
    // Clear all pending timeouts
    for (const timeout of this.editCoalesceTimeout.values()) {
      clearTimeout(timeout);
    }

    this.editCoalesceTimeout.clear();
    this.pendingEdits.clear();
    this.changeEmitter.dispose();
  }
}
