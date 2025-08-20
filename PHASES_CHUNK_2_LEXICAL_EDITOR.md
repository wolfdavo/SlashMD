# Phase Breakdown: Chunk 2 - Lexical Editor Components

## Overview of Phasing Strategy

The Lexical Editor Components chunk is divided into 4 progressive phases that build upon each other. Each phase delivers working functionality and provides clear handoff points to minimize context transfer between sub-agents.

**Dependency Flow**: Foundation → Core Blocks → Interactive Features → Advanced Polish

**Key Principle**: Each phase should produce a working, testable application that the next phase can build upon without needing deep knowledge of implementation details.

---

## Phase 1: Foundation & Basic Infrastructure
**Duration Estimate**: 1 sub-agent session  
**Dependencies**: None

### Scope & Deliverables
- Set up React application structure with Vite/webpack
- Install and configure core Lexical dependencies
- Implement mock VS Code API and theme integration
- Create basic project architecture (components/, hooks/, types/, styles/)
- Implement basic block types: `paragraph` and `heading` (levels 1-3)
- Set up `useBlocks` hook for block data management
- Create basic `LexicalEditor.tsx` component with theme support

### Success Criteria
- [ ] React app runs on `npm run dev` with hot reload
- [ ] Theme switching works (light/dark) using CSS custom properties
- [ ] Can render paragraph and heading blocks from mock Block[] data
- [ ] Basic text editing works within blocks
- [ ] Mock VS Code API logs messages to console
- [ ] Project structure follows specified architecture

### Dependencies on Previous Phases
None - this is the foundation phase.

### What Next Phase Needs from This Phase
- Working React app with Lexical editor
- Block data management system (`useBlocks` hook)
- Theme integration working
- Basic Block interface and types defined
- Example of how to create custom Lexical nodes (from paragraph/heading implementation)

### Handoff Package
```typescript
// types/blocks.ts - Core interfaces
interface Block {
  id: string;
  type: BlockType;
  sourceRange: { start: number; end: number };
  content: any;
  children?: Block[];
}

// hooks/useBlocks.tsx - Block management
const useBlocks = () => {
  // Block CRUD operations
  // Block data state management
}

// Sample working blocks: paragraph, heading
```

---

## Phase 2: Core Block Types Implementation
**Duration Estimate**: 1 sub-agent session  
**Dependencies**: Phase 1 complete

### Scope & Deliverables
- Implement all remaining core block Lexical nodes:
  - `ListBlockNode` (ordered/unordered)
  - `TaskListNode` + `TaskItemNode` 
  - `QuoteBlockNode`
  - `CodeBlockNode` (basic version)
  - `DividerNode`
  - `TableBlockNode` (basic version)
  - `ImageBlockNode` (placeholder version)
  - `CalloutNode` (basic version)
  - `ToggleNode` (basic version)
- Create corresponding React components in `components/Blocks/`
- Extend block data management to handle all block types
- Add sample data for all block types

### Success Criteria
- [ ] All block types render correctly from Block[] data
- [ ] Basic editing works for each block type (text content)
- [ ] Block conversion works (can change block types)
- [ ] Sample document with all block types loads and displays
- [ ] Block hierarchy works (lists with items, toggles with content)

### Dependencies on Previous Phases
- Working Lexical editor setup from Phase 1
- Block management system and interfaces from Phase 1
- Theme integration from Phase 1

### What Next Phase Needs from This Phase
- All block types implemented and working
- Complete Block component library
- Extended useBlocks hook supporting all block types
- Sample data covering all block scenarios
- Block type conversion functionality

### Handoff Package
```typescript
// All block components working:
// HeadingBlock, ListBlock, TaskBlock, CodeBlock, etc.

// Extended useBlocks with:
const useBlocks = () => {
  const convertBlock = (blockId: string, newType: BlockType) => { ... }
  const insertBlock = (afterId: string, blockType: BlockType) => { ... }
  // ... full CRUD operations for all block types
}

// Sample data with all block types represented
const fullSampleDocument: Block[] = [ ... ]
```

---

## Phase 3: Interactive Features & UX
**Duration Estimate**: 1 sub-agent session  
**Dependencies**: Phases 1 & 2 complete

### Scope & Deliverables
- Implement slash menu system (`SlashMenu.tsx`)
  - Trigger on `/` character with fuzzy search
  - Block type categories and keyboard navigation
  - Block insertion and conversion
- Create drag handle system (`DragHandle.tsx`)
  - Visual drag handles (`••`) on block hover
  - Vertical reordering with drop indicators
  - Horizontal indent/outdent for hierarchical blocks
- Build inline formatting toolbar (`Toolbar.tsx`)
  - Selection-based appearance with bold, italic, code, links
  - Keyboard shortcuts (`Cmd+B`, `Cmd+I`, etc.)
- Add keyboard shortcuts hook (`useKeyboard.tsx`)
- Create drag and drop functionality (`useDragAndDrop.tsx`)

### Success Criteria
- [ ] Slash menu appears on `/` and allows block creation/conversion
- [ ] Fuzzy search works in slash menu with arrow key navigation
- [ ] Drag handles appear on hover and enable block reordering
- [ ] Visual drop indicators show during drag operations
- [ ] Inline toolbar appears on text selection with working formatting
- [ ] All keyboard shortcuts work as specified
- [ ] Drag and drop works for both reordering and indentation

### Dependencies on Previous Phases
- All block types implemented from Phase 2
- Working editor and block management from Phase 1
- Block conversion functionality from Phase 2

### What Next Phase Needs from This Phase
- Complete interactive editing experience
- All user interaction patterns working
- Hook-based architecture for extending functionality
- Working slash menu and drag systems for enhancement

### Handoff Package
```typescript
// Interactive components:
// SlashMenu, DragHandle, Toolbar

// Interaction hooks:
const useKeyboard = () => { ... }
const useDragAndDrop = () => { ... }

// Enhanced editor with full interactivity:
// - Slash commands working
// - Drag reordering working  
// - Inline formatting working
// - Keyboard shortcuts working
```

---

## Phase 4: Advanced UIs, Testing & Polish
**Duration Estimate**: 1 sub-agent session  
**Dependencies**: Phases 1, 2 & 3 complete

### Scope & Deliverables
- Implement advanced block-specific UIs:
  - Code blocks: language dropdown, copy button, line numbers
  - Tables: add/remove row/column, alignment controls  
  - Images: drag/drop placeholder, sizing controls
  - Callouts: type selector (note/tip/warning), icons
  - Toggles: collapse/expand animations, summary editing
- Set up comprehensive testing suite
  - Component tests for all blocks and interactions
  - Integration tests for drag/drop, keyboard shortcuts
  - Mock VS Code API testing utilities
- Add demo features:
  - Sample document loader
  - JSON export functionality
  - Performance monitoring
- Performance optimizations and accessibility improvements
- Final polish and responsive design refinements

### Success Criteria
- [ ] All advanced block UIs work correctly
- [ ] Comprehensive test coverage (>80%) with passing tests
- [ ] Performance meets <16ms keystroke response requirement
- [ ] Full accessibility with keyboard navigation
- [ ] Responsive design works in constrained webview
- [ ] Demo features showcase all functionality
- [ ] Ready for VS Code integration

### Dependencies on Previous Phases
- Complete block library from Phase 2
- Full interactive system from Phase 3
- Foundation architecture from Phase 1

### What Next Phase Needs from This Phase
This is the final phase. Delivers production-ready React application for VS Code integration.

### Handoff Package
```typescript
// Production-ready application with:
// - All features implemented and tested
// - Performance optimized
// - Fully accessible
// - VS Code integration ready

// Complete test suite
// Build artifacts ready for embedding
// Documentation and examples
```

---

## Inter-Phase Communication Guidelines

### Context Minimization Strategy
Each sub-agent should focus only on their phase deliverables. Previous phase work should be treated as "black box" functionality that just works.

### Required Handoff Information
- **File structure**: What files were created/modified
- **Key interfaces**: TypeScript interfaces that next phase needs
- **Usage examples**: How to use the functionality you built
- **Known limitations**: What's not implemented yet
- **Test status**: What's tested vs. what needs testing

### Success Validation
Each phase should end with a working application that demonstrates its deliverables. The next sub-agent should be able to `npm run dev` and immediately see working functionality.
