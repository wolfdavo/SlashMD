# SlashMD — Block-Based Markdown Editor for VS Code

A Notion-like block-based WYSIWYG editor for Markdown files in VS Code and Cursor.

## Features

- **Block-based editing**: Headings, paragraphs, lists, todos, quotes, code blocks, tables, and more
- **Slash menu**: Type `/` to insert blocks with fuzzy search
- **Inline formatting**: Bold, italic, strikethrough, inline code, links
- **Drag handles**: Reorder blocks with drag-and-drop
- **Callouts**: Note, tip, warning, important, and caution admonitions
- **Toggles**: Collapsible sections using `<details>` HTML
- **Image support**: Paste or drag images to save to your assets folder
- **Live sync**: Changes sync instantly with the underlying Markdown file
- **VS Code themes**: Respects your current color theme
- **Keyboard navigation**: Full keyboard support for accessibility

## Installation

### From VSIX

1. Download the `.vsix` file from releases
2. In VS Code: `Extensions` → `...` → `Install from VSIX`

### From Source

```bash
# Clone and install
git clone <repo>
cd slashmd
npm install

# Build
npm run build

# Package
npm run package
```

## Usage

1. Open any `.md` or `.markdown` file
2. SlashMD opens as the default editor
3. Type `/` to open the block menu
4. Select text for inline formatting toolbar

### Commands

- **SlashMD: Open as Raw Markdown** - Switch to plain text editor
- **SlashMD: Insert Block...** - Open block picker

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `/` | Open slash menu |
| `Cmd/Ctrl+B` | Bold |
| `Cmd/Ctrl+I` | Italic |
| `Cmd/Ctrl+E` | Inline code |
| `Cmd/Ctrl+K` | Insert link |
| `Tab` | Indent list item |
| `Shift+Tab` | Outdent list item |
| `Alt+↑/↓` | Move block up/down |

## Settings

| Setting | Description | Default |
|---------|-------------|---------|
| `slashmd.assets.folder` | Folder for pasted images | `assets` |
| `slashmd.format.wrap` | Line wrap width (0 = no wrap) | `0` |
| `slashmd.callouts.style` | Callout syntax (`admonition` or `emoji`) | `admonition` |
| `slashmd.toggles.syntax` | Toggle syntax (`details` or `list`) | `details` |
| `slashmd.math.enabled` | Enable math blocks (future) | `false` |
| `slashmd.mermaid.enabled` | Enable Mermaid diagrams (future) | `false` |

## Block Types

### Supported

- Paragraph
- Heading 1-3
- Bullet list
- Numbered list
- Todo list (checkboxes)
- Quote
- Code block (with language)
- Divider (horizontal rule)
- Table
- Image
- Link
- Callout (Note, Tip, Warning, Important, Caution)
- Toggle (collapsible)

### Markdown Mapping

| Block | Markdown |
|-------|----------|
| Heading | `# H1`, `## H2`, `### H3` |
| Bullet list | `- item` |
| Numbered list | `1. item` |
| Todo | `- [ ] task`, `- [x] done` |
| Quote | `> text` |
| Code | ` ```lang ` |
| Divider | `---` |
| Table | GFM tables |
| Toggle | `<details><summary>Title</summary>...</details>` |
| Callout | `> [!NOTE]` |

## Development

```bash
# Install dependencies
npm install

# Watch mode
npm run dev

# Build
npm run build

# Package extension
npm run package
```

### Project Structure

```
slashmd/
├── packages/
│   ├── extension-host/    # VS Code extension
│   ├── webview-ui/        # React + Lexical editor
│   └── shared/            # Shared types
├── package.json           # Root workspace
└── tsconfig.base.json     # Shared TypeScript config
```

## Compatibility

- VS Code 1.85.0+
- Cursor (latest)
- macOS, Windows, Linux

## License

MIT
