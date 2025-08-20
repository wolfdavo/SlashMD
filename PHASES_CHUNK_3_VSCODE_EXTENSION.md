# Phase Breakdown: Chunk 3 - VS Code Extension Shell

## Overview of Phasing Strategy

The VS Code Extension Shell will be built in 4 focused phases, each building upon the previous one. This approach ensures:

- **Logical dependency flow**: Foundation → Security → Core Features → Advanced Features
- **Manageable scope**: Each phase can be completed in a single session without context overflow
- **Clear handoff points**: Each phase produces specific deliverables needed by the next
- **Incremental validation**: Extension functionality can be tested at each stage

The phases follow the natural VS Code extension development lifecycle, from basic registration through advanced features.

---

## Phase 1: Foundation & Extension Structure

### Scope
Establish the basic VS Code extension infrastructure and registration without any WebView content.

### Deliverables
- Complete package structure (`packages/extension-host/`)
- Configured `package.json` with all VS Code contribution points
- Basic `extension.ts` with activation and custom editor registration
- TypeScript configuration and build setup
- VS Code debug configuration (`.vscode/launch.json`)
- Placeholder for core classes (empty implementations)

### Dependencies
- None (foundation phase)

### Success Criteria
- Extension activates in VS Code when opening .md files
- Custom editor is registered and available in "Open With" menu
- No runtime errors during activation
- Extension can be debugged with F5 in VS Code
- TypeScript compiles without errors

### Key Files Created
```
packages/extension-host/
  src/
    extension.ts           # Main activation with basic registration
    types.ts              # Shared type definitions
  package.json            # Complete VS Code extension manifest
  tsconfig.json          # TypeScript configuration
  .vscode/launch.json    # Debug configuration
```

### What Next Phase Needs
- Working extension structure that activates
- Registered custom editor provider (empty implementation)
- TypeScript build pipeline
- Basic type definitions for messaging

---

## Phase 2: WebView Security & Messaging Foundation

### Scope
Implement secure WebView setup with Content Security Policy, nonce generation, and basic bi-directional messaging protocol.

### Deliverables
- `WebViewManager` class with complete security implementation
- CSP (Content Security Policy) configuration
- Cryptographic nonce generation
- HTML template with placeholder content
- Basic messaging protocol setup
- Message type definitions and handler structure

### Dependencies
- Phase 1: Extension structure and registration

### Success Criteria
- WebView loads with proper security headers (no CSP violations)
- Simple HTML placeholder displays correctly
- PostMessage communication works both ways (extension ↔ webview)
- Console shows no security warnings or errors
- Mock messages can be sent and received

### Key Files Created
```
src/
  webviewManager.ts      # WebView setup, CSP, HTML generation
  messageHandler.ts      # Message routing and protocol handling
media/
  webview.js            # Basic WebView-side messaging script
```

### What Next Phase Needs
- Secure WebView initialization
- Working bidirectional messaging
- Message protocol definitions
- HTML template ready for content

---

## Phase 3: Document Management & Text Editing

### Scope
Implement the core CustomTextEditorProvider functionality including document synchronization, text edits, and backup/restore.

### Deliverables
- Complete `CustomTextEditorProvider` implementation
- Document change detection and handling
- VS Code TextEdit application system
- Backup and restore for hot-exit functionality
- Document initialization and synchronization

### Dependencies
- Phase 2: WebView security and messaging foundation

### Success Criteria
- Opening .md files loads document content in WebView
- External document changes are reflected in WebView
- Text edits from WebView are applied to VS Code document
- File saves properly from WebView changes
- Hot-exit works (restore content after VS Code restart)

### Key Files Created
```
src/
  customEditor.ts       # CustomTextEditorProvider implementation
  documentManager.ts    # Document sync and change handling
```

### What Next Phase Needs
- Working document editing pipeline
- Stable text synchronization
- Backup/restore functionality
- Ready foundation for advanced features

---

## Phase 4: Commands, Settings & Asset Management

### Scope
Implement VS Code commands, configuration management, and asset handling (image paste/drag functionality).

### Deliverables
- Complete `AssetService` for image handling
- All VS Code commands (`openAsText`, `toggleDefault`, etc.)
- Settings integration and reactive configuration
- Asset folder management and file writing
- Final integration testing and packaging

### Dependencies
- Phase 3: Working document management and text editing

### Success Criteria
- "Open as Raw Markdown" command works from title bar
- Image paste/drag creates files in assets folder and inserts markdown links
- Settings panel is accessible and changes are reactive
- Extension packages successfully as .vsix
- All success criteria from context document are met

### Key Files Created
```
src/
  assetService.ts       # Image paste/drag and file management
  commands.ts           # VS Code command implementations
  settings.ts           # Configuration management
media/
  icon.png             # Extension icon
```

### What Next Phase (Chunk 4) Needs
- Fully functional VS Code extension shell
- Working WebView with messaging protocol
- Asset handling capability
- Settings system ready for editor integration
- Document management pipeline ready for Lexical editor

---

## Context Transfer Strategy

### Between Phases
Each phase will document:
- **API surface**: What classes/methods are exposed
- **Message contracts**: What messages the WebView expects/sends
- **Configuration schema**: What settings are available
- **File locations**: Where each component is implemented

### For Chunk 4 Integration
The final phase will provide:
- Complete messaging API documentation
- WebView HTML template with injection points
- Asset handling workflow
- Settings configuration interface
- VS Code integration patterns

This ensures the Lexical editor integration (Chunk 4) can proceed without needing to understand VS Code extension internals.