-- SlashMD Renderer Module
-- Renders blocks using modular block renderers

local M = {}

local state = require("slashmd.state")
local config = require("slashmd.config")
local parser = require("slashmd.parser")
local utils = require("slashmd.utils")

-- Import block renderers
local blocks = {
  heading = require("slashmd.blocks.heading"),
  code = require("slashmd.blocks.code"),
  list = require("slashmd.blocks.list"),
  callout = require("slashmd.blocks.callout"),
  table = require("slashmd.blocks.table"),
  image = require("slashmd.blocks.image"),
  toggle = require("slashmd.blocks.toggle"),
}

-- Import inline formatter
local inline = require("slashmd.inline")

local ns = state.namespace

--- Clear all rendering for a buffer
---@param bufnr number Buffer number
function M.clear(bufnr)
  vim.api.nvim_buf_clear_namespace(bufnr, ns, 0, -1)
end

--- Render all blocks for a buffer
---@param bufnr number Buffer number
---@param block_list table[] List of blocks
---@param opts table|nil Render options
function M.render(bufnr, block_list, opts)
  opts = opts or {}

  -- Clear existing marks
  M.clear(bufnr)

  -- Get visible range for optimized rendering
  local start_visible, end_visible
  if opts.visible_only then
    start_visible, end_visible = utils.get_visible_range()
  end

  -- Render each block
  for _, block in ipairs(block_list) do
    -- Skip blocks outside visible range if optimizing
    if opts.visible_only then
      if block.end_line < start_visible or block.start_line > end_visible then
        goto continue
      end
    end

    M.render_block(bufnr, block, opts)

    ::continue::
  end
end

--- Render a single block using the appropriate renderer
---@param bufnr number Buffer number
---@param block table Block to render
---@param opts table|nil Render options
function M.render_block(bufnr, block, opts)
  opts = opts or {}
  local block_type = block.type

  -- Dispatch to appropriate block renderer
  if block_type == parser.BlockType.HEADING then
    blocks.heading.render(bufnr, block, opts)
  elseif block_type == parser.BlockType.CODE_BLOCK then
    blocks.code.render(bufnr, block, opts)
  elseif block_type == parser.BlockType.BULLET_LIST then
    blocks.list.render_bullet(bufnr, block, opts)
    inline.render_block(bufnr, block, opts)
  elseif block_type == parser.BlockType.NUMBERED_LIST then
    blocks.list.render_numbered(bufnr, block, opts)
    inline.render_block(bufnr, block, opts)
  elseif block_type == parser.BlockType.TODO_LIST then
    blocks.list.render_todo(bufnr, block, opts)
  elseif block_type == parser.BlockType.BLOCKQUOTE then
    M.render_blockquote(bufnr, block, opts)
    inline.render_block(bufnr, block, opts)
  elseif block_type == parser.BlockType.CALLOUT then
    blocks.callout.render(bufnr, block, opts)
    inline.render_block(bufnr, block, opts)
  elseif block_type == parser.BlockType.THEMATIC_BREAK then
    M.render_horizontal_rule(bufnr, block, opts)
  elseif block_type == parser.BlockType.IMAGE then
    blocks.image.render(bufnr, block, opts)
  elseif block_type == parser.BlockType.TABLE then
    blocks.table.render(bufnr, block, opts)
  elseif block_type == parser.BlockType.TOGGLE then
    blocks.toggle.render(bufnr, block, opts)
  elseif block_type == parser.BlockType.PARAGRAPH then
    -- Paragraphs only need inline formatting
    inline.render_block(bufnr, block, opts)
  end
end

--- Render a blockquote (kept inline for simplicity)
---@param bufnr number Buffer number
---@param block table Blockquote block
---@param opts table|nil Render options
function M.render_blockquote(bufnr, block, opts)
  local quote_icon = config.get_icon("quote")

  for line = block.start_line, block.end_line do
    local line_text = vim.api.nvim_buf_get_lines(bufnr, line, line + 1, false)[1]
    if line_text then
      -- Find the > marker
      local marker_end = line_text:find("^>%s*") or 1
      if marker_end then
        -- Conceal the > marker
        vim.api.nvim_buf_set_extmark(bufnr, ns, line, 0, {
          end_col = marker_end,
          conceal = "",
          priority = 100,
        })

        -- Add styled border
        vim.api.nvim_buf_set_extmark(bufnr, ns, line, 0, {
          virt_text = { { quote_icon .. " ", "SlashMDBlockquoteBorder" } },
          virt_text_pos = "inline",
          priority = 100,
        })

        -- Italic text
        vim.api.nvim_buf_set_extmark(bufnr, ns, line, 0, {
          end_row = line + 1,
          hl_group = "SlashMDBlockquote",
          priority = 50,
        })
      end
    end
  end
end

--- Render a horizontal rule
---@param bufnr number Buffer number
---@param block table Horizontal rule block
---@param opts table|nil Render options
function M.render_horizontal_rule(bufnr, block, opts)
  local width = utils.get_term_width() - 4
  local rule_char = config.get_icon("horizontal_rule")
  local rule = string.rep(rule_char, width)

  -- Overlay the entire line
  vim.api.nvim_buf_set_extmark(bufnr, ns, block.start_line, 0, {
    virt_text = { { rule, "SlashMDHorizontalRule" } },
    virt_text_pos = "overlay",
    priority = 100,
  })

  -- Conceal the original
  local line = vim.api.nvim_buf_get_lines(bufnr, block.start_line, block.start_line + 1, false)[1]
  if line then
    vim.api.nvim_buf_set_extmark(bufnr, ns, block.start_line, 0, {
      end_col = #line,
      conceal = "",
      priority = 100,
    })
  end
end

--- Get block renderer by type
---@param block_type string Block type
---@return table|nil Block renderer module
function M.get_block_renderer(block_type)
  local type_map = {
    [parser.BlockType.HEADING] = blocks.heading,
    [parser.BlockType.CODE_BLOCK] = blocks.code,
    [parser.BlockType.BULLET_LIST] = blocks.list,
    [parser.BlockType.NUMBERED_LIST] = blocks.list,
    [parser.BlockType.TODO_LIST] = blocks.list,
    [parser.BlockType.CALLOUT] = blocks.callout,
    [parser.BlockType.TABLE] = blocks.table,
    [parser.BlockType.IMAGE] = blocks.image,
    [parser.BlockType.TOGGLE] = blocks.toggle,
  }
  return type_map[block_type]
end

--- Re-render a specific block
---@param bufnr number Buffer number
---@param block table Block to re-render
function M.refresh_block(bufnr, block)
  -- Clear extmarks for this block's lines
  for line = block.start_line, block.end_line do
    local marks = vim.api.nvim_buf_get_extmarks(bufnr, ns, { line, 0 }, { line, -1 }, {})
    for _, mark in ipairs(marks) do
      vim.api.nvim_buf_del_extmark(bufnr, ns, mark[1])
    end
  end

  -- Re-render the block
  M.render_block(bufnr, block)
end

return M
