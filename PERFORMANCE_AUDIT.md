# SlashMD Performance Audit

**Date**: November 28, 2025
**Auditor**: Claude Code
**Scope**: Full codebase performance analysis

---

## Executive Summary

This audit identified **20 performance issues** across the SlashMD VS Code extension. The most critical finding is that the **entire document is transmitted on every keystroke**, creating a significant bottleneck for large files. Other major issues include O(n) tree traversals, DOM layout thrashing, and event handler memory churn.

### Issue Distribution

| Severity | Count |
|----------|-------|
| Critical | 1 |
| High | 5 |
| Medium | 8 |
| Low | 4 |

---

## Critical Issues

### 1. Full Document Sent on Every Keystroke

**Location**: `packages/webview-ui/src/app/App.tsx` (lines 58-67)

**Problem**: Despite a comment stating "Calculate diff and send minimal edits", the implementation sends the entire document content on every keystroke by using `Number.MAX_SAFE_INTEGER` as the end range.

```typescript
vscode.postMessage({
  type: "APPLY_TEXT_EDITS",
  edits: [
    {
      start: 0,
      end: Number.MAX_SAFE_INTEGER,  // Replaces entire document
      text: markdown,
    },
  ],
});
```

**Impact**: For a 50KB document, approximately 50KB is transmitted across the IPC bridge per keystroke. At typical typing speeds (5-10 keystrokes/second), this creates 250-500KB/second of unnecessary data transfer.

**Recommendation**: Implement proper diff calculation using a library like `diff-match-patch` or track Lexical's granular change events to send only modified ranges.

---

## High Severity Issues

### 2. O(n) Tree Traversal on Every Keystroke

**Location**: `packages/webview-ui/src/app/mapper/lexicalToMdast.ts` (lines 53-69)

**Problem**: The `exportLexicalToMdast` function traverses the entire Lexical editor state on every content change triggered by `OnChangePlugin`. This is an O(n) operation where n is the number of nodes in the document.

**Impact**: Performance degrades linearly with document size. Documents with 1000+ nodes will experience noticeable input lag.

**Recommendation**: Consider implementing incremental updates by tracking which nodes have changed, or debouncing the export operation.

---

### 3. CodeBlockPlugin Layout Thrashing

**Location**: `packages/webview-ui/src/app/editor/CodeBlockPlugin.tsx` (lines 178-276)

**Problem**: On every editor update, this plugin:
1. Recursively walks the tree to find all code blocks
2. Calls `getBoundingClientRect()` on each code block element
3. Contains duplicate `findCodeNodes` functions (lines 188-199 and 232-243)

```typescript
// This runs on every editor update
const findCodeNodes = (node: LexicalNode): CodeNode[] => {
  // Recursive traversal...
};
// Then for each node:
element.getBoundingClientRect(); // Forces layout recalculation
```

**Impact**: For a document with 100 code blocks, 100 synchronous layout calculations occur per editor change, causing layout thrashing and visible jank.

**Recommendation**:
- Deduplicate the `findCodeNodes` function
- Batch DOM reads using `requestAnimationFrame`
- Cache element positions and invalidate only when necessary
- Debounce the update listener (current 200ms setTimeout is applied too late)

---

### 4. DragHandlePlugin Event Handler Churn

**Location**: `packages/webview-ui/src/app/editor/DragHandlePlugin.tsx` (lines 123-254)

**Problem**: Event handlers (`handleMouseMove`, `handleDragOver`, `handleDrop`, `handleDragLeave`) are recreated and re-attached on every render because they depend on `isDragging` in the useEffect dependency array.

```typescript
useEffect(() => {
  // Event handlers defined here capture isDragging
  const handleMouseMove = (e: MouseEvent) => { /* uses isDragging */ };

  document.addEventListener("mousemove", handleMouseMove);
  // ...
  return () => {
    document.removeEventListener("mousemove", handleMouseMove);
  };
}, [isDragging, /* other deps */]); // Re-runs when isDragging changes
```

**Impact**: Constant event listener attachment/detachment causes memory churn and potential timing issues where events are missed during the swap.

**Recommendation**: Use refs to access current state values instead of including them in dependencies, or use event delegation with a single stable handler.

---

### 5. External Changes Send Full Document

**Location**: `packages/extension-host/src/customEditor.ts` (lines 165-180)

**Problem**: When external file changes are detected, the full document text is sent to the webview via `document.getText()` instead of sending only the changed portion.

```typescript
webviewPanel.webview.postMessage({
  type: "DOC_CHANGED",
  text: document.getText(), // Sends entire document
});
```

**Impact**: External edits (e.g., from git operations or other editors) trigger large IPC messages, causing lag proportional to file size.

**Recommendation**: Use the `contentChanges` array from the document change event to send only modified ranges.

---

### 6. No Bundle Code Splitting

**Location**: `packages/webview-ui/esbuild.config.mjs` (lines 13-30)

**Problem**: The entire Lexical ecosystem and all dependencies are bundled as a single IIFE with:
- No code splitting
- No tree-shaking optimization
- No minification in watch mode

**Impact**: The webview bundle is approximately 500KB+ unminified, increasing initial load time and memory usage for every editor instance.

**Recommendation**:
- Enable minification in all builds
- Consider dynamic imports for less-common features
- Evaluate tree-shaking opportunities

---

## Medium Severity Issues

### 7. ExternalUpdatePlugin Unnecessary Re-parsing

**Location**: `packages/webview-ui/src/app/editor/Editor.tsx` (lines 168-190)

**Problem**: Uses a simplistic 500ms timestamp comparison to detect echo-back from internal changes. When an external change is detected, the entire markdown is re-parsed and re-imported even if the content is identical to the current state.

**Recommendation**: Compare content hashes before triggering a full re-import.

---

### 8. Toolbar State Updates Not Batched

**Location**: `packages/webview-ui/src/app/editor/Toolbar.tsx` (lines 24-76)

**Problem**: Multiple sequential `setState` calls occur on every selection change:
- `setIsBold`
- `setIsItalic`
- `setIsStrikethrough`
- `setIsCode`
- `setIsLink`
- `setShowToolbar`
- `setToolbarPosition`

Additionally, the `updateToolbar` callback lacks `useCallback` memoization, causing the `SELECTION_CHANGE_COMMAND` handler to be re-registered.

**Recommendation**: Consolidate into a single state object or use `useReducer`. Memoize the callback with `useCallback`.

---

### 9. SlashMenu Closures Recreated

**Location**: `packages/webview-ui/src/app/editor/SlashMenu.tsx` (lines 43-329)

**Problem**: The `blockOptions` memo depends on `[editor]`, which changes frequently in Lexical. All 15+ block option `onSelect` closures are recreated each time.

**Recommendation**: Extract `onSelect` handlers or use a more stable dependency pattern.

---

### 10. SlashMenuPlugin Position Updates Unthrottled

**Location**: `packages/webview-ui/src/app/editor/SlashMenuPlugin.tsx` (lines 30-126)

**Problem**: The update listener calculates DOM rects and calls `setMenuState` on every editor update without debouncing or position comparison.

**Recommendation**: Add position comparison to skip updates when coordinates haven't changed, or debounce the position calculation.

---

### 11. ImageComponent Resize Listener Churn

**Location**: `packages/webview-ui/src/app/editor/nodes/ImageComponent.tsx` (lines 91-136)

**Problem**: Mousemove and mouseup listeners are re-attached on every state change during resize operations. The dependency array includes `isResizing`, `currentWidth`, `naturalWidth`, `naturalHeight`, causing the effect to run on every pixel of drag movement.

**Recommendation**: Use refs to access current dimensions, keeping the effect stable during resize.

---

### 12. Eager Prism Language Loading

**Location**: `packages/webview-ui/src/index.tsx` (lines 7-32)

**Problem**: All 24 Prism language components are eagerly imported at startup:
- typescript, jsx, tsx, python, java, c, cpp, csharp
- go, rust, ruby, php, swift, kotlin, scss, json
- yaml, markdown, sql, bash, powershell, docker, graphql

**Impact**: Bundle includes all languages even if the user only writes JavaScript. Increases parse and compile time.

**Recommendation**: Implement lazy loading based on languages actually used in the document, or allow user configuration of enabled languages.

---

### 13. BlockClickPlugin DOM Operations

**Location**: `packages/webview-ui/src/app/editor/BlockClickPlugin.tsx` (lines 48-88)

**Problem**: Expensive DOM operations (`findBlockAtY`, `getBoundingClientRect`) execute on every mousedown event within the editor.

**Recommendation**: Consider throttling or caching block positions.

---

### 14. Synchronous Webview HTML Assignment

**Location**: `packages/extension-host/src/customEditor.ts` (lines 71-73)

**Problem**: Setting `webviewPanel.webview.html` is a blocking operation that parses and compiles the entire HTML/JS bundle synchronously in `resolveCustomTextEditor`. A 100ms setTimeout on line 200 works around this but doesn't address the root cause.

**Recommendation**: Consider progressive loading or showing a loading state while the bundle initializes.

---

## Low Severity Issues

### 15. preprocessDetailsBlocks Regex Overhead

**Location**: `packages/webview-ui/src/app/mapper/mdastToLexical.ts` (lines 80-153)

**Problem**: Regex matching runs on every HTML node to detect toggle/details blocks, even for nodes that clearly aren't details elements.

**Recommendation**: Add early-exit conditions (e.g., check for `<details` prefix before running regex).

---

### 16. Asset Deduplication Double-Read

**Location**: `packages/extension-host/src/assetService.ts` (lines 43-65)

**Problem**: When checking for duplicate files, entire file contents are read into memory for comparison.

**Recommendation**: Compare file sizes first, then fall back to content comparison only for size matches.

---

### 17. Message Handlers Set Unbounded Growth

**Location**: `packages/webview-ui/src/messaging.ts` (lines 43-60)

**Problem**: The `messageHandlers` Set could grow unbounded in hot-reload scenarios if handlers are added multiple times without proper cleanup.

**Recommendation**: Add safeguards against duplicate handler registration.

---

### 18. CSS Not Minified

**Location**: `packages/webview-ui/esbuild.config.mjs` (lines 32-37)

**Problem**: CSS is copied as-is without minification or dead code elimination.

**Recommendation**: Add CSS minification to the build pipeline.

---

## Recommended Prioritization

### Phase 1: Critical Path (Highest Impact)
1. **Issue #1**: Implement diff-based messaging
2. **Issue #3**: Fix CodeBlockPlugin layout thrashing
3. **Issue #2**: Optimize or debounce tree traversal

### Phase 2: Memory & Event Handling
4. **Issue #4**: Fix DragHandlePlugin event patterns
5. **Issue #8**: Batch Toolbar state updates
6. **Issue #11**: Fix ImageComponent resize handlers

### Phase 3: Bundle & Loading
7. **Issue #6**: Add code splitting and minification
8. **Issue #12**: Lazy-load Prism languages
9. **Issue #14**: Improve webview initialization

### Phase 4: Polish
10. Remaining medium and low severity issues

---

## Appendix: Testing Recommendations

To validate performance improvements:

1. **Large Document Test**: Create a 10,000+ line markdown file and measure:
   - Time to open editor
   - Input latency while typing
   - Memory usage over time

2. **Code Block Stress Test**: Document with 100+ code blocks, measure scroll performance

3. **External Edit Test**: Modify file externally while editor is open, measure update latency

4. **Memory Profiling**: Use Chrome DevTools in webview to identify memory leaks during extended sessions
