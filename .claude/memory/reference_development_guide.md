---
name: Development guide
description: How to develop, iterate, debug, and test changes in SlashMD — local workflow, reload strategies, debugging tools, and testing approaches
type: reference
---

# SlashMD — Development Guide

## Initial setup

```bash
npm install
```

Open the **monorepo root** (`SlashMD/`) as your VS Code workspace — the launch configurations in `.vscode/launch.json` and the tasks in `.vscode/tasks.json` only work when the root is the workspace.

---

## The core development loop

### 1. Start watch mode

```bash
npm run dev
```

This runs two watchers in parallel:
- **`extension-host`** — tsup watches `src/extension.ts`, recompiles to `dist/extension.js` on save
- **`webview-ui`** — esbuild watches `src/index.tsx` + all imports, recompiles to `extension-host/dist/webview.js`; a separate `fs.watch` on `src/styles.css` copies it to `extension-host/dist/webview.css` on every save

Leave this terminal running throughout your session.

### 2. Launch the Extension Development Host

In the **main VS Code window** (where the source code is open):

- Press `Shift+Cmd+D` to open the Run and Debug panel
- Select **"Run SlashMD Extension"** from the dropdown at the top
- Click the green ▶ button

> **macOS note:** There is no bare F5 key. Use `fn+F5` or the ▶ button in the Run and Debug panel.

A second VS Code window opens — this is the **Extension Development Host**.

### 3. Open a Markdown file to activate the editor

In the Extension Development Host window, open any `.md` file (even an empty one). The SlashMD editor activates automatically and shows your latest built code.

You now have two windows:
- **Main window** — where you edit source code
- **Extension Development Host** — where you test the result

> There is no localhost or browser dev server. The webview inside VS Code is your live preview.

---

## Applying changes — what to do after saving

| What you changed | Rebuild needed? | How to apply |
|---|---|---|
| `styles.css` | Auto (fs.watch) | `Ctrl+Shift+P` → **Developer: Reload Webview** |
| Any `webview-ui/src/**` file | Auto (esbuild watch) | `Ctrl+Shift+P` → **Developer: Reload Webview** |
| Any `extension-host/src/**` file | Auto (tsup watch) | `Ctrl+Shift+P` → **Developer: Restart Extension Host** |
| `shared/src/index.ts` | Manual: `npm run build -w packages/shared` | Restart Extension Host |
| `extension-host/package.json` (settings schema) | Manual rebuild | Restart Extension Host |

**Reload Webview** (~0.5s) reloads only the iframe — faster and preserves the host process.  
**Restart Extension Host** (~2s) restarts the Node.js process — needed for any host-side change.

### Keyboard shortcut tip

Bind `Ctrl+Shift+R` (or similar) to **Developer: Reload Webview** in VS Code keybindings for a one-key refresh cycle.

---

## Debugging

### Webview side (React, CSS, editor logic)

Open DevTools inside the **Extension Development Host** window:

```
Help → Toggle Developer Tools
```

This is a full Chrome DevTools instance. Use it to:
- **Console** — all `console.log` from `webview-ui/` appear here; messages are prefixed with `SlashMD:`
- **Elements** — inspect live DOM, tweak CSS values directly to prototype styles before committing
- **Sources** — set breakpoints in `.ts`/`.tsx` source files (source maps are included in watch/dev mode)
- **Network** — verify asset loads

### Extension host side (Node.js, file I/O, message routing)

Breakpoints work directly in the **Run and Debug** panel in the main VS Code window. Set them in `extension-host/src/*.ts` — they hit when the Extension Development Host triggers that code path.

`console.log` from the host appears in:
```
Output panel → "Extension Host" (or search for "SlashMD")
```

### Tracing the message protocol

Every message crossing the UI↔Host boundary is logged at both ends:
- **Host side** (Output panel): `SlashMD: Received validated message from webview: APPLY_TEXT_EDITS`
- **Webview side** (DevTools console): `SlashMD App: Handling message: DOC_INIT`

This lets you verify the full round-trip for any feature involving the messaging protocol.

---

## Iterating on specific areas

### Styles (`styles.css`)

The fastest loop in the project:
1. Edit `packages/webview-ui/src/styles.css`
2. Save → esbuild's `fs.watch` copies it instantly
3. Reload Webview → change visible in ~0.5s

For prototyping, tweak values live in DevTools Elements panel first, then copy the final values into `styles.css`.

### Editor behaviour (plugins, nodes)

Files in `webview-ui/src/app/editor/`:
1. Save → esbuild rebuilds (~200ms)
2. Reload Webview

If your change affects how content is parsed/serialised, also open a `.md` file that exercises that content to verify round-trip fidelity.

### Markdown serialisation (`mapper/`)

The mapper is exercised every time you edit content. To test a specific case:
1. Open a `.md` file with the relevant syntax in it
2. Edit something in the editor
3. Switch to the raw text editor (`Ctrl+Shift+P → SlashMD: Open as Raw Markdown`) and inspect the output
4. Switch back to SlashMD to verify the editor re-parses it correctly

### Extension host changes (`customEditor.ts`, `assetService.ts`, etc.)

1. Save → tsup rebuilds (~200ms)
2. Restart Extension Host
3. Re-open a `.md` file (the editor re-initialises fresh)

### Settings

After changing `extension-host/package.json` (the settings schema):
1. Restart Extension Host
2. Open VS Code settings (`Ctrl+,`) and search `slashmd` to confirm the new setting appears

After changing `getSettings()` or `getThemeOverrides()` in `types.ts`:
1. Restart Extension Host — the new values will be sent on the next `DOC_INIT`

---

## Common workflows

### Adding / tweaking a style

1. Open DevTools in the Extension Development Host
2. Use Elements panel to find the class and prototype the change
3. Copy final values to `styles.css`
4. Save → Reload Webview

### Fixing a parser bug (mdast → Lexical)

1. Create or open a `.md` file that reproduces the issue
2. Edit `mdastToLexical.ts`
3. Save → Reload Webview → the file re-parses on init
4. Verify in the editor; then switch to raw view to confirm the serialised output is correct

### Adding a new block type

See `reference_project_guide.md` for the full checklist. After implementing:
1. Reload Webview
2. Use the slash menu (`/`) to insert the block
3. Type content in it
4. Switch to raw markdown view — confirm the markdown is correct
5. Switch back to SlashMD — confirm it re-parses correctly (round-trip)

### Changing the messaging protocol

Any change to message shapes must be applied in three places in sync:
- `shared/src/index.ts` (canonical)
- `webview-ui/src/types.ts` (webview copy)
- `extension-host/src/validation.ts` (host validation)

After changing all three: rebuild shared, then restart Extension Host + Reload Webview.

---

## Testing

### Manual testing checklist

There are no automated tests currently. All verification is manual. After any non-trivial change, exercise the following:

**Core round-trip** (most important)
- [ ] Open a `.md` file with varied content (headings, lists, code blocks, tables)
- [ ] Make an edit in the editor
- [ ] Switch to raw markdown — confirm the output is valid Markdown
- [ ] Switch back to SlashMD — confirm it re-parses without loss

**Block types** (test whichever your change touches)
- [ ] Paragraphs, H1–H5
- [ ] Bullet list, numbered list, todo list (check/uncheck items)
- [ ] Blockquote
- [ ] Code block — language selector, syntax highlighting, copy button
- [ ] Table — insert/delete rows and columns
- [ ] Toggle — open/close, nested content
- [ ] Callout — all five types
- [ ] Image — paste, drag, URL insert, resize handles
- [ ] Divider (`---`)

**Inline formatting** (toolbar)
- [ ] Bold, italic, strikethrough, inline code, link

**Editor interactions**
- [ ] Slash menu — type `/`, search, keyboard navigation, Escape to close
- [ ] Drag handle — drag blocks to reorder
- [ ] Delete button — delete a block
- [ ] Find/replace (`Ctrl+F`)
- [ ] Undo/redo (`Ctrl+Z` / `Ctrl+Shift+Z`)

**Markdown shortcuts**
- [ ] `# ` → H1, `## ` → H2, `### ` → H3
- [ ] `- ` → bullet list, `1. ` → numbered list, `[ ] ` → todo
- [ ] `> ` → blockquote
- [ ] `` ``` `` + Enter → plain code block
- [ ] `` ```typescript `` + Enter → TypeScript code block

**External changes**
- [ ] Edit the raw `.md` file in a text editor while SlashMD is open — confirm the editor updates

**Settings**
- [ ] Change `slashmd.theme.fontScale` → confirm font size updates without reload
- [ ] Change `slashmd.theme.codeTheme` → confirm syntax colours update
- [ ] Change `slashmd.theme.h1Color` → confirm heading colour updates

### Regression areas to watch

These areas have historically been fragile — always recheck after changes to the mapper or serialiser:

- **Tables** — column alignment is lost if the mdast serialiser isn't careful
- **Toggles** — the `<details>` HTML round-trip can break if whitespace handling changes
- **Callouts** — the admonition syntax (`> [!NOTE]`) must survive a full parse/stringify cycle
- **Images** — relative paths must resolve correctly for both `document` and `workspace` resolution modes
- **Nested lists** — indentation levels can collapse if the list serialiser isn't precise

---

## Packaging and installing locally

```bash
npm run build          # one-shot build of all packages
npm run package        # produces packages/extension-host/slashmd.vsix
code --install-extension packages/extension-host/slashmd.vsix --force
```

Use `--force` if VS Code says a same-version extension is already installed. After installing, do a full VS Code restart (not just reload window) to activate the new version.
