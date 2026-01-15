# SlashMD for Neo-Vim: Implementation Plan

> A Notion-style block-based Markdown editor for Neo-Vim

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Core Components](#core-components)
- [Feature Mapping](#feature-mapping)
- [Rendering Examples](#rendering-examples)
- [Directory Structure](#directory-structure)
- [Configuration API](#configuration-api)
- [Implementation Phases](#implementation-phases)
- [Technical Decisions](#technical-decisions)
- [Risks and Mitigations](#risks-and-mitigations)

---

## Overview

SlashMD's core value proposition is transforming plain Markdown into a Notion-style block-based WYSIWYG experience while keeping files as standard `.md`. For Neo-Vim, we create a similar experience adapted to the terminal environment, leveraging Neo-Vim's modern features.

### What SlashMD (VS Code) Does

| Component | How It Works |
|-----------|--------------|
| **Architecture** | VS Code extension + React/Lexical webview, communicating via postMessage |
| **Parsing** | Markdown → MDAST (AST) → Lexical nodes (bidirectional) |
| **Block Types** | Paragraphs, headings, lists, code blocks, tables, callouts, toggles, images, horizontal rules |
| **Key Features** | Slash menu (`/` commands), drag handles, floating toolbar, markdown shortcuts |
| **Data Flow** | All edits converted back to plain Markdown with minimal diffs |

### Goals for Neo-Vim

1. **Visual clarity** - Headings, callouts, code blocks rendered beautifully
2. **Block-aware editing** - Navigate and manipulate by block, not line
3. **Notion-style commands** - Slash menu for quick block insertion
4. **Pure markdown** - No sidecars, files remain standard `.md`
5. **Vim-native** - Respects modal editing, integrates with existing workflows

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Neo-Vim                                 │
├─────────────────────────────────────────────────────────────────┤
│  ┌───────────────────┐    ┌───────────────────────────────┐    │
│  │   Markdown Buffer │◄──►│   SlashMD View Buffer         │    │
│  │   (hidden/source) │    │   (rendered, interactive)     │    │
│  └───────────────────┘    └───────────────────────────────┘    │
│            ▲                           ▲                        │
│            │                           │                        │
│            ▼                           ▼                        │
│  ┌───────────────────┐    ┌───────────────────────────────┐    │
│  │   Parser Module   │    │   Renderer Module             │    │
│  │   (tree-sitter    │    │   (extmarks, virtual text,    │    │
│  │    or lua parser) │    │    conceal, highlights)       │    │
│  └───────────────────┘    └───────────────────────────────┘    │
│            │                           │                        │
│            └───────────┬───────────────┘                        │
│                        ▼                                        │
│           ┌─────────────────────────┐                          │
│           │   Block State Manager   │                          │
│           │   (Lua tables/AST)      │                          │
│           └─────────────────────────┘                          │
└─────────────────────────────────────────────────────────────────┘
```

### Why Lua?

Neo-Vim's Lua API provides:
- Better performance than Vimscript
- Access to `vim.api`, `vim.treesitter`, `vim.lsp`
- Native table/object structures for AST
- Async capabilities via `vim.loop`
- Integration with tree-sitter for parsing

---

## Core Components

### 1. Parser Module

**Recommended:** Tree-sitter markdown parser (mature, handles GFM)

```lua
-- Using tree-sitter
local parser = vim.treesitter.get_parser(bufnr, "markdown")
local tree = parser:parse()[1]
local root = tree:root()
```

### 2. Block State Manager

Central AST representation similar to Lexical's node tree:

```lua
-- Block types (mirroring SlashMD)
local BlockType = {
  PARAGRAPH = "paragraph",
  HEADING = "heading",
  CODE_BLOCK = "code_block",
  BULLET_LIST = "bullet_list",
  NUMBERED_LIST = "numbered_list",
  TODO_LIST = "todo_list",
  BLOCKQUOTE = "blockquote",
  CALLOUT = "callout",       -- > [!NOTE]
  TOGGLE = "toggle",         -- <details>
  TABLE = "table",
  IMAGE = "image",
  HORIZONTAL_RULE = "hr",
}

-- Block structure
local Block = {
  id = "uuid",
  type = BlockType.HEADING,
  depth = 2,               -- for headings
  content = "Hello",
  children = {},           -- nested blocks
  collapsed = false,       -- for toggles
  language = "lua",        -- for code blocks
  checked = false,         -- for todos
  source_range = {1, 5},   -- lines in source markdown
}
```

### 3. Renderer Module

Neo-Vim rendering mechanisms:

| Mechanism | Use Case |
|-----------|----------|
| **Extmarks** | Virtual text, highlights, signs |
| **Conceal** | Hide markdown syntax (`*bold*` → **bold**) |
| **Virtual lines** | Insert rendered lines between real lines |
| **Floating windows** | Menus, tooltips, image previews |
| **Highlights** | Syntax coloring via `nvim_buf_add_highlight` |

**Rendering Example:**

```lua
-- Render a heading with icon and color
vim.api.nvim_buf_set_extmark(bufnr, ns_id, line, 0, {
  virt_text = {{"󰉫 ", "SlashMDHeadingIcon"}},  -- nerd font icon
  virt_text_pos = "inline",
  hl_group = "SlashMDHeading1",
  priority = 100,
})
```

### 4. Interaction Layer

**Slash Menu** - Floating window with fuzzy search:

```lua
-- Trigger on "/" at line start
vim.keymap.set("i", "/", function()
  if at_line_start() then
    show_slash_menu()
  else
    return "/"
  end
end, { buffer = bufnr, expr = true })
```

**Block Navigation** - Custom motions:

```lua
-- Move between blocks with [b and ]b
vim.keymap.set("n", "]b", "<cmd>SlashMDNextBlock<cr>")
vim.keymap.set("n", "[b", "<cmd>SlashMDPrevBlock<cr>")
```

**Block Operations** - Leader mappings:

```lua
-- <leader>bd - Delete block
-- <leader>bm - Move block (enter move mode)
-- <leader>bt - Transform block type
-- <leader>bc - Toggle collapse (for toggles/callouts)
```

---

## Feature Mapping

### VS Code → Neo-Vim

| SlashMD Feature | Neo-Vim Equivalent |
|-----------------|-------------------|
| Floating toolbar | Which-key style popup or Telescope picker |
| Drag handles | Block move mode with `j`/`k` + confirm |
| Slash menu | Floating window + fuzzy filter (like Telescope) |
| Inline formatting | Conceal + highlights (hide `**`, show bold) |
| Code highlighting | Tree-sitter + native syntax |
| Callout blocks | Colored signs + virtual text icons |
| Toggle blocks | Fold-like collapse with custom rendering |
| Images | Kitty/iTerm2 graphics protocol OR ASCII placeholder |
| Tables | Render with box-drawing characters |

---

## Rendering Examples

### Headings

```
Source:                    Rendered:
# Hello World         →    󰉫  Hello World          (large, colored)
## Section            →    󰉬  Section              (medium, different color)
```

### Callouts

```
Source:                          Rendered:
> [!NOTE]                   →    ┃ 󰋽 Note
> This is important              ┃ This is important
                                 (blue background highlight)
```

### Code Blocks

```
Source:                          Rendered:
```lua                      →    ╭─ lua ─────────────────╮
local x = 1                      │ local x = 1           │
```                              ╰───────────────────────╯
```

### Toggles

```
Collapsed:                       Expanded:
▶ FAQ                       →    ▼ FAQ
                                   Answer content here...
```

### Todo Lists

```
Source:                          Rendered:
- [x] Done                  →    ☑ Done     (green)
- [ ] Pending                    ☐ Pending  (gray)
```

---

## Directory Structure

```
packages/neovim-plugin/
├── lua/
│   └── slashmd/
│       ├── init.lua           -- Plugin entry point
│       ├── config.lua         -- User configuration
│       ├── parser.lua         -- Tree-sitter integration
│       ├── state.lua          -- Block state manager
│       ├── renderer.lua       -- Extmark/virtual text rendering
│       ├── commands.lua       -- User commands
│       ├── keymaps.lua        -- Default keybindings
│       ├── slash_menu.lua     -- "/" command palette
│       ├── block_ops.lua      -- Block operations (move, delete, transform)
│       ├── highlights.lua     -- Highlight group definitions
│       ├── utils.lua          -- Helpers
│       └── blocks/
│           ├── heading.lua
│           ├── code.lua
│           ├── callout.lua
│           ├── toggle.lua
│           ├── table.lua
│           ├── image.lua
│           └── list.lua
├── queries/
│   └── markdown/
│       └── highlights.scm     -- Custom tree-sitter queries
├── doc/
│   └── slashmd.txt            -- Vim help documentation
├── plugin/
│   └── slashmd.lua            -- Auto-load setup
└── README.md
```

---

## Configuration API

```lua
require("slashmd").setup({
  -- Enable/disable features
  features = {
    slash_menu = true,
    block_navigation = true,
    conceal = true,
    icons = true,           -- requires nerd font
    images = "kitty",       -- "kitty", "iterm", "ascii", "none"
  },

  -- Appearance
  theme = {
    heading_colors = {
      h1 = "#FF6B6B",
      h2 = "#4ECDC4",
      h3 = "#45B7D1",
    },
    callout_colors = {
      note = "#61AFEF",
      tip = "#98C379",
      warning = "#E5C07B",
      important = "#C678DD",
      caution = "#E06C75",
    },
  },

  -- Keymaps
  keymaps = {
    next_block = "]b",
    prev_block = "[b",
    toggle_fold = "<Tab>",
    delete_block = "<leader>bd",
    move_block_up = "<leader>bk",
    move_block_down = "<leader>bj",
  },

  -- Assets
  assets = {
    folder = "assets",
    clipboard_paste = true,
  },
})
```

---

## Implementation Phases

### Phase 1: Foundation ✅
- [x] Plugin structure and configuration system
- [x] Tree-sitter markdown parsing integration
- [x] Basic block state representation
- [x] Simple rendering (headings, paragraphs with conceal)

### Phase 2: Core Blocks ✅
- [x] Code blocks with language labels
- [x] Lists (bullet, numbered, todo with checkboxes)
- [x] Blockquotes
- [x] Horizontal rules
- [x] Tables with box-drawing characters

### Phase 3: Rich Blocks ✅
- [x] Callout detection and rendering (`> [!NOTE]`)
- [x] Toggle/details blocks with collapse
- [x] Image placeholders (path display)

### Phase 4: Interactions ✅
- [x] Slash menu with floating window
- [x] Block navigation motions
- [x] Block move operations
- [x] Transform block type commands

### Phase 5: Advanced (In Progress)
- [x] Kitty/iTerm image protocol support (skeleton)
- [ ] Clipboard image paste
- [ ] Live preview sync
- [ ] LSP integration (completions, diagnostics)
- [ ] Inline formatting (bold, italic, strikethrough, links)

---

## Technical Decisions

| Decision | Recommendation | Rationale |
|----------|---------------|-----------|
| Parser | Tree-sitter markdown | Mature, fast, incremental parsing |
| Rendering mode | Same buffer with extmarks | Simpler than dual-buffer, better cursor sync |
| Menu system | Custom floating window | More control than Telescope dependency |
| Image support | Optional Kitty protocol | Works in modern terminals, graceful fallback |
| State sync | On CursorHold + TextChanged | Balance responsiveness vs performance |

---

## Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| Tree-sitter markdown edge cases | Fallback to regex for specific patterns |
| Performance on large files | Incremental rendering, visible range only |
| Terminal compatibility | Feature detection, graceful degradation |
| Cursor position mapping | Maintain source↔rendered line map |

---

## References

- [SlashMD VS Code Extension](../extension-host/) - Original implementation
- [Neo-Vim Lua API](https://neovim.io/doc/user/lua.html)
- [Tree-sitter Markdown](https://github.com/tree-sitter-grammars/tree-sitter-markdown)
- [Extmarks Documentation](https://neovim.io/doc/user/api.html#nvim_buf_set_extmark())
