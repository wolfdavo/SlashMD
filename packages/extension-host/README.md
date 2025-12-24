# SlashMD — Block-Based Markdown Editor

A Notion-style block editor for Markdown files. Write beautifully, store as plain Markdown.

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
- _Italic_ (Cmd/Ctrl+I)
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

Customize colors for headings, bold, and italic text to make them stand out:

| Setting                      | Description            | Example Values          |
| ---------------------------- | ---------------------- | ----------------------- |
| `slashmd.theme.headingColor` | Color for all headings | `#e06c75`, `coral`      |
| `slashmd.theme.boldColor`    | Color for bold text    | `#d19a66`, `orange`     |
| `slashmd.theme.italicColor`  | Color for italic text  | `#98c379`, `lightgreen` |

Leave empty to use your theme's default text color.

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
| `slashmd.theme.headingColor` | Custom color for headings                | _(none)_     |
| `slashmd.theme.boldColor`    | Custom color for bold text               | _(none)_     |
| `slashmd.theme.italicColor`  | Custom color for italic text             | _(none)_     |

## Requirements

- VS Code 1.85.0+ or Cursor

## Links

- [Website](https://slashmd.dev)
- [GitHub Repository](https://github.com/wolfdavo/SlashMD)
- [Report Issues](https://github.com/wolfdavo/SlashMD/issues)

## License

MIT
