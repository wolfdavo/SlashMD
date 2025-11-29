import * as vscode from 'vscode';
import { generateNonce, buildCsp } from './csp';
import { getSettings, SlashMDSettings } from './types';
import { AssetService } from './assetService';

interface TextEdit {
  start: number;
  end: number;
  newText: string;
}

interface UIToHostMessage {
  type: 'APPLY_TEXT_EDITS' | 'WRITE_ASSET' | 'REQUEST_INIT' | 'REQUEST_SETTINGS';
  edits?: TextEdit[];
  reason?: 'typing' | 'drag' | 'paste' | 'format';
  dataUri?: string;
  suggestedName?: string;
}

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
    console.log('SlashMD: resolveCustomTextEditor called for', document.uri.toString());

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
    const html = this.getHtmlForWebview(webviewPanel.webview);
    console.log('SlashMD: Setting webview HTML, length:', html.length);
    webviewPanel.webview.html = html;

    // Track if we're currently applying edits from the webview
    let isApplyingEdits = false;

    // Send document content to webview
    const sendDocumentToWebview = () => {
      const text = document.getText();
      console.log('SlashMD: Sending DOC_INIT to webview, text length:', text.length);

      // Generate base URI for resolving relative asset paths
      let assetBaseUri: string | undefined;
      if (workspaceFolder) {
        assetBaseUri = webviewPanel.webview.asWebviewUri(workspaceFolder.uri).toString();
        // Ensure it ends with a slash for proper path joining
        if (!assetBaseUri.endsWith('/')) {
          assetBaseUri += '/';
        }
      }

      webviewPanel.webview.postMessage({
        type: 'DOC_INIT',
        text: text,
        settings: getSettings(),
        assetBaseUri,
      });
    };

    // Handle messages from webview
    const messageHandler = webviewPanel.webview.onDidReceiveMessage(
      async (message: UIToHostMessage) => {
        console.log('SlashMD: Received message from webview:', message.type);
        switch (message.type) {
          case 'REQUEST_INIT':
            sendDocumentToWebview();
            break;

          case 'REQUEST_SETTINGS':
            webviewPanel.webview.postMessage({
              type: 'SETTINGS_CHANGED',
              settings: getSettings(),
            });
            break;

          case 'APPLY_TEXT_EDITS':
            if (message.edits && message.edits.length > 0) {
              isApplyingEdits = true;
              const edit = new vscode.WorkspaceEdit();

              for (const textEdit of message.edits) {
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
        }
      }
    );

    // Handle external document changes
    const changeDocumentSubscription = vscode.workspace.onDidChangeTextDocument((e) => {
      if (e.document.uri.toString() === document.uri.toString() && !isApplyingEdits) {
        // External change detected, sync to webview
        if (e.contentChanges.length > 0) {
          const change = e.contentChanges[0];
          const start = document.offsetAt(change.range.start);
          const end = start + change.rangeLength;

          webviewPanel.webview.postMessage({
            type: 'DOC_CHANGED',
            text: document.getText(),
            range: { start, end },
          });
        }
      }
    });

    // Handle settings changes
    const configChangeSubscription = vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration('slashmd')) {
        webviewPanel.webview.postMessage({
          type: 'SETTINGS_CHANGED',
          settings: getSettings(),
        });
      }
    });

    // Cleanup on panel dispose
    webviewPanel.onDidDispose(() => {
      messageHandler.dispose();
      changeDocumentSubscription.dispose();
      configChangeSubscription.dispose();
    });

    // Send initial content after a short delay to ensure webview is ready
    setTimeout(() => {
      sendDocumentToWebview();
    }, 100);
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

    console.log('SlashMD: Extension URI:', this.context.extensionUri.toString());
    console.log('SlashMD: Script URI:', scriptUri.toString());
    console.log('SlashMD: Style URI:', styleUri.toString());
    console.log('SlashMD: CSP:', csp);

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
    console.log('SlashMD inline script running');
    window.onerror = function(msg, url, line, col, error) {
      console.error('SlashMD error:', msg, url, line, col, error);
      document.getElementById('root').innerHTML = '<div style="color: red; padding: 20px;">Error: ' + msg + '</div>';
      return false;
    };
  </script>
  <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
  }
}
