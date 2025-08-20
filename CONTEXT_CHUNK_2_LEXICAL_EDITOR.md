# Context Handoff: Chunk 2 - Lexical Editor Components

## Mission
Build a standalone React application using Lexical that provides a complete block-based Markdown editing experience. This will later be embedded in a VS Code WebView.

## Scope (What you're building)
- **Package name**: `@slashmd/webview-ui`
- **Zero dependencies on**: VS Code APIs, Node.js filesystem, extension host messaging
- **Input**: Block data structures (matches Chunk 1 output)
- **Output**: Fully functional React app with all editing features

## Technical Requirements

### Core Stack
```bash
Key dependencies:
- react ^18.2.0
- react-dom ^18.2.0  
- lexical ^0.14.0
- @lexical/react ^0.14.0
- @lexical/utils ^0.14.0
- @lexical/selection ^0.14.0
- @lexical/list ^0.14.0
- @lexical/table ^0.14.0
- @lexical/code ^0.14.0
```

### Mock Data Interface (matches Chunk 1)
```typescript
// Mock the md-mapper types for development
interface Block {
  id: string;
  type: BlockType;
  sourceRange: { start: number; end: number };
  content: any;
  children?: Block[];
}

type BlockType = 
  | 'paragraph' | 'heading' | 'list' | 'listItem' | 'taskList' | 'taskItem'
  | 'quote' | 'code' | 'divider' | 'table' | 'image' | 'callout' | 'toggle';
```

### Core Features to Implement

#### 1. Lexical Custom Nodes
Create custom Lexical nodes for each block type:
- `HeadingBlockNode` (levels 1-3)
- `ListBlockNode` (ordered/unordered)  
- `TaskListNode` + `TaskItemNode`
- `QuoteBlockNode`
- `CodeBlockNode` (with language selector)
- `DividerNode`
- `TableBlockNode`
- `ImageBlockNode`
- `CalloutNode` (with type: note/tip/warning)
- `ToggleNode` (collapsible with summary)

#### 2. Slash Menu System
- Trigger on `/` character
- Fuzzy search through block types
- Arrow key navigation + Enter to select
- Convert current block or insert new block
- Categories: "Basic", "Lists", "Media", "Advanced"

#### 3. Drag Handle System
- Show `••` drag handle on block hover (left gutter)
- Drag to reorder blocks vertically
- Horizontal drag for indent/outdent (lists, toggle content)
- Keyboard alternatives: `Alt+↑/↓` for move, `Tab/Shift+Tab` for indent
- Visual drop indicators

#### 4. Inline Formatting Toolbar
- Appears on text selection
- Bold (`Cmd+B`), Italic (`Cmd+I`), Inline Code (`Cmd+E`)
- Link insertion (`Cmd+K`) with URL input
- Strikethrough support

#### 5. Block-Specific UIs
**Code Blocks**: Language dropdown, copy button, line numbers (optional)
**Tables**: Add/remove row/column buttons, alignment controls
**Images**: Placeholder for drag/drop (mock the file handling)  
**Callouts**: Type selector (note/tip/warning), icon display
**Toggles**: Collapse/expand state, summary editing

### Development Setup

#### Standalone Development Server
```typescript
// Mock VS Code WebView environment
const mockVSCodeAPI = {
  postMessage: (data: any) => console.log('Mock postMessage:', data),
  setState: (state: any) => localStorage.setItem('vscode-state', JSON.stringify(state)),
  getState: () => JSON.parse(localStorage.getItem('vscode-state') || '{}')
};

// Mock messaging for development
window.acquireVsCodeApi = () => mockVSCodeAPI;
```

#### Theme Integration
```css
/* Use CSS custom properties that match VS Code theme variables */
:root {
  --vscode-editor-background: #1e1e1e;
  --vscode-editor-foreground: #d4d4d4;
  --vscode-editorLineNumber-foreground: #858585;
  /* ... other theme variables */
}

/* Light theme overrides */
[data-theme="light"] {
  --vscode-editor-background: #ffffff;
  --vscode-editor-foreground: #000000;
}
```

### Component Architecture
```
src/
  App.tsx                 # Main editor container
  components/
    Editor/
      LexicalEditor.tsx   # Main Lexical setup
      SlashMenu.tsx       # Command palette
      DragHandle.tsx      # Block reordering
      Toolbar.tsx         # Inline formatting
    Blocks/
      HeadingBlock.tsx
      ListBlock.tsx
      TaskBlock.tsx
      CodeBlock.tsx
      TableBlock.tsx
      CalloutBlock.tsx
      ToggleBlock.tsx
      ImageBlock.tsx
    UI/
      Button.tsx
      Dropdown.tsx
      Modal.tsx
  hooks/
    useBlocks.tsx         # Block data management
    useKeyboard.tsx       # Keyboard shortcuts
    useDragAndDrop.tsx    # Drag behavior
  types/
    blocks.ts             # Block type definitions
    editor.ts             # Editor state types
  styles/
    globals.css
    editor.css
    blocks.css
```

### Mock Data & Testing

#### Sample Block Data
```typescript
const sampleDocument: Block[] = [
  {
    id: 'h1-1',
    type: 'heading',
    content: { level: 1, text: 'Sample Document' },
    sourceRange: { start: 0, end: 17 },
  },
  {
    id: 'p-1', 
    type: 'paragraph',
    content: { text: 'This is a paragraph with **bold** text.' },
    sourceRange: { start: 18, end: 57 },
  },
  {
    id: 'task-1',
    type: 'taskList',
    sourceRange: { start: 58, end: 120 },
    children: [
      {
        id: 'task-item-1',
        type: 'taskItem', 
        content: { checked: false, text: 'Incomplete task' },
        sourceRange: { start: 58, end: 80 },
      }
    ]
  }
];
```

#### Interactive Demo Features
- Load sample documents
- Theme switcher (light/dark)
- Export blocks as JSON
- Performance monitoring (typing latency)

### Success Criteria
- [ ] All block types render and edit correctly
- [ ] Slash menu works with fuzzy search
- [ ] Drag handles reorder blocks smoothly
- [ ] Inline toolbar appears on selection
- [ ] Keyboard shortcuts work as expected  
- [ ] Responsive design works in constrained webview
- [ ] Performance: <16ms keystroke response time
- [ ] Theme variables respect VS Code appearance
- [ ] Accessibility: full keyboard navigation

### Test Requirements
```
tests/
  components/
    Editor.test.tsx
    SlashMenu.test.tsx
    Blocks/
      HeadingBlock.test.tsx
      TaskBlock.test.tsx
      # ... one test per block type
  integration/
    drag-and-drop.test.tsx
    keyboard-shortcuts.test.tsx
    block-conversion.test.tsx
  mocks/
    vscode-api.ts
    sample-documents.ts
```

### What You DON'T Need to Worry About
- Real VS Code messaging (mock it)
- Actual file system operations (mock image uploads)
- Markdown parsing/serialization (use mock block data)
- Extension host communication
- Real persistence (use localStorage for demo)

### Interface Contracts (Other chunks depend on these)
Your components will receive `Block[]` data and emit editing events. Keep the block manipulation API clean for integration.

### Development Commands
```bash
# Standalone development server
npm run dev        # Start dev server at http://localhost:5173

# Component testing  
npm run test       # Run component tests

# Build for production
npm run build      # Generate bundled webview.js
```

Focus on creating a polished, responsive editing experience that feels as good as Notion!