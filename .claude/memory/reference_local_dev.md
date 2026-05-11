---

name: Local build and test instructions
description: How to build, run, and test the SlashMD extension locally during development
type: reference
---------------

## Building and Testing SlashMD Locally

### Prerequisites

- Node.js 18+
- VS Code or Cursor
- The repo open as a workspace in VS Code

### First-time setup

```bash
npm install
```

### Option A — Watch mode + F5 (recommended for development)

**1. Start watch mode** (rebuilds automatically on file save):

```bash
npm run dev
```

Watches both `extension-host` (tsup) and `webview-ui` (esbuild) in parallel. The webview bundle is written directly to `packages/extension-host/dist/`.

**2. Press F5** in VS Code and select **"Run SlashMD Extension"**.

Open any `.md` file in the new window. On save, reload with **Ctrl+Shift+P → Developer: Reload Webview**.

### Option B — Clean build + F5

Press **F5** and select **"Run SlashMD Extension (with build)"** — runs `npm run build` first via pre-launch task.

### Option C — One-shot build

```bash
npm run build
```

### Reloading changes

| What changed                              | How to reload                                    |
| ----------------------------------------- | ------------------------------------------------ |
| `webview-ui/src/**` (CSS, React, editor)  | Ctrl+Shift+P → Developer: Reload Webview         |
| `extension-host/src/**` (extension logic) | Ctrl+Shift+P → Developer: Restart Extension Host |
| `shared/src/**`                           | Restart Extension Host                           |

### Packaging a .vsix for manual install

```bash
npm run package
```

The output is at **`packages/extension-host/slashmd.vsix`** (not the project root).

Install it with:

```bash
code --install-extension packages/extension-host/slashmd.vsix
```

Or in VS Code: **Extensions → ⋯ → Install from VSIX…** and navigate to `packages/extension-host/slashmd.vsix`.

### Tips

- The webview bundle (`webview.js` + `webview.css`) must be present in `packages/extension-host/dist/` — `npm run dev/build` copies them there automatically.
- Webview console logs: **Help → Toggle Developer Tools → Console** inside the Extension Development Host window.
- Extension host logs: **Output panel → SlashMD channel**.
