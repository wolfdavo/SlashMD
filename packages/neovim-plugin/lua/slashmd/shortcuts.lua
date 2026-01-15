-- SlashMD Shortcuts Module
-- Markdown editing shortcuts and auto-completion

local M = {}

local config = require("slashmd.config")

--- Get list continuation prefix for a line
---@param line string Current line content
---@return string|nil Prefix for next line
local function get_list_continuation(line)
  -- Bullet list (-, *, +)
  local indent, marker = line:match("^(%s*)([%-*+])%s")
  if marker then
    return indent .. marker .. " "
  end

  -- Numbered list
  local num_indent, num = line:match("^(%s*)(%d+)[.)]%s")
  if num then
    return num_indent .. tostring(tonumber(num) + 1) .. ". "
  end

  -- Todo list
  local todo_indent = line:match("^(%s*)[%-*+]%s*%[[ xX]%]%s")
  if todo_indent then
    return todo_indent .. "- [ ] "
  end

  -- Blockquote
  local quote_indent = line:match("^(%s*)>%s*")
  if quote_indent then
    return quote_indent .. "> "
  end

  return nil
end

--- Check if a line is an empty list item
---@param line string Line content
---@return boolean
local function is_empty_list_item(line)
  -- Empty bullet
  if line:match("^%s*[%-*+]%s*$") then
    return true
  end
  -- Empty numbered
  if line:match("^%s*%d+[.)]%s*$") then
    return true
  end
  -- Empty todo
  if line:match("^%s*[%-*+]%s*%[[ xX]%]%s*$") then
    return true
  end
  -- Empty quote
  if line:match("^%s*>%s*$") then
    return true
  end
  return false
end

--- Handle Enter key in insert mode
---@param bufnr number Buffer number
---@return string Key sequence to execute
function M.handle_enter(bufnr)
  local row = vim.api.nvim_win_get_cursor(0)[1]
  local line = vim.api.nvim_buf_get_lines(bufnr, row - 1, row, false)[1]

  if not line then
    return "<CR>"
  end

  -- If empty list item, remove it and exit list
  if is_empty_list_item(line) then
    vim.api.nvim_buf_set_lines(bufnr, row - 1, row, false, { "" })
    return ""
  end

  -- Get continuation prefix
  local prefix = get_list_continuation(line)
  if prefix then
    -- Insert new line with prefix
    vim.api.nvim_buf_set_lines(bufnr, row, row, false, { prefix })
    vim.api.nvim_win_set_cursor(0, { row + 1, #prefix })
    return ""
  end

  return "<CR>"
end

--- Handle Tab key for list indentation
---@param bufnr number Buffer number
---@return string Key sequence
function M.handle_tab(bufnr)
  local row = vim.api.nvim_win_get_cursor(0)[1]
  local line = vim.api.nvim_buf_get_lines(bufnr, row - 1, row, false)[1]

  if not line then
    return "<Tab>"
  end

  -- Check if we're in a list
  if line:match("^%s*[%-*+]%s") or line:match("^%s*%d+[.)]%s") then
    -- Indent the line
    vim.api.nvim_buf_set_lines(bufnr, row - 1, row, false, { "  " .. line })
    vim.api.nvim_win_set_cursor(0, { row, vim.api.nvim_win_get_cursor(0)[2] + 2 })
    return ""
  end

  return "<Tab>"
end

--- Handle Shift-Tab for list outdentation
---@param bufnr number Buffer number
---@return string Key sequence
function M.handle_shift_tab(bufnr)
  local row = vim.api.nvim_win_get_cursor(0)[1]
  local line = vim.api.nvim_buf_get_lines(bufnr, row - 1, row, false)[1]

  if not line then
    return "<S-Tab>"
  end

  -- Check if we're in an indented list
  if line:match("^  %s*[%-*+]%s") or line:match("^  %s*%d+[.)]%s") then
    -- Outdent the line
    local new_line = line:gsub("^  ", "")
    vim.api.nvim_buf_set_lines(bufnr, row - 1, row, false, { new_line })
    local new_col = math.max(0, vim.api.nvim_win_get_cursor(0)[2] - 2)
    vim.api.nvim_win_set_cursor(0, { row, new_col })
    return ""
  end

  return "<S-Tab>"
end

--- Handle Backspace at start of list item
---@param bufnr number Buffer number
---@return string Key sequence
function M.handle_backspace(bufnr)
  local row, col = unpack(vim.api.nvim_win_get_cursor(0))
  local line = vim.api.nvim_buf_get_lines(bufnr, row - 1, row, false)[1]

  if not line then
    return "<BS>"
  end

  -- Check if cursor is right after a list marker
  local patterns = {
    "^(%s*[%-*+]%s)$", -- Bullet with cursor at end
    "^(%s*%d+[.)]%s)$", -- Number with cursor at end
    "^(%s*[%-*+]%s*%[[ xX]%]%s)$", -- Todo with cursor at end
  }

  for _, pattern in ipairs(patterns) do
    local prefix = line:match(pattern)
    if prefix and col == #prefix then
      -- Remove the list marker, keep any indent
      local indent = line:match("^(%s*)")
      vim.api.nvim_buf_set_lines(bufnr, row - 1, row, false, { indent })
      vim.api.nvim_win_set_cursor(0, { row, #indent })
      return ""
    end
  end

  return "<BS>"
end

--- Auto-pair characters
---@param char string Character that was typed
---@param bufnr number Buffer number
---@return string Characters to insert
function M.auto_pair(char, bufnr)
  local pairs = {
    ["("] = "()",
    ["["] = "[]",
    ["{"] = "{}",
    ['"'] = '""',
    ["'"] = "''",
    ["`"] = "``",
    ["*"] = "**",
    ["_"] = "__",
    ["~"] = "~~",
  }

  local pair = pairs[char]
  if pair then
    -- Check if we should auto-pair (not at end of word for quotes)
    local col = vim.api.nvim_win_get_cursor(0)[2]
    local line = vim.api.nvim_get_current_line()
    local after = line:sub(col + 1, col + 1)

    -- Don't auto-pair if next char is alphanumeric
    if after:match("%w") then
      return char
    end

    -- For markdown formatting, only pair at word boundaries
    if char == "*" or char == "_" or char == "~" then
      local before = line:sub(col, col)
      if before:match("%w") then
        return char
      end
    end

    -- Insert pair and position cursor in middle
    return pair .. "<Left>"
  end

  return char
end

--- Setup shortcuts for a buffer
---@param bufnr number Buffer number
function M.setup(bufnr)
  local opts = { buffer = bufnr, expr = true, silent = true }

  -- Enter key for list continuation
  vim.keymap.set("i", "<CR>", function()
    return M.handle_enter(bufnr)
  end, vim.tbl_extend("force", opts, { desc = "SlashMD: Smart enter" }))

  -- Tab for indentation
  vim.keymap.set("i", "<Tab>", function()
    return M.handle_tab(bufnr)
  end, vim.tbl_extend("force", opts, { desc = "SlashMD: Smart tab" }))

  -- Shift-Tab for outdentation
  vim.keymap.set("i", "<S-Tab>", function()
    return M.handle_shift_tab(bufnr)
  end, vim.tbl_extend("force", opts, { desc = "SlashMD: Smart shift-tab" }))

  -- Backspace for list item removal
  vim.keymap.set("i", "<BS>", function()
    return M.handle_backspace(bufnr)
  end, vim.tbl_extend("force", opts, { desc = "SlashMD: Smart backspace" }))

  -- Auto-pairing for markdown formatting (optional)
  if config.get().features.auto_pairs then
    for _, char in ipairs({ "*", "_", "~", "`" }) do
      vim.keymap.set("i", char, function()
        return M.auto_pair(char, bufnr)
      end, opts)
    end
  end
end

--- Remove shortcuts from a buffer
---@param bufnr number Buffer number
function M.remove(bufnr)
  local keys = { "<CR>", "<Tab>", "<S-Tab>", "<BS>", "*", "_", "~", "`" }
  for _, key in ipairs(keys) do
    pcall(vim.keymap.del, "i", key, { buffer = bufnr })
  end
end

return M
