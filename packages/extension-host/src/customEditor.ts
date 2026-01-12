import * as vscode from 'vscode';
import { generateNonce, buildCsp } from './csp';
import { getSettings, getThemeOverrides } from './types';
import { AssetService } from './assetService';
import { UIToHostMessageSchema } from './validation';

export class SlashMDEditorProvider implements vscode.CustomTextEditorProvider {
  public static readonly viewType = 'slashmd.editor';

  private static readonly webviewOptions: vscode.WebviewOptions = {
    enableScripts: true,
    localResourceRoots: [],
  };

  constructor(private readonly context: vscode.ExtensionContext) {}

  public static register(context: vscode.ExtensionContext): vscode.Disposable {
    const provider = new SlashMDEditorProvider(context);
    const providerRegistration = vscode.window.registerCustomEditorProvider(
      SlashMDEditorProvider.viewType,
      provider,
      {
        webviewOptions: {
          retainContextWhenHidden: true,
        },
        supportsMultipleEditorsPerDocument: false,
      }
    );
    return providerRegistration;
  }

  async resolveCustomTextEditor(
    document: vscode.TextDocument,
    webviewPanel: vscode.WebviewPanel,
    _token: vscode.CancellationToken
  ): Promise<void> {
    // Get workspace folder for asset service
    const workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri);
    const assetService = new AssetService(workspaceFolder);

    // Configure webview
    const localResourceRoots = [
      vscode.Uri.joinPath(this.context.extensionUri, 'dist'),
      vscode.Uri.joinPath(this.context.extensionUri, 'media'),
    ];
    // Add workspace folder to allow loading images from assets
    if (workspaceFolder) {
      localResourceRoots.push(workspaceFolder.uri);
    }
    webviewPanel.webview.options = {
      ...SlashMDEditorProvider.webviewOptions,
      localResourceRoots,
    };

    // Set initial HTML
    webviewPanel.webview.html = this.getHtmlForWebview(webviewPanel.webview);

    // Track if we're currently applying edits from the webview
    let isApplyingEdits = false;

    // Send document content to webview
    const sendDocumentToWebview = () => {
      const text = document.getText();

      // Generate base URI for resolving relative asset paths (workspace root)
      let assetBaseUri: string | undefined;
      if (workspaceFolder) {
        assetBaseUri = webviewPanel.webview.asWebviewUri(workspaceFolder.uri).toString();
        // Ensure it ends with a slash for proper path joining
        if (!assetBaseUri.endsWith('/')) {
          assetBaseUri += '/';
        }
      }

      // Generate URI for the document's directory (for document-relative path resolution)
      let documentDirUri: string | undefined;
      const documentDir = vscode.Uri.joinPath(document.uri, '..');
      documentDirUri = webviewPanel.webview.asWebviewUri(documentDir).toString();
      // Ensure it ends with a slash for proper path joining
      if (!documentDirUri.endsWith('/')) {
        documentDirUri += '/';
      }

      const settings = getSettings();
      webviewPanel.webview.postMessage({
        type: 'DOC_INIT',
        text: text,
        settings,
        assetBaseUri,
        documentDirUri,
        themeOverrides: getThemeOverrides(settings),
      });
    };

    // Handle messages from webview with runtime validation
    const messageHandler = webviewPanel.webview.onDidReceiveMessage(
      async (rawMessage: unknown) => {
        // Runtime validation of incoming message
        const parseResult = UIToHostMessageSchema.safeParse(rawMessage);
        if (!parseResult.success) {
          console.error('SlashMD: Invalid message from webview:', parseResult.error.message);
          return;
        }

        const message = parseResult.data;

        switch (message.type) {
          case 'REQUEST_INIT':
            sendDocumentToWebview();
            break;

          case 'REQUEST_SETTINGS': {
            const reqSettings = getSettings();
            webviewPanel.webview.postMessage({
              type: 'SETTINGS_CHANGED',
              settings: reqSettings,
              themeOverrides: getThemeOverrides(reqSettings),
            });
            break;
          }

          case 'APPLY_TEXT_EDITS':
            if (message.edits && message.edits.length > 0) {
              isApplyingEdits = true;
              const edit = new vscode.WorkspaceEdit();

              for (const textEdit of message.edits) {
                // Additional validation: ensure end >= start
                if (textEdit.end < textEdit.start) {
                  console.error('SlashMD: Invalid edit range: end < start');
                  continue;
                }
                const startPos = document.positionAt(textEdit.start);
                const endPos = document.positionAt(textEdit.end);
                const range = new vscode.Range(startPos, endPos);
                edit.replace(document.uri, range, textEdit.newText);
              }

              await vscode.workspace.applyEdit(edit);
              isApplyingEdits = false;
            }
            break;

          case 'WRITE_ASSET':
            if (message.dataUri) {
              try {
                const relPath = await assetService.writeAsset(
                  message.dataUri,
                  message.suggestedName
                );
                // Convert relative path to webview URI for display
                let webviewUri = relPath;
                if (workspaceFolder) {
                  const fileUri = vscode.Uri.joinPath(workspaceFolder.uri, relPath);
                  webviewUri = webviewPanel.webview.asWebviewUri(fileUri).toString();
                }
                webviewPanel.webview.postMessage({
                  type: 'ASSET_WRITTEN',
                  relPath,
                  webviewUri,
                });
              } catch (error) {
                webviewPanel.webview.postMessage({
                  type: 'ERROR',
                  message: error instanceof Error ? error.message : 'Failed to write asset',
                });
              }
            }
            break;

          case 'OPEN_LINK':
            if (message.url) {
              await this.openLink(message.url, document.uri);
            }
            break;

        }
      }
    );

    // Track last sent content to avoid duplicate sends
    let lastSentContent = document.getText();

    // Handle external document changes
    const changeDocumentSubscription = vscode.workspace.onDidChangeTextDocument((e) => {
      if (e.document.uri.toString() === document.uri.toString() && !isApplyingEdits) {
        // External change detected, sync to webview
        if (e.contentChanges.length > 0) {
          const newContent = document.getText();
          // Only send if content actually changed (avoids echo from our own edits)
          if (newContent !== lastSentContent) {
            lastSentContent = newContent;
            webviewPanel.webview.postMessage({
              type: 'DOC_CHANGED',
              text: newContent,
            });
          }
        }
      }
    });

    // Handle settings changes
    const configChangeSubscription = vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration('slashmd')) {
        const newSettings = getSettings();
        webviewPanel.webview.postMessage({
          type: 'SETTINGS_CHANGED',
          settings: newSettings,
          themeOverrides: getThemeOverrides(newSettings),
        });
      }
    });

    // Handle VS Code theme changes (for auto theme detection)
    const themeChangeSubscription = vscode.window.onDidChangeActiveColorTheme(() => {
      const currentSettings = getSettings();
      // Only update if using auto theme
      if (currentSettings.codeTheme === 'auto') {
        webviewPanel.webview.postMessage({
          type: 'SETTINGS_CHANGED',
          settings: currentSettings,
          themeOverrides: getThemeOverrides(currentSettings),
        });
      }
    });

    // Cleanup on panel dispose
    webviewPanel.onDidDispose(() => {
      messageHandler.dispose();
      changeDocumentSubscription.dispose();
      configChangeSubscription.dispose();
      themeChangeSubscription.dispose();
    });

    // Send initial content after a short delay to ensure webview is ready
    setTimeout(() => {
      sendDocumentToWebview();
    }, 100);
  }

  /**
   * Open a link from the webview.
   * - Relative .md links: Open in VS Code editor
   * - Anchor-only links (#anchor): Ignored (handled in webview)
   * - External URLs (http/https): Open in default browser
   */
  private async openLink(url: string, documentUri: vscode.Uri): Promise<void> {
    // Handle anchor-only links (in-page navigation) - nothing to do
    if (url.startsWith('#')) {
      return;
    }

    // Handle external URLs
    if (url.startsWith('http://') || url.startsWith('https://')) {
      await vscode.env.openExternal(vscode.Uri.parse(url));
      return;
    }

    // Handle relative links (wiki-links to other markdown files)
    // Resolve relative to the current document's directory
    const documentDir = vscode.Uri.joinPath(documentUri, '..');
    
    // Remove any anchor from the URL for file resolution
    const [filePath, anchor] = url.split('#', 2);
    
    // Resolve the file path relative to the document
    const targetUri = vscode.Uri.joinPath(documentDir, filePath);
    
    try {
      // Check if the file exists
      await vscode.workspace.fs.stat(targetUri);
      
      // Open the document
      // Use showTextDocument to ensure it opens (works with custom editors too)
      const doc = await vscode.workspace.openTextDocument(targetUri);
      await vscode.window.showTextDocument(doc);
      
      // TODO: If anchor is present, could scroll to heading with that id
    } catch (error) {
      // File doesn't exist - show error
      vscode.window.showWarningMessage(`File not found: ${filePath}`);
    }
  }

  private getHtmlForWebview(webview: vscode.Webview): string {
    const nonce = generateNonce();
    const csp = buildCsp(webview, nonce);

    // Get the webview bundle URI
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.context.extensionUri, 'dist', 'webview.js')
    );
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.context.extensionUri, 'dist', 'webview.css')
    );

    // SECURITY: Use safe DOM APIs for error display instead of innerHTML
    // The error handler uses textContent to prevent XSS
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy" content="${csp}">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="${styleUri}" rel="stylesheet">
  <title>SlashMD</title>
</head>
<body>
  <div id="root">
    <div style="padding: 20px; color: #888;">Loading SlashMD editor...</div>
  </div>
  <script nonce="${nonce}">
    window.onerror = function(msg, url, line, col, error) {
      console.error('SlashMD error:', msg, url, line, col, error);
      var root = document.getElementById('root');
      var errorDiv = document.createElement('div');
      errorDiv.style.cssText = 'color: red; padding: 20px;';
      errorDiv.textContent = 'Error: ' + String(msg);
      root.innerHTML = '';
      root.appendChild(errorDiv);
      return false;
    };
  </script>
  <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
  }
}
