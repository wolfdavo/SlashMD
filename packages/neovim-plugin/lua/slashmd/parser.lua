-- SlashMD Parser Module
-- Parses markdown into block structures using tree-sitter

local M = {}

local utils = require("slashmd.utils")

---@class SlashMDBlock
---@field id string Unique block identifier
---@field type string Block type (heading, paragraph, code_block, etc.)
---@field content string Text content of the block
---@field children SlashMDBlock[] Child blocks
---@field start_line number 0-indexed start line in source
---@field end_line number 0-indexed end line in source
---@field depth number|nil Heading depth (1-6) or list indent
---@field language string|nil Code block language
---@field checked boolean|nil Todo item checked state
---@field collapsed boolean|nil Toggle collapsed state
---@field callout_type string|nil Callout type (note, tip, warning, etc.)

-- Block types matching SlashMD VS Code
M.BlockType = {
  PARAGRAPH = "paragraph",
  HEADING = "heading",
  CODE_BLOCK = "code_block",
  BULLET_LIST = "bullet_list",
  NUMBERED_LIST = "numbered_list",
  TODO_LIST = "todo_list",
  BLOCKQUOTE = "blockquote",
  CALLOUT = "callout",
  TOGGLE = "toggle",
  TABLE = "table",
  IMAGE = "image",
  HORIZONTAL_RULE = "hr",
  THEMATIC_BREAK = "thematic_break",
}

-- Tree-sitter node type to block type mapping
local node_type_map = {
  atx_heading = M.BlockType.HEADING,
  setext_heading = M.BlockType.HEADING,
  paragraph = M.BlockType.PARAGRAPH,
  fenced_code_block = M.BlockType.CODE_BLOCK,
  indented_code_block = M.BlockType.CODE_BLOCK,
  list = function(node, bufnr)
    -- Check first list item to determine type
    for child in node:iter_children() do
      if child:type() == "list_item" then
        local marker = child:child(0)
        if marker then
          local marker_type = marker:type()
          if marker_type == "list_marker_minus" or marker_type == "list_marker_plus" or marker_type == "list_marker_star" then
            -- Check for task list
            local text = vim.treesitter.get_node_text(child, bufnr)
            if text:match("^%s*[%-%*%+]%s*%[[ xX]%]") then
              return M.BlockType.TODO_LIST
            end
            return M.BlockType.BULLET_LIST
          elseif marker_type == "list_marker_dot" or marker_type == "list_marker_parenthesis" then
            return M.BlockType.NUMBERED_LIST
          end
        end
      end
    end
    return M.BlockType.BULLET_LIST
  end,
  block_quote = function(node, bufnr)
    -- Check if it's a callout (> [!NOTE], > [!TIP], etc.)
    local text = vim.treesitter.get_node_text(node, bufnr)
    local callout_match = text:match("^>%s*%[!(%w+)%]")
    if callout_match then
      return M.BlockType.CALLOUT
    end
    return M.BlockType.BLOCKQUOTE
  end,
  thematic_break = M.BlockType.THEMATIC_BREAK,
  pipe_table = M.BlockType.TABLE,
  html_block = function(node, bufnr)
    local text = vim.treesitter.get_node_text(node, bufnr)
    if text:match("^<details") then
      return M.BlockType.TOGGLE
    end
    return M.BlockType.PARAGRAPH
  end,
  image = M.BlockType.IMAGE,
}

--- Get the tree-sitter parser for a buffer
---@param bufnr number Buffer number
---@return any|nil Parser or nil if not available
local function get_parser(bufnr)
  local ok, parser = pcall(vim.treesitter.get_parser, bufnr, "markdown")
  if not ok or not parser then
    return nil
  end
  return parser
end

--- Extract heading depth from a heading node
---@param node any Tree-sitter node
---@param bufnr number Buffer number
---@return number Heading depth (1-6)
local function get_heading_depth(node, bufnr)
  for child in node:iter_children() do
    local child_type = child:type()
    if child_type == "atx_h1_marker" then
      return 1
    elseif child_type == "atx_h2_marker" then
      return 2
    elseif child_type == "atx_h3_marker" then
      return 3
    elseif child_type == "atx_h4_marker" then
      return 4
    elseif child_type == "atx_h5_marker" then
      return 5
    elseif child_type == "atx_h6_marker" then
      return 6
    end
  end

  -- Fallback: count # characters
  local text = vim.treesitter.get_node_text(node, bufnr)
  local hashes = text:match("^(#+)")
  return hashes and #hashes or 1
end

--- Extract heading content (text after the # markers)
---@param node any Tree-sitter node
---@param bufnr number Buffer number
---@return string Heading content
local function get_heading_content(node, bufnr)
  for child in node:iter_children() do
    if child:type() == "inline" or child:type() == "heading_content" then
      return vim.treesitter.get_node_text(child, bufnr)
    end
  end

  -- Fallback: strip # markers
  local text = vim.treesitter.get_node_text(node, bufnr)
  return text:gsub("^#+%s*", "")
end

--- Extract code block language
---@param node any Tree-sitter node
---@param bufnr number Buffer number
---@return string|nil Language identifier
local function get_code_language(node, bufnr)
  for child in node:iter_children() do
    if child:type() == "info_string" then
      local info = vim.treesitter.get_node_text(child, bufnr)
      return info:match("^(%S+)")
    end
  end
  return nil
end

--- Extract code block content
---@param node any Tree-sitter node
---@param bufnr number Buffer number
---@return string Code content
local function get_code_content(node, bufnr)
  for child in node:iter_children() do
    if child:type() == "code_fence_content" then
      return vim.treesitter.get_node_text(child, bufnr)
    end
  end
  return ""
end

--- Extract callout type from blockquote
---@param text string Block text
---@return string|nil Callout type
local function get_callout_type(text)
  local callout_type = text:match("^>%s*%[!(%w+)%]")
  if callout_type then
    return callout_type:lower()
  end
  return nil
end

--- Parse a tree-sitter node into a block
---@param node any Tree-sitter node
---@param bufnr number Buffer number
---@return SlashMDBlock|nil
local function parse_node(node, bufnr)
  local node_type = node:type()
  local block_type_or_fn = node_type_map[node_type]

  if not block_type_or_fn then
    return nil
  end

  local block_type
  if type(block_type_or_fn) == "function" then
    block_type = block_type_or_fn(node, bufnr)
  else
    block_type = block_type_or_fn
  end

  local start_row, start_col, end_row, end_col = node:range()
  local text = vim.treesitter.get_node_text(node, bufnr)

  ---@type SlashMDBlock
  local block = {
    id = utils.generate_id(),
    type = block_type,
    content = text,
    children = {},
    start_line = start_row,
    end_line = end_row,
  }

  -- Add type-specific fields
  if block_type == M.BlockType.HEADING then
    block.depth = get_heading_depth(node, bufnr)
    block.content = get_heading_content(node, bufnr)
  elseif block_type == M.BlockType.CODE_BLOCK then
    block.language = get_code_language(node, bufnr)
    block.content = get_code_content(node, bufnr)
  elseif block_type == M.BlockType.CALLOUT then
    block.callout_type = get_callout_type(text)
    -- Remove the callout marker from content
    block.content = text:gsub("^>%s*%[!%w+%]%s*", ">"):gsub("^>%s*", "")
  elseif block_type == M.BlockType.TODO_LIST then
    block.children = parse_todo_items(node, bufnr)
  elseif block_type == M.BlockType.IMAGE then
    -- Extract image path
    local alt, path = text:match("!%[(.-)%]%((.-)%)")
    block.content = alt or ""
    block.path = path
  end

  return block
end

--- Parse todo list items
---@param node any Tree-sitter node
---@param bufnr number Buffer number
---@return SlashMDBlock[] Todo items
function parse_todo_items(node, bufnr)
  local items = {}

  for child in node:iter_children() do
    if child:type() == "list_item" then
      local text = vim.treesitter.get_node_text(child, bufnr)
      local checked = text:match("%[([xX])%]") ~= nil
      local content = text:gsub("^%s*[%-%*%+]%s*%[[ xX]%]%s*", "")

      local start_row, _, end_row, _ = child:range()
      table.insert(items, {
        id = utils.generate_id(),
        type = "todo_item",
        content = content,
        checked = checked,
        children = {},
        start_line = start_row,
        end_line = end_row,
      })
    end
  end

  return items
end

--- Parse a buffer into blocks
---@param bufnr number Buffer number
---@return SlashMDBlock[] List of blocks
function M.parse(bufnr)
  local parser = get_parser(bufnr)
  if not parser then
    -- Fallback to regex-based parsing
    return M.parse_fallback(bufnr)
  end

  local tree = parser:parse()[1]
  if not tree then
    return M.parse_fallback(bufnr)
  end

  local root = tree:root()
  local blocks = {}

  -- Iterate through direct children of the document
  for node in root:iter_children() do
    local block = parse_node(node, bufnr)
    if block then
      table.insert(blocks, block)
    end
  end

  return blocks
end

--- Fallback regex-based parser when tree-sitter is unavailable
---@param bufnr number Buffer number
---@return SlashMDBlock[] List of blocks
function M.parse_fallback(bufnr)
  local lines = vim.api.nvim_buf_get_lines(bufnr, 0, -1, false)
  local blocks = {}
  local i = 1

  while i <= #lines do
    local line = lines[i]
    local block = nil

    -- Heading
    local heading_match, heading_content = line:match("^(#+)%s+(.+)$")
    if heading_match then
      block = {
        id = utils.generate_id(),
        type = M.BlockType.HEADING,
        depth = #heading_match,
        content = heading_content,
        children = {},
        start_line = i - 1,
        end_line = i - 1,
      }
    end

    -- Horizontal rule
    if not block and line:match("^%s*[%-*_]%s*[%-*_]%s*[%-*_][%-*_%s]*$") then
      block = {
        id = utils.generate_id(),
        type = M.BlockType.THEMATIC_BREAK,
        content = line,
        children = {},
        start_line = i - 1,
        end_line = i - 1,
      }
    end

    -- Code block
    if not block then
      local lang = line:match("^```(%w*)%s*$")
      if lang or line:match("^```%s*$") then
        local start_line = i - 1
        local code_lines = {}
        i = i + 1
        while i <= #lines and not lines[i]:match("^```%s*$") do
          table.insert(code_lines, lines[i])
          i = i + 1
        end
        block = {
          id = utils.generate_id(),
          type = M.BlockType.CODE_BLOCK,
          language = lang ~= "" and lang or nil,
          content = table.concat(code_lines, "\n"),
          children = {},
          start_line = start_line,
          end_line = i - 1,
        }
      end
    end

    -- Blockquote / Callout
    if not block and line:match("^>") then
      local start_line = i - 1
      local quote_lines = { line }
      i = i + 1
      while i <= #lines and lines[i]:match("^>") do
        table.insert(quote_lines, lines[i])
        i = i + 1
      end
      i = i - 1 -- Back up one since we'll increment at the end

      local full_text = table.concat(quote_lines, "\n")
      local callout_type = full_text:match("^>%s*%[!(%w+)%]")

      if callout_type then
        block = {
          id = utils.generate_id(),
          type = M.BlockType.CALLOUT,
          callout_type = callout_type:lower(),
          content = full_text:gsub("^>%s*%[!%w+%]%s*", ">"):gsub("^>%s*", ""),
          children = {},
          start_line = start_line,
          end_line = i - 1,
        }
      else
        block = {
          id = utils.generate_id(),
          type = M.BlockType.BLOCKQUOTE,
          content = full_text,
          children = {},
          start_line = start_line,
          end_line = i - 1,
        }
      end
    end

    -- Todo list item
    if not block and line:match("^%s*[%-*+]%s*%[[ xX]%]") then
      local checked = line:match("%[([xX])%]") ~= nil
      local content = line:gsub("^%s*[%-*+]%s*%[[ xX]%]%s*", "")
      block = {
        id = utils.generate_id(),
        type = M.BlockType.TODO_LIST,
        content = content,
        checked = checked,
        children = {},
        start_line = i - 1,
        end_line = i - 1,
      }
    end

    -- Bullet list
    if not block and line:match("^%s*[%-*+]%s+[^%[]") then
      local content = line:gsub("^%s*[%-*+]%s+", "")
      block = {
        id = utils.generate_id(),
        type = M.BlockType.BULLET_LIST,
        content = content,
        children = {},
        start_line = i - 1,
        end_line = i - 1,
      }
    end

    -- Numbered list
    if not block and line:match("^%s*%d+[.)]%s+") then
      local content = line:gsub("^%s*%d+[.)]%s+", "")
      block = {
        id = utils.generate_id(),
        type = M.BlockType.NUMBERED_LIST,
        content = content,
        children = {},
        start_line = i - 1,
        end_line = i - 1,
      }
    end

    -- Image
    if not block then
      local alt, path = line:match("^!%[(.-)%]%((.-)%)")
      if path then
        block = {
          id = utils.generate_id(),
          type = M.BlockType.IMAGE,
          content = alt or "",
          path = path,
          children = {},
          start_line = i - 1,
          end_line = i - 1,
        }
      end
    end

    -- Paragraph (non-empty line that didn't match anything else)
    if not block and line:match("%S") then
      block = {
        id = utils.generate_id(),
        type = M.BlockType.PARAGRAPH,
        content = line,
        children = {},
        start_line = i - 1,
        end_line = i - 1,
      }
    end

    if block then
      table.insert(blocks, block)
    end

    i = i + 1
  end

  return blocks
end

return M
