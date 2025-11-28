import * as vscode from 'vscode';

export function registerCommands(context: vscode.ExtensionContext): void {
  // Open as Raw Markdown command
  context.subscriptions.push(
    vscode.commands.registerCommand('slashmd.openAsText', async () => {
      const activeEditor = vscode.window.activeTextEditor;
      const uri = activeEditor?.document.uri ?? vscode.window.tabGroups.activeTabGroup.activeTab?.input;

      if (uri && uri instanceof vscode.Uri) {
        await vscode.commands.executeCommand('vscode.openWith', uri, 'default');
      } else {
        vscode.window.showWarningMessage('No Markdown file is currently active');
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
