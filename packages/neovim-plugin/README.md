# SlashMD for Neo-Vim

A Notion-style block-based Markdown editor for Neo-Vim. Transform your plain Markdown files into beautifully rendered, interactive documents.

![SlashMD Demo](https://placeholder.com/demo.gif)

## Features

- **Beautiful Block Rendering** - Headings, callouts, code blocks rendered with icons and colors
- **Slash Menu** - Type `/` at line start for quick block insertion (Notion-style)
- **Block Navigation** - Jump between blocks with `]b` and `[b`
- **Block Operations** - Move, delete, and transform blocks with keyboard shortcuts
- **Todo Checkboxes** - Interactive checkboxes with visual feedback
- **Callout Blocks** - GitHub-style callouts (`> [!NOTE]`, `> [!TIP]`, etc.)
- **Code Blocks** - Syntax highlighting with language labels and borders
- **Pure Markdown** - Files remain standard `.md`, no sidecars

## Requirements

- Neo-Vim 0.9.0+
- Tree-sitter markdown parser (recommended)
- Nerd Font (for icons)

## Installation

### lazy.nvim

```lua
{
    "slashmd/neovim-plugin",
    ft = { "markdown" },
    opts = {},
}
```

### packer.nvim

```lua
use {
    "slashmd/neovim-plugin",
    ft = { "markdown" },
    config = function()
        require("slashmd").setup()
    end,
}
```

## Configuration

```lua
require("slashmd").setup({
    auto_enable = true,

    features = {
        slash_menu = true,
        block_navigation = true,
        conceal = true,
        icons = true,
    },

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

    keymaps = {
        next_block = "]b",
        prev_block = "[b",
        toggle_fold = "<Tab>",
        delete_block = "<leader>bd",
        move_block_up = "<leader>bk",
        move_block_down = "<leader>bj",
    },
})
```

## Keymaps

| Key | Action |
|-----|--------|
| `]b` | Next block |
| `[b` | Previous block |
| `<Tab>` | Toggle fold/checkbox |
| `<leader>bd` | Delete block |
| `<leader>bk` | Move block up |
| `<leader>bj` | Move block down |
| `<leader>bt` | Transform block |
| `/` (insert, line start) | Open slash menu |

## Commands

- `:SlashMD` - Toggle SlashMD
- `:SlashMD enable` - Enable SlashMD
- `:SlashMD disable` - Disable SlashMD
- `:SlashMD refresh` - Re-render blocks

## Block Types

### Headings
```markdown
# Heading 1
## Heading 2
### Heading 3
```

### Callouts
```markdown
> [!NOTE]
> This is a note callout

> [!TIP]
> This is a tip callout

> [!WARNING]
> This is a warning callout
```

### Todo Lists
```markdown
- [ ] Unchecked item
- [x] Checked item
```

### Code Blocks
````markdown
```lua
local x = 1
print(x)
```
````

## License

MIT

## Related

- [SlashMD VS Code Extension](https://github.com/slashmd/vscode) - Original VS Code version
