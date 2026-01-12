import * as vscode from 'vscode';

// Helper to get the current markdown file URI
function getActiveMarkdownUri(): vscode.Uri | undefined {
  const activeEditor = vscode.window.activeTextEditor;
  if (activeEditor?.document.uri) {
    return activeEditor.document.uri;
  }

  // For custom editors, check the active tab
  const activeTab = vscode.window.tabGroups.activeTabGroup.activeTab;
  if (activeTab?.input && typeof activeTab.input === 'object' && 'uri' in activeTab.input) {
    const uri = (activeTab.input as { uri: vscode.Uri }).uri;
    if (uri.path.endsWith('.md') || uri.path.endsWith('.markdown')) {
      return uri;
    }
  }

  return undefined;
}

// Safe open implementation - opens in text first to ensure document is initialized,
// then switches to SlashMD. This works around Cursor's diff tracking issue where
// newly created files can crash custom editors.
async function openInSlashMDSafely(uri: vscode.Uri): Promise<void> {
  // Step 1: Open in text editor first to ensure document is in clean state
  await vscode.commands.executeCommand('vscode.openWith', uri, 'default');
  
  // Step 2: Close and reopen in SlashMD
  await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
  await vscode.commands.executeCommand('vscode.openWith', uri, 'slashmd.editor');
}

export function registerCommands(context: vscode.ExtensionContext): void {
  // Open as Raw Markdown command
  context.subscriptions.push(
    vscode.commands.registerCommand('slashmd.openAsText', async () => {
      const uri = getActiveMarkdownUri();
      if (uri) {
        // Close current tab and open in default editor (same tab position)
        await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
        await vscode.commands.executeCommand('vscode.openWith', uri, 'default');
      } else {
        vscode.window.showWarningMessage('No Markdown file is currently active');
      }
    })
  );

  // Open as SlashMD command - uses safe mode approach to avoid Cursor diff tracking issues
  context.subscriptions.push(
    vscode.commands.registerCommand('slashmd.openAsSlashMD', async () => {
      const uri = getActiveMarkdownUri();
      if (uri) {
        try {
          await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
          await openInSlashMDSafely(uri);
        } catch (error) {
          vscode.window.showErrorMessage(
            `Failed to open in SlashMD: ${error instanceof Error ? error.message : 'Unknown error'}`
          );
        }
      } else {
        vscode.window.showWarningMessage('No Markdown file is currently active');
      }
    })
  );

  // Safe open command - for opening from explorer context menu or command palette
  // Uses the same safe approach as openAsSlashMD
  context.subscriptions.push(
    vscode.commands.registerCommand('slashmd.safeOpen', async (uri?: vscode.Uri) => {
      // Get URI from argument or active file
      const targetUri = uri || getActiveMarkdownUri();
      if (!targetUri) {
        vscode.window.showWarningMessage('No Markdown file specified');
        return;
      }

      try {
        await openInSlashMDSafely(targetUri);
      } catch (error) {
        vscode.window.showErrorMessage(
          `Failed to open in SlashMD: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    })
  );

  // Copy markdown content command
  context.subscriptions.push(
    vscode.commands.registerCommand('slashmd.copyContent', async () => {
      const uri = getActiveMarkdownUri();
      if (!uri) {
        vscode.window.showWarningMessage('No Markdown file is currently active');
        return;
      }

      // Try to get content from active text editor first
      const activeEditor = vscode.window.activeTextEditor;
      if (activeEditor?.document.uri.toString() === uri.toString()) {
        await vscode.env.clipboard.writeText(activeEditor.document.getText());
        vscode.window.showInformationMessage('Copied to clipboard');
        return;
      }

      // For custom editor, read the file directly
      try {
        const document = await vscode.workspace.openTextDocument(uri);
        await vscode.env.clipboard.writeText(document.getText());
        vscode.window.showInformationMessage('Copied to clipboard');
      } catch (error) {
        vscode.window.showErrorMessage('Failed to copy content');
      }
    })
  );

  // Insert Block command (placeholder for slash menu integration)
  context.subscriptions.push(
    vscode.commands.registerCommand('slashmd.insertBlock', async () => {
      const items: vscode.QuickPickItem[] = [
        { label: 'Paragraph', description: 'Plain text block' },
        { label: 'Heading 1', description: '# Large heading' },
        { label: 'Heading 2', description: '## Medium heading' },
        { label: 'Heading 3', description: '### Small heading' },
        { label: 'Bullet List', description: '- List items' },
        { label: 'Numbered List', description: '1. Numbered items' },
        { label: 'Todo List', description: '- [ ] Task items' },
        { label: 'Quote', description: '> Blockquote' },
        { label: 'Code Block', description: '``` Code fence' },
        { label: 'Divider', description: '--- Horizontal rule' },
        { label: 'Table', description: 'GFM table' },
        { label: 'Toggle', description: '<details> Collapsible section' },
        { label: 'Callout', description: '> [!NOTE] Admonition' },
      ];

      const selection = await vscode.window.showQuickPick(items, {
        placeHolder: 'Select a block type to insert',
      });

      if (selection) {
        // This will be handled by the webview in the actual implementation
        vscode.window.showInformationMessage(`Insert ${selection.label} - handled in editor`);
      }
    })
  );
}
