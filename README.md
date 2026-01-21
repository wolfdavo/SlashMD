# SlashMD — Block-Based Markdown Editor

A Notion-style block editor for Markdown files. Write beautifully, store as plain Markdown.

There is an interactive demo with a rough copy of the editor on [SlashMD](https://slashmd.dev)

![SlashMD Demo](https://github.com/wolfdavo/SlashMD/blob/main/slashmd-example.gif?raw=true)

## Why SlashMD?

Markdown is powerful but editing raw syntax can be tedious. SlashMD gives you the best of both worlds:

- **Write visually** — No more counting `#` symbols or matching brackets
- **Store as Markdown** — Your files stay portable, version-control friendly, and readable anywhere
- **Works instantly** — Opens `.md` files automatically with zero configuration

## Features

### Slash Commands

Type `/` anywhere to insert blocks with fuzzy search. Headings, lists, code blocks, tables, callouts — all just a keystroke away.

### Block-Based Editing

- **Drag & drop** blocks to reorder content
- **Indent/outdent** with Tab and Shift+Tab
- **Move blocks** with Alt+Arrow keys

### Rich Content

| Block Type      | Markdown Output         |
| --------------- | ----------------------- |
| Headings        | `# ## ###`              |
| Bullet lists    | `- item`                |
| Numbered lists  | `1. item`               |
| Todo checkboxes | `- [ ] task`            |
| Blockquotes     | `> quote`               |
| Code blocks     | ` ```lang ``` `         |
| Tables          | GFM tables              |
| Callouts        | `> [!NOTE]` admonitions |
| Toggles         | `<details>` HTML        |
| Images          | `![alt](path)`          |
| Dividers        | `---`                   |

### Inline Formatting

Select text to reveal the formatting toolbar:

- **Bold** (Cmd/Ctrl+B)
- *Italic* (Cmd/Ctrl+I)
- `Code` (Cmd/Ctrl+E)
- [Links](.) (Cmd/Ctrl+K)
- ~~Strikethrough~~

### Image Support

Paste or drag images directly into the editor. SlashMD automatically saves them to your assets folder and inserts the Markdown reference.

### Theme Integration

SlashMD respects your VS Code color theme — light, dark, or high contrast.

#### Code Block Themes

By default, code block syntax highlighting automatically adapts to your VS Code theme (light or dark). You can also choose a specific theme:

| Theme          | Description                |
| -------------- | -------------------------- |
| `auto`         | Matches your VS Code theme |
| `dark`         | VS Code Dark+ colors       |
| `light`        | VS Code Light+ colors      |
| `github-dark`  | GitHub's dark theme        |
| `github-light` | GitHub's light theme       |
| `monokai`      | Classic Monokai colors     |

Change this in Settings → `slashmd.theme.codeTheme`

#### Typography Colors

Customize colors for headings, bold, and italic text:

- `slashmd.theme.headingColor` — Color for all headings (fallback)
- `slashmd.theme.h1Color` / `h2Color` / `h3Color` / `h4Color` / `h5Color` — Per-level heading colors (override headingColor)
- `slashmd.theme.boldColor` — Color for bold text
- `slashmd.theme.italicColor` — Color for italic text

#### Heading Indentation

Add left indentation to create a visual hierarchy:

- `slashmd.theme.h1Indent` / `h2Indent` / `h3Indent` / `h4Indent` / `h5Indent` — e.g., `0`, `16px`, `2em`

Leave any setting empty to use the default.

## Keyboard Shortcuts

| Shortcut      | Action             |
| ------------- | ------------------ |
| `/`           | Open slash menu    |
| `Cmd/Ctrl+B`  | Bold               |
| `Cmd/Ctrl+I`  | Italic             |
| `Cmd/Ctrl+E`  | Inline code        |
| `Cmd/Ctrl+K`  | Insert link        |
| `Tab`         | Indent list item   |
| `Shift+Tab`   | Outdent list item  |
| `Alt+Up/Down` | Move block up/down |

## Commands

- **SlashMD: Open as Raw Markdown** — Switch to the plain text editor
- **SlashMD: Open as SlashMD** — Open a Markdown file in SlashMD
- **SlashMD: Copy Markdown Content** — Copy the document to clipboard

## Settings

| Setting                      | Description                              | Default      |
| ---------------------------- | ---------------------------------------- | ------------ |
| `slashmd.assets.folder`      | Folder for pasted images                 | `assets`     |
| `slashmd.callouts.style`     | Callout syntax (`admonition` or `emoji`) | `admonition` |
| `slashmd.toggles.syntax`     | Toggle syntax (`details` or `list`)      | `details`    |
| `slashmd.theme.codeTheme`    | Code block syntax highlighting theme     | `auto`       |
| `slashmd.theme.headingColor` | Color for all headings (fallback)        | *(none)*     |
| `slashmd.theme.h1Color`      | Color for H1 headings                    | *(none)*     |
| `slashmd.theme.h2Color`      | Color for H2 headings                    | *(none)*     |
| `slashmd.theme.h3Color`      | Color for H3 headings                    | *(none)*     |
| `slashmd.theme.h4Color`      | Color for H4 headings                    | *(none)*     |
| `slashmd.theme.h5Color`      | Color for H5 headings                    | *(none)*     |
| `slashmd.theme.h1Indent`     | Left indent for H1 headings              | *(none)*     |
| `slashmd.theme.h2Indent`     | Left indent for H2 headings              | *(none)*     |
| `slashmd.theme.h3Indent`     | Left indent for H3 headings              | *(none)*     |
| `slashmd.theme.h4Indent`     | Left indent for H4 headings              | *(none)*     |
| `slashmd.theme.h5Indent`     | Left indent for H5 headings              | *(none)*     |
| `slashmd.theme.boldColor`    | Color for bold text                      | *(none)*     |
| `slashmd.theme.italicColor`  | Color for italic text                    | *(none)*     |

## Requirements

- VS Code 1.85.0+ or Cursor

## Contributing

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or later
- [VS Code](https://code.visualstudio.com/) or [Cursor](https://cursor.sh/)

### Setup

1. **Clone the repository**

   ```bash
   git clone https://github.com/wolfdavo/SlashMD.git
   cd SlashMD
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Build the extension**

   ```bash
   npm run build
   ```

### Development

Run the extension in development mode with auto-rebuild on changes:

```bash
npm run dev
```

Then press **F5** in VS Code to launch the Extension Development Host window.

### Testing

Open any `.md` file in the Extension Development Host to test the editor. Changes to the webview code will require a rebuild, but you can reload the webview with **Cmd+Shift+P** → "Developer: Reload Webviews".

### Installing Locally

To install your local build as the active extension (replacing any marketplace version):

1. **Package the extension**

   ```bash
   cd packages/extension-host
   npx vsce package --no-dependencies
   ```

2. **Install the `.vsix` file**

   ```bash
   code --install-extension slashmd-*.vsix --force
   ```

3. **Reload VS Code** to activate the new version.

### Project Structure

```
SlashMD/
├── packages/
│   ├── extension-host/   # VS Code extension (Node.js)
│   ├── webview-ui/       # Editor UI (React + Lexical)
│   └── shared/           # Shared types and utilities
└── website/              # Marketing website
```

## Links

- [Website](https://slashmd.dev)
- [GitHub Repository](https://github.com/wolfdavo/SlashMD)
- [Report Issues](https://github.com/wolfdavo/SlashMD/issues)

## License

MIT
