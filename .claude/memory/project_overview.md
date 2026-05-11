---
name: SlashMD Project Overview
description: Architecture, tech stack, key files, and current state of the SlashMD VS Code extension
type: project
originSessionId: 106bc269-c33e-4b41-a1c1-cdc3bd1755b1
---
SlashMD (v0.2.4) is a VS Code/Cursor extension providing a Notion-style block-based WYSIWYG editor for Markdown files, stored as plain Markdown.

**Why:** Ships as a VSIX; underlying file stays pure Markdown — no sidecar state. Webview communicates via postMessage with Zod-validated message schemas.

**How to apply:** When suggesting changes, keep the plain-Markdown constraint in mind; all new block types need both mdast↔Lexical mapper logic and Markdown serialization.

## Monorepo (npm workspaces)

- `packages/extension-host/` — VS Code extension (tsup → `dist/extension.js`)
  - `src/extension.ts` — activate/deactivate entry point
  - `src/customEditor.ts` (290 lines) — `CustomTextEditorProvider`, webview lifecycle, message routing
  - `src/assetService.ts` (192 lines) — image write/paste handling
  - `src/commands.ts` (108 lines) — openAsText, openAsSlashMD, copyContent, insertBlock
  - `src/types.ts` (158 lines) — settings, theme presets, CSS var overrides
  - `src/validation.ts` — Zod schemas for UI→Host messages (separate from shared for tree-shaking)
  - `src/csp.ts` — Content Security Policy builder

- `packages/webview-ui/` — React 18 + Lexical (esbuild → `dist/webview.js` + `dist/webview.css`)
  - `src/app/App.tsx` (151 lines) — state management, diff-based edit dispatch
  - `src/app/editor/Editor.tsx` (346 lines) — Lexical config, plugin wiring
  - `src/app/mapper/mdastToLexical.ts` (605 lines) — markdown→editor import
  - `src/app/mapper/lexicalToMdast.ts` (466 lines) — editor→markdown export
  - `src/app/editor/SlashMenu.tsx` (493 lines) — `/` command menu
  - `src/app/editor/TableActionsPlugin.tsx` (547 lines) — table row/col actions
  - `src/app/editor/SearchPlugin.tsx` (433 lines) — find/replace
  - `src/app/editor/DragHandlePlugin.tsx` (369 lines) — block drag handles
  - `src/app/editor/nodes/` — CalloutNode, ToggleNode, ImageNode, HorizontalRuleNode

- `packages/shared/` — Zod schemas + inferred TS types for the full messaging protocol

- `website/` — Next.js marketing site with a live demo editor (mirrors webview-ui editor components)

## Messaging Protocol
UI→Host: `REQUEST_INIT`, `REQUEST_SETTINGS`, `APPLY_TEXT_EDITS`, `WRITE_ASSET`
Host→UI: `DOC_INIT`, `DOC_CHANGED`, `SETTINGS_CHANGED`, `ASSET_WRITTEN`, `ERROR`

App uses minimal-diff (`computeMinimalEdits`) before sending `APPLY_TEXT_EDITS` to VS Code.

## Settings (all under `slashmd.*`)
assets.folder, assets.imagePathResolution (document|workspace), format.wrap, callouts.style (admonition|emoji), toggles.syntax (details|list), math.enabled, mermaid.enabled, theme.codeTheme (auto|dark|light|github-dark|github-light|monokai), per-heading color/indent, boldColor, italicColor.

## Block Types
paragraph, heading1-5, bulletList, numberedList, todoList, quote, code, divider, image, table, toggle, callout, link
