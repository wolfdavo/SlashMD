-- SlashMD Utility Functions

local M = {}

-- Simple counter for ID generation
local id_counter = 0

--- Generate a unique ID
---@return string Unique identifier
function M.generate_id()
  id_counter = id_counter + 1
  return string.format("slashmd_%d_%d", vim.loop.hrtime(), id_counter)
end

--- Check if cursor is at the start of a line
---@return boolean
function M.at_line_start()
  local col = vim.api.nvim_win_get_cursor(0)[2]
  local line = vim.api.nvim_get_current_line()
  local before_cursor = line:sub(1, col)
  return before_cursor:match("^%s*$") ~= nil
end

--- Get the current line content
---@return string
function M.get_current_line()
  return vim.api.nvim_get_current_line()
end

--- Get the current cursor position (0-indexed)
---@return number, number row, col
function M.get_cursor()
  local pos = vim.api.nvim_win_get_cursor(0)
  return pos[1] - 1, pos[2]
end

--- Set cursor position (0-indexed)
---@param row number 0-indexed row
---@param col number 0-indexed column
function M.set_cursor(row, col)
  vim.api.nvim_win_set_cursor(0, { row + 1, col })
end

--- Get visible line range in current window
---@return number, number start_line, end_line (0-indexed)
function M.get_visible_range()
  local win = vim.api.nvim_get_current_win()
  local start_line = vim.fn.line("w0") - 1
  local end_line = vim.fn.line("w$") - 1
  return start_line, end_line
end

--- Truncate string to max length with ellipsis
---@param str string Input string
---@param max_len number Maximum length
---@return string Truncated string
function M.truncate(str, max_len)
  if #str <= max_len then
    return str
  end
  return str:sub(1, max_len - 1) .. "…"
end

--- Pad string to specified length
---@param str string Input string
---@param len number Target length
---@param char string|nil Padding character (default space)
---@param align string|nil Alignment: "left", "right", "center" (default "left")
---@return string Padded string
function M.pad(str, len, char, align)
  char = char or " "
  align = align or "left"

  if #str >= len then
    return str
  end

  local padding = len - #str
  if align == "right" then
    return string.rep(char, padding) .. str
  elseif align == "center" then
    local left = math.floor(padding / 2)
    local right = padding - left
    return string.rep(char, left) .. str .. string.rep(char, right)
  else
    return str .. string.rep(char, padding)
  end
end

--- Create a box drawing border line
---@param width number Width of the box
---@param position string "top", "bottom", or "middle"
---@param label string|nil Optional label for top border
---@return string Border line
function M.box_line(width, position, label)
  local chars = {
    top_left = "╭",
    top_right = "╮",
    bottom_left = "╰",
    bottom_right = "╯",
    horizontal = "─",
    vertical = "│",
  }

  if position == "top" then
    if label and #label > 0 then
      local label_with_space = " " .. label .. " "
      local remaining = width - 2 - #label_with_space
      local right_pad = math.max(0, remaining)
      return chars.top_left
        .. chars.horizontal
        .. label_with_space
        .. string.rep(chars.horizontal, right_pad)
        .. chars.top_right
    else
      return chars.top_left .. string.rep(chars.horizontal, width - 2) .. chars.top_right
    end
  elseif position == "bottom" then
    return chars.bottom_left .. string.rep(chars.horizontal, width - 2) .. chars.bottom_right
  else
    return chars.vertical .. string.rep(" ", width - 2) .. chars.vertical
  end
end

--- Escape string for use in pattern
---@param str string Input string
---@return string Escaped string
function M.escape_pattern(str)
  return str:gsub("([%(%)%.%%%+%-%*%?%[%]%^%$])", "%%%1")
end

--- Deep copy a table
---@param t table Input table
---@return table Copied table
function M.deep_copy(t)
  if type(t) ~= "table" then
    return t
  end
  local copy = {}
  for k, v in pairs(t) do
    copy[k] = M.deep_copy(v)
  end
  return copy
end

--- Debounce a function
---@param fn function Function to debounce
---@param ms number Debounce delay in milliseconds
---@return function Debounced function
function M.debounce(fn, ms)
  local timer = nil
  return function(...)
    local args = { ... }
    if timer then
      timer:stop()
    end
    timer = vim.loop.new_timer()
    timer:start(
      ms,
      0,
      vim.schedule_wrap(function()
        fn(unpack(args))
      end)
    )
  end
end

--- Check if terminal supports Kitty graphics protocol
---@return boolean
function M.supports_kitty_graphics()
  local term = vim.env.TERM or ""
  local term_program = vim.env.TERM_PROGRAM or ""
  return term:match("kitty") ~= nil or term_program:match("kitty") ~= nil
end

--- Check if terminal supports iTerm2 inline images
---@return boolean
function M.supports_iterm_images()
  local term_program = vim.env.TERM_PROGRAM or ""
  return term_program:match("iTerm") ~= nil
end

--- Get terminal width
---@return number
function M.get_term_width()
  return vim.o.columns
end

--- Calculate display width of a string (accounting for wide chars)
---@param str string Input string
---@return number Display width
function M.display_width(str)
  return vim.fn.strdisplaywidth(str)
end

return M
