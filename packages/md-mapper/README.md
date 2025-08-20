# @slashmd/md-mapper

> Standalone Markdown to structured block conversion library with perfect fidelity and source range tracking

[![npm version](https://badge.fury.io/js/@slashmd%2Fmd-mapper.svg)](https://badge.fury.io/js/@slashmd%2Fmd-mapper)
[![TypeScript](https://badgen.net/badge/icon/typescript?icon=typescript&label)](https://typescriptlang.org)
[![Build Status](https://github.com/slashmd/md-mapper/workflows/CI/badge.svg)](https://github.com/slashmd/md-mapper/actions)
[![Coverage Status](https://coveralls.io/repos/github/slashmd/md-mapper/badge.svg?branch=main)](https://coveralls.io/github/slashmd/md-mapper?branch=main)

## Overview

`@slashmd/md-mapper` is a high-performance TypeScript library that converts between Markdown text and structured block data with perfect fidelity. It's designed specifically for the SlashMD ecosystem but can be used in any project that needs reliable Markdown processing with source range tracking.

### Key Features

- **Perfect Round-trip Fidelity**: `parseMarkdown(serializeBlocks(parseMarkdown(text))) === text`
- **Source Range Tracking**: Every block knows its exact position in the source document
- **Custom Syntax Support**: Callouts (`> [!NOTE]`), toggles (`<details>`), and more
- **Performance Optimized**: Parse 10MB documents in under 1 second
- **Zero UI Dependencies**: Pure Node.js library, no React/VS Code dependencies
- **Comprehensive Error Handling**: Graceful degradation and recovery strategies
- **TypeScript Native**: Full type safety with comprehensive interfaces

### Supported Block Types

- **Text Blocks**: Paragraphs, Headings (H1-H3)
- **Lists**: Ordered, Unordered, Task Lists with nesting
- **Rich Content**: Code blocks, Tables, Images, Links
- **Interactive**: Callouts, Toggles (collapsible sections)
- **Structure**: Dividers (horizontal rules), Blockquotes

## Installation

```bash
npm install @slashmd/md-mapper
```

## Quick Start

```typescript
import { parseMarkdown, serializeBlocks } from '@slashmd/md-mapper';

// Parse Markdown into structured blocks
const markdown = `# Hello World

This is a **paragraph** with *formatting*.

- [ ] Todo item
- [x] Completed item

> [!TIP]
> This is a callout!`;

const blocks = parseMarkdown(markdown);
console.log(blocks.length); // 3 blocks: heading, paragraph, taskList, callout

// Convert back to Markdown
const regenerated = serializeBlocks(blocks);
console.log(regenerated === markdown); // true (perfect fidelity)

// Access block properties
blocks.forEach(block => {
  console.log(`Block type: ${block.type}`);
  console.log(`Source range: ${block.sourceRange.start}-${block.sourceRange.end}`);
  console.log(`Content:`, block.content);
});
```

## Core API

### Parsing

```typescript
import { parseMarkdown } from '@slashmd/md-mapper';

// Basic parsing
const blocks = parseMarkdown(markdownText);

// With performance optimization for large documents
import { parseMarkdownOptimized } from '@slashmd/md-mapper';
const blocks = parseMarkdownOptimized(markdownText, {
  enableBatching: true,
  enableCaching: true
});

// Adaptive parsing (automatically chooses best strategy)
import { parseMarkdownAdaptive } from '@slashmd/md-mapper';
const blocks = parseMarkdownAdaptive(markdownText);
```

### Serialization

```typescript
import { serializeBlocks } from '@slashmd/md-mapper';

// Convert blocks back to Markdown
const markdown = serializeBlocks(blocks);

// Configure serialization style
import { configureSettings } from '@slashmd/md-mapper';
configureSettings({
  calloutsStyle: 'emoji', // or 'admonition'
  wrapWidth: 80
});
```

### Error Handling

```typescript
import { 
  safeParseMarkdown, 
  parseWithFallback,
  isParseError 
} from '@slashmd/md-mapper';

// Safe parsing without throwing
const result = safeParseMarkdown(markdown, { throwOnError: false });
if (result.error) {
  console.error('Parse failed:', result.error);
} else {
  console.log('Blocks:', result.blocks);
}

// Parsing with automatic recovery
try {
  const blocks = parseWithFallback(markdown, {
    enableRecovery: true,
    maxRetries: 2
  });
} catch (error) {
  if (isParseError(error)) {
    console.error('Parse error:', error.message);
  }
}
```

### Incremental Updates

```typescript
import { updateBlocks, textEditToDocumentChange } from '@slashmd/md-mapper';

// Update blocks after text changes
const originalBlocks = parseMarkdown(originalText);
const textEdit = { start: 10, end: 20, newText: 'updated content' };
const change = textEditToDocumentChange(textEdit);
const updatedBlocks = updateBlocks(originalBlocks, [change]);
```

## Block Structure

Every block follows this interface:

```typescript
interface Block {
  id: string;                    // Stable ID for UI binding
  type: BlockType;               // Block type identifier  
  sourceRange: SourceRange;      // Position in source document
  content: BlockContent;         // Type-specific content
  children?: Block[];            // Nested blocks (for lists, toggles)
}

interface SourceRange {
  start: number;  // Character offset from start of document
  end: number;    // Character offset from start of document
}
```

### Block Types

#### Text Blocks

```typescript
// Paragraph
{
  type: 'paragraph',
  content: {
    text: 'This is a paragraph with **bold** text.',
    formatting: [{ start: 22, end: 28, type: 'bold' }]
  }
}

// Heading
{
  type: 'heading',
  content: {
    level: 1, // 1, 2, or 3
    text: 'Chapter Title',
    formatting: []
  }
}
```

#### Lists

```typescript
// Ordered/Unordered List
{
  type: 'list',
  content: {
    ordered: true,
    startNumber: 1
  },
  children: [
    {
      type: 'listItem',
      content: {
        text: 'First item',
        indent: 0,
        formatting: []
      }
    }
  ]
}

// Task List
{
  type: 'taskList',
  content: {},
  children: [
    {
      type: 'taskItem',
      content: {
        checked: true,
        text: 'Completed task',
        indent: 0,
        formatting: []
      }
    }
  ]
}
```

#### Rich Content

```typescript
// Code Block
{
  type: 'code',
  content: {
    language: 'typescript',
    code: 'const x = 1;',
    showLineNumbers: false
  }
}

// Table
{
  type: 'table',
  content: {
    headers: [
      { text: 'Name', formatting: [] },
      { text: 'Value', formatting: [] }
    ],
    rows: [
      [
        { text: 'Item 1', formatting: [] },
        { text: '42', formatting: [] }
      ]
    ],
    alignments: ['left', 'right']
  }
}

// Image
{
  type: 'image',
  content: {
    src: './image.png',
    alt: 'Description',
    title: 'Optional title'
  }
}
```

#### Interactive Blocks

```typescript
// Callout
{
  type: 'callout',
  content: {
    type: 'tip', // 'note' | 'tip' | 'warning' | 'danger' | 'info'
    title: 'Pro Tip',
    text: 'This is helpful information.',
    formatting: []
  }
}

// Toggle
{
  type: 'toggle',
  content: {
    summary: 'Click to expand',
    collapsed: false
  },
  children: [
    // Nested blocks inside the toggle
  ]
}
```

## Configuration

### Settings

```typescript
import { configureSettings, getSettings } from '@slashmd/md-mapper';

// Configure parser behavior
configureSettings({
  calloutsStyle: 'admonition',  // 'admonition' | 'emoji'
  togglesSyntax: 'details',     // 'details' | 'list' (future)
  wrapWidth: 0,                 // Line wrap width (0 = no wrap)
  preserveFormatting: true      // Maintain original structure
});

// Get current settings
const settings = getSettings();
console.log(settings);
```

### Custom Syntax

#### Callouts

The library supports two callout styles:

**Admonition Style** (default):
```markdown
> [!NOTE]
> This is a note callout

> [!TIP] Optional Title
> This is a tip with a custom title

> [!WARNING]
> This is a warning

> [!DANGER]
> This is dangerous

> [!INFO]
> This is informational
```

**Emoji Style**:
```markdown
> 📝 Note:
> This is a note callout

> 💡 Tip:
> This is a tip callout

> ⚠️ Warning:
> This is a warning

> 🚨 Danger:
> This is dangerous

> ℹ️ Info:
> This is informational
```

#### Toggles

Toggles use HTML `<details>` elements:

```markdown
<details>
<summary>Click to expand</summary>

This content is collapsible.

- It can contain
- Multiple blocks
- Including lists

```code
And code blocks
```

</details>
```

## Performance

The library is optimized for high performance:

- **Small documents** (< 50KB): < 10ms parsing
- **Medium documents** (< 1MB): < 100ms parsing  
- **Large documents** (< 10MB): < 1 second parsing
- **Memory efficient**: Minimal memory footprint with cleanup
- **Streaming support**: For extremely large documents

### Performance Optimization

```typescript
import { 
  parseMarkdownOptimized,
  PerformanceMonitor,
  benchmarkParsing 
} from '@slashmd/md-mapper';

// Use optimized parser for large documents
const blocks = parseMarkdownOptimized(largeMarkdown, {
  enableBatching: true,      // Split large docs into chunks
  enableCaching: true,       // Cache parsed results
  enableMonitoring: false,   // Disable perf monitoring overhead
  maxChunkSize: 100000       // 100KB chunks
});

// Monitor performance
const monitor = PerformanceMonitor.getInstance();
const blocks = parseMarkdown(markdown);
const metrics = monitor.getMetrics();
console.log('Parse time:', metrics.parseMarkdown?.avgTime);

// Benchmark different parsing strategies
const results = await benchmarkParsing(markdown);
console.log('Standard:', results.standard.time);
console.log('Optimized:', results.optimized.time);
console.log('Adaptive:', results.adaptive.time);
```

## Error Handling

The library provides comprehensive error handling:

### Error Types

```typescript
import { 
  MarkdownProcessingError,
  InvalidInputError,
  ParseError,
  SerializationError,
  ValidationError 
} from '@slashmd/md-mapper';

try {
  const blocks = parseMarkdown(invalidMarkdown);
} catch (error) {
  if (error instanceof InvalidInputError) {
    console.error('Invalid input:', error.message);
  } else if (error instanceof ParseError) {
    console.error('Parse failed:', error.message);
  } else if (error instanceof ValidationError) {
    console.error('Validation failed:', error.message);
  }
}
```

### Recovery Strategies

```typescript
import { RECOVERY_STRATEGIES } from '@slashmd/md-mapper';

// Fix common markdown issues
const fixed = RECOVERY_STRATEGIES.fixCommonIssues(malformedMarkdown);

// Split large documents for processing
const chunks = RECOVERY_STRATEGIES.chunkDocument(hugeMarkdown, 1024 * 1024);
```

## Advanced Usage

### Custom Block Processing

```typescript
import { parseMarkdown } from '@slashmd/md-mapper';

const blocks = parseMarkdown(markdown);

// Filter specific block types
const headings = blocks.filter(block => block.type === 'heading');
const codeBlocks = blocks.filter(block => block.type === 'code');

// Process nested structures
function walkBlocks(blocks: Block[], callback: (block: Block) => void) {
  blocks.forEach(block => {
    callback(block);
    if (block.children) {
      walkBlocks(block.children, callback);
    }
  });
}

// Extract all text content
function extractText(blocks: Block[]): string {
  const texts: string[] = [];
  walkBlocks(blocks, (block) => {
    if ('text' in block.content) {
      texts.push(block.content.text);
    }
  });
  return texts.join(' ');
}
```

### Source Range Operations

```typescript
import { 
  createSourceRange,
  containsRange,
  rangesOverlap,
  adjustRangeAfterEdit 
} from '@slashmd/md-mapper';

// Create a source range
const range = createSourceRange({ start: 10, end: 50 });

// Check if ranges overlap
const overlaps = rangesOverlap(range1, range2);

// Adjust ranges after text edits
const edit = { start: 20, end: 30, newText: 'replacement' };
const adjustedRange = adjustRangeAfterEdit(range, edit);
```

### Stable ID Management

```typescript
import { generateBlockId, assignBlockIds } from '@slashmd/md-mapper';

// Generate consistent IDs
const id1 = generateBlockId('heading', 'Chapter 1', 0, 100);
const id2 = generateBlockId('heading', 'Chapter 1', 0, 100);
console.log(id1 === id2); // true - same content produces same ID

// Assign IDs to blocks
const blocksWithIds = assignBlockIds(blocks, originalMarkdown);
```

## Integration Examples

### With React

```typescript
import { parseMarkdown, serializeBlocks } from '@slashmd/md-mapper';
import { useState, useCallback } from 'react';

function MarkdownEditor() {
  const [markdown, setMarkdown] = useState('# Hello\n\nWorld');
  const [blocks, setBlocks] = useState(() => parseMarkdown(markdown));

  const updateBlocks = useCallback((newBlocks: Block[]) => {
    setBlocks(newBlocks);
    setMarkdown(serializeBlocks(newBlocks));
  }, []);

  return (
    <div>
      <textarea 
        value={markdown}
        onChange={(e) => {
          setMarkdown(e.target.value);
          setBlocks(parseMarkdown(e.target.value));
        }}
      />
      <BlockEditor blocks={blocks} onChange={updateBlocks} />
    </div>
  );
}
```

### With Node.js File Processing

```typescript
import { parseMarkdown, serializeBlocks } from '@slashmd/md-mapper';
import { promises as fs } from 'fs';

async function processMarkdownFile(filePath: string) {
  const markdown = await fs.readFile(filePath, 'utf8');
  const blocks = parseMarkdown(markdown);
  
  // Process blocks (e.g., extract headings for TOC)
  const headings = blocks
    .filter(block => block.type === 'heading')
    .map(block => ({
      level: block.content.level,
      text: block.content.text,
      id: block.id
    }));
  
  // Generate processed markdown
  const processedMarkdown = serializeBlocks(blocks);
  await fs.writeFile(filePath, processedMarkdown);
  
  return { blocks, headings };
}
```

## Testing

The library includes comprehensive testing utilities:

```typescript
import { 
  parseMarkdown, 
  serializeBlocks,
  benchmarkParsing 
} from '@slashmd/md-mapper';

// Property-based testing
function testRoundTripFidelity(markdown: string) {
  const blocks = parseMarkdown(markdown);
  const regenerated = serializeBlocks(blocks);
  const reBlocks = parseMarkdown(regenerated);
  
  // Should maintain block structure
  expect(reBlocks.length).toBe(blocks.length);
  expect(serializeBlocks(reBlocks)).toBe(regenerated);
}

// Performance testing
async function testPerformance(markdown: string) {
  const results = await benchmarkParsing(markdown);
  expect(results.adaptive.time).toBeLessThan(1000); // < 1s for large docs
}
```

## Troubleshooting

### Common Issues

**Performance**: For large documents, use `parseMarkdownAdaptive()` which automatically chooses the best parsing strategy.

**Memory**: The library includes automatic cleanup. For extremely large documents, consider processing in chunks.

**Round-trip Fidelity**: While the library maintains perfect fidelity for well-formed markdown, malformed syntax may be normalized during parsing.

**Custom Syntax**: Make sure to configure the appropriate settings for callouts and toggles.

### Debug Mode

```typescript
import { PerformanceMonitor } from '@slashmd/md-mapper';

const monitor = PerformanceMonitor.getInstance();
const blocks = parseMarkdown(markdown);
const metrics = monitor.getMetrics();

console.log('Performance metrics:', metrics);
```

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## License

MIT © [SlashMD](https://github.com/slashmd)

## Changelog

### v0.4.0 (Latest)
- ✅ Performance optimizations for 10MB documents (<1s parsing)
- ✅ Comprehensive error handling and recovery strategies  
- ✅ Property-based testing with 100+ random documents
- ✅ Enhanced caching and memory optimization
- ✅ Streaming parser for extremely large documents

### v0.3.0
- ✅ Custom syntax support (callouts and toggles)
- ✅ Configurable settings system
- ✅ Incremental updates with `updateBlocks()`
- ✅ Enhanced stable ID generation

### v0.2.0
- ✅ All standard Markdown block types
- ✅ Complex nested structures (lists, tables)
- ✅ Task list support with GFM syntax
- ✅ Round-trip fidelity testing

### v0.1.0
- ✅ Basic parsing and serialization
- ✅ Source range tracking
- ✅ Core block types (paragraphs, headings, dividers)
- ✅ TypeScript foundation

---

**Built with ❤️ for the SlashMD ecosystem**