# SlashMD WebView UI - Phase 1

This is the React-based user interface for the SlashMD editor, implementing Phase 1 functionality with basic block editing capabilities.

## Phase 1 Features

✅ **Foundation & Basic Infrastructure**
- React application with Vite build system
- TypeScript configuration and type safety
- CSS custom properties theme system (light/dark/high-contrast)
- Mock VS Code API for standalone development
- Basic block data management with `useBlocks` hook
- Editable paragraph and heading blocks (H1, H2, H3)

## Development Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run tests (when implemented)
npm run test
```

## Project Structure

```
src/
├── components/
│   ├── Editor/
│   │   ├── SimpleEditor.tsx      # Main editor component (Phase 1)
│   │   └── LexicalEditor.tsx     # Full Lexical editor (future)
│   └── Blocks/
│       ├── ParagraphBlock.tsx    # Paragraph block component
│       └── HeadingBlock.tsx      # Heading block component
├── hooks/
│   └── useBlocks.tsx             # Block data management
├── types/
│   ├── blocks.ts                 # Block data structures
│   └── editor.ts                 # Editor types
├── mocks/
│   └── vscode-api.ts             # Mock VS Code API
└── styles/
    ├── globals.css               # Global styles & theme variables
    ├── editor.css                # Editor-specific styles
    └── blocks.css                # Block-specific styles
```

## Usage

The application runs standalone for development with sample content. You can:

- **Edit blocks**: Click on paragraph or heading content to edit
- **Switch themes**: Use the theme switcher in the top-right (Light/Dark/High Contrast)
- **View block info**: Check the bottom-left corner for block count and theme info

## Theme System

The application uses CSS custom properties that match VS Code's theme variables:

- `--vscode-editor-background` / `--vscode-editor-foreground`
- `--vscode-input-*` for form elements
- `--vscode-button-*` for buttons
- `--vscode-list-*` for interactive elements

Themes automatically switch based on the `data-theme` attribute on the document root.

## Mock VS Code API

For standalone development, the app includes a mock VS Code API that simulates:

- `acquireVsCodeApi()` function
- Message posting and state management
- Document initialization with sample blocks
- Theme change notifications

## What's Next (Future Phases)

Phase 2 will add:
- Full Lexical editor integration
- Additional block types (lists, tasks, quotes, code, tables, etc.)
- Block conversion and transformation

Phase 3 will add:
- Slash menu for block insertion
- Drag and drop for reordering
- Inline formatting toolbar
- Keyboard shortcuts

Phase 4 will add:
- Advanced block UIs and polish
- Comprehensive testing
- Performance optimizations
- VS Code integration readiness

## Development Notes

- Uses React 18.2.0 with TypeScript
- Vite for fast development and building
- ContentEditable elements for basic text editing (Phase 1)
- Will migrate to Lexical nodes in later phases
- CSS custom properties ensure VS Code theme compatibility