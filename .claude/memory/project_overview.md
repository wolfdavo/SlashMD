---

name: SlashMD Project Overview
description: Architecture, tech stack, key files, and current state of the SlashMD VS Code extension
type: project
-------------

# SlashMD — Project Overview

## What the extension does

SlashMD replaces VS Code's default Markdown preview with a live block editor — similar to Notion — that opens automatically when you open any `.md` file. The file on disk is always plain Markdown. The editor is just a visual layer on top of it.

---

## The mental model: two processes talking to each other

This is the most important thing to understand about VS Code extensions with editors.

When SlashMD opens a file, VS Code runs **two completely separate processes**:

```javascript
┌─────────────────────────────────┐     messages      ┌──────────────────────────────┐
│   Extension Host (Node.js)      │ ◄────────────────► │   Webview (browser sandbox)  │
│                                 │                    │                              │
│  - Reads/writes the .md file    │                    │  - Renders the visual editor │
│  - Handles VS Code commands     │                    │  - React + Lexical           │
│  - Manages settings             │                    │  - styles.css                │
│  - Saves images to disk         │                    │  - No file access at all     │
└─────────────────────────────────┘                    └──────────────────────────────┘
      packages/extension-host/                               packages/webview-ui/
```

**The Extension Host** is a Node.js process with full access to the file system, VS Code APIs, and the user's workspace. Think of it as the backend.

**The Webview** is a sandboxed browser iframe. It has no file system access and cannot call VS Code APIs. It can only send and receive messages to/from the extension host. Think of it as the frontend.

They communicate via `postMessage` — like a web app talking to a service worker. Every user edit travels: `editor → message → host → file`. Every file change travels: `file → message → editor`.

---

## Repository structure

```javascript
SlashMD/
├── packages/
│   ├── extension-host/     The VS Code extension (the "backend")
│   ├── webview-ui/         The editor UI (the "frontend")
│   └── shared/             Types shared between the two
├── package.json            Monorepo root — runs all packages together
├── package-lock.json       Exact dependency versions (don't edit manually)
├── .vscode/
│   ├── launch.json         F5 launch configurations
│   └── tasks.json          Background tasks (watch mode auto-start)
└── CLAUDE.md               Instructions for Claude Code
```

---

## `packages/extension-host/` — the backend

This is the VS Code extension. It runs in Node.js, has access to files and VS Code APIs, and is responsible for everything that touches the actual `.md` file.

### `package.json` — the extension manifest ⭐

**The most important file for configuring the extension itself.**

It tells VS Code everything about the extension:

- The extension's name, version, icon, description
- Which file types it handles (`*.md`, `*.markdown`)
- What commands it adds to VS Code (e.g. "Open as Raw Markdown")
- What settings it contributes under `slashmd.*`
- What icons appear in the editor toolbar

**Edit this file when you want to:**

- Add a new setting (under `contributes.configuration.properties`)
- Add a new command
- Change the extension version, name, or description
- Change which toolbar buttons appear

### `src/extension.ts` — the entry point

The very first file VS Code runs when the extension activates. It just wires up two things:

1. Registers the custom editor provider (so `.md` files open in SlashMD)
2. Registers the commands

You rarely need to touch this file.

### `src/customEditor.ts` — the heart of the backend ⭐

**The most important file in the extension host.**

This file manages the full lifecycle of an open editor:

- Creates the webview iframe and injects the HTML shell with the JS/CSS bundle
- Sends the document content to the webview when it opens (`DOC_INIT`)
- Listens for user edits from the webview and applies them to the file (`APPLY_TEXT_EDITS`)
- Watches for external file changes (e.g. git pull) and pushes updates to the webview (`DOC_CHANGED`)
- Listens for settings changes and pushes them to the webview (`SETTINGS_CHANGED`)
- Handles image saving requests from the webview (`WRITE_ASSET`)

**Edit this file when you want to:**

- Change how the webview is initialised
- Add a new message type to handle from the webview
- Change when/how the file is updated
- Add new data sent to the webview on startup

### `src/types.ts` — settings definitions ⭐

Defines the `SlashMDSettings` TypeScript interface and two key functions:

- `getSettings()` — reads all `slashmd.*` settings from VS Code and returns them as a typed object
- `getThemeOverrides()` — converts settings into CSS custom property values (e.g. `--slashmd-h1-color: red`) that the webview applies directly

Also contains the colour presets for each code syntax theme (dark, light, GitHub, Monokai).

**Edit this file when you want to:**

- Add a new setting to `SlashMDSettings` (after adding it to `package.json`)
- Read a new setting in `getSettings()`
- Emit a new CSS variable from a setting in `getThemeOverrides()`

### `src/commands.ts` — VS Code commands

Implements the four commands that appear in the editor toolbar and command palette:

- **Open as Raw Markdown** — closes the custom editor and opens the plain text editor
- **Open as SlashMD** — the reverse
- **Copy Markdown Content** — copies the raw markdown to clipboard
- **Insert Block…** — not yet fully implemented

**Edit this file when you want to add a new command or change command behaviour.**

### `src/assetService.ts` — image saving

Handles the `WRITE_ASSET` message: takes a base64 image data URI from the webview, validates it (MIME type, file size, path safety), and writes it to the configured assets folder (default: `assets/` relative to the markdown file).

**Edit this file when you want to change how pasted/dropped images are saved.**

### `src/validation.ts` — message safety

Zod schemas that validate every message arriving from the webview before the extension host acts on it. Guards against malformed or malicious messages.

You rarely need to edit this unless you're adding a new message type from the webview.

### `src/csp.ts` — Content Security Policy

Builds the security header that restricts what the webview iframe can do (no remote scripts, no eval, etc.). You should not need to touch this.

### `dist/` — compiled output

Generated by the build. Contains:

- `extension.js` — compiled extension host code
- `webview.js` — compiled React app (copied here by the webview-ui build)
- `webview.css` — compiled styles (copied here by the webview-ui build)

**Never edit files in dist/ directly — they are overwritten on every build.**

### `media/` — icons

SVG icons used in the VS Code editor toolbar (the switch-editor and copy buttons). Edit these if you want to change the toolbar icons.

---

## `packages/webview-ui/` — the frontend

This is the editor UI. It runs in a sandboxed browser context (like a web page). It's built with React and Lexical (a rich text editor framework from Meta). It has no access to the file system — everything goes through messages to the extension host.

### `src/styles.css` — all visual styles ⭐

**The file to edit for any visual change.**

A single global CSS file that covers everything: typography, headings, lists, code blocks, tables, callouts, toggles, the slash menu, toolbar, drag handles, image modal, and search bar.

Uses CSS custom properties (variables) throughout — most colours come from VS Code's theme via `var(--vscode-*)` variables, and SlashMD's own overrides via `var(--slashmd-*)` variables.

**Edit this file when you want to change how anything looks.**

### `src/index.tsx` — webview entry point

Mounts the React app into the `<div id="root">` element. One function call. You rarely need to touch this.

### `src/messaging.ts` — talking to the extension host

A thin wrapper around VS Code's `postMessage` API. Provides named functions (`requestInit()`, `applyTextEdits()`, `writeAsset()`) instead of raw `postMessage` calls, and sets up the listener for incoming messages.

**Edit this file if you add a new outgoing message type (UI → Host).**

### `src/types.ts` — message type definitions (webview side)

Zod schemas and TypeScript types for all messages the webview can send and receive. This is a parallel copy of `shared/src/index.ts` maintained separately for bundle size reasons.

**When you add a new field to the settings or a new message type, update this file too** (alongside `shared/src/index.ts`).

### `src/app/App.tsx` — top-level state ⭐

The root React component. Holds the state for:

- Document content (the current markdown string)
- Settings received from the host
- Asset URIs for resolving images
- Theme CSS variable overrides

Key behaviour: when the user types, `App` calls `computeMinimalEdits()` to find only the characters that changed (instead of sending the whole document), then sends that small diff to the extension host as `APPLY_TEXT_EDITS`. This avoids unnecessary file churn.

**Edit this file if you need to add new top-level state or handle a new message from the host.**

### `src/app/editor/Editor.tsx` — Lexical setup ⭐

Configures and mounts the Lexical editor. Does three things:

1. Declares all registered node types (`editorNodes` array) — every custom block type must be listed here
2. Declares the CSS class map (`editorTheme`) — maps Lexical's internal node names to CSS classes in `styles.css`
3. Mounts all plugins as React children inside `<LexicalComposer>`

**Edit this file when you add a new node type or a new plugin.**

### `src/app/editor/` — all editor plugins

Each plugin is a React component that returns `null` — its job is to register behaviour into Lexical via hooks, not to render anything. The exception is `Toolbar.tsx` and `SlashMenu.tsx` which render floating UI.

| File                                    | What it does                                                                  | Edit when…                                    |
| --------------------------------------- | ----------------------------------------------------------------------------- | --------------------------------------------- |
| `Toolbar.tsx`                           | Floating format bar (bold, italic, link, etc.) that appears on text selection | Changing toolbar buttons or inline formatting |
| `SlashMenu.tsx` + `SlashMenuPlugin.tsx` | The `/` command palette that inserts block types                              | Adding a new block to the slash menu          |
| `CodeBlockPlugin.tsx`                   | Language selector button + copy button overlay on each code block             | Changing code block toolbar UI                |
| `CodeFencePlugin.tsx`                   | Converts ` ```lang ` + Enter into a code block with language set              | Changing code fence trigger behaviour         |
| `MarkdownShortcutsPlugin.tsx`           | `# `, `- `, `> ` etc. keyboard shortcuts that auto-convert to blocks          | Adding/removing markdown shortcut triggers    |
| `DragHandlePlugin.tsx`                  | The `⠿` handle on the left of each block for drag-to-reorder                  | Changing drag handle behaviour or appearance  |
| `TableActionsPlugin.tsx`                | Right-click/hover menu to add/delete table rows and columns                   | Changing table editing UX                     |
| `TogglePlugin.tsx`                      | Open/close state management for toggle (collapsible) blocks                   | Changing toggle behaviour                     |
| `ImagePlugin.tsx`                       | Paste and drag-drop image handling                                            | Changing how images are pasted or dropped     |
| `ImageModal.tsx`                        | The modal dialog for inserting images by URL or file upload                   | Changing the image insert UI                  |
| `SearchPlugin.tsx`                      | Ctrl+F find/replace with highlight overlay                                    | Changing search behaviour                     |
| `BlockClickPlugin.tsx`                  | Normalises click behaviour for custom block nodes                             | Rarely needed                                 |
| `AssetContext.tsx`                      | React context that resolves relative image paths to webview URIs              | Changing image path resolution logic          |
| `utils.ts`                              | Small shared helper functions                                                 | Adding shared utilities                       |

### `src/app/editor/nodes/` — custom block types

Lexical comes with standard nodes (paragraph, heading, list, code, table). SlashMD adds its own for blocks Lexical doesn't support natively:

| File                                  | Block type                                 | Markdown on disk                           |
| ------------------------------------- | ------------------------------------------ | ------------------------------------------ |
| `CalloutNode.ts`                      | Coloured callout box (note, tip, warning…) | `> [!NOTE]` admonition or emoji prefix     |
| `ToggleNode.tsx`                      | Collapsible toggle block                   | `<details><summary>…</summary>…</details>` |
| `ImageNode.ts` + `ImageComponent.tsx` | Image with resize handles                  | `![alt](path)`                             |
| `HorizontalRuleNode.ts`               | Horizontal divider line                    | `---`                                      |
| `index.ts`                            | Re-exports all nodes for convenient import | —                                          |

**When adding a new block type, create a new node file here.**

### `src/app/mapper/` — the translation layer ⭐

This is where Markdown text and the visual editor are connected.

**mdastToLexical.ts** — called when opening a file or receiving an external update. Walks the parsed Markdown AST (mdast) and creates the corresponding Lexical nodes. Think of it as "import".

**lexicalToMdast.ts** — called after every edit. Walks the Lexical editor state and produces a Markdown AST. Think of it as "export". Then `stringify.ts` converts that AST to a Markdown string.

**If a block type doesn't display correctly when opening a file → fix mdastToLexical.ts.If a block type doesn't save correctly to Markdown → fix lexicalToMdast.ts.**

### `src/markdown/` — Markdown parsing and serialisation

**parse.ts** — converts a Markdown string into an AST using `mdast-util-from-markdown` with GFM (GitHub Flavoured Markdown) extensions (tables, strikethrough, task lists, etc.).

**stringify.ts** — converts an AST back into a Markdown string using `mdast-util-to-markdown`.

You rarely need to edit these unless you're adding a new Markdown syntax extension (e.g. math, Mermaid).

---

## `packages/shared/` — the contract between frontend and backend

Contains the canonical Zod schemas and TypeScript types for the messaging protocol. Both packages reference this to ensure they agree on message shapes.

### `src/index.ts` — message schemas ⭐

Defines every message that can be sent between the extension host and the webview, plus all the settings types. **When adding a new message field or a new message type, start here**, then update the parallel copies in `extension-host/src/validation.ts` and `webview-ui/src/types.ts`.

---

## Config and tooling files

| File                                     | Purpose                                                                             |
| ---------------------------------------- | ----------------------------------------------------------------------------------- |
| `package.json` (root)                    | Monorepo root — defines workspaces, shared dev dependencies, top-level scripts      |
| `package-lock.json`                      | Exact locked versions of all dependencies — committed to git                        |
| `.vscode/launch.json`                    | F5 configurations: "Run SlashMD Extension" and "Run SlashMD Extension (with build)" |
| `.vscode/tasks.json`                     | Runs `npm run dev` automatically when the workspace opens                           |
| `packages/webview-ui/esbuild.config.mjs` | esbuild bundler config — outputs to `extension-host/dist/`, watches CSS separately  |
| `packages/extension-host/tsconfig.json`  | TypeScript config for the extension host                                            |
| `packages/webview-ui/tsconfig.json`      | TypeScript config for the webview                                                   |
| `tsconfig.base.json`                     | Shared TypeScript base config                                                       |

---

## How a user edit travels through the system

To make the flow concrete, here is what happens when a user types a character:

1. **User types** in the Lexical editor (webview)
2. Lexical fires an `onChange` event → `Editor.tsx` handles it
3. `lexicalToMdast.ts` converts the full editor state to a Markdown AST
4. `stringify.ts` converts the AST to a Markdown string
5. `App.tsx` runs `computeMinimalEdits()` — finds only the characters that changed
6. `messaging.ts` sends `APPLY_TEXT_EDITS` to the extension host via `postMessage`
7. `customEditor.ts` receives the message, validates it with `validation.ts`
8. Applies the edit to the VS Code `TextDocument` via `WorkspaceEdit`
9. VS Code writes the change to the `.md` file on disk

The whole round-trip takes \~100ms.
