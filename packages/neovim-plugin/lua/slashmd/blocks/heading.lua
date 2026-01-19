-- SlashMD Heading Block Renderer

local M = {}

local config = require("slashmd.config")
local highlights = require("slashmd.highlights")
local state = require("slashmd.state")

local ns = state.namespace

--- Render a heading block
---@param bufnr number Buffer number
---@param block table Heading block
---@param opts table|nil Render options
function M.render(bufnr, block, opts)
  opts = opts or {}

  local depth = block.depth or 1
  local text_hl, icon_hl = highlights.get_heading_hl(depth)

  -- Get the line content
  local line = vim.api.nvim_buf_get_lines(bufnr, block.start_line, block.start_line + 1, false)[1]
  if not line then
    return
  end

  -- Calculate where the # markers end
  local _, hash_end = line:find("^#+%s*")
  hash_end = hash_end or depth + 1

  -- Conceal the # markers and replace with a simple prefix
  -- Use box-drawing or simple markers that work in all fonts
  local prefix_chars = { "▍", "▎", "▏", "┃", "│", "╎" }
  local prefix = prefix_chars[depth] or "│"

  vim.api.nvim_buf_set_extmark(bufnr, ns, block.start_line, 0, {
    end_col = hash_end,
    conceal = "",
    priority = 100,
  })

  -- Add colored prefix marker
  vim.api.nvim_buf_set_extmark(bufnr, ns, block.start_line, 0, {
    virt_text = { { prefix .. " ", icon_hl } },
    virt_text_pos = "inline",
    priority = 100,
  })

  -- Apply heading highlight to entire line
  vim.api.nvim_buf_set_extmark(bufnr, ns, block.start_line, 0, {
    end_row = block.start_line,
    end_col = #line,
    hl_group = text_hl,
    priority = 50,
  })

  -- Add underline for h1 and h2 for visual weight
  if depth == 1 then
    local underline = string.rep("━", math.min(#line - hash_end + 2, 60))
    vim.api.nvim_buf_set_extmark(bufnr, ns, block.start_line, 0, {
      virt_lines = { { { underline, text_hl } } },
      virt_lines_above = false,
      priority = 100,
    })
  elseif depth == 2 then
    local underline = string.rep("─", math.min(#line - hash_end + 2, 50))
    vim.api.nvim_buf_set_extmark(bufnr, ns, block.start_line, 0, {
      virt_lines = { { { underline, text_hl } } },
      virt_lines_above = false,
      priority = 100,
    })
  end
end

--- Get the display text for a heading (without # markers)
---@param block table Heading block
---@return string
function M.get_display_text(block)
  return block.content or ""
end

--- Create a heading block from text
---@param text string Heading text
---@param depth number Heading depth (1-6)
---@return string[] Lines to insert
function M.create(text, depth)
  depth = math.max(1, math.min(6, depth or 1))
  local prefix = string.rep("#", depth) .. " "
  return { prefix .. text }
end

--- Convert a block to a heading
---@param content string Block content
---@param depth number Target heading depth
---@return string[] Lines
function M.from_content(content, depth)
  return M.create(content, depth)
end

--- Extract plain text from a heading
---@param lines string[] Heading lines
---@return string Plain text content
function M.to_content(lines)
  if #lines == 0 then
    return ""
  end
  return lines[1]:gsub("^#+%s*", "")
end

--- Cycle heading depth (h1 -> h2 -> h3 -> h1)
---@param bufnr number Buffer number
---@param block table Heading block
function M.cycle_depth(bufnr, block)
  local line = vim.api.nvim_buf_get_lines(bufnr, block.start_line, block.start_line + 1, false)[1]
  if not line then
    return
  end

  local current_depth = block.depth or 1
  local new_depth = (current_depth % 3) + 1 -- Cycle 1 -> 2 -> 3 -> 1

  local content = line:gsub("^#+%s*", "")
  local new_line = string.rep("#", new_depth) .. " " .. content

  vim.api.nvim_buf_set_lines(bufnr, block.start_line, block.start_line + 1, false, { new_line })
end

return M
