/**
 * VS Code Commands for Phase 4: Commands, Settings & Asset Management
 * 
 * This module implements all SlashMD VS Code commands:
 * - Open as Raw Markdown
 * - Insert Block menu
 * - Toggle SlashMD as default editor
 * - Asset management commands
 * - Settings management
 */

import * as vscode from 'vscode';
import { AssetService } from './assetService';

export class CommandManager {
  constructor(
    private readonly context: vscode.ExtensionContext,
    private readonly assetService: AssetService
  ) {}

  /**
   * Register all SlashMD commands
   */
  registerCommands(): void {
    // Core editor commands
    this.registerOpenAsTextCommand();
    this.registerInsertBlockCommand();
    this.registerToggleDefaultCommand();
    
    // Asset management commands
    this.registerAssetCommands();
    
    // Settings commands
    this.registerSettingsCommands();
    
    // Development and debugging commands
    this.registerDeveloperCommands();
    
    console.log('[CommandManager] All commands registered successfully');
  }

  /**
   * Open as Raw Markdown command - opens current SlashMD file in default text editor
   */
  private registerOpenAsTextCommand(): void {
    const command = vscode.commands.registerCommand('slashmd.openAsText', async () => {
      try {
        const activeEditor = vscode.window.activeTextEditor;
        
        if (activeEditor?.document.languageId === 'markdown') {
          // Open the same file with default editor
          await vscode.commands.executeCommand(
            'vscode.openWith',
            activeEditor.document.uri,
            'default'
          );
          
          vscode.window.showInformationMessage('Opened as raw Markdown in text editor');
        } else {
          // Try to find active custom editor
          const activeTab = vscode.window.tabGroups.activeTabGroup.activeTab;
          
          if (activeTab?.input && 'uri' in activeTab.input) {
            const uri = (activeTab.input as any).uri as vscode.Uri;
            if (uri.path.endsWith('.md') || uri.path.endsWith('.markdown')) {
              await vscode.commands.executeCommand('vscode.openWith', uri, 'default');
              vscode.window.showInformationMessage('Opened as raw Markdown in text editor');
              return;
            }
          }
          
          vscode.window.showWarningMessage('No active Markdown file found to open as text');
        }
      } catch (error) {
        console.error('[CommandManager] Failed to open as text:', error);
        vscode.window.showErrorMessage(`Failed to open as text: ${error instanceof Error ? error.message : String(error)}`);
      }
    });

    this.context.subscriptions.push(command);
  }

  /**
   * Insert Block command - shows quick pick menu for block insertion
   */
  private registerInsertBlockCommand(): void {
    const command = vscode.commands.registerCommand('slashmd.insertBlock', async () => {
      try {
        const blockTypes = [
          { label: '$(symbol-text) Paragraph', description: 'Plain text paragraph', value: 'paragraph' },
          { label: '$(symbol-numeric) Heading 1', description: '# Large heading', value: 'heading1' },
          { label: '$(symbol-numeric) Heading 2', description: '## Medium heading', value: 'heading2' },
          { label: '$(symbol-numeric) Heading 3', description: '### Small heading', value: 'heading3' },
          { label: '$(list-unordered) Bulleted List', description: '• List with bullets', value: 'bulletList' },
          { label: '$(list-ordered) Numbered List', description: '1. Numbered list', value: 'numberedList' },
          { label: '$(checklist) Todo List', description: '☐ Checkable tasks', value: 'todoList' },
          { label: '$(quote) Quote', description: '> Blockquote text', value: 'quote' },
          { label: '$(code) Code Block', description: '```code block```', value: 'code' },
          { label: '$(table) Table', description: 'Structured data table', value: 'table' },
          { label: '$(image) Image', description: 'Insert image from file', value: 'image' },
          { label: '$(link) Link', description: '[text](url)', value: 'link' },
          { label: '$(info) Callout', description: 'Note, tip, warning callout', value: 'callout' },
          { label: '$(fold) Toggle', description: 'Collapsible section', value: 'toggle' },
          { label: '$(dash) Divider', description: 'Horizontal rule separator', value: 'divider' }
        ];

        const selected = await vscode.window.showQuickPick(blockTypes, {
          placeHolder: 'Select a block type to insert',
          matchOnDescription: true
        });

        if (selected) {
          await this.insertBlockAtCursor(selected.value);
        }
      } catch (error) {
        console.error('[CommandManager] Failed to show insert block menu:', error);
        vscode.window.showErrorMessage(`Failed to show block menu: ${error instanceof Error ? error.message : String(error)}`);
      }
    });

    this.context.subscriptions.push(command);
  }

  /**
   * Toggle SlashMD as default editor for Markdown files
   */
  private registerToggleDefaultCommand(): void {
    const command = vscode.commands.registerCommand('slashmd.toggleDefault', async () => {
      try {
        const config = vscode.workspace.getConfiguration();
        const currentAssociations = config.get<Record<string, string>>('workbench.editorAssociations', {});
        
        const isCurrentlyDefault = currentAssociations['*.md'] === 'slashmd.editor';
        
        if (isCurrentlyDefault) {
          // Remove association to use VS Code default
          const newAssociations = { ...currentAssociations };
          delete newAssociations['*.md'];
          
          await config.update(
            'workbench.editorAssociations',
            Object.keys(newAssociations).length > 0 ? newAssociations : undefined,
            vscode.ConfigurationTarget.Global
          );
          
          vscode.window.showInformationMessage('VS Code default editor is now used for Markdown files');
        } else {
          // Set SlashMD as default
          await config.update(
            'workbench.editorAssociations',
            { ...currentAssociations, '*.md': 'slashmd.editor' },
            vscode.ConfigurationTarget.Global
          );
          
          vscode.window.showInformationMessage('SlashMD is now the default editor for Markdown files');
        }
      } catch (error) {
        console.error('[CommandManager] Failed to toggle default editor:', error);
        vscode.window.showErrorMessage(`Failed to toggle default editor: ${error instanceof Error ? error.message : String(error)}`);
      }
    });

    this.context.subscriptions.push(command);
  }

  /**
   * Register asset management commands
   */
  private registerAssetCommands(): void {
    // Import image from file
    const importImage = vscode.commands.registerCommand('slashmd.importImage', async () => {
      try {
        const fileUris = await vscode.window.showOpenDialog({
          canSelectFiles: true,
          canSelectFolders: false,
          canSelectMany: false,
          filters: {
            'Images': ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg']
          },
          openLabel: 'Import Image'
        });

        if (fileUris && fileUris[0]) {
          const imageUri = fileUris[0];
          await this.importImageFile(imageUri);
        }
      } catch (error) {
        console.error('[CommandManager] Failed to import image:', error);
        vscode.window.showErrorMessage(`Failed to import image: ${error instanceof Error ? error.message : String(error)}`);
      }
    });

    // Show asset statistics
    const showAssetStats = vscode.commands.registerCommand('slashmd.showAssetStats', async () => {
      try {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
          vscode.window.showWarningMessage('Asset statistics require an open workspace folder');
          return;
        }

        const stats = await this.assetService.getAssetStats(workspaceFolder.uri);
        const sizeInMB = (stats.totalSize / (1024 * 1024)).toFixed(2);
        
        const typeList = Object.entries(stats.assetTypes)
          .map(([ext, count]) => `${ext}: ${count}`)
          .join(', ') || 'None';

        vscode.window.showInformationMessage(
          `Asset Stats: ${stats.totalAssets} files, ${sizeInMB} MB total. Types: ${typeList}`
        );
      } catch (error) {
        console.error('[CommandManager] Failed to show asset stats:', error);
        vscode.window.showErrorMessage(`Failed to get asset stats: ${error instanceof Error ? error.message : String(error)}`);
      }
    });

    // Open assets folder
    const openAssetsFolder = vscode.commands.registerCommand('slashmd.openAssetsFolder', async () => {
      try {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
          vscode.window.showWarningMessage('Opening assets folder requires an open workspace');
          return;
        }

        const assetsFolder = vscode.workspace.getConfiguration('slashmd').get('assets.folder', 'assets');
        const assetsPath = vscode.Uri.joinPath(workspaceFolder.uri, assetsFolder);
        
        await vscode.commands.executeCommand('revealFileInOS', assetsPath);
      } catch (error) {
        console.error('[CommandManager] Failed to open assets folder:', error);
        vscode.window.showErrorMessage(`Failed to open assets folder: ${error instanceof Error ? error.message : String(error)}`);
      }
    });

    this.context.subscriptions.push(importImage, showAssetStats, openAssetsFolder);
  }

  /**
   * Register settings management commands
   */
  private registerSettingsCommands(): void {
    // Open SlashMD settings
    const openSettings = vscode.commands.registerCommand('slashmd.openSettings', async () => {
      await vscode.commands.executeCommand('workbench.action.openSettings', 'slashmd');
    });

    // Reset SlashMD settings to defaults
    const resetSettings = vscode.commands.registerCommand('slashmd.resetSettings', async () => {
      try {
        const confirm = await vscode.window.showWarningMessage(
          'Reset all SlashMD settings to defaults?',
          { modal: true },
          'Reset Settings'
        );

        if (confirm) {
          const config = vscode.workspace.getConfiguration('slashmd');
          
          // Reset each setting to its default value
          await config.update('assets.folder', undefined, vscode.ConfigurationTarget.Global);
          await config.update('format.wrap', undefined, vscode.ConfigurationTarget.Global);
          await config.update('callouts.style', undefined, vscode.ConfigurationTarget.Global);
          await config.update('toggles.syntax', undefined, vscode.ConfigurationTarget.Global);
          await config.update('theme.density', undefined, vscode.ConfigurationTarget.Global);
          await config.update('math.enabled', undefined, vscode.ConfigurationTarget.Global);
          await config.update('mermaid.enabled', undefined, vscode.ConfigurationTarget.Global);
          await config.update('showLineNumbers', undefined, vscode.ConfigurationTarget.Global);

          vscode.window.showInformationMessage('SlashMD settings reset to defaults');
        }
      } catch (error) {
        console.error('[CommandManager] Failed to reset settings:', error);
        vscode.window.showErrorMessage(`Failed to reset settings: ${error instanceof Error ? error.message : String(error)}`);
      }
    });

    this.context.subscriptions.push(openSettings, resetSettings);
  }

  /**
   * Register development and debugging commands
   */
  private registerDeveloperCommands(): void {
    // Show extension information
    const showInfo = vscode.commands.registerCommand('slashmd.showInfo', async () => {
      const extension = vscode.extensions.getExtension('slashmd.slashmd');
      const version = extension?.packageJSON.version || 'Unknown';
      
      const info = `SlashMD v${version}
Phase 4: Commands, Settings & Asset Management
Extension Host: Active
WebView: Integrated
Document Management: Complete
Asset Pipeline: Ready`;

      vscode.window.showInformationMessage(info, 'Copy Info').then(selection => {
        if (selection === 'Copy Info') {
          vscode.env.clipboard.writeText(info);
        }
      });
    });

    // Reload extension (development)
    const reloadExtension = vscode.commands.registerCommand('slashmd.reloadExtension', async () => {
      await vscode.commands.executeCommand('workbench.action.reloadWindow');
    });

    this.context.subscriptions.push(showInfo, reloadExtension);
  }

  /**
   * Insert a block at the current cursor position
   */
  private async insertBlockAtCursor(blockType: string): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showWarningMessage('No active editor to insert block');
      return;
    }

    const position = editor.selection.active;
    const blockText = this.getBlockText(blockType);
    
    await editor.edit(editBuilder => {
      editBuilder.insert(position, blockText);
    });

    // Move cursor to appropriate position within the inserted block
    const newPosition = this.getNewCursorPosition(position, blockType);
    if (newPosition) {
      editor.selection = new vscode.Selection(newPosition, newPosition);
    }
  }

  /**
   * Get markdown text for a block type
   */
  private getBlockText(blockType: string): string {
    const blockTemplates: Record<string, string> = {
      paragraph: '\nYour text here\n',
      heading1: '\n# Heading 1\n',
      heading2: '\n## Heading 2\n',
      heading3: '\n### Heading 3\n',
      bulletList: '\n- Item 1\n- Item 2\n- Item 3\n',
      numberedList: '\n1. Item 1\n2. Item 2\n3. Item 3\n',
      todoList: '\n- [ ] Task 1\n- [ ] Task 2\n- [x] Completed task\n',
      quote: '\n> Your quote here\n',
      code: '\n```typescript\n// Your code here\nconst example = "Hello, world!";\n```\n',
      table: '\n| Column 1 | Column 2 | Column 3 |\n|----------|----------|----------|\n| Row 1    | Data     | Data     |\n| Row 2    | Data     | Data     |\n',
      image: '\n![Alt text](path/to/image.png)\n',
      link: '\n[Link text](https://example.com)\n',
      callout: '\n> [!NOTE]\n> Your note here\n',
      toggle: '\n<details>\n<summary>Click to expand</summary>\n\nYour content here\n\n</details>\n',
      divider: '\n---\n'
    };

    return blockTemplates[blockType] || '\nYour content here\n';
  }

  /**
   * Get new cursor position after inserting a block
   */
  private getNewCursorPosition(insertPosition: vscode.Position, blockType: string): vscode.Position | null {
    const cursorOffsets: Record<string, { line: number; character: number }> = {
      paragraph: { line: 1, character: 0 },
      heading1: { line: 1, character: 2 },
      heading2: { line: 1, character: 3 },
      heading3: { line: 1, character: 4 },
      bulletList: { line: 1, character: 2 },
      numberedList: { line: 1, character: 3 },
      todoList: { line: 1, character: 6 },
      quote: { line: 1, character: 2 },
      code: { line: 2, character: 0 },
      image: { line: 1, character: 2 },
      link: { line: 1, character: 1 },
      callout: { line: 2, character: 2 }
    };

    const offset = cursorOffsets[blockType];
    if (!offset) return null;

    return new vscode.Position(
      insertPosition.line + offset.line,
      offset.character
    );
  }

  /**
   * Import an image file and copy it to assets folder
   */
  private async importImageFile(imageUri: vscode.Uri): Promise<void> {
    try {
      // Read the image file
      const imageBuffer = await vscode.workspace.fs.readFile(imageUri);
      
      // Convert to data URI
      const fileName = vscode.workspace.asRelativePath(imageUri);
      const extension = fileName.split('.').pop()?.toLowerCase() || 'png';
      const mimeType = `image/${extension === 'jpg' ? 'jpeg' : extension}`;
      const base64Data = Buffer.from(imageBuffer).toString('base64');
      const dataUri = `data:${mimeType};base64,${base64Data}`;
      
      // Use asset service to write the file
      const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
      if (!workspaceFolder) {
        throw new Error('No workspace folder available');
      }
      
      const result = await this.assetService.writeAsset(
        {
          dataUri,
          suggestedName: fileName
        },
        workspaceFolder.uri
      );
      
      // Insert markdown image link at cursor
      const editor = vscode.window.activeTextEditor;
      if (editor && editor.document.languageId === 'markdown') {
        const position = editor.selection.active;
        const imageMarkdown = `![${fileName}](${result.relPath})`;
        
        await editor.edit(editBuilder => {
          editBuilder.insert(position, imageMarkdown);
        });
      }
      
      const message = result.wasDuplicate
        ? `Image already exists in assets folder: ${result.relPath}`
        : `Image imported to assets folder: ${result.relPath}`;
        
      vscode.window.showInformationMessage(message);
      
    } catch (error) {
      console.error('[CommandManager] Failed to import image file:', error);
      throw error;
    }
  }
}