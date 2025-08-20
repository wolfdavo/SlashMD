# SlashMD — Block-Based Markdown Editor for VS Code

<div align="center">

**A VS Code extension that opens Markdown files in a Notion-like, block-based WYSIWYG editor by default, while preserving the underlying file as plain Markdown.**

[![VS Code Extension](https://img.shields.io/badge/VS%20Code-Extension-blue?style=flat-square&logo=visual-studio-code)](https://marketplace.visualstudio.com/publishers/yourPublisher)
[![TypeScript](https://img.shields.io/badge/TypeScript-100%25-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](https://opensource.org/licenses/MIT)

*Get Notion-style fluid editing and structure, keep Markdown portability and git-friendliness, and avoid lock-in.*

</div>

## ✨ Features

### 🎯 **Core Functionality**
- **Block-Based Editing**: Transform Markdown files into interactive, Notion-like blocks
- **Perfect Fidelity**: Underlying files remain as standard Markdown — no vendor lock-in
- **Real-Time Sync**: Changes sync instantly between the visual editor and file system
- **Git Friendly**: External changes (git pull, other editors) automatically update the editor

### 🚀 **Interactive Features** 
- **Slash Menu**: Type `/` for instant block insertion and conversion with fuzzy search
- **Drag & Drop**: Reorder blocks and adjust nesting with intuitive drag handles
- **Inline Formatting**: Rich text toolbar with bold, italic, code, and link support
- **Keyboard Shortcuts**: Standard shortcuts (`Cmd+B`, `Cmd+I`, `Cmd+K`) work seamlessly

### 📝 **Supported Block Types**
- **Text Blocks**: Paragraphs, Headings (H1-H3), Quotes
- **Lists**: Bulleted, Numbered, and Task Lists with nesting
- **Rich Content**: Code blocks (with syntax highlighting), Tables, Images, Dividers
- **Interactive**: Callouts (Note/Tip/Warning), Collapsible Toggles

### 🎨 **Advanced Features**
- **Custom Syntax**: Callouts (`> [!NOTE]`) and Toggles (`<details>`)  
- **Asset Management**: Paste/drag images automatically saved to workspace with relative links
- **Theme Integration**: Respects VS Code's light/dark/high-contrast themes
- **Performance Optimized**: Handles large documents with <16ms keystroke latency

## 🚀 Quick Start

### Installation

**Option 1: VS Code Marketplace** (Coming Soon)
```bash
ext install yourPublisher.slashmd
```

**Option 2: Local Installation**
```bash
# Clone and build
git clone https://github.com/yourusername/SlashMD.git
cd SlashMD
npm install
npm run build

# Package and install
npm run package
code --install-extension packages/extension-host/slashmd-0.0.1.vsix
```

### Usage

1. **Open any `.md` file** — SlashMD automatically becomes the default editor
2. **Start editing** — Click on text to edit, use `/` for the slash menu
3. **Drag blocks** — Hover over the left edge to see drag handles (`••`)
4. **Format text** — Select text to see the formatting toolbar
5. **Add images** — Paste or drag images directly into the editor
6. **Switch to raw** — Use "Open as Raw Markdown" button in the title bar

## 🏗️ Architecture

SlashMD is built as a modular TypeScript monorepo with three main packages:

### 📦 **Package Structure**

```
SlashMD/
├── packages/
│   ├── md-mapper/          # Markdown ↔ Block conversion library
│   ├── webview-ui/         # React + Lexical editor components  
│   └── extension-host/     # VS Code extension with WebView integration
├── scripts/                # Build and validation scripts
└── docs/                   # Documentation and design files
```

### ⚙️ **Tech Stack**
- **Extension Host**: TypeScript, VS Code APIs, Node.js
- **Editor UI**: React 18, Lexical Editor, Vite
- **Markdown Engine**: Unified/Remark with GFM support
- **Build System**: pnpm workspaces, tsup, esbuild
- **Testing**: Vitest with property-based testing

## 🛠️ Development

### Prerequisites
- Node.js 18+
- pnpm 8+
- VS Code 1.85+

### Setup
```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Start development mode
pnpm dev

# Run tests
pnpm test

# Package extension
pnpm package
```

### Development Workflow
```bash
# Launch Extension Development Host
code .
# Press F5 to start debugging

# Or run individual packages
pnpm --filter md-mapper test
pnpm --filter webview-ui dev  
pnpm --filter extension-host build
```

## 📋 Markdown Syntax Support

### Standard Markdown
- **Headers**: `# ## ###`
- **Lists**: `- * +` and `1. 2. 3.`  
- **Tasks**: `- [ ] - [x]`
- **Quotes**: `>`
- **Code**: `` ``` `` and `` ` ``
- **Tables**: GFM table syntax
- **Images**: `![alt](src)`
- **Links**: `[text](url)`

### SlashMD Extensions
- **Callouts**: `> [!NOTE]` `> [!TIP]` `> [!WARNING]`
- **Toggles**: `<details><summary>Title</summary>content</details>`
- **Assets**: Automatic relative path management

## ⚡ Performance

SlashMD is optimized for real-world usage:

- **Large Documents**: Handles 10MB+ files efficiently  
- **Real-Time Editing**: <16ms keystroke response time
- **Memory Efficient**: Virtualized rendering for long documents
- **Incremental Parsing**: Only re-parses changed sections

## 🔧 Configuration

Configure SlashMD through VS Code settings:

```json
{
  "slashmd.assets.folder": "assets",
  "slashmd.format.wrap": 0,
  "slashmd.callouts.style": "admonition",
  "slashmd.theme.density": "comfortable"
}
```

### Available Settings
| Setting | Default | Description |
|---------|---------|-------------|
| `slashmd.assets.folder` | `"assets"` | Folder for pasted/dragged images |
| `slashmd.format.wrap` | `0` | Markdown wrap width (0 = no wrap) |
| `slashmd.callouts.style` | `"admonition"` | Callout syntax: `admonition` or `emoji` |
| `slashmd.theme.density` | `"comfortable"` | UI density: `compact` or `comfortable` |

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Areas for Contribution
- **New Block Types**: Extend the block system
- **Performance**: Optimization and benchmarking  
- **Accessibility**: Screen reader and keyboard support
- **Internationalization**: Multi-language support
- **Testing**: Edge cases and integration tests

## 📚 Documentation

- **[Design Document](SLASHMD_DESIGN_DRAFT.md)**: Complete technical specification
- **[API Documentation](packages/md-mapper/README.md)**: Markdown processing library
- **[Component Guide](packages/webview-ui/README.md)**: Editor component documentation
- **[Extension Guide](packages/extension-host/README.md)**: VS Code integration details

## 🐛 Troubleshooting

### Common Issues

**SlashMD doesn't open for Markdown files**
- Check that the extension is installed and enabled
- Use "Make SlashMD Default for Markdown" command

**Performance issues with large files**
- Enable performance mode in settings
- Consider splitting very large documents

**Images not saving**
- Check workspace permissions
- Verify `slashmd.assets.folder` setting

**Sync conflicts with external changes**
- Use "Reload from File" if corruption occurs
- Check git status for unexpected changes

### Getting Help
1. Check the [Issues](https://github.com/yourusername/SlashMD/issues) page
2. Search existing issues or create a new one
3. Include your VS Code version and error messages

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 🙏 Acknowledgments

SlashMD is inspired by modern block-based editors like Notion and builds upon the excellent VS Code extension ecosystem. Special thanks to the maintainers of:

- [Unified/Remark](https://github.com/remarkjs/remark) - Markdown processing
- [Lexical](https://github.com/facebook/lexical) - Rich text editing framework  
- [VS Code](https://github.com/Microsoft/vscode) - Extensible editor platform

---

<div align="center">
<strong>Transform your Markdown editing experience with SlashMD! 🚀</strong>
</div>