# SlashMD — Block‑Based Markdown Editor for VSCode/Cursor — Design Draft

**Owner:** You\
**Editor targets:** VS Code (stable), Cursor (current stable)\
**Doc status:** Draft v0.1\
**Last updated:** 2025‑08‑19 (PT) **Project name:** SlashMD

---

## 1) Summary

Build a VS Code extension (compatible with Cursor) that opens Markdown files in a Notion‑like, block‑based WYSIWYG editor **by default**, while preserving the underlying file as plain Markdown. The editor lives in a **Webview Custom Text Editor**, offering blocks (headings, paragraphs, lists, todos, toggles, callouts, tables, code, images, etc.), drag‑and‑drop reordering, a slash command menu, and instant sync to the Markdown text buffer.

**Why:** Get Notion‑style fluid editing and structure, keep Markdown portability and git‑friendliness, and avoid lock‑in.

---

## Name & Branding

- **Product name:** SlashMD
- **Identifier (publisher.extension):** `<yourPublisher>.slashmd`
- **Display name (Marketplace):** SlashMD — Block‑Based Markdown
- **Tagline:** "/"‑first, block‑based Markdown editor for VS Code & Cursor.
- **Legal note:** Not affiliated with or endorsed by Notion Labs, Inc. "Notion" is a trademark of Notion Labs, Inc. Avoid using "Notion" in the extension name or icon.

## 2) Goals & Non‑Goals

### Goals (P0)

- Open `*.md` in a **custom editor** by default with a Notion‑like UI.
- Provide core Notion‑like blocks: paragraph, heading 1–3, bulleted/numbered lists, **todo list** (`- [ ]`), quote, **toggle**, callout, code block, image, divider, table, link.
- **Slash menu** (`/`) for inserting/converting blocks with type‑ahead.
- **Drag handle** per block for reordering and nesting via drag‑to‑indent.
- Inline formatting: bold/italic/strikethrough/inline‑code/link.
- **Live Markdown sync** (no forked storage): all edits flow to the underlying Markdown file and vice‑versa (external changes reflected in UI).
- **Asset pipeline** for images: paste/drag‑in images saved to workspace (configurable folder) with relative links.
- "+ Open as text" toggle to fall back to the native VS Code Markdown text editor.

### Non‑Goals (initial)

- Real‑time multi‑user collaboration (future P2).
- Advanced Notion features: databases/kanban, comments/resolution, per‑block permissions.
- Proprietary markdown dialects that break outside VS Code (we’ll prefer broadly supported syntax).

---

## 3) Target Users & Use Cases

- **Docs/README authors** who want quick block structure and beautiful output without leaving Git.
- **Developers** writing specs, ADRs, and changelogs needing lists, todos, callouts, code & tables.
- **Product/Design** for PRDs and design docs with callouts and toggles for collapsible sections.

---

## 4) UX Overview

### Key Interactions

- **Slash menu**: type `/` at line start (or anywhere) → fuzzy list of blocks ("Heading", "Todo", "Callout \:bulb:", "Toggle", "Table", "Code"…). Arrow/select/enter.
- **Drag handles**: hover left gutter shows •• handle; drag to reorder. Horizontal drag adjusts indent level (list nesting, toggle content nesting). Keyboard alternatives: `Alt+↑/↓` move block; `Tab/Shift+Tab` indent/outdent (lists and toggles).
- **Inline formatting** via toolbar (appears on selection) and shortcuts: `Cmd/Ctrl+B/I`, `Cmd/Ctrl+E` for inline code, `Cmd/Ctrl+K` for link.
- **Block transform palette**: `Cmd/Ctrl+Shift+P` → "Convert block to…" or via `⌘/Ctrl+⇧+1` style hotkey.
- **Code blocks**: language picker, copy button, optional line numbers.
- **Tables**: add/delete row/column, alignments.
- **Toggles**: collapsible content using Markdown‑compatible mapping (details below).
- **Callouts**: quick presets (Note/Tip/Warning) + emoji icon.
- **Images**: paste/drag; saved to `/assets` (config) with relative paths.

### View Modes

- **WYSIWYG** (default) — Notion‑like presentation.
- **Split** (P1) — WYSIWYG left, raw Markdown right (two‑way live).
- **Raw** — Open with VS Code’s built‑in text editor (command button in title bar).

### Accessibility

- Full keyboard navigation between blocks, ARIA roles for toolbar & menus, focus ring visibility, and screen‑reader labels for block types and controls.

---

## 5) Markdown Mapping (Dialects & Fidelity)

We aim for **portable Markdown**. For features Notion has but Markdown lacks, we choose broadly‑accepted patterns.

| Notion‑like Feature | Markdown Representation                                   | Notes                                                                  |
| ------------------- | --------------------------------------------------------- | ---------------------------------------------------------------------- |
| Paragraph           | Plain text                                                | —                                                                      |
| Heading 1–3         | `#`, `##`, `###`                                          | Limit to 3 (configurable).                                             |
| Bulleted list       | `- ` items                                                | GFM compatible.                                                        |
| Numbered list       | `1. ` items                                               | GFM compatible.                                                        |
| Todo list           | `- [ ]` / `- [x]`                                         | GFM task list.                                                         |
| Quote               | `>`                                                       | —                                                                      |
| Divider             | `---`                                                     | Horizontal rule                                                        |
| Code block          | ` ` + lang                                                | Fenced code blocks                                                     |
| Image               | `![alt](relative/path.png)`                               | Save assets locally with workspace‑relative links                      |
| Link                | `[text](url)`                                             | Toolbar and `Cmd/Ctrl+K`                                               |
| Table               | GFM tables                                                | Alignment via `:---:`                                                  |
| **Toggle**          | HTML `<details><summary>Title</summary>…</details>`       | Portable to GitHub/most renderers; readable raw                        |
| **Callout**         | Admonition‑style blockquote `> [!NOTE]` (or `> 💡 Note:`) | Choose admonition syntax by default; fallback emoji style if preferred |
| Footnotes (P1)      | GFM footnotes `[^1]`                                      | Optional                                                               |
| Math (P1)           | `$…$`, `$$…$$`                                            | Render with KaTeX in webview; passthrough in Markdown                  |
| Mermaid (P1)        | fenced ` ```mermaid `                                     | Render in webview; passthrough                                         |

**Block IDs (P1):** store stable IDs for drag/sync/anchors using `{#id}` attribute (via `markdown-it-attrs` style) or preceding HTML comments: `<!-- id:abcd-1234 -->`. IDs allow durable cross‑links without changing visible text.

---

## 6) Architecture

### High‑Level

- **Extension Host (Node)**
  - Registers **CustomTextEditorProvider** for `*.md` with `priority: "default"`.
  - Manages document lifecycle, backups, saves, hot‑exit.
  - Handles file IO for pasted images/assets via `vscode.workspace.fs`.
  - Provides configuration, commands, telemetry (opt‑in), and settings.
- **Webview (UI)**
  - Built with **React + Lexical** (block editor) for performant, structured editing.
  - Parses/serializes Markdown via **remark** (mdast) + custom mappers to/from Lexical nodes.
  - Renders with CSS + virtualized list for large docs.
  - Sends granular edit intents to host → host applies precise `TextEdit`s.

```
[User] ⇄ [Webview (Lexical)] ⇄ (postMessage) ⇄ [Extension Host]
                          ⇅                             ⇅
                     mdast/blocks                   TextDocument
                          ⇵                             ⇵
                      remark I/O                 WorkspaceEdit/Edits
```

### Modules

1. **Parser**: `remark-parse`, `remark-gfm`, `remark-frontmatter`, `remark-math` (P1), directives/admonitions (P1). Output **mdast** annotated with source ranges.
2. **Serializer**: `remark-stringify` with stable formatting rules (list bullets, fence style, table alignment, line wrap width configurable).
3. **Mapper**: mdast ⇄ Lexical nodes with source map spans. Maintains a per‑block `sourceRange` for precise round‑trips.
4. **Edit Engine**: Translates block operations (insert/move/indent/toggle/format) into minimal text edits:
   - Coalesce changes for smooth undo/redo.
   - Preserve user whitespace/indent choices where possible.
5. **Sync Manager**:
   - **Doc → UI**: On `TextDocument` change events (external edits), reparse diff regions and update blocks.
   - **UI → Doc**: Batch apply edits via `TextEditorEdit` or `WorkspaceEdit` with selections maintained.
6. **Asset Service**:
   - On paste/drag image, write to `assets/` (config), de‑dup by hash, link relative.
   - Option: prompt for file name.
7. **Renderer**:
   - WYSIWYG block components; KaTeX/Mermaid (P1) client‑side render.
   - Theme aware (light/dark, respect VS Code theme variables).

### State & Performance

- Keep **authoritative state** = Markdown text buffer. UI state mirrors it with block spans.
- Use incremental parsing: reparse affected blocks only on text diffs.
- Virtualize block list for large files (> 2k lines).
- Debounce expensive layout; keep edits <16ms per frame; aim 60 FPS during typing/drag.

---

## 7) Extension Contributions & Activation

``** (sketch):**

```jsonc
{
  "activationEvents": [
    "onLanguage:markdown",
    "onCustomEditor:slashmd.editor",
    "onCommand:slashmd.openAsText"
  ],
  "contributes": {
    "customEditors": [
      {
        "viewType": "slashmd.editor",
        "displayName": "SlashMD — Block‑Based Markdown",
        "selector": [ { "filenamePattern": "*.md" }, { "filenamePattern": "*.markdown" } ],
        "priority": "default" // open as default editor for MD
      }
    ],
    "commands": [
      { "command": "slashmd.openAsText", "title": "Open as Raw Markdown" },
      { "command": "slashmd.toggleDefault", "title": "Make Notion Editor Default for Markdown" },
      { "command": "slashmd.insertBlock", "title": "Insert Block…" }
    ],
    "configuration": {
      "properties": {
        "slashmd.assets.folder": { "type": "string", "default": "assets", "description": "Relative folder for pasted/dragged images." },
        "slashmd.format.wrap": { "type": "integer", "default": 0, "description": "Markdown wrap width (0 = no wrap)." },
        "slashmd.callouts.style": { "type": "string", "enum": ["admonition", "emoji"], "default": "admonition" },
        "slashmd.toggles.syntax": { "type": "string", "enum": ["details", "list"], "default": "details" },
        "slashmd.math.enabled": { "type": "boolean", "default": false },
        "slashmd.mermaid.enabled": { "type": "boolean", "default": false }
      }
    }
  }
}
```

**Activation strategy:** Prefer `onCustomEditor` open to minimize idle cost. No `onStartupFinished`.

---

## 8) Cursor Compatibility

- Cursor is a VS Code fork that runs the standard extension host. To remain compatible:
  - **Avoid proposed APIs**; use **stable** Webview + Custom Text Editor APIs.
  - Avoid undocumented `vscode.markdownLanguageFeatures` overrides.
  - Ship as a regular `.vsix`; verify Cursor can install from Marketplace or via local install.
  - Test on macOS/Windows/Linux in VS Code **and** Cursor (smoke: open, edit, save, images, drag).
- If Cursor changes default editor behavior, expose the **"Make default"** command to re‑register.

---

## 9) Security, Privacy, CSP

- **No remote code** in webview; bundle all JS/CSS; configure strict **Content Security Policy**.
- Sanitize pasted HTML; images written to disk only with explicit user paste/drag.
- Telemetry **opt‑in** only; include data minimization and disable by default.

**Webview CSP example:**

```
Content-Security-Policy: default-src 'none'; img-src vscode-resource: data:; style-src 'unsafe-inline'; script-src 'nonce-<rand>';
```

(Exact scheme/name varies with VS Code API; use `webview.asWebviewUri`.)

---

## 10) Settings & Theming

- Respect VS Code theme tokens (foreground, background, editor selection).
- Provide a **compact** vs **comfortable** density.
- Toggle for showing line numbers and trailing whitespace markers in Raw view.

---

## 11) Testing Strategy

- **Unit**: mdast ⇄ Lexical mapping; serializer idempotency; toggle/callout conversions.
- **Property tests**: random Markdown documents round‑trip to same text.
- **Integration (Playwright)**: user flows (create table, drag blocks, paste image, toggle collapse).
- **Performance**: typing latency, large file opening, image paste.
- **Compatibility**: VS Code Stable/Insiders; Cursor latest. OS matrix.

---

## 12) Roadmap

### MVP (P0)

- Custom editor default for `.md`/`.markdown`.
- Blocks: paragraph, H1‑H3, bullet/numbered, todo, quote, divider, code, image, table, link.
- Slash menu, drag handles, inline toolbar.
- Image paste/drag to assets folder; relative links.
- Toggle via `<details>`; Callouts via admonitions.
- Theme support; basic settings; raw fallback.

### P1

- Split view; footnotes; math (KaTeX); Mermaid; block IDs; outline panel.
- Quick convert between block types; multi‑block selection; search/replace UI.

### P2

- Comments; backlinks/wiki‑links; cross‑file embeds; export to HTML/PDF; collaboration (CRDT).

---

## 13) Open Technical Choices

- **Editor framework**: **Lexical** (smaller, modern) vs **TipTap/ProseMirror** (ecosystem). MVP assumes **Lexical**; re‑evaluate if table controls or complex plugins push us to TipTap.
- **Toggle syntax**: default to `<details>` for portability; offer list‑based toggles for teams that prefer pure Markdown lists.
- **Callouts**: default to admonition syntax (`> [!NOTE]`), with emoji fallback for renderers lacking admonition plugins.

---

## 14) Risks & Mitigations

- **Text sync drift** (mapping errors between blocks and source).\
  *Mitigate:* maintain source ranges per node; prefer minimal edits; add property tests; show recovery banner with "Reload from file".
- **Large files** performance.\
  *Mitigate:* virtualize; incremental parsing; workerize expensive transforms inside webview.
- **Markdown ecosystem variance**.\
  *Mitigate:* stick to GFM + conservative extensions; make dialect toggles explicit.
- **Cursor divergence** (future API differences).\
  *Mitigate:* avoid proposed APIs; CI test matrix with Cursor.

---

## 15) Implementation Notes (MVP Sketch)

### Custom Editor Provider

- `resolveCustomTextEditor(document, webviewPanel)`: init state, set HTML with nonce & URIs, wire `webview.onDidReceiveMessage` and panel disposal.
- `onDidChangeTextDocument` to detect external edits; debounce/patch webview state.
- `backup`/`saveCustomDocument` implement hot‑exit & crash recovery.

### Messaging Contract (UI ⇄ Host)

```ts
// UI → Host
{ type: 'APPLY_EDITS', edits: TextEdit[], reason: 'typing'|'drag'|'paste' }
{ type: 'WRITE_ASSET', dataUri: string, suggestedName?: string }
{ type: 'REQUEST_SETTINGS' }

// Host → UI
{ type: 'DOC_INIT', text: string, settings: {...} }
{ type: 'DOC_CHANGE', text: string, range: {start,end} }
{ type: 'ASSET_WRITTEN', relPath: string }
```

### Libraries (tentative)

- **Editor**: `lexical`, `@lexical/react` (+ custom nodes for callout, toggle, table)
- **MD**: `unified`, `remark-parse`, `remark-gfm`, `remark-frontmatter`, `remark-stringify`, `remark-math` (P1)
- **Render helpers**: `katex` (P1), `mermaid` (P1)
- **Build**: `esbuild` (fast bundling for webview) + `tsup` for extension host TS
- **Tests**: `vitest`/`jest`, `playwright`

---

## 16) Developer Experience

- **Monorepo** with packages: `extension-host/`, `webview-ui/`, `md-mapper/`.
- One‑command dev: `pnpm dev` spawns `vscode-test` with watch builds.
- ESLint/Prettier; strict TS; CI on PR with test matrix.

---

## 17) Distribution

- Publish to VS Code Marketplace (free). Provide `.vsix` downloads for Cursor users.
- Clear changelog & migration notes for any syntax setting defaults.

---

## 18) Success Metrics (opt‑in)

- Daily Active Users; average session length; error rate on sync; image paste success; performance timings (typing latency). Telemetry strictly anonymized & opt‑in.

---

## 19) Appendix A — Example Markdown Encodings

### Toggle

```markdown
<details><summary>Advanced Options</summary>

- Item A
- Item B

</details>
```

### Callout (admonition style)

```markdown
> [!TIP]
> You can paste images directly.
```

### Task List

```markdown
- [ ] Plan docs
- [x] Implement custom editor provider
```

---

## 20) Appendix B — MVP Task Breakdown (Est. Order)

1. Project scaffolding (host + webview; build).
2. Custom editor registration (default for MD) + raw fallback command.
3. Parse markdown → blocks; minimal rendering.
4. Inline formatting toolbar & shortcuts.
5. Slash menu & block insertion.
6. Drag handles + reorder + indent/outdent.
7. Lists, todos, headings, quotes, code, divider.
8. Images paste/drag + asset writer.
9. Tables basic.
10. Toggles (details) & callouts (admonition).
11. Incremental parsing & external edit sync.
12. Settings, theming, A11y pass.
13. Tests & perf budget.
14. Packaging & docs.



---

# Claude Code Context Pack for SlashMD

> Copy/paste sections below into Claude Code as context. They define scope, constraints, repo structure, and an execution plan with tasks & acceptance criteria.

## A) Master Engineering Brief (paste as Claude “system”/project brief)

**Project:** SlashMD — a VS Code/Cursor extension that opens Markdown files in a Notion‑style, block‑based WYSIWYG **custom editor** by default, while keeping the file stored as plain Markdown.

**Non‑negotiables**

- Underlying file is always plain Markdown; no hidden sidecar state required for core editing.
- Register a **Custom Text Editor** (`viewType: "slashmd.editor"`, `priority: "default"`) for `*.md` and `*.markdown`.
- UI built in a Webview (React + **Lexical**). Mapping to/from Markdown via **unified/remark**.
- Support core blocks in MVP (headings, lists, todos, quotes, divider, code, image, table, link), plus **toggle (**``**)** and **callout (admonition)**.
- Paste/drag image assets → write to configurable workspace folder (default `assets/`) and link relatively.
- Provide command to open raw text and a visible button in the editor title bar.
- Keep to **stable VS Code APIs** only (Cursor compatibility).
- Strict Webview **CSP** and no remote code.

**Tech stack**

- **Node 20+**, **pnpm**, **TypeScript** everywhere.
- Extension host bundled with **tsup**. Webview bundled with **esbuild**.
- UI: **React** + **Lexical**. Markdown: **unified/remark** (`remark-parse`, `remark-gfm`, `remark-stringify`, optional `remark-math`).
- Testing: **vitest**/**jest** (unit), **playwright** (integration for webview flows).

**Performance**

- Incremental parsing and minimal `WorkspaceEdit`s. Virtualize long block lists. Keep typing latency under \~16ms.

**Accessibility**

- Keyboard‑first UX; ARIA labels for toolbar/menus; high‑contrast compliant.

**Telemetry**

- Off by default. If enabled, collect minimal anonymous metrics; no document content.

---

## B) Repository Blueprint (paste to Claude and ask it to scaffold)

**Monorepo (pnpm workspaces):**

```
slashmd/
  package.json              # root (workspaces + scripts)
  pnpm-workspace.yaml
  tsconfig.base.json
  .editorconfig
  .gitignore
  .vscode/
    launch.json            # Extension Dev Host config
    tasks.json             # build/watch tasks
  packages/
    extension-host/
      src/
        extension.ts       # activate, register custom editor
        customEditor.ts    # provider + messaging bridge
        assetService.ts
        commands.ts
        csp.ts             # helper to build CSP + nonce
        types.ts
      media/               # static webview assets (if any)
      package.json
      tsconfig.json
      README.md
    webview-ui/
      src/
        index.tsx
        app/App.tsx
        app/blocks/*       # paragraph, heading, list, todo, quote, code, table, callout, toggle, image
        app/editor/*       # Lexical config, nodes, toolbar, slash menu, drag handles
        app/mapper/*       # mdast <-> lexical mapping
        app/state/*        # selection, undo/redo policies
        styles.css
        messaging.ts       # postMessage bridge
        markdown/
          parse.ts         # remark-parse pipeline
          stringify.ts     # remark-stringify pipeline
          formats.ts       # config for table/links/wrap width
      public/
        index.html         # minimal, CSP placeholders
      package.json
      tsconfig.json
      esbuild.config.ts
    md-mapper/
      src/
        mdastToLexical.ts
        lexicalToMdast.ts
        ranges.ts          # source range tracking
      package.json
      tsconfig.json
  packages/shared/         # (optional) shared types/util
```

**Root **``** (sketch):**

```jsonc
{
  "name": "slashmd-monorepo",
  "private": true,
  "workspaces": ["packages/*"],
  "scripts": {
    "build": "pnpm -r run build",
    "dev": "pnpm -r --parallel run dev",
    "lint": "pnpm -r run lint",
    "test": "pnpm -r run test",
    "package": "pnpm --filter extension-host run package"
  }
}
```

**Extension **``** (minimal):**

```jsonc
{
  "name": "slashmd",
  "displayName": "SlashMD — Block‑Based Markdown",
  "publisher": "yourPublisher",
  "version": "0.0.1",
  "engines": { "vscode": ">=1.85.0" },
  "categories": ["Other"],
  "main": "./dist/extension.js",
  "activationEvents": [
    "onLanguage:markdown",
    "onCustomEditor:slashmd.editor",
    "onCommand:slashmd.openAsText"
  ],
  "contributes": {
    "customEditors": [
      {
        "viewType": "slashmd.editor",
        "displayName": "SlashMD — Block‑Based Markdown",
        "selector": [{"filenamePattern":"*.md"},{"filenamePattern":"*.markdown"}],
        "priority": "default"
      }
    ],
    "commands": [
      {"command":"slashmd.openAsText","title":"Open as Raw Markdown"},
      {"command":"slashmd.insertBlock","title":"Insert Block…"}
    ],
    "configuration": {
      "properties": {
        "slashmd.assets.folder": {"type":"string","default":"assets"}
      }
    }
  },
  "scripts": {
    "build": "tsup src/extension.ts --format=cjs --dts --outDir dist",
    "dev": "tsup src/extension.ts --format=cjs --watch --outDir dist",
    "package": "vsce package"
  },
  "devDependencies": {
    "tsup": "^8.0.0",
    "typescript": "^5.4.0",
    "@types/node": "^20.11.0",
    "vsce": "^3.0.0"
  },
  "dependencies": {}
}
```

**Webview **``** (minimal):**

```jsonc
{
  "name": "slashmd-webview",
  "private": true,
  "scripts": {
    "build": "esbuild src/index.tsx --bundle --outfile=dist/webview.js --platform=browser",
    "dev": "esbuild src/index.tsx --bundle --outfile=dist/webview.js --platform=browser --sourcemap --watch",
    "lint": "eslint ."
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "lexical": "^0.14.0",
    "@lexical/react": "^0.14.0",
    "unified": "^11.0.0",
    "remark-parse": "^11.0.0",
    "remark-gfm": "^4.0.0",
    "remark-stringify": "^11.0.0"
  },
  "devDependencies": {
    "esbuild": "^0.21.0",
    "typescript": "^5.4.0"
  }
}
```

**VS Code debug config (**``**):**

```jsonc
{
  "$schema": "vscode://schemas/launch",
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Run SlashMD Extension",
      "type": "extensionHost",
      "request": "launch",
      "runtimeExecutable": "${execPath}",
      "args": ["--extensionDevelopmentPath=${workspaceFolder}"],
      "outFiles": ["${workspaceFolder}/packages/extension-host/dist/**/*.js"],
      "preLaunchTask": "pnpm -w dev"
    }
  ]
}
```

---

## C) Messaging Protocol v1 (UI ⇄ Host)

Paste into both sides as the contract.

```ts
// UI → Host
export type UIToHost =
  | { type: 'APPLY_TEXT_EDITS'; edits: TextEdit[]; reason: 'typing'|'drag'|'paste'|'format' }
  | { type: 'WRITE_ASSET'; dataUri: string; suggestedName?: string }
  | { type: 'REQUEST_INIT' }
  | { type: 'REQUEST_SETTINGS' };

// Host → UI
export type HostToUI =
  | { type: 'DOC_INIT'; text: string; settings: Record<string,unknown> }
  | { type: 'DOC_CHANGED'; text: string; range?: { start: number; end: number } }
  | { type: 'ASSET_WRITTEN'; relPath: string }
  | { type: 'ERROR'; message: string };

export interface TextEdit { start: number; end: number; newText: string }
```

**Guidelines**

- Keep payloads small: send ranges, not full text, when possible.
- Include a monotonically increasing `seq` if needed for de‑dupe.

---

## D) Webview CSP Template & URI Helpers

**CSP builder (host):**

```ts
export function buildCsp(nonce: string) {
  return [
    "default-src 'none'",
    "img-src vscode-resource: data:",
    "style-src 'unsafe-inline'",
    `script-src 'nonce-${nonce}'`
  ].join('; ');
}
```

**HTML shell (webview-ui/public/index.html):**

```html
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta http-equiv="Content-Security-Policy" content="__CSP__" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>SlashMD</title>
  </head>
  <body>
    <div id="root"></div>
    <script nonce="__NONCE__" src="__JS_BUNDLE__"></script>
  </body>
</html>
```

---

## E) Task Tree (Epics → Tasks → Subtasks)

Use this as Claude’s execution roadmap. Each task includes acceptance criteria.

### Epic 1 — Repo & Build System

1. **Initialize monorepo**
   - Subtasks: root `package.json`, `pnpm-workspace.yaml`, `tsconfig.base.json`, `.editorconfig`, `.gitignore`.
   - Acceptance: `pnpm i` succeeds; `pnpm build` runs without errors (no‑ops allowed initially).
2. **Extension package setup** (`packages/extension-host`)
   - Subtasks: `package.json` with scripts, `tsup` config inline, `src/extension.ts` stub, `src/customEditor.ts` stub, `commands.ts` stub, `csp.ts`.
   - Acceptance: `pnpm --filter extension-host dev` produces `dist/extension.js` and launches dev host.
3. **Webview package setup** (`packages/webview-ui`)
   - Subtasks: `package.json` scripts, `esbuild.config.ts`, `src/index.tsx`, `public/index.html`.
   - Acceptance: `pnpm --filter webview-ui dev` builds `dist/webview.js` and updates on change.
4. **VS Code debug config**
   - Subtasks: `.vscode/launch.json`, `tasks.json` wiring `pnpm -w dev`.
   - Acceptance: F5 runs Extension Development Host with SlashMD activated.

### Epic 2 — Custom Editor Wiring

1. **Register CustomTextEditorProvider**
   - Subtasks: implement `resolveCustomTextEditor`; load HTML; compute nonce; inject CSP; wire `postMessage` both ways.
   - Acceptance: opening `.md` opens the custom editor pane (blank UI OK).
2. **Open as Raw Markdown command**
   - Subtasks: register command, context menu contribution.
   - Acceptance: Command switches current resource to text editor.

### Epic 3 — Markdown Parse & Serialize (md‑mapper)

1. **Parse pipeline**
   - Subtasks: `remark-parse` + `remark-gfm`; produce mdast with positional info.
   - Acceptance: unit tests parse sample docs; positions exist on nodes.
2. **Serialize pipeline**
   - Subtasks: `remark-stringify` with consistent options (fences, bullets, wrap width from settings).
   - Acceptance: round‑trip tests yield equivalent Markdown (allow whitespace diffs).
3. **Mapping layer** (mdast ⇄ Lexical)
   - Subtasks: implement nodes for paragraph, headings, list/listItem, taskListItem, code, blockquote, thematicBreak, table, image, link, HTML (for `<details>` toggles), callouts (blockquote with marker).
   - Acceptance: property tests over random docs; specific fixtures for toggles/callouts.

### Epic 4 — Webview Editor (Lexical)

1. **Editor shell**
   - Subtasks: Lexical setup, key bindings, selection toolbar, theme tokens.
   - Acceptance: typing produces block nodes; inline bold/italic/link via shortcuts.
2. **Slash menu**
   - Subtasks: `/` trigger, fuzzy search, insert chosen block; convert current block type.
   - Acceptance: selecting “Heading 2” converts the block and updates underlying MD.
3. **Drag handles & indent**
   - Subtasks: draggable gutter; Alt+↑/↓; Tab/Shift+Tab; maintain list nesting.
   - Acceptance: reordering updates Markdown minimally; no duplications.
4. **Blocks**
   - Paragraph, H1‑H3, bullet/numbered lists, task list, quote, divider, code block, image, table, link.
   - Acceptance: each block serializes to expected Markdown.
5. **Toggle block** (`<details>`)
   - Subtasks: UI for summary + children; collapsed state remembered in UI only.
   - Acceptance: Markdown output matches `<details><summary>…` pattern.
6. **Callout block** (admonition)
   - Subtasks: choose style from settings; emoji/icon picker optional.
   - Acceptance: Markdown blockquote contains `[!NOTE]` or emoji header.
7. **Image paste/drag**
   - Subtasks: convert clipboard file→`WRITE_ASSET`; host returns `relPath`; insert `![alt](relPath)`.
   - Acceptance: file written to `assets/` and link resolves.

### Epic 5 — Sync & External Edits

1. **UI → Doc minimal edits**
   - Subtasks: compute diffs from source ranges; coalesce small edits.
   - Acceptance: undo/redo in VS Code behaves naturally.
2. **Doc → UI incremental refresh**
   - Subtasks: handle `onDidChangeTextDocument`; reparse only affected ranges.
   - Acceptance: external edits (git pull) update UI without full rerender.

### Epic 6 — Settings, Theming, A11y

1. **Settings surface** (`slashmd.*`)
   - Acceptance: changes take effect without reload where possible.
2. **VS Code theme tokens**
   - Acceptance: colors respect current theme; dark/light verified.
3. **A11y pass**
   - Acceptance: full keyboard navigation of blocks; toolbar accessible.

### Epic 7 — QA, Packaging, and Docs

1. **Tests**
   - Subtasks: unit + integration; fixtures for complex blocks.
   - Acceptance: CI green; coverage thresholds met (configure modest target initially).
2. **Packaging**
   - Subtasks: icons, README, changelog, `vsce package`.
   - Acceptance: `.vsix` installs; smoke test on Cursor.
3. **Docs**
   - Subtasks: quickstart, limitations, settings reference.
   - Acceptance: README explains “open as default”, assets folder behavior, fallback to raw.

---

## F) Acceptance Test Matrix (sample)

- Open `.md` → SlashMD editor is default.
- Type paragraph → text appears in file on save and on hot‑exit restore.
- Convert paragraph → H2 via slash menu.
- Create list, indent/outdent items with Tab/Shift+Tab.
- Create task list; toggle `[ ]` → `[x]` with click and via keyboard.
- Insert code block with language; copy button copies content.
- Insert callout TIP; serialize to `> [!TIP]` lines.
- Insert toggle; collapse/expand; serialize to `<details>`.
- Paste PNG image; file written under `assets/` and linked relatively.
- External edit (open same file in raw editor and modify) syncs into webview without full reset.

---

## G) Coding Standards & UX Conventions

- Keep Markdown diffs minimal: preserve user bullet style (`-` vs `*`) where feasible.
- Prefer **spaces** over tabs in emitted Markdown unless original block uses tabs.
- Use semantic HTML in webview; avoid `contentEditable` outside of Lexical.
- Don’t block the extension host thread; heavy work stays in webview or is chunked.

---

## H) Kickoff Prompt for Claude Code (paste as first command)

""" You are generating a VS Code extension named **SlashMD**. Follow the **Master Engineering Brief**, **Repository Blueprint**, and **Task Tree** provided. Use **pnpm**, **TypeScript**, **tsup** (extension), and **esbuild** (webview). Scaffold the monorepo and implement **Epic 1** and **Epic 2** to the point where a Markdown file opens in a custom editor with a blank React app loaded in the webview. Include `.vscode/launch.json` so F5 launches an Extension Development Host. After scaffolding, run the dev tasks and confirm the editor opens. """

---

## I) Future Prompts (milestone handoffs)

- **Milestone 2 (Editor basics):** “Implement Epic 4 tasks 1–3 (editor shell, slash menu, drag handles) with stubbed Markdown mapping. Wire APPLY\_TEXT\_EDITS to insert text at caret for now.”
- **Milestone 3 (Mapper):** “Implement Epic 3 mapping for paragraph, headings, lists, tasks, quotes, divider, code. Add round‑trip tests.”
- **Milestone 4 (Assets & tables):** “Implement image paste/drag asset pipeline and basic GFM tables UI + serialization.”
- **Milestone 5 (Sync polish):** “Implement minimal text edits with source ranges; incremental reparse on doc changes.”

---

## J) Definition of Done (MVP)

- All MVP features in the Roadmap are implemented and pass the Acceptance Test Matrix.
- No uncaught exceptions in the extension host or webview during common flows.
- Package signed `.vsix` installs on VS Code Stable and Cursor; manual smoke tests pass on macOS and Windows.
- README includes setup, settings, limitations, and troubleshooting.

