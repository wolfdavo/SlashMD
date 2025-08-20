# Context Handoff: Chunk 3 - VS Code Extension Shell

## Mission
Create a VS Code extension that registers as the default editor for Markdown files and loads a WebView with proper security, messaging, and VS Code integration. This shell will later host the Lexical editor from Chunk 2.

## Scope (What you're building)
- **Package name**: `@slashmd/extension-host`
- **Zero dependencies on**: Markdown parsing logic, React components, Lexical editor
- **Input**: Any HTML content for WebView (you'll use a simple placeholder)
- **Output**: Functional VS Code extension with secure WebView and command integration

## Technical Requirements

### Core VS Code APIs
```typescript
import * as vscode from 'vscode';

// Key APIs you'll use:
// - vscode.workspace.registerTextDocumentContentProvider
// - vscode.window.registerCustomEditorProvider  
// - vscode.commands.registerCommand
// - vscode.workspace.fs (for asset handling)
```

### Extension Structure
```
packages/extension-host/
  src/
    extension.ts           # Extension activation & registration
    customEditor.ts        # CustomTextEditorProvider implementation
    webviewManager.ts      # WebView setup, CSP, messaging
    assetService.ts        # Image paste/drag file handling
    commands.ts            # Command registration
    settings.ts            # Configuration management
    types.ts               # Shared types for messaging
  media/
    icon.png              # Extension icon
  package.json           # Extension manifest
  README.md
  tsconfig.json
```

### Package.json Configuration
```jsonc
{
  "name": "slashmd",
  "displayName": "SlashMD — Block-Based Markdown",
  "publisher": "yourPublisher", 
  "version": "0.0.1",
  "engines": { "vscode": "^1.85.0" },
  "categories": ["Other"],
  "main": "./dist/extension.js",
  
  "activationEvents": [
    "onLanguage:markdown",
    "onCustomEditor:slashmd.editor"
  ],
  
  "contributes": {
    "customEditors": [
      {
        "viewType": "slashmd.editor",
        "displayName": "SlashMD — Block-Based Markdown",
        "selector": [
          { "filenamePattern": "*.md" },
          { "filenamePattern": "*.markdown" }
        ],
        "priority": "default"
      }
    ],
    
    "commands": [
      {
        "command": "slashmd.openAsText", 
        "title": "Open as Raw Markdown",
        "icon": "$(edit)"
      },
      {
        "command": "slashmd.insertBlock",
        "title": "Insert Block..."
      },
      {
        "command": "slashmd.toggleDefault",
        "title": "Make SlashMD Default for Markdown"
      }
    ],
    
    "menus": {
      "editor/title": [
        {
          "command": "slashmd.openAsText",
          "when": "activeCustomEditorId == slashmd.editor",
          "group": "navigation"
        }
      ]
    },
    
    "configuration": {
      "title": "SlashMD",
      "properties": {
        "slashmd.assets.folder": {
          "type": "string",
          "default": "assets",
          "description": "Relative folder for pasted/dragged images"
        },
        "slashmd.format.wrap": {
          "type": "integer", 
          "default": 0,
          "description": "Markdown wrap width (0 = no wrap)"
        },
        "slashmd.callouts.style": {
          "type": "string",
          "enum": ["admonition", "emoji"],
          "default": "admonition",
          "description": "Callout syntax style"
        },
        "slashmd.theme.density": {
          "type": "string",
          "enum": ["compact", "comfortable"],
          "default": "comfortable"
        }
      }
    }
  }
}
```

### Core Implementation

#### CustomTextEditorProvider
```typescript
export class SlashMDEditorProvider implements vscode.CustomTextEditorProvider {
  
  async resolveCustomTextEditor(
    document: vscode.TextDocument,
    webviewPanel: vscode.WebviewPanel,
    token: vscode.CancellationToken
  ): Promise<void> {
    // 1. Setup WebView with security
    // 2. Load HTML with nonce and CSP
    // 3. Wire up messaging between WebView and extension
    // 4. Handle document changes (external edits)
    // 5. Implement backup/restore for hot-exit
  }
  
  // Handle backup for hot-exit recovery
  async backupCustomDocument(
    document: vscode.CustomDocument,
    context: vscode.CustomDocumentBackupContext,
    cancellation: vscode.CancellationToken
  ): Promise<vscode.CustomDocumentBackup> {
    // Implement backup logic
  }
}
```

#### WebView Security & Setup
```typescript
export class WebViewManager {
  
  setupWebView(webview: vscode.Webview, extensionUri: vscode.Uri): string {
    // 1. Generate cryptographic nonce
    const nonce = this.generateNonce();
    
    // 2. Build Content Security Policy
    const csp = this.buildCSP(nonce);
    
    // 3. Get WebView URIs for local resources
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(extensionUri, 'media', 'webview.js')
    );
    
    // 4. Return HTML with placeholders filled
    return this.getHtmlContent(nonce, csp, scriptUri);
  }
  
  private buildCSP(nonce: string): string {
    return [
      "default-src 'none'",
      "img-src vscode-resource: data:",
      "style-src 'unsafe-inline'", 
      `script-src 'nonce-${nonce}'`
    ].join('; ');
  }
  
  private getHtmlContent(nonce: string, csp: string, scriptUri: vscode.Uri): string {
    return `<!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta http-equiv="Content-Security-Policy" content="${csp}">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>SlashMD</title>
      </head>
      <body>
        <div id="root">
          <h2>SlashMD Editor Loading...</h2>
          <p>This is a placeholder. The Lexical editor will replace this content.</p>
        </div>
        <script nonce="${nonce}" src="${scriptUri}"></script>
      </body>
    </html>`;
  }
}
```

#### Messaging Protocol Implementation
```typescript
// Types for WebView ↔ Extension communication
export interface UIToHost {
  type: 'APPLY_TEXT_EDITS' | 'WRITE_ASSET' | 'REQUEST_INIT';
  payload: any;
}

export interface HostToUI {
  type: 'DOC_INIT' | 'DOC_CHANGED' | 'ASSET_WRITTEN' | 'ERROR';
  payload: any;
}

// Message handling
export class MessageHandler {
  
  handleUIMessage(message: UIToHost, document: vscode.TextDocument): void {
    switch (message.type) {
      case 'APPLY_TEXT_EDITS':
        this.applyTextEdits(document, message.payload.edits);
        break;
      case 'WRITE_ASSET':
        this.writeAssetFile(message.payload);
        break;
      case 'REQUEST_INIT':
        this.sendDocumentInit(document);
        break;
    }
  }
  
  private async applyTextEdits(document: vscode.TextDocument, edits: any[]): Promise<void> {
    const workspaceEdit = new vscode.WorkspaceEdit();
    // Convert edits to VS Code TextEdit format
    // Apply via workspace.applyEdit()
  }
}
```

#### Asset Service (Image Handling)
```typescript
export class AssetService {
  
  async writeAsset(
    dataUri: string, 
    suggestedName: string | undefined,
    workspaceUri: vscode.Uri
  ): Promise<string> {
    // 1. Get assets folder from settings
    const assetsFolder = vscode.workspace.getConfiguration('slashmd').get<string>('assets.folder', 'assets');
    
    // 2. Ensure assets directory exists
    const assetsPath = vscode.Uri.joinPath(workspaceUri, assetsFolder);
    await vscode.workspace.fs.createDirectory(assetsPath);
    
    // 3. Generate unique filename (hash-based to avoid duplicates)
    const fileName = this.generateFileName(dataUri, suggestedName);
    const filePath = vscode.Uri.joinPath(assetsPath, fileName);
    
    // 4. Write file
    const buffer = this.dataUriToBuffer(dataUri);
    await vscode.workspace.fs.writeFile(filePath, buffer);
    
    // 5. Return relative path for markdown link
    return `${assetsFolder}/${fileName}`;
  }
  
  private generateFileName(dataUri: string, suggestedName?: string): string {
    // Hash content to avoid duplicates
    // Use suggested name or generate from hash + timestamp
  }
}
```

### Commands Implementation
```typescript
export function registerCommands(context: vscode.ExtensionContext): void {
  
  // Open current markdown file in text editor
  const openAsText = vscode.commands.registerCommand('slashmd.openAsText', async () => {
    const activeEditor = vscode.window.activeTextEditor;
    if (activeEditor?.document.languageId === 'markdown') {
      await vscode.commands.executeCommand('vscode.openWith', 
        activeEditor.document.uri, 
        'default'
      );
    }
  });
  
  // Toggle SlashMD as default for markdown
  const toggleDefault = vscode.commands.registerCommand('slashmd.toggleDefault', async () => {
    // Update user settings to prefer SlashMD editor
  });
  
  context.subscriptions.push(openAsText, toggleDefault);
}
```

### Settings Integration
```typescript
export class SettingsManager {
  
  getSettings(): Record<string, any> {
    const config = vscode.workspace.getConfiguration('slashmd');
    return {
      assetsFolder: config.get('assets.folder', 'assets'),
      wrapWidth: config.get('format.wrap', 0),
      calloutsStyle: config.get('callouts.style', 'admonition'),
      themeDensity: config.get('theme.density', 'comfortable')
    };
  }
  
  onSettingsChanged(callback: () => void): vscode.Disposable {
    return vscode.workspace.onDidChangeConfiguration(event => {
      if (event.affectsConfiguration('slashmd')) {
        callback();
      }
    });
  }
}
```

### Development Setup

#### VS Code Debug Configuration (.vscode/launch.json)
```jsonc
{
  "version": "0.2.0", 
  "configurations": [
    {
      "name": "Run SlashMD Extension",
      "type": "extensionHost",
      "request": "launch",
      "runtimeExecutable": "${execPath}",
      "args": ["--extensionDevelopmentPath=${workspaceFolder}/packages/extension-host"],
      "outFiles": ["${workspaceFolder}/packages/extension-host/dist/**/*.js"],
      "preLaunchTask": "build-extension"
    }
  ]
}
```

### Success Criteria
- [ ] Extension activates when opening .md files
- [ ] Custom editor opens as default for markdown
- [ ] "Open as Raw Markdown" command works in title bar
- [ ] WebView loads with proper CSP and no console errors
- [ ] Settings are accessible and reactive
- [ ] Image paste writes files to assets folder
- [ ] Messaging protocol handles mock messages
- [ ] Extension packages as .vsix successfully
- [ ] Works in both VS Code and Cursor

### Mock WebView Content
For development, create a simple HTML page that demonstrates:
- PostMessage communication working
- Settings being received from extension
- Mock image drop/paste handling
- Theme variables being applied

### What You DON'T Need to Worry About
- Markdown parsing (mock it with placeholder text)
- Complex editor UI (simple placeholder is fine)  
- Lexical integration (will be handled by Chunk 4)
- Advanced block operations

### Interface Contracts (Other chunks depend on these)
Your extension will host the WebView content from Chunk 2 and provide:
- Document text via messaging
- Settings configuration
- Asset writing capability
- VS Code theme integration

Focus on rock-solid VS Code integration with bulletproof security and messaging!