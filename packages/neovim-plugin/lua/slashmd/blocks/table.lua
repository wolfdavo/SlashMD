-- SlashMD Table Block Renderer
-- Renders markdown tables with box-drawing characters

local M = {}

local config = require("slashmd.config")
local state = require("slashmd.state")
local utils = require("slashmd.utils")

local ns = state.namespace

-- Box drawing characters
local box = {
  top_left = "┌",
  top_right = "┐",
  bottom_left = "└",
  bottom_right = "┘",
  horizontal = "─",
  vertical = "│",
  cross = "┼",
  top_t = "┬",
  bottom_t = "┴",
  left_t = "├",
  right_t = "┤",
}

--- Parse a table row into cells
---@param line string Table row line
---@return string[] Cells
local function parse_row(line)
  local cells = {}
  -- Remove leading/trailing pipes and split by |
  local content = line:gsub("^%s*|", ""):gsub("|%s*$", "")
  for cell in content:gmatch("([^|]+)") do
    table.insert(cells, vim.trim(cell))
  end
  return cells
end

--- Check if a row is a delimiter row (|---|---|)
---@param line string Table row line
---@return boolean
local function is_delimiter_row(line)
  return line:match("^%s*|?%s*:?%-+:?%s*|") ~= nil
end

--- Calculate column widths from table lines
---@param lines string[] Table lines
---@return number[] Column widths
local function calculate_column_widths(lines)
  local widths = {}

  for _, line in ipairs(lines) do
    if not is_delimiter_row(line) then
      local cells = parse_row(line)
      for i, cell in ipairs(cells) do
        local width = utils.display_width(cell)
        widths[i] = math.max(widths[i] or 0, width)
      end
    end
  end

  return widths
end

--- Render a table block
---@param bufnr number Buffer number
---@param block table Table block
---@param opts table|nil Render options
function M.render(bufnr, block, opts)
  opts = opts or {}

  local lines = vim.api.nvim_buf_get_lines(bufnr, block.start_line, block.end_line + 1, false)
  if #lines < 2 then
    return
  end

  local col_widths = calculate_column_widths(lines)
  local total_width = 1 -- Start with left border

  for _, w in ipairs(col_widths) do
    total_width = total_width + w + 3 -- cell content + padding + separator
  end

  -- Render each line
  for i, line in ipairs(lines) do
    local line_num = block.start_line + i - 1

    if is_delimiter_row(line) then
      -- Render delimiter row with box characters
      local border_parts = { { box.left_t, "SlashMDTableBorder" } }

      for j, width in ipairs(col_widths) do
        table.insert(border_parts, { string.rep(box.horizontal, width + 2), "SlashMDTableBorder" })
        if j < #col_widths then
          table.insert(border_parts, { box.cross, "SlashMDTableBorder" })
        end
      end

      table.insert(border_parts, { box.right_t, "SlashMDTableBorder" })

      vim.api.nvim_buf_set_extmark(bufnr, ns, line_num, 0, {
        virt_text = border_parts,
        virt_text_pos = "overlay",
        priority = 100,
      })

      -- Conceal original line
      vim.api.nvim_buf_set_extmark(bufnr, ns, line_num, 0, {
        end_col = #line,
        conceal = "",
        priority = 100,
      })
    else
      -- Render data row
      local cells = parse_row(line)
      local is_header = i == 1

      -- Build row with box characters
      local row_parts = { { box.vertical, "SlashMDTableBorder" } }

      for j, width in ipairs(col_widths) do
        local cell = cells[j] or ""
        local padded = utils.pad(cell, width)
        local hl = is_header and "SlashMDTableHeader" or "SlashMDTableCell"

        table.insert(row_parts, { " " .. padded .. " ", hl })
        table.insert(row_parts, { box.vertical, "SlashMDTableBorder" })
      end

      vim.api.nvim_buf_set_extmark(bufnr, ns, line_num, 0, {
        virt_text = row_parts,
        virt_text_pos = "overlay",
        priority = 100,
      })

      -- Conceal original line
      vim.api.nvim_buf_set_extmark(bufnr, ns, line_num, 0, {
        end_col = #line,
        conceal = "",
        priority = 100,
      })
    end
  end

  -- Add top border
  if opts.top_border ~= false then
    local top_parts = { { box.top_left, "SlashMDTableBorder" } }
    for j, width in ipairs(col_widths) do
      table.insert(top_parts, { string.rep(box.horizontal, width + 2), "SlashMDTableBorder" })
      if j < #col_widths then
        table.insert(top_parts, { box.top_t, "SlashMDTableBorder" })
      end
    end
    table.insert(top_parts, { box.top_right, "SlashMDTableBorder" })

    vim.api.nvim_buf_set_extmark(bufnr, ns, block.start_line, 0, {
      virt_lines = { top_parts },
      virt_lines_above = true,
      priority = 100,
    })
  end

  -- Add bottom border
  if opts.bottom_border ~= false then
    local bottom_parts = { { box.bottom_left, "SlashMDTableBorder" } }
    for j, width in ipairs(col_widths) do
      table.insert(bottom_parts, { string.rep(box.horizontal, width + 2), "SlashMDTableBorder" })
      if j < #col_widths then
        table.insert(bottom_parts, { box.bottom_t, "SlashMDTableBorder" })
      end
    end
    table.insert(bottom_parts, { box.bottom_right, "SlashMDTableBorder" })

    vim.api.nvim_buf_set_extmark(bufnr, ns, block.end_line, 0, {
      virt_lines = { bottom_parts },
      virt_lines_above = false,
      priority = 100,
    })
  end
end

--- Create a table
---@param headers string[] Column headers
---@param rows string[][] Row data
---@return string[] Lines to insert
function M.create(headers, rows)
  local lines = {}

  -- Calculate column widths
  local widths = {}
  for i, header in ipairs(headers) do
    widths[i] = math.max(#header, 3)
  end

  for _, row in ipairs(rows) do
    for i, cell in ipairs(row) do
      widths[i] = math.max(widths[i] or 3, #cell)
    end
  end

  -- Build header row
  local header_cells = {}
  for i, header in ipairs(headers) do
    table.insert(header_cells, utils.pad(header, widths[i]))
  end
  table.insert(lines, "| " .. table.concat(header_cells, " | ") .. " |")

  -- Build delimiter row
  local delim_cells = {}
  for i, _ in ipairs(headers) do
    table.insert(delim_cells, string.rep("-", widths[i]))
  end
  table.insert(lines, "| " .. table.concat(delim_cells, " | ") .. " |")

  -- Build data rows
  for _, row in ipairs(rows) do
    local row_cells = {}
    for i, _ in ipairs(headers) do
      local cell = row[i] or ""
      table.insert(row_cells, utils.pad(cell, widths[i]))
    end
    table.insert(lines, "| " .. table.concat(row_cells, " | ") .. " |")
  end

  return lines
end

--- Create an empty table template
---@param cols number Number of columns
---@param rows number Number of data rows
---@return string[] Lines to insert
function M.create_empty(cols, rows)
  cols = cols or 3
  rows = rows or 1

  local headers = {}
  for i = 1, cols do
    table.insert(headers, "Column " .. i)
  end

  local data = {}
  for _ = 1, rows do
    local row = {}
    for _ = 1, cols do
      table.insert(row, "")
    end
    table.insert(data, row)
  end

  return M.create(headers, data)
end

--- Add a column to a table
---@param bufnr number Buffer number
---@param block table Table block
---@param header string Column header
function M.add_column(bufnr, block, header)
  local lines = vim.api.nvim_buf_get_lines(bufnr, block.start_line, block.end_line + 1, false)

  for i, line in ipairs(lines) do
    local new_cell
    if i == 1 then
      new_cell = header or "New"
    elseif is_delimiter_row(line) then
      new_cell = "---"
    else
      new_cell = ""
    end

    -- Insert before the final |
    lines[i] = line:gsub("|%s*$", " | " .. new_cell .. " |")
  end

  vim.api.nvim_buf_set_lines(bufnr, block.start_line, block.end_line + 1, false, lines)
end

--- Add a row to a table
---@param bufnr number Buffer number
---@param block table Table block
function M.add_row(bufnr, block)
  local header_line = vim.api.nvim_buf_get_lines(bufnr, block.start_line, block.start_line + 1, false)[1]
  local cells = parse_row(header_line)

  local new_row_cells = {}
  for _ = 1, #cells do
    table.insert(new_row_cells, "")
  end

  local new_row = "| " .. table.concat(new_row_cells, " | ") .. " |"
  vim.api.nvim_buf_set_lines(bufnr, block.end_line + 1, block.end_line + 1, false, { new_row })
end

-- Setup highlight groups for tables
vim.api.nvim_set_hl(0, "SlashMDTableBorder", { link = "Comment" })
vim.api.nvim_set_hl(0, "SlashMDTableHeader", { bold = true, fg = "#E5C07B" })
vim.api.nvim_set_hl(0, "SlashMDTableCell", { fg = "#ABB2BF" })

return M
