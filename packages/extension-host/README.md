# SlashMD — Block-Based Markdown Editor

A Notion-style block editor for Markdown files. Write beautifully, store as plain Markdown.

![SlashMD Editor](https://raw.githubusercontent.com/wolfdavo/SlashMD/main/docs/demo.gif)

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

| Block Type | Markdown Output |
|------------|-----------------|
| Headings | `# ## ###` |
| Bullet lists | `- item` |
| Numbered lists | `1. item` |
| Todo checkboxes | `- [ ] task` |
| Blockquotes | `> quote` |
| Code blocks | ` ```lang ``` ` |
| Tables | GFM tables |
| Callouts | `> [!NOTE]` admonitions |
| Toggles | `<details>` HTML |
| Images | `![alt](path)` |
| Dividers | `---` |

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

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `/` | Open slash menu |
| `Cmd/Ctrl+B` | Bold |
| `Cmd/Ctrl+I` | Italic |
| `Cmd/Ctrl+E` | Inline code |
| `Cmd/Ctrl+K` | Insert link |
| `Tab` | Indent list item |
| `Shift+Tab` | Outdent list item |
| `Alt+Up/Down` | Move block up/down |

## Commands

- **SlashMD: Open as Raw Markdown** — Switch to the plain text editor
- **SlashMD: Open as SlashMD** — Open a Markdown file in SlashMD
- **SlashMD: Copy Markdown Content** — Copy the document to clipboard

## Settings

| Setting | Description | Default |
|---------|-------------|---------|
| `slashmd.assets.folder` | Folder for pasted images | `assets` |
| `slashmd.callouts.style` | Callout syntax (`admonition` or `emoji`) | `admonition` |
| `slashmd.toggles.syntax` | Toggle syntax (`details` or `list`) | `details` |

## Requirements

- VS Code 1.85.0+ or Cursor

## Links

- [GitHub Repository](https://github.com/wolfdavo/SlashMD)
- [Report Issues](https://github.com/wolfdavo/SlashMD/issues)

## License

MIT
