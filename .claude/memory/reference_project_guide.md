---
name: Project structure and workflows guide
description: Full guide to the SlashMD codebase structure, data flow, and main development workflows
type: reference
---

# SlashMD — Project Structure & Workflows

## What it is

A VS Code / Cursor extension that opens `.md` and `.markdown` files in a Notion-style block editor by default. The file on disk is always plain Markdown — no sidecar state, no custom format.

---

## Repository layout

```
slashmd-monorepo/
├── packages/
│   ├── extension-host/     VS Code extension (Node.js, runs in extension host process)
│   ├── webview-ui/         React editor UI (runs in sandboxed webview process)
│   └── shared/             Zod schemas + TypeScript types shared across both packages
├── website/                Next.js marketing site with a live demo editor (standalone)
├── .claude/memory/         Project memory files for Claude Code sessions
└── package.json            npm workspace root
```

---

## Package: `extension-host`

**Runtime:** Node.js (VS Code extension host process)  
**Build:** tsup → `dist/extension.js`

### Key files

| File | Role |
|---|---|
| `src/extension.ts` | Entry point — `activate()` registers the editor provider and commands |
| `src/customEditor.ts` | `SlashMDEditorProvider` — webview lifecycle, message routing, document sync |
| `src/types.ts` | `SlashMDSettings` interface, `getSettings()`, `getThemeOverrides()` |
| `src/assetService.ts` | Handles image paste/drag — validates, sanitizes, writes to `assets/` folder |
| `src/commands.ts` | `openAsText`, `openAsSlashMD`, `copyContent`, `insertBlock` commands |
| `src/validation.ts` | Zod schemas for validating messages arriving from the webview |
| `src/csp.ts` | Builds the Content Security Policy header for the webview HTML |

### What `customEditor.ts` does

1. Registers a `CustomTextEditorProvider` for `*.md` / `*.markdown`
2. On open: generates HTML shell, injects `webview.js` + `webview.css` from `dist/`
3. Sends `DOC_INIT` (document text + settings + asset URIs) to the webview after 100ms
4. Listens for messages from the webview and dispatches them:
   - `APPLY_TEXT_EDITS` → applies character-level diffs to the TextDocument via `WorkspaceEdit`
   - `WRITE_ASSET` → delegates to `AssetService`, responds with `ASSET_WRITTEN`
   - `REQUEST_INIT` / `REQUEST_SETTINGS` → re-sends current state
5. Watches for external document changes and setting changes, pushes updates to webview

---

## Package: `webview-ui`

**Runtime:** Sandboxed browser context (VS Code webview)  
**Build:** esbuild → `dist/webview.js` + `dist/webview.css` (copied into `extension-host/dist/`)

### Key files

| File | Role |
|---|---|
| `src/index.tsx` | React entry point — mounts `<App />` |
| `src/messaging.ts` | Thin wrapper around `acquireVsCodeApi()` — `postMessage`, `addMessageHandler` |
| `src/types.ts` | Zod schemas + TS types for Host→UI messages (mirrors `shared/`) |
| `src/app/App.tsx` | Top-level state: content, settings, theme overrides; computes minimal diffs |
| `src/app/editor/Editor.tsx` | Lexical config, all plugin registrations, content init & external sync |
| `src/app/mapper/mdastToLexical.ts` | Converts mdast tree → Lexical editor state (import) |
| `src/app/mapper/lexicalToMdast.ts` | Converts Lexical editor state → mdast tree (export) |
| `src/markdown/parse.ts` | `parseMarkdown()` — wraps `mdast-util-from-markdown` + GFM extension |
| `src/markdown/stringify.ts` | `stringifyMarkdown()` — wraps `mdast-util-to-markdown` + GFM extension |
| `src/styles.css` | All editor styles — single global stylesheet |

### Editor plugins (all in `src/app/editor/`)

| Plugin | What it does |
|---|---|
| `MarkdownShortcutsPlugin` | `- ` → list, `# ` → heading, `> ` → quote, etc. |
| `CodeFencePlugin` | `` ``` `` or `` ```lang `` + Enter → code block with language |
| `CodeBlockPlugin` | Language selector button + copy button floating over each code block |
| `SlashMenuPlugin` + `SlashMenu` | `/` command palette — inserts any block type |
| `DragHandlePlugin` | Drag handle + delete button on the left of each block |
| `Toolbar` | Floating formatting toolbar on text selection |
| `TableActionsPlugin` | Insert/delete row/column actions on table cells |
| `TogglePlugin` | Handles open/close state for toggle blocks |
| `ImagePlugin` | Paste/drop image handling, sends `WRITE_ASSET` to host |
| `ImageModal` | URL / file upload modal for inserting images |
| `BlockClickPlugin` | Normalises click handling for custom block nodes |
| `SearchPlugin` | Ctrl+F find/replace with highlight overlay |

### Custom Lexical nodes (in `src/app/editor/nodes/`)

| Node | Markdown representation |
|---|---|
| `CalloutNode` | `> [!NOTE]` admonition syntax or emoji prefix |
| `ToggleContainerNode` / `ToggleTitleNode` / `ToggleContentNode` | `<details><summary>…</summary>…</details>` HTML |
| `ImageNode` / `ImageComponent` | `![alt](src)` with resize handles |
| `HorizontalRuleNode` | `---` |

---

## Package: `shared`

**Runtime:** Build-time only (types are inlined, not bundled at runtime)  
**Build:** tsc

Contains the canonical Zod schemas and inferred TypeScript types for the full messaging protocol. Both `extension-host` and `webview-ui` reference these (the webview also has a local copy in `src/types.ts` for tree-shaking reasons).

---

## Data flow

```
User edits in Lexical
        ↓
lexicalToMdast.ts   (Lexical state → mdast tree)
        ↓
stringifyMarkdown() (mdast tree → Markdown string)
        ↓
computeMinimalEdits() in App.tsx  (find changed region only)
        ↓
postMessage APPLY_TEXT_EDITS  (UI → Host)
        ↓
customEditor.ts: WorkspaceEdit.replace()
        ↓
VS Code TextDocument (the file on disk)
```

Reverse path (external edit or initial load):

```
TextDocument text
        ↓
DOC_INIT / DOC_CHANGED message  (Host → UI)
        ↓
parseMarkdown()    (Markdown string → mdast tree)
        ↓
mdastToLexical.ts  (mdast tree → Lexical editor state)
        ↓
Editor re-renders
```

---

## Messaging protocol

All messages are Zod-validated on receipt. Schema definitions live in `shared/src/index.ts`.

**UI → Host**

| Message | When sent |
|---|---|
| `REQUEST_INIT` | Webview mounted — requests initial document + settings |
| `REQUEST_SETTINGS` | Explicit settings refresh |
| `APPLY_TEXT_EDITS` | User edited content — carries `{start, end, newText}[]` + reason |
| `WRITE_ASSET` | Image pasted/dropped — carries data URI + optional filename |

**Host → UI**

| Message | When sent |
|---|---|
| `DOC_INIT` | Initial load — carries full text, settings, asset URIs, theme overrides |
| `DOC_CHANGED` | External edit detected (file changed outside the editor) |
| `SETTINGS_CHANGED` | User changed a `slashmd.*` setting or VS Code theme |
| `ASSET_WRITTEN` | Image saved to disk — carries relative path + webview URI |
| `ERROR` | Any host-side failure |

---

## Settings reference (`slashmd.*`)

| Setting | Type | Default | Effect |
|---|---|---|---|
| `assets.folder` | string | `"assets"` | Subfolder for pasted/dropped images |
| `assets.imagePathResolution` | `document\|workspace` | `"document"` | Resolve image paths relative to file or workspace root |
| `format.wrap` | number | `0` | Markdown line wrap width (0 = off) |
| `callouts.style` | `admonition\|emoji` | `"admonition"` | Callout serialisation style |
| `toggles.syntax` | `details\|list` | `"details"` | Toggle serialisation syntax |
| `math.enabled` | boolean | `false` | Math block support (not yet fully wired) |
| `mermaid.enabled` | boolean | `false` | Mermaid diagram support (not yet fully wired) |
| `theme.codeTheme` | enum | `"auto"` | Syntax highlight theme for code blocks |
| `theme.fontScale` | number 0.5–3 | `1` | Font size multiplier on top of VS Code editor font size |
| `theme.headingColor` | string | `""` | Fallback color for all headings |
| `theme.h1Color`…`h5Color` | string | `""` | Per-level heading color override |
| `theme.h1Indent`…`h5Indent` | string | `""` | Per-level heading left indent |
| `theme.boldColor` | string | `""` | Color for bold text |
| `theme.italicColor` | string | `""` | Color for italic text |

Settings are read in `extension-host/src/types.ts → getSettings()` and sent to the webview as part of `DOC_INIT` and `SETTINGS_CHANGED`. Theme-derived CSS variables are computed in `getThemeOverrides()` and applied by `App.tsx` as inline CSS custom properties on `document.documentElement`.

---

## Main development workflows

### Adding a new block type

1. **Create a Lexical node** in `webview-ui/src/app/editor/nodes/` (extend `DecoratorNode` or `ElementNode`)
2. **Export it** from `nodes/index.ts`
3. **Register it** in `editorNodes` array in `Editor.tsx`
4. **Add mdast → Lexical import** in `mapper/mdastToLexical.ts`
5. **Add Lexical → mdast export** in `mapper/lexicalToMdast.ts`
6. **Add a slash menu entry** in `editor/SlashMenu.tsx` (`BLOCK_OPTIONS` array)
7. **Add styles** in `src/styles.css`
8. Add to the `BlockType` union in `shared/src/index.ts` if needed

### Adding a new setting

1. Add the VS Code config entry in `extension-host/package.json` under `contributes.configuration.properties`
2. Add the field to `SlashMDSettings` interface in `extension-host/src/types.ts`
3. Read it in `getSettings()` in the same file
4. Emit it as a CSS variable in `getThemeOverrides()` if it's visual, or pass it through the settings object if it's behavioural
5. Add `fontScale: z.number()…` (or equivalent) to `SlashMDSettingsSchema` in both `shared/src/index.ts` and `webview-ui/src/types.ts`
6. Consume the setting in the webview (CSS variable applied in `App.tsx`, or read from `settings` prop in the relevant component)

### Adding a new editor plugin

1. Create `MyPlugin.tsx` in `webview-ui/src/app/editor/`
2. Export a function component that returns `null` (side-effects only via `useLexicalComposerContext`)
3. Import and add `<MyPlugin />` inside the `<LexicalComposer>` in `Editor.tsx`
4. Add styles to `styles.css`

### Modifying the Markdown serialisation

- **Parse** (Markdown → editor): edit `mdastToLexical.ts`. Each mdast node type has a `convertBlockNode` / `convertInlineNode` case.
- **Stringify** (editor → Markdown): edit `lexicalToMdast.ts`. Each Lexical node type has a corresponding export function.
- **GFM extensions** (tables, strikethrough, task lists, autolinks) are enabled in `parse.ts` and `stringify.ts` via `micromark-extension-gfm` / `mdast-util-gfm`.

---

## Security notes

- Webview CSP is strict — no remote scripts, no `eval`. All JS/CSS is bundled locally.
- Asset uploads are validated in `assetService.ts`: MIME type allowlist (no SVG), 5 MB limit, path traversal prevention, filename sanitisation.
- Messages from the webview are Zod-validated in `customEditor.ts` before any action is taken.
- HTML content in the editor is sanitised with DOMPurify (`mdastToLexical.ts`) before being inserted as raw HTML nodes.
