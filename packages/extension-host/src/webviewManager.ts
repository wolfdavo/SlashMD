/**
 * WebView Security & Setup Manager for Phase 2
 * 
 * This class handles secure WebView initialization with:
 * - Strict Content Security Policy (CSP) 
 * - Cryptographic nonce generation
 * - Proper VS Code resource URI handling
 * - HTML template generation with security headers
 */

import * as vscode from 'vscode';
import * as crypto from 'crypto';

export class WebViewManager {
  constructor(private readonly extensionUri: vscode.Uri) {}

  /**
   * Setup WebView with strict security and return HTML content
   */
  setupWebView(webview: vscode.Webview): string {
    // Generate cryptographic nonce for script security
    const nonce = this.generateNonce();
    
    // Configure WebView options with security restrictions
    webview.options = {
      enableScripts: true,
      enableForms: false,
      enableCommandUris: false,
      localResourceRoots: [this.extensionUri]
    };
    
    // Build Content Security Policy
    const csp = this.buildCSP(nonce);
    
    // Get WebView URIs for built React app resources
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.extensionUri, 'media', 'webview-bundle.js')
    );
    
    const stylesUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.extensionUri, 'media', 'webview-bundle.css')
    );
    
    // Return secure HTML content for React app
    return this.getHtmlContent(nonce, csp, scriptUri, stylesUri);
  }

  /**
   * Generate cryptographically secure nonce for CSP
   */
  private generateNonce(): string {
    return crypto.randomBytes(32).toString('base64');
  }

  /**
   * Build strict Content Security Policy with nonce-based script allowlist
   */
  private buildCSP(nonce: string): string {
    return [
      "default-src 'none'",                    // Block everything by default
      "img-src vscode-resource: data: blob:",  // Allow local images and data URIs
      "style-src 'unsafe-inline'",             // Allow inline styles (required for VS Code theme vars)
      `script-src 'nonce-${nonce}'`,           // Only allow scripts with matching nonce
      "connect-src 'none'",                    // No network connections
      "font-src vscode-resource:",             // Only local fonts
      "form-action 'none'",                    // No form submissions
      "frame-src 'none'",                      // No frames
      "object-src 'none'",                     // No plugins
      "base-uri 'none'",                       // No base URI changes
      "media-src 'none'"                       // No media sources
    ].join('; ');
  }

  /**
   * Generate secure HTML template for React app
   */
  private getHtmlContent(nonce: string, csp: string, scriptUri: vscode.Uri, stylesUri?: vscode.Uri): string {
    return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Security-Policy" content="${csp}">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SlashMD Editor</title>
    ${stylesUri ? `<link rel="stylesheet" href="${stylesUri}">` : ''}
    <style>
      /* VS Code theme integration and basic styles */
      :root {
        --vscode-font-family: var(--vscode-font-family);
        --vscode-font-size: var(--vscode-font-size);
        --vscode-foreground: var(--vscode-foreground);
        --vscode-background: var(--vscode-editor-background);
      }
      
      body {
        font-family: var(--vscode-font-family, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif);
        font-size: var(--vscode-font-size, 14px);
        color: var(--vscode-foreground, #cccccc);
        background-color: var(--vscode-background, var(--vscode-editor-background, #1e1e1e));
        margin: 0;
        padding: 0;
        height: 100vh;
        width: 100vw;
        overflow: hidden;
      }
      
      #root {
        height: 100%;
        width: 100%;
        display: flex;
        flex-direction: column;
      }
      
      /* Loading fallback styles */
      .loading-fallback {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100%;
        width: 100%;
        flex-direction: column;
        background: var(--vscode-editor-background, #1e1e1e);
        color: var(--vscode-foreground, #cccccc);
      }
      
      .loading-spinner {
        width: 24px;
        height: 24px;
        border: 2px solid var(--vscode-progressBar-background, #333333);
        border-top: 2px solid var(--vscode-progressBar-foreground, #0078d4);
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin-bottom: 12px;
      }
      
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      
      .loading-text {
        font-size: 14px;
        margin-bottom: 4px;
      }
      
      .loading-subtext {
        font-size: 12px;
        color: var(--vscode-descriptionForeground, #999999);
      }
    </style>
  </head>
  <body>
    <div id="root">
      <!-- Fallback loading state if React doesn't load -->
      <div class="loading-fallback">
        <div class="loading-spinner"></div>
        <div class="loading-text">Loading SlashMD Editor...</div>
        <div class="loading-subtext">Integration Phase - React + Lexical Editor</div>
      </div>
    </div>
    
    <!-- Load the React app -->
    <script nonce="${nonce}" src="${scriptUri}"></script>
  </body>
</html>`;
  }

  /**
   * Get the current VS Code theme
   */
  getVSCodeTheme(): 'light' | 'dark' | 'high-contrast' {
    const colorTheme = vscode.window.activeColorTheme;
    
    switch (colorTheme.kind) {
      case vscode.ColorThemeKind.Light:
        return 'light';
      case vscode.ColorThemeKind.Dark:
        return 'dark';
      case vscode.ColorThemeKind.HighContrast:
        return 'high-contrast';
      default:
        return 'dark'; // Default fallback
    }
  }
}