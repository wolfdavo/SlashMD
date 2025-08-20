# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SlashMD is a VS Code/Cursor extension that opens Markdown files in a Notion-like, block-based WYSIWYG editor by default, while preserving the underlying file as plain Markdown. The extension uses a Custom Text Editor with WebView implementation.

## Architecture

**Monorepo Structure (planned):**
```
packages/
  extension-host/     # VS Code extension host (Node.js)
  webview-ui/        # React + Lexical editor UI
  md-mapper/         # Markdown ↔ Lexical conversion
  shared/            # Shared types and utilities
```

**Tech Stack:**
- **Package Manager:** pnpm (with workspaces)
- **Language:** TypeScript everywhere
- **Extension Host:** tsup for bundling
- **WebView UI:** React + Lexical editor, esbuild for bundling  
- **Markdown Processing:** unified/remark (remark-parse, remark-gfm, remark-stringify)
- **Testing:** vitest/jest (unit), playwright (integration)

**Key Components:**
- CustomTextEditorProvider registers as default editor for *.md files
- Webview communicates via postMessage with extension host
- Markdown parsing/serializing maintains source ranges for precise edits
- Asset pipeline for images (paste/drag → workspace folder with relative links)

## Development Commands

**Root-level:**
```bash
pnpm install              # Install all dependencies
pnpm build                # Build all packages
pnpm dev                  # Start development with watch mode
pnpm lint                 # Lint all packages
pnpm test                 # Run all tests
pnpm package              # Package extension as .vsix
```

**Extension Development:**
```bash
# Launch Extension Development Host
F5 (VS Code debug)        # Uses .vscode/launch.json config

# Individual package commands
pnpm --filter extension-host build
pnpm --filter webview-ui dev
pnpm --filter md-mapper test
```

## Core Requirements & Constraints

**Non-negotiables:**
- Underlying file is always plain Markdown (no hidden sidecar state)
- Uses VS Code's stable APIs only (Cursor compatibility)
- Custom Text Editor with priority: "default" for *.md files
- Strict Webview CSP with no remote code
- Support for core blocks: headings, lists, todos, quotes, code, tables, images, links, toggles, callouts

**Markdown Mapping:**
- Toggles: `<details><summary>Title</summary>content</details>`
- Callouts: Admonition style `> [!NOTE]` or emoji style `> 💡 Note:`
- Images: Relative paths to configurable assets folder (default: `assets/`)
- Preserve user formatting choices (bullet styles, indentation)

**Performance:**
- Incremental parsing and minimal WorkspaceEdits
- Virtualize long block lists
- Keep typing latency under ~16ms

## Key Features

**Block Types (MVP):**
- Paragraph, Headings (H1-H3), Bulleted/Numbered Lists
- Todo Lists (`- [ ]`/`- [x]`)
- Quotes, Code Blocks, Tables, Images, Links
- Toggles (collapsible sections), Callouts

**User Interactions:**
- Slash menu (`/`) for block insertion/conversion
- Drag handles for reordering and nesting
- Inline toolbar for formatting (bold/italic/link)
- "Open as Raw Markdown" command for fallback

## Messaging Protocol

**UI → Host:**
- `APPLY_TEXT_EDITS`: Send precise text edits to document
- `WRITE_ASSET`: Save pasted/dragged image to assets folder
- `REQUEST_INIT`: Request document initialization

**Host → UI:**
- `DOC_INIT`: Send initial document text and settings
- `DOC_CHANGED`: Notify of external document changes
- `ASSET_WRITTEN`: Confirm asset saved with relative path

## Settings

**Configuration (`slashmd.*`):**
- `assets.folder`: Relative folder for images (default: "assets")
- `format.wrap`: Markdown wrap width (0 = no wrap)
- `callouts.style`: "admonition" or "emoji" style
- `toggles.syntax`: "details" or "list" based

## Testing Strategy

- **Unit Tests:** mdast ↔ Lexical mapping, serializer round-trips
- **Property Tests:** Random Markdown documents maintain fidelity
- **Integration Tests:** User flows (drag blocks, paste images, slash menu)
- **Compatibility Tests:** VS Code Stable + Cursor on multiple OS

## Development Notes

- Use semantic versioning for releases
- Maintain backward compatibility for Markdown output
- Keep extension activation lightweight (prefer `onCustomEditor`)
- All telemetry must be opt-in and anonymous
- Follow VS Code extension security best practices

## Debug Configuration

Extension development uses `.vscode/launch.json` with Extension Development Host. The `pnpm dev` task should be run before launching to ensure all packages are built in watch mode.