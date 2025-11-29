# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SlashMD is a VS Code/Cursor extension that opens Markdown files in a Notion-style, block-based WYSIWYG custom editor by default while keeping files stored as plain Markdown.

## Build Commands

```bash
# Install dependencies
npm install

# Build all packages
npm run build

# Watch mode for development
npm run dev

# Lint all packages
npm run lint

# Run tests
npm run test

# Security audit
npm run audit

# Package the extension for distribution
npm run package

# Build specific package
npm run build --workspace=packages/extension-host
npm run build --workspace=packages/webview-ui
```

## Development Workflow

1. Run `npm run dev` to start watch mode for all packages
2. Press F5 in VS Code to launch the Extension Development Host (use "Run SlashMD Extension (with build)" configuration for fresh builds)
3. Open any `.md` file to test the custom editor

## Architecture

### Monorepo Structure (npm workspaces)

- **packages/extension-host/** - VS Code extension (Node.js)
  - Registers `CustomTextEditorProvider` for `*.md` files with `priority: "default"`
  - Handles document lifecycle, messaging bridge, and asset writing
  - Built with `tsup`, outputs to `dist/extension.js`

- **packages/webview-ui/** - React UI running in webview
  - Built with React + Lexical for block editing
  - Markdown parsing via `mdast-util-from-markdown` and `mdast-util-gfm`
  - Built with `esbuild`, outputs to `dist/webview.js` and `dist/webview.css`

- **packages/shared/** - Shared TypeScript types for messaging protocol

### Data Flow

```
User ⇄ Webview (Lexical) ⇄ postMessage ⇄ Extension Host ⇄ TextDocument
              ↓                              ↓
        mdast mapper                   WorkspaceEdit
```

### Key Files

- `extension-host/src/customEditor.ts` - CustomTextEditorProvider implementation, webview initialization, message handling
- `webview-ui/src/app/App.tsx` - Main React component, state management
- `webview-ui/src/app/mapper/` - mdast ⇄ Lexical node conversion
- `webview-ui/src/app/editor/` - Lexical config, toolbar, slash menu, drag handles
- `webview-ui/src/app/editor/nodes/` - Custom Lexical nodes (CalloutNode, ToggleNode, ImageNode, etc.)
- `shared/src/index.ts` - Messaging protocol types (`UIToHostMessage`, `HostToUIMessage`)

### Messaging Protocol

UI → Host messages: `APPLY_TEXT_EDITS`, `WRITE_ASSET`, `REQUEST_INIT`, `REQUEST_SETTINGS`
Host → UI messages: `DOC_INIT`, `DOC_CHANGED`, `ASSET_WRITTEN`, `SETTINGS_CHANGED`, `ERROR`

## Technical Constraints

- Requires VS Code 1.85.0+ or Cursor
- Use only stable VS Code APIs (for Cursor compatibility)
- Strict webview CSP - no remote code, all JS/CSS bundled
- Underlying file must always be plain Markdown - no sidecar state
- The webview bundle must be copied to `packages/extension-host/dist/` for packaging
