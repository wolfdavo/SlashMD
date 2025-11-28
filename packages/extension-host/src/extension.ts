import * as vscode from 'vscode';
import { SlashMDEditorProvider } from './customEditor';
import { registerCommands } from './commands';

export function activate(context: vscode.ExtensionContext): void {
  // Register the custom editor provider
  context.subscriptions.push(SlashMDEditorProvider.register(context));

  // Register commands
  registerCommands(context);

  console.log('SlashMD extension activated');
}

export function deactivate(): void {
  console.log('SlashMD extension deactivated');
}
