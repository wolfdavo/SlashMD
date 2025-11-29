import * as vscode from 'vscode';
import * as path from 'path';
import * as crypto from 'crypto';
import { getSettings } from './types';

// SECURITY: Max file size for assets (5MB)
const MAX_ASSET_SIZE = 5 * 1024 * 1024;

// SECURITY: Strict base64 validation regex
const BASE64_REGEX = /^[A-Za-z0-9+/]*={0,2}$/;

// SECURITY: Allowed MIME types for images
const ALLOWED_MIME_TYPES: Record<string, string> = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/gif': '.gif',
  'image/webp': '.webp',
  'image/bmp': '.bmp',
  // SVG intentionally omitted due to script execution risk
  // If SVG support is needed, content must be sanitized first
};

export class AssetService {
  constructor(private readonly workspaceFolder: vscode.WorkspaceFolder | undefined) {}

  /**
   * SECURITY: Sanitize filename to prevent path traversal attacks
   * - Extracts only the basename (removes any path components)
   * - Removes dangerous characters
   * - Ensures filename doesn't start with a dot (hidden file)
   */
  private sanitizeFilename(name: string): string {
    // Extract only the filename, removing any path components
    let basename = path.basename(name);

    // Remove any remaining dangerous characters, keep only alphanumeric, dots, hyphens, underscores
    basename = basename.replace(/[^a-zA-Z0-9._-]/g, '_');

    // Ensure it doesn't start with a dot (hidden file) or multiple underscores
    basename = basename.replace(/^[._]+/, '');

    // Ensure reasonable length
    if (basename.length > 200) {
      const ext = path.extname(basename);
      const nameWithoutExt = basename.slice(0, 200 - ext.length);
      basename = nameWithoutExt + ext;
    }

    return basename || '';
  }

  /**
   * SECURITY: Validate and normalize assets folder path
   * - Prevents directory traversal via relative paths
   * - Rejects absolute paths
   */
  private validateAssetsFolder(folder: string): string {
    const normalized = path.normalize(folder);

    // Reject if path contains parent directory references
    if (normalized.includes('..')) {
      console.warn('SlashMD: Assets folder contains "..", using default');
      return 'assets';
    }

    // Reject absolute paths
    if (path.isAbsolute(normalized)) {
      console.warn('SlashMD: Assets folder is absolute path, using default');
      return 'assets';
    }

    // Reject if starts with slash or backslash
    if (normalized.startsWith('/') || normalized.startsWith('\\')) {
      console.warn('SlashMD: Assets folder starts with separator, using default');
      return 'assets';
    }

    return normalized;
  }

  async writeAsset(dataUri: string, suggestedName?: string): Promise<string> {
    if (!this.workspaceFolder) {
      throw new Error('No workspace folder available');
    }

    const settings = getSettings();
    // SECURITY: Validate assets folder path
    const assetsFolder = this.validateAssetsFolder(settings.assetsFolder);

    // Parse data URI with stricter validation
    const matches = dataUri.match(/^data:([^;]+);base64,(.+)$/);
    if (!matches) {
      throw new Error('Invalid data URI format');
    }

    const mimeType = matches[1];
    const base64Data = matches[2];

    // SECURITY: Validate MIME type against allowlist
    if (!ALLOWED_MIME_TYPES[mimeType]) {
      throw new Error(`Unsupported image type: ${mimeType}. Allowed types: ${Object.keys(ALLOWED_MIME_TYPES).join(', ')}`);
    }

    // SECURITY: Validate base64 format strictly
    if (!BASE64_REGEX.test(base64Data)) {
      throw new Error('Invalid base64 data format');
    }

    // SECURITY: Check estimated size before decoding (base64 is ~4/3 of original)
    const estimatedSize = Math.ceil(base64Data.length * 0.75);
    if (estimatedSize > MAX_ASSET_SIZE) {
      throw new Error(`Image too large. Maximum size is ${MAX_ASSET_SIZE / (1024 * 1024)}MB`);
    }

    const buffer = Buffer.from(base64Data, 'base64');

    // SECURITY: Verify actual buffer size
    if (buffer.length > MAX_ASSET_SIZE) {
      throw new Error(`Image too large. Maximum size is ${MAX_ASSET_SIZE / (1024 * 1024)}MB`);
    }

    // Generate filename with sanitization
    const extension = ALLOWED_MIME_TYPES[mimeType];
    const hash = crypto.createHash('md5').update(buffer).digest('hex').substring(0, 8);

    // SECURITY: Sanitize suggested name if provided
    let filename: string;
    if (suggestedName) {
      const sanitized = this.sanitizeFilename(suggestedName);
      if (sanitized) {
        // Ensure correct extension for the MIME type
        const suggestedExt = path.extname(sanitized).toLowerCase();
        if (suggestedExt === extension) {
          filename = sanitized;
        } else {
          // Replace extension with correct one
          filename = sanitized.replace(/\.[^.]+$/, '') + extension;
        }
      } else {
        filename = `image-${hash}${extension}`;
      }
    } else {
      filename = `image-${hash}${extension}`;
    }

    // Ensure assets folder exists
    const assetsFolderUri = vscode.Uri.joinPath(this.workspaceFolder.uri, assetsFolder);
    try {
      await vscode.workspace.fs.stat(assetsFolderUri);
    } catch {
      await vscode.workspace.fs.createDirectory(assetsFolderUri);
    }

    // Write file
    const fileUri = vscode.Uri.joinPath(assetsFolderUri, filename);

    // Check for existing file with same name, add suffix if needed
    let finalUri = fileUri;
    let counter = 1;
    while (true) {
      try {
        const stat = await vscode.workspace.fs.stat(finalUri);
        // File exists - first compare sizes (cheap check)
        if (stat.size === buffer.length) {
          // Sizes match, need to compare content
          const existingContent = await vscode.workspace.fs.readFile(finalUri);
          if (Buffer.compare(buffer, Buffer.from(existingContent)) === 0) {
            // Same content, reuse existing file
            break;
          }
        }
        // Different content or size, try new name
        const baseName = filename.replace(/\.[^.]+$/, '');
        const ext = path.extname(filename);
        finalUri = vscode.Uri.joinPath(assetsFolderUri, `${baseName}-${counter}${ext}`);
        counter++;
      } catch {
        // File doesn't exist, write it
        await vscode.workspace.fs.writeFile(finalUri, buffer);
        break;
      }
    }

    // Return relative path from workspace root
    const relativePath = path.posix.join(
      assetsFolder,
      path.basename(finalUri.fsPath)
    );

    return relativePath;
  }
}
