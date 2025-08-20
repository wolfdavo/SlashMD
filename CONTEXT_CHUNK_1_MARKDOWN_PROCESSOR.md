# Context Handoff: Chunk 1 - Markdown Processing Library

## Mission
Build a standalone Node.js library (`md-mapper`) that converts between Markdown text and structured block data with perfect fidelity and source range tracking.

## Scope (What you're building)
- **Package name**: `@slashmd/md-mapper` 
- **Zero dependencies on**: VS Code APIs, React, Lexical, or any UI framework
- **Input**: Plain Markdown text (string)
- **Output**: Structured block data with source positions + reverse conversion

## Technical Requirements

### Core API Surface
```typescript
// Main exports your library must provide
export interface SourceRange {
  start: number;  // character offset in source
  end: number;    // character offset in source
}

export interface Block {
  id: string;           // stable ID for UI binding
  type: BlockType;      // see enum below
  sourceRange: SourceRange;
  content: any;         // type-specific content
  children?: Block[];   // for nested structures
}

export type BlockType = 
  | 'paragraph' | 'heading' | 'list' | 'listItem' | 'taskList' | 'taskItem'
  | 'quote' | 'code' | 'divider' | 'table' | 'image' | 'callout' | 'toggle';

// Core functions to implement
export function parseMarkdown(markdown: string): Block[];
export function serializeBlocks(blocks: Block[]): string;
export function updateBlocks(blocks: Block[], edit: TextEdit): Block[];
```

### Block Type Specifications

**Paragraph**: Plain text content
**Heading**: Level (1-3) + text content  
**List/ListItem**: Ordered/unordered with nesting support
**TaskList/TaskItem**: GFM task syntax `- [ ]` and `- [x]`
**Quote**: Blockquote content (may contain callouts)
**Code**: Language + content
**Divider**: Horizontal rule `---`
**Table**: Headers + rows with alignment
**Image**: alt text + src path + title
**Callout**: Type (note/tip/warning) + content (maps to `> [!NOTE]` or `> 💡 Note:`)
**Toggle**: Summary + collapsible content (maps to `<details><summary>`)

### Remark Pipeline Setup
```bash
npm dependencies you'll need:
- unified
- remark-parse  
- remark-gfm
- remark-stringify
- remark-frontmatter (handle YAML frontmatter)
- mdast-util-to-string
```

### Critical Features

1. **Source Range Tracking**: Every block must know its exact character positions in source
2. **Stable IDs**: Generate consistent block IDs that survive edits (hash-based)
3. **Round-trip Fidelity**: `parseMarkdown(serializeBlocks(parseMarkdown(text))) === text` (modulo whitespace)
4. **Custom Syntax Support**: 
   - Callouts: `> [!NOTE]` or `> 💡 Note:` styles
   - Toggles: `<details><summary>Title</summary>content</details>`
5. **Incremental Updates**: Given a text edit, update affected block ranges

## Test Requirements

### Unit Tests (use vitest or jest)
- Round-trip tests for each block type
- Property tests: random Markdown documents maintain fidelity
- Source range accuracy tests
- Edge cases: nested lists, mixed content, malformed syntax
- Custom syntax: toggles and callouts

### Test Files to Create
```
tests/
  parser.test.ts        # Basic parsing functionality
  serializer.test.ts    # Serialization + round-trips  
  ranges.test.ts        # Source range tracking
  blocks/               # One test file per block type
    headings.test.ts
    lists.test.ts
    tables.test.ts
    callouts.test.ts
    toggles.test.ts
  fixtures/             # Sample markdown files
    complex-doc.md
    nested-lists.md
    callouts-examples.md
```

## Package Structure
```
packages/md-mapper/
  src/
    index.ts           # Main exports
    parser.ts          # Markdown → blocks
    serializer.ts      # Blocks → markdown
    blocks/            # Block type definitions
    ranges.ts          # Source range utilities
    ids.ts             # Stable ID generation
  tests/
  package.json
  tsconfig.json
  README.md
```

## Success Criteria
- [ ] All block types parse and serialize correctly
- [ ] Source ranges are accurate within ±1 character
- [ ] Round-trip tests pass for 100+ random documents
- [ ] Performance: Parse 10MB document in <1 second
- [ ] Zero VS Code or UI dependencies
- [ ] Comprehensive test suite with >90% coverage

## Example Usage
```typescript
import { parseMarkdown, serializeBlocks } from '@slashmd/md-mapper';

const markdown = `# Hello
- [ ] Task 1
- [x] Task 2

> [!TIP]  
> This is a callout`;

const blocks = parseMarkdown(markdown);
console.log(blocks[0].type); // 'heading'
console.log(blocks[1].type); // 'taskList'
console.log(blocks[2].type); // 'callout'

const roundTrip = serializeBlocks(blocks);
// roundTrip should match original markdown
```

## What You DON'T Need to Worry About
- VS Code extension APIs
- React components or UI
- Lexical editor integration  
- WebView messaging
- Image file handling (just parse the markdown link)

## Interface Contracts (Other chunks depend on these)
Your exports will be imported by the Integration chunk. Keep the API surface stable and well-typed.

Focus solely on bullet-proof Markdown processing with perfect fidelity!