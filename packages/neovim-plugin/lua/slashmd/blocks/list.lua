-- SlashMD List Block Renderer
-- Handles bullet lists, numbered lists, and todo lists

local M = {}

local config = require("slashmd.config")
local state = require("slashmd.state")

local ns = state.namespace

--- Render a bullet list item
---@param bufnr number Buffer number
---@param block table List block
---@param opts table|nil Render options
function M.render_bullet(bufnr, block, opts)
  opts = opts or {}

  local bullet = config.get_icon("bullet")
  local line = vim.api.nvim_buf_get_lines(bufnr, block.start_line, block.start_line + 1, false)[1]

  if not line then
    return
  end

  -- Find the bullet marker and indentation
  local indent, marker_end = line:match("^(%s*)[%-*+]%s()")
  if not marker_end then
    return
  end

  local indent_level = #(indent or "")

  -- Conceal the original marker
  vim.api.nvim_buf_set_extmark(bufnr, ns, block.start_line, indent_level, {
    end_col = marker_end - 1,
    conceal = "",
    priority = 100,
  })

  -- Add styled bullet with proper indentation
  local indent_str = string.rep(" ", indent_level)
  vim.api.nvim_buf_set_extmark(bufnr, ns, block.start_line, indent_level, {
    virt_text = { { bullet .. " ", "SlashMDBullet" } },
    virt_text_pos = "inline",
    priority = 100,
  })
end

--- Render a numbered list item
---@param bufnr number Buffer number
---@param block table List block
---@param opts table|nil Render options
function M.render_numbered(bufnr, block, opts)
  opts = opts or {}

  local line = vim.api.nvim_buf_get_lines(bufnr, block.start_line, block.start_line + 1, false)[1]

  if not line then
    return
  end

  -- Find the number marker
  local indent, number, marker_end = line:match("^(%s*)(%d+)[.)]%s()")
  if not marker_end then
    return
  end

  local indent_level = #(indent or "")

  -- Highlight the number (keep it visible but styled)
  vim.api.nvim_buf_set_extmark(bufnr, ns, block.start_line, indent_level, {
    end_col = marker_end - 1,
    hl_group = "SlashMDNumberedList",
    priority = 100,
  })
end

--- Render a todo list item
---@param bufnr number Buffer number
---@param block table Todo block
---@param opts table|nil Render options
function M.render_todo(bufnr, block, opts)
  opts = opts or {}

  local checked = block.checked
  local checkbox_icon = checked and config.get_icon("checkbox_checked") or config.get_icon("checkbox_unchecked")
  local checkbox_hl = checked and "SlashMDTodoCheckbox" or "SlashMDTodoCheckboxEmpty"
  local text_hl = checked and "SlashMDTodoChecked" or "SlashMDTodoUnchecked"

  local line = vim.api.nvim_buf_get_lines(bufnr, block.start_line, block.start_line + 1, false)[1]

  if not line then
    return
  end

  -- Find the checkbox marker
  local indent, marker_end = line:match("^(%s*)[%-*+]%s*%[[ xX]%]%s()")
  if not marker_end then
    return
  end

  local indent_level = #(indent or "")

  -- Conceal the original marker (- [ ] or - [x])
  vim.api.nvim_buf_set_extmark(bufnr, ns, block.start_line, indent_level, {
    end_col = marker_end - 1,
    conceal = "",
    priority = 100,
  })

  -- Add styled checkbox
  vim.api.nvim_buf_set_extmark(bufnr, ns, block.start_line, indent_level, {
    virt_text = { { checkbox_icon .. " ", checkbox_hl } },
    virt_text_pos = "inline",
    priority = 100,
  })

  -- Apply text styling (strikethrough for checked items)
  vim.api.nvim_buf_set_extmark(bufnr, ns, block.start_line, marker_end - 1, {
    end_row = block.start_line,
    end_col = #line,
    hl_group = text_hl,
    priority = 50,
  })
end

--- Main render function that dispatches to appropriate renderer
---@param bufnr number Buffer number
---@param block table List block
---@param opts table|nil Render options
function M.render(bufnr, block, opts)
  local block_type = block.type

  if block_type == "bullet_list" then
    M.render_bullet(bufnr, block, opts)
  elseif block_type == "numbered_list" then
    M.render_numbered(bufnr, block, opts)
  elseif block_type == "todo_list" then
    M.render_todo(bufnr, block, opts)
  end
end

--- Toggle checkbox state
---@param bufnr number Buffer number
---@param line_num number 0-indexed line number
---@return boolean|nil New checked state
function M.toggle_checkbox(bufnr, line_num)
  local line = vim.api.nvim_buf_get_lines(bufnr, line_num, line_num + 1, false)[1]

  if not line then
    return nil
  end

  local new_line, new_checked
  if line:match("%[%s%]") then
    new_line = line:gsub("%[%s%]", "[x]", 1)
    new_checked = true
  elseif line:match("%[[xX]%]") then
    new_line = line:gsub("%[[xX]%]", "[ ]", 1)
    new_checked = false
  else
    return nil
  end

  vim.api.nvim_buf_set_lines(bufnr, line_num, line_num + 1, false, { new_line })
  return new_checked
end

--- Create a bullet list
---@param items string[] List items
---@return string[] Lines to insert
function M.create_bullet(items)
  local lines = {}
  for _, item in ipairs(items) do
    table.insert(lines, "- " .. item)
  end
  return lines
end

--- Create a numbered list
---@param items string[] List items
---@return string[] Lines to insert
function M.create_numbered(items)
  local lines = {}
  for i, item in ipairs(items) do
    table.insert(lines, i .. ". " .. item)
  end
  return lines
end

--- Create a todo list
---@param items table[] List items with {text, checked} fields
---@return string[] Lines to insert
function M.create_todo(items)
  local lines = {}
  for _, item in ipairs(items) do
    local checkbox = item.checked and "[x]" or "[ ]"
    table.insert(lines, "- " .. checkbox .. " " .. item.text)
  end
  return lines
end

--- Convert list to different type
---@param bufnr number Buffer number
---@param block table List block
---@param target_type string Target list type
function M.convert_list_type(bufnr, block, target_type)
  local line = vim.api.nvim_buf_get_lines(bufnr, block.start_line, block.start_line + 1, false)[1]

  if not line then
    return
  end

  -- Extract content
  local indent, content
  if block.type == "bullet_list" then
    indent, content = line:match("^(%s*)[%-*+]%s+(.*)$")
  elseif block.type == "numbered_list" then
    indent, content = line:match("^(%s*)%d+[.)]%s+(.*)$")
  elseif block.type == "todo_list" then
    indent, content = line:match("^(%s*)[%-*+]%s*%[[ xX]%]%s+(.*)$")
  end

  if not content then
    return
  end

  indent = indent or ""

  -- Create new line based on target type
  local new_line
  if target_type == "bullet_list" then
    new_line = indent .. "- " .. content
  elseif target_type == "numbered_list" then
    new_line = indent .. "1. " .. content
  elseif target_type == "todo_list" then
    new_line = indent .. "- [ ] " .. content
  else
    return
  end

  vim.api.nvim_buf_set_lines(bufnr, block.start_line, block.start_line + 1, false, { new_line })
end

--- Indent a list item
---@param bufnr number Buffer number
---@param line_num number 0-indexed line number
function M.indent(bufnr, line_num)
  local line = vim.api.nvim_buf_get_lines(bufnr, line_num, line_num + 1, false)[1]
  if line then
    vim.api.nvim_buf_set_lines(bufnr, line_num, line_num + 1, false, { "  " .. line })
  end
end

--- Outdent a list item
---@param bufnr number Buffer number
---@param line_num number 0-indexed line number
function M.outdent(bufnr, line_num)
  local line = vim.api.nvim_buf_get_lines(bufnr, line_num, line_num + 1, false)[1]
  if line then
    local new_line = line:gsub("^  ", "")
    vim.api.nvim_buf_set_lines(bufnr, line_num, line_num + 1, false, { new_line })
  end
end

return M
