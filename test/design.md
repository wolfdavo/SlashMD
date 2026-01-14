# Design Decisions

This document covers design decisions for SlashMD.

## Goals

- **Simplicity**: Keep markdown files as plain markdown
- **WYSIWYG**: Notion-like editing experience
- **Compatibility**: Work in VS Code and Cursor

## Key Decisions

### Block-Based Editing

We use Lexical as the editor framework because it supports:
- Block-level nodes
- Rich text formatting
- Custom node types

### Wiki-Links

Wiki-links (`[[page]]` syntax) are supported for:
- Quick linking between documents
- Foam/Obsidian compatibility
- Cmd+click navigation

## See Also

- [[architecture]] for system overview
- [[notes]] for quick notes
