/**
 * Asset Service for Phase 4: Commands, Settings & Asset Management
 * 
 * This service handles:
 * - Image paste/drag file processing and storage
 * - Workspace asset folder management
 * - File deduplication based on content hashing
 * - Relative path generation for Markdown links
 * - Asset cleanup and organization
 */

import * as vscode from 'vscode';
import * as crypto from 'crypto';
import * as path from 'path';

export interface AssetWriteResult {
  /** Relative path to written file */
  relPath: string;
  /** Full URI to written file */
  fullUri: vscode.Uri;
  /** Whether this was a duplicate (deduplicated) */
  wasDuplicate: boolean;
  /** File size in bytes */
  fileSize: number;
}

export interface AssetWriteRequest {
  /** Data URI containing the image data */
  dataUri: string;
  /** Suggested filename (optional) */
  suggestedName?: string;
  /** Block ID that will receive the image (for tracking) */
  targetBlockId?: string;
}

export class AssetService {
  private readonly supportedImageTypes = new Set([
    'image/png',
    'image/jpeg', 
    'image/jpg',
    'image/gif',
    'image/webp',
    'image/svg+xml'
  ]);

  constructor(private readonly context: vscode.ExtensionContext) {}

  /**
   * Write an asset file to the workspace assets folder
   * Returns relative path for markdown link insertion
   */
  async writeAsset(
    request: AssetWriteRequest,
    workspaceUri: vscode.Uri
  ): Promise<AssetWriteResult> {
    try {
      console.log('[AssetService] Writing asset:', {
        dataUriPrefix: request.dataUri.substring(0, 50) + '...',
        suggestedName: request.suggestedName,
        targetBlockId: request.targetBlockId
      });

      // Parse and validate data URI
      const { mimeType, buffer, extension } = this.parseDataUri(request.dataUri);
      
      // Get assets folder from settings
      const assetsFolder = this.getAssetsFolder();
      
      // Ensure assets directory exists
      const assetsPath = vscode.Uri.joinPath(workspaceUri, assetsFolder);
      await this.ensureDirectoryExists(assetsPath);
      
      // Generate unique filename with content-based hash
      const fileName = await this.generateFileName(
        buffer,
        extension,
        request.suggestedName
      );
      
      // Check for existing file with same content
      const filePath = vscode.Uri.joinPath(assetsPath, fileName);
      const wasDuplicate = await this.fileExists(filePath);
      
      if (!wasDuplicate) {
        // Write the file
        await vscode.workspace.fs.writeFile(filePath, buffer);
        console.log('[AssetService] Asset written successfully:', {
          fileName,
          fileSize: buffer.length,
          mimeType
        });
      } else {
        console.log('[AssetService] Asset already exists, using existing file:', fileName);
      }
      
      return {
        relPath: `${assetsFolder}/${fileName}`,
        fullUri: filePath,
        wasDuplicate,
        fileSize: buffer.length
      };
      
    } catch (error) {
      console.error('[AssetService] Failed to write asset:', error);
      throw new Error(`Asset write failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get assets folder path from settings
   */
  private getAssetsFolder(): string {
    const config = vscode.workspace.getConfiguration('slashmd');
    return config.get('assets.folder', 'assets');
  }

  /**
   * Parse data URI and extract image data
   */
  private parseDataUri(dataUri: string): { mimeType: string; buffer: Uint8Array; extension: string } {
    // Validate data URI format
    const dataUriRegex = /^data:([^;]+);base64,(.+)$/;
    const match = dataUri.match(dataUriRegex);
    
    if (!match) {
      throw new Error('Invalid data URI format');
    }
    
    const [, mimeType, base64Data] = match;
    
    // Validate supported image type
    if (!this.supportedImageTypes.has(mimeType)) {
      throw new Error(`Unsupported image type: ${mimeType}. Supported types: ${Array.from(this.supportedImageTypes).join(', ')}`);
    }
    
    // Decode base64 data
    const buffer = new Uint8Array(Buffer.from(base64Data, 'base64'));
    
    // Get file extension from MIME type
    const extension = this.getExtensionFromMimeType(mimeType);
    
    return { mimeType, buffer, extension };
  }

  /**
   * Get file extension from MIME type
   */
  private getExtensionFromMimeType(mimeType: string): string {
    const mimeToExt: Record<string, string> = {
      'image/png': 'png',
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg', 
      'image/gif': 'gif',
      'image/webp': 'webp',
      'image/svg+xml': 'svg'
    };
    
    return mimeToExt[mimeType] || 'png';
  }

  /**
   * Generate unique filename based on content hash and suggested name
   */
  private async generateFileName(
    buffer: Uint8Array,
    extension: string,
    suggestedName?: string
  ): Promise<string> {
    // Generate content hash for deduplication
    const hash = crypto.createHash('sha256').update(buffer).digest('hex');
    const shortHash = hash.substring(0, 8);
    
    // Use suggested name if provided, otherwise generate from hash + timestamp
    let baseName: string;
    
    if (suggestedName) {
      // Remove extension from suggested name if present
      const parsedName = path.parse(suggestedName);
      baseName = this.sanitizeFileName(parsedName.name);
    } else {
      // Generate name from timestamp and hash
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[-:]/g, '').replace('T', '_');
      baseName = `image_${timestamp}_${shortHash}`;
    }
    
    return `${baseName}.${extension}`;
  }

  /**
   * Sanitize filename for cross-platform compatibility
   */
  private sanitizeFileName(name: string): string {
    // Remove or replace invalid characters
    return name
      .replace(/[<>:"/\\|?*]/g, '_')  // Replace invalid characters
      .replace(/\s+/g, '_')           // Replace spaces with underscores
      .replace(/_{2,}/g, '_')         // Collapse multiple underscores
      .replace(/^_+|_+$/g, '')       // Trim leading/trailing underscores
      .substring(0, 100);             // Limit length
  }

  /**
   * Ensure directory exists, creating it if necessary
   */
  private async ensureDirectoryExists(dirUri: vscode.Uri): Promise<void> {
    try {
      await vscode.workspace.fs.stat(dirUri);
    } catch (error) {
      // Directory doesn't exist, create it
      console.log('[AssetService] Creating assets directory:', dirUri.toString());
      await vscode.workspace.fs.createDirectory(dirUri);
    }
  }

  /**
   * Check if file exists
   */
  private async fileExists(fileUri: vscode.Uri): Promise<boolean> {
    try {
      await vscode.workspace.fs.stat(fileUri);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get asset statistics for the workspace
   */
  async getAssetStats(workspaceUri: vscode.Uri): Promise<{
    totalAssets: number;
    totalSize: number;
    assetTypes: Record<string, number>;
  }> {
    try {
      const assetsFolder = this.getAssetsFolder();
      const assetsPath = vscode.Uri.joinPath(workspaceUri, assetsFolder);
      
      const entries = await vscode.workspace.fs.readDirectory(assetsPath);
      
      let totalSize = 0;
      const assetTypes: Record<string, number> = {};
      
      for (const [name, type] of entries) {
        if (type === vscode.FileType.File) {
          const filePath = vscode.Uri.joinPath(assetsPath, name);
          const stat = await vscode.workspace.fs.stat(filePath);
          
          totalSize += stat.size;
          
          const ext = path.extname(name).toLowerCase();
          assetTypes[ext] = (assetTypes[ext] || 0) + 1;
        }
      }
      
      return {
        totalAssets: entries.filter(([, type]) => type === vscode.FileType.File).length,
        totalSize,
        assetTypes
      };
      
    } catch (error) {
      console.warn('[AssetService] Failed to get asset stats:', error);
      return { totalAssets: 0, totalSize: 0, assetTypes: {} };
    }
  }

  /**
   * Clean up unused assets (placeholder for future implementation)
   * This would analyze markdown files and remove assets that are no longer referenced
   */
  async cleanupUnusedAssets(workspaceUri: vscode.Uri): Promise<{
    removedCount: number;
    freedSpace: number;
  }> {
    console.log('[AssetService] Asset cleanup not yet implemented');
    // TODO: Implement in future version
    // - Scan all .md files in workspace
    // - Extract image references
    // - Compare with assets folder
    // - Remove unreferenced assets (with user confirmation)
    
    return { removedCount: 0, freedSpace: 0 };
  }

  /**
   * Validate workspace for asset operations
   */
  validateWorkspace(workspaceUri: vscode.Uri | undefined): vscode.Uri {
    if (!workspaceUri) {
      throw new Error('No workspace folder available. Assets can only be saved in workspace folders.');
    }
    
    return workspaceUri;
  }

  /**
   * Get workspace folder for a given document
   */
  getWorkspaceFolder(document: vscode.TextDocument): vscode.Uri {
    const workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri);
    
    if (!workspaceFolder) {
      throw new Error('Document is not in a workspace folder. Assets can only be saved in workspace folders.');
    }
    
    return workspaceFolder.uri;
  }
}