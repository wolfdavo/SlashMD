# Architecture

This document describes the architecture of SlashMD.

## Overview

SlashMD is a VS Code/Cursor extension that provides a Notion-style WYSIWYG editor for Markdown files.

## Components

1. **Extension Host** - Node.js code that runs in VS Code
2. **Webview UI** - React app with Lexical editor
3. **Shared Types** - TypeScript types shared between packages

## Related

- See [[design]] for design decisions
- See [[notes]] for quick notes
- Back to [[comprehensive-test|Comprehensive Test]]
