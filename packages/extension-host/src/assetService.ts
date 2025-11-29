import * as vscode from 'vscode';
import * as path from 'path';
import * as crypto from 'crypto';
import { getSettings } from './types';

export class AssetService {
  constructor(private readonly workspaceFolder: vscode.WorkspaceFolder | undefined) {}

  async writeAsset(dataUri: string, suggestedName?: string): Promise<string> {
    if (!this.workspaceFolder) {
      throw new Error('No workspace folder available');
    }

    const settings = getSettings();
    const assetsFolder = settings.assetsFolder;

    // Parse data URI
    const matches = dataUri.match(/^data:([^;]+);base64,(.+)$/);
    if (!matches) {
      throw new Error('Invalid data URI format');
    }

    const mimeType = matches[1];
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, 'base64');

    // Generate filename
    const extension = this.getExtensionFromMime(mimeType);
    const hash = crypto.createHash('md5').update(buffer).digest('hex').substring(0, 8);
    const filename = suggestedName || `image-${hash}${extension}`;

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

  private getExtensionFromMime(mimeType: string): string {
    const mimeToExt: Record<string, string> = {
      'image/png': '.png',
      'image/jpeg': '.jpg',
      'image/gif': '.gif',
      'image/webp': '.webp',
      'image/svg+xml': '.svg',
      'image/bmp': '.bmp',
    };
    return mimeToExt[mimeType] || '.png';
  }
}
