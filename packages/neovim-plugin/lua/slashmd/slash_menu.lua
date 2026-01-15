-- SlashMD Slash Menu Module
-- Notion-style command palette triggered by /

local M = {}

local config = require("slashmd.config")

-- Menu items
local menu_items = {
  {
    label = "Heading 1",
    icon = "󰉫",
    description = "Large section heading",
    action = "heading1",
    shortcut = "h1",
  },
  {
    label = "Heading 2",
    icon = "󰉬",
    description = "Medium section heading",
    action = "heading2",
    shortcut = "h2",
  },
  {
    label = "Heading 3",
    icon = "󰉭",
    description = "Small section heading",
    action = "heading3",
    shortcut = "h3",
  },
  {
    label = "Bullet List",
    icon = "•",
    description = "Create a simple bullet list",
    action = "bullet_list",
    shortcut = "ul",
  },
  {
    label = "Numbered List",
    icon = "1.",
    description = "Create a numbered list",
    action = "numbered_list",
    shortcut = "ol",
  },
  {
    label = "Todo List",
    icon = "☐",
    description = "Track tasks with checkboxes",
    action = "todo_list",
    shortcut = "todo",
  },
  {
    label = "Code Block",
    icon = "󰅩",
    description = "Add a code snippet",
    action = "code_block",
    shortcut = "code",
  },
  {
    label = "Quote",
    icon = "┃",
    description = "Capture a quote",
    action = "blockquote",
    shortcut = "quote",
  },
  {
    label = "Callout",
    icon = "󰋽",
    description = "Make information stand out",
    action = "callout",
    shortcut = "note",
  },
  {
    label = "Divider",
    icon = "─",
    description = "Visual separator",
    action = "horizontal_rule",
    shortcut = "hr",
  },
  {
    label = "Image",
    icon = "󰥶",
    description = "Insert an image",
    action = "image",
    shortcut = "img",
  },
  {
    label = "Table",
    icon = "󰓫",
    description = "Add a table",
    action = "table",
    shortcut = "table",
  },
}

-- Current menu state
local menu_state = {
  bufnr = nil,
  win = nil,
  buf = nil,
  items = {},
  selected = 1,
  filter = "",
  original_line = nil,
}

--- Filter menu items based on input
---@param filter string Filter string
---@return table[] Filtered items
local function filter_items(filter)
  if filter == "" then
    return menu_items
  end

  local filtered = {}
  local filter_lower = filter:lower()

  for _, item in ipairs(menu_items) do
    local label_lower = item.label:lower()
    local shortcut_lower = item.shortcut:lower()

    if label_lower:find(filter_lower, 1, true) or shortcut_lower:find(filter_lower, 1, true) then
      table.insert(filtered, item)
    end
  end

  return filtered
end

--- Render the menu content
local function render_menu()
  if not menu_state.buf or not vim.api.nvim_buf_is_valid(menu_state.buf) then
    return
  end

  local lines = {}
  local highlights = {}

  for i, item in ipairs(menu_state.items) do
    local prefix = i == menu_state.selected and "▶ " or "  "
    local icon = config.get().features.icons and (item.icon .. " ") or ""
    local line = prefix .. icon .. item.label

    table.insert(lines, line)

    -- Highlight selected line
    if i == menu_state.selected then
      table.insert(highlights, {
        line = i - 1,
        hl_group = "SlashMDMenuSelected",
      })
    end
  end

  -- Add description for selected item
  if menu_state.selected <= #menu_state.items then
    local selected = menu_state.items[menu_state.selected]
    table.insert(lines, "")
    table.insert(lines, "  " .. selected.description)
    table.insert(highlights, {
      line = #lines - 1,
      hl_group = "Comment",
    })
  end

  vim.api.nvim_buf_set_option(menu_state.buf, "modifiable", true)
  vim.api.nvim_buf_set_lines(menu_state.buf, 0, -1, false, lines)
  vim.api.nvim_buf_set_option(menu_state.buf, "modifiable", false)

  -- Apply highlights
  local ns = vim.api.nvim_create_namespace("slashmd_menu")
  vim.api.nvim_buf_clear_namespace(menu_state.buf, ns, 0, -1)

  for _, hl in ipairs(highlights) do
    vim.api.nvim_buf_add_highlight(menu_state.buf, ns, hl.hl_group, hl.line, 0, -1)
  end
end

--- Close the menu
local function close_menu()
  if menu_state.win and vim.api.nvim_win_is_valid(menu_state.win) then
    vim.api.nvim_win_close(menu_state.win, true)
  end

  if menu_state.buf and vim.api.nvim_buf_is_valid(menu_state.buf) then
    vim.api.nvim_buf_delete(menu_state.buf, { force = true })
  end

  menu_state.win = nil
  menu_state.buf = nil
  menu_state.items = {}
  menu_state.selected = 1
  menu_state.filter = ""
end

--- Execute the selected menu item
local function execute_selection()
  if menu_state.selected > #menu_state.items then
    close_menu()
    return
  end

  local item = menu_state.items[menu_state.selected]
  local bufnr = menu_state.bufnr
  local line = menu_state.original_line

  close_menu()

  -- Clear the / that triggered the menu
  if line then
    vim.api.nvim_buf_set_lines(bufnr, line, line + 1, false, { "" })
  end

  -- Insert the appropriate content
  M.insert_block(bufnr, item.action, line)
end

--- Insert block content
---@param bufnr number Buffer number
---@param action string Action type
---@param line number Line number
function M.insert_block(bufnr, action, line)
  local lines = {}
  local cursor_line = line
  local cursor_col = 0

  if action == "heading1" then
    lines = { "# " }
    cursor_col = 2
  elseif action == "heading2" then
    lines = { "## " }
    cursor_col = 3
  elseif action == "heading3" then
    lines = { "### " }
    cursor_col = 4
  elseif action == "bullet_list" then
    lines = { "- " }
    cursor_col = 2
  elseif action == "numbered_list" then
    lines = { "1. " }
    cursor_col = 3
  elseif action == "todo_list" then
    lines = { "- [ ] " }
    cursor_col = 6
  elseif action == "code_block" then
    lines = { "```", "", "```" }
    cursor_line = line + 1
    cursor_col = 0
  elseif action == "blockquote" then
    lines = { "> " }
    cursor_col = 2
  elseif action == "callout" then
    lines = { "> [!NOTE]", "> " }
    cursor_line = line + 1
    cursor_col = 2
  elseif action == "horizontal_rule" then
    lines = { "---", "" }
    cursor_line = line + 1
    cursor_col = 0
  elseif action == "image" then
    lines = { "![]()" }
    cursor_col = 4
  elseif action == "table" then
    lines = {
      "| Column 1 | Column 2 | Column 3 |",
      "|----------|----------|----------|",
      "|          |          |          |",
    }
    cursor_line = line + 2
    cursor_col = 2
  end

  vim.api.nvim_buf_set_lines(bufnr, line, line + 1, false, lines)
  vim.api.nvim_win_set_cursor(0, { cursor_line + 1, cursor_col })
  vim.cmd("startinsert")
end

--- Setup keymaps for the menu window
local function setup_menu_keymaps()
  local opts = { buffer = menu_state.buf, nowait = true }

  -- Navigation
  vim.keymap.set({ "n", "i" }, "<Down>", function()
    menu_state.selected = math.min(menu_state.selected + 1, #menu_state.items)
    render_menu()
  end, opts)

  vim.keymap.set({ "n", "i" }, "<Up>", function()
    menu_state.selected = math.max(menu_state.selected - 1, 1)
    render_menu()
  end, opts)

  vim.keymap.set({ "n", "i" }, "<C-n>", function()
    menu_state.selected = math.min(menu_state.selected + 1, #menu_state.items)
    render_menu()
  end, opts)

  vim.keymap.set({ "n", "i" }, "<C-p>", function()
    menu_state.selected = math.max(menu_state.selected - 1, 1)
    render_menu()
  end, opts)

  vim.keymap.set("n", "j", function()
    menu_state.selected = math.min(menu_state.selected + 1, #menu_state.items)
    render_menu()
  end, opts)

  vim.keymap.set("n", "k", function()
    menu_state.selected = math.max(menu_state.selected - 1, 1)
    render_menu()
  end, opts)

  -- Selection
  vim.keymap.set({ "n", "i" }, "<CR>", execute_selection, opts)
  vim.keymap.set({ "n", "i" }, "<Tab>", execute_selection, opts)

  -- Close
  vim.keymap.set({ "n", "i" }, "<Esc>", close_menu, opts)
  vim.keymap.set({ "n", "i" }, "<C-c>", close_menu, opts)
  vim.keymap.set("n", "q", close_menu, opts)

  -- Filtering (type to filter)
  vim.keymap.set("i", "<BS>", function()
    if #menu_state.filter > 0 then
      menu_state.filter = menu_state.filter:sub(1, -2)
      menu_state.items = filter_items(menu_state.filter)
      menu_state.selected = 1
      render_menu()
    end
    return ""
  end, { buffer = menu_state.buf, expr = true })
end

--- Show the slash menu
---@param bufnr number Buffer number
function M.show(bufnr)
  -- Close any existing menu
  close_menu()

  -- Store original position
  menu_state.bufnr = bufnr
  menu_state.original_line = vim.api.nvim_win_get_cursor(0)[1] - 1
  menu_state.filter = ""
  menu_state.items = menu_items
  menu_state.selected = 1

  -- Create menu buffer
  menu_state.buf = vim.api.nvim_create_buf(false, true)
  vim.api.nvim_buf_set_option(menu_state.buf, "bufhidden", "wipe")
  vim.api.nvim_buf_set_option(menu_state.buf, "buftype", "nofile")

  -- Calculate window size and position
  local width = 40
  local height = math.min(#menu_items + 3, 15)
  local row = vim.fn.winline()
  local col = vim.fn.wincol()

  -- Create floating window
  menu_state.win = vim.api.nvim_open_win(menu_state.buf, true, {
    relative = "cursor",
    row = 1,
    col = 0,
    width = width,
    height = height,
    style = "minimal",
    border = "rounded",
    title = " / Slash Commands ",
    title_pos = "center",
  })

  -- Set window options
  vim.api.nvim_win_set_option(menu_state.win, "cursorline", false)
  vim.api.nvim_win_set_option(menu_state.win, "winhl", "Normal:SlashMDMenuNormal,FloatBorder:SlashMDMenuBorder")

  -- Render initial content
  render_menu()

  -- Setup keymaps
  setup_menu_keymaps()

  -- Handle character input for filtering
  vim.api.nvim_create_autocmd("InsertCharPre", {
    buffer = menu_state.buf,
    callback = function()
      local char = vim.v.char
      if char:match("%w") then
        menu_state.filter = menu_state.filter .. char
        menu_state.items = filter_items(menu_state.filter)
        menu_state.selected = 1
        vim.schedule(render_menu)
      end
      -- Prevent the character from being inserted
      vim.v.char = ""
    end,
  })

  -- Start in insert mode for filtering
  vim.cmd("startinsert")
end

return M
