# Context Handoff: Chunk 4 - Integration & Sync Engine

## Mission
Connect the three independent chunks (Markdown Processor, Lexical Editor, VS Code Extension) into a cohesive SlashMD extension with bidirectional sync and precise text editing.

## Prerequisites (What you need from other chunks)
- **Chunk 1**: `@slashmd/md-mapper` with `parseMarkdown()`, `serializeBlocks()`, `updateBlocks()`
- **Chunk 2**: `@slashmd/webview-ui` with React components that work with Block data
- **Chunk 3**: `@slashmd/extension-host` with working CustomTextEditor and messaging infrastructure

## Scope (What you're integrating)
- Replace placeholder WebView content with real Lexical editor
- Wire Markdown processor to convert document text ↔ block data
- Implement sync engine for external document changes
- Create precise text edit system to avoid full document rewrites
- End-to-end testing and performance optimization

## Technical Requirements

### Integration Architecture
```
VS Code Document (TextDocument) 
         ↕ 
Extension Host (messaging bridge)
         ↕ 
WebView UI (Lexical editor)
         ↕
Block Data (unified interface)
         ↕
Markdown Processor (md-mapper)
```

### Core Integration Tasks

#### 1. Replace WebView Placeholder Content
**Current state**: Extension loads simple HTML placeholder
**Target state**: Extension loads full React + Lexical editor

```typescript
// In extension-host/src/webviewManager.ts
export class WebViewManager {
  
  setupWebView(webview: vscode.Webview, extensionUri: vscode.Uri): string {
    // Replace simple placeholder with built webview-ui bundle
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(extensionUri, 'dist', 'webview.js') // Built from Chunk 2
    );
    
    // Include CSS bundle
    const stylesUri = webview.asWebviewUri(
      vscode.Uri.joinPath(extensionUri, 'dist', 'webview.css')
    );
    
    return this.getHtmlContent(nonce, csp, scriptUri, stylesUri);
  }
}
```

#### 2. Document Initialization Flow
```typescript
// When custom editor opens a document:
// 1. Extension reads TextDocument.getText()
// 2. Calls md-mapper.parseMarkdown(text) → Block[]  
// 3. Sends DOC_INIT message to WebView with blocks
// 4. WebView initializes Lexical editor with block data

interface DocInitMessage {
  type: 'DOC_INIT';
  payload: {
    blocks: Block[];
    settings: Record<string, any>;
    theme: 'light' | 'dark';
  };
}
```

#### 3. Edit Flow (UI → Document)
```typescript
// User types in Lexical editor:
// 1. Lexical onChange → detect changed blocks
// 2. WebView computes minimal text edits from source ranges
// 3. Sends APPLY_TEXT_EDITS message to extension
// 4. Extension applies edits via WorkspaceEdit
// 5. VS Code updates document + triggers save

interface ApplyEditsMessage {
  type: 'APPLY_TEXT_EDITS';
  payload: {
    edits: TextEdit[];
    reason: 'typing' | 'drag' | 'paste' | 'format';
    affectedBlocks: string[]; // Block IDs for optimization
  };
}

interface TextEdit {
  startOffset: number;  // Character position in document
  endOffset: number;    // Character position in document  
  newText: string;      // Replacement text
}
```

#### 4. External Change Flow (Document → UI)
```typescript
// External edit (git pull, other editor):
// 1. VS Code fires onDidChangeTextDocument
// 2. Extension detects changes and affected ranges
// 3. Calls md-mapper.updateBlocks(oldBlocks, changeEvent) → Block[]
// 4. Sends DOC_CHANGED message to WebView
// 5. WebView updates Lexical editor state

interface DocChangedMessage {
  type: 'DOC_CHANGED';
  payload: {
    blocks: Block[];
    changeRanges: Array<{start: number, end: number}>;
    preserveSelection: boolean;
  };
}
```

#### 5. Sync Engine Implementation
```typescript
export class SyncEngine {
  
  private lastKnownBlocks: Block[] = [];
  private pendingEdits: TextEdit[] = [];
  
  // Convert block changes to minimal text edits
  computeTextEdits(oldBlocks: Block[], newBlocks: Block[]): TextEdit[] {
    const edits: TextEdit[] = [];
    
    // Algorithm:
    // 1. Find blocks that changed (content, order, nesting)
    // 2. Use source ranges to compute precise character offsets
    // 3. Generate minimal edits that preserve unchanged content
    // 4. Handle block reordering via move operations
    
    return edits;
  }
  
  // Handle external document changes
  handleExternalChange(
    document: vscode.TextDocument, 
    changeEvent: vscode.TextDocumentChangeEvent
  ): Block[] {
    // 1. Parse new document content
    const newBlocks = parseMarkdown(document.getText());
    
    // 2. Update internal state
    this.lastKnownBlocks = newBlocks;
    
    // 3. Return blocks for UI update
    return newBlocks;
  }
  
  // Prevent sync conflicts during user editing
  suppressExternalChanges(duration: number): void {
    // Temporarily ignore external changes to prevent sync conflicts
  }
}
```

### Performance Optimizations

#### 1. Incremental Parsing
```typescript
export class IncrementalParser {
  
  parseChangedRegions(
    document: vscode.TextDocument,
    changes: vscode.TextDocumentContentChangeEvent[],
    previousBlocks: Block[]
  ): Block[] {
    // Only reparse sections that actually changed
    // Preserve unchanged blocks with their source ranges
    // Update affected parent containers (lists, toggles)
  }
}
```

#### 2. Edit Coalescing
```typescript
export class EditCoalescer {
  
  private pendingEdits: TextEdit[] = [];
  private debounceTimer: NodeJS.Timeout | null = null;
  
  queueEdit(edit: TextEdit): void {
    this.pendingEdits.push(edit);
    
    // Debounce rapid edits (typing)
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    
    this.debounceTimer = setTimeout(() => {
      this.flushEdits();
    }, 50); // 50ms debounce
  }
  
  private flushEdits(): void {
    // Merge overlapping edits
    // Apply as single WorkspaceEdit
    // Clear pending queue
  }
}
```

### Asset Pipeline Integration
```typescript
// Connect Chunk 2's image paste with Chunk 3's asset service

// In WebView (Chunk 2):
const handleImagePaste = async (file: File) => {
  const dataUri = await fileToDataUri(file);
  
  // Send to extension host
  vscode.postMessage({
    type: 'WRITE_ASSET',
    payload: { dataUri, suggestedName: file.name }
  });
};

// In Extension Host (Chunk 3):  
const handleAssetWrite = async (payload: any) => {
  const relPath = await assetService.writeAsset(
    payload.dataUri,
    payload.suggestedName,
    document.uri
  );
  
  // Send back to WebView
  webview.postMessage({
    type: 'ASSET_WRITTEN', 
    payload: { relPath }
  });
};
```

### Error Handling & Recovery
```typescript
export class SyncErrorHandler {
  
  handleSyncConflict(error: SyncConflictError): void {
    // Show user notification with recovery options:
    // 1. Reload from file (lose WebView changes)
    // 2. Overwrite file (lose external changes)  
    // 3. Open in text editor for manual merge
  }
  
  handleParseError(error: ParseError): void {
    // Graceful degradation:
    // 1. Show error in WebView
    // 2. Offer "Open as Raw Markdown" fallback
    // 3. Log details for debugging
  }
}
```

### Integration Test Suite
```typescript
// End-to-end tests covering the full integration
describe('SlashMD Integration', () => {
  
  test('Document initialization', async () => {
    // 1. Open .md file in SlashMD
    // 2. Verify WebView receives correct blocks
    // 3. Verify Lexical editor renders properly
  });
  
  test('Basic editing flow', async () => {
    // 1. Type text in editor
    // 2. Verify document updates  
    // 3. Verify file save works
    // 4. Verify undo/redo works
  });
  
  test('External change sync', async () => {
    // 1. Open file in SlashMD
    // 2. Edit same file in text editor
    // 3. Verify SlashMD updates automatically
    // 4. Verify no conflicts or data loss
  });
  
  test('Block operations', async () => {
    // 1. Drag reorder blocks
    // 2. Use slash menu to insert blocks
    // 3. Convert block types
    // 4. Verify Markdown output correctness
  });
  
  test('Asset pipeline', async () => {
    // 1. Paste image in editor
    // 2. Verify file written to assets folder
    // 3. Verify Markdown link inserted
    // 4. Verify image displays correctly
  });
});
```

### Build Pipeline Integration
```jsonc
// Root package.json scripts
{
  "scripts": {
    "build": "pnpm -r run build && npm run bundle-extension",
    "bundle-extension": "npm run copy-webview-dist && vsce package",
    "copy-webview-dist": "cp packages/webview-ui/dist/* packages/extension-host/media/",
    "dev": "pnpm -r --parallel run dev",
    "test:integration": "node scripts/run-integration-tests.js"
  }
}
```

### Success Criteria
- [ ] All three chunks work together seamlessly  
- [ ] Document ↔ blocks conversion is lossless
- [ ] External changes sync without data loss
- [ ] Text edits are minimal and precise  
- [ ] Performance meets requirements (<16ms typing latency)
- [ ] Asset pipeline works end-to-end
- [ ] Error handling gracefully recovers from conflicts
- [ ] Full test suite passes
- [ ] Extension packages and installs correctly

### Performance Targets
- **Document open time**: <500ms for files up to 1MB
- **Typing latency**: <16ms keystroke to UI update
- **External sync time**: <200ms for reasonable file sizes  
- **Memory usage**: <100MB total for extension + WebView
- **Parse/serialize time**: <100ms for 10k line documents

### Debugging & Development
- Add extensive logging for sync operations
- WebView dev tools for debugging editor state
- VS Code debugging for extension host
- Performance profiling tools
- Sync conflict simulation tools

This integration chunk is the most complex but brings everything together into a working SlashMD extension!