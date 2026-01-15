-- SlashMD State Manager
-- Manages block state for each buffer

local M = {}

-- State storage per buffer
---@type table<number, table>
local buffer_state = {}

-- Namespace for extmarks
M.namespace = vim.api.nvim_create_namespace("slashmd")

--- Initialize state for a buffer
---@param bufnr number Buffer number
function M.init(bufnr)
  buffer_state[bufnr] = {
    enabled = true,
    blocks = {},
    collapsed = {}, -- Track collapsed toggle/callout blocks by ID
    line_to_block = {}, -- Map line numbers to block IDs
  }
end

--- Check if SlashMD is enabled for a buffer
---@param bufnr number Buffer number
---@return boolean
function M.is_enabled(bufnr)
  return buffer_state[bufnr] ~= nil and buffer_state[bufnr].enabled
end

--- Clear state for a buffer
---@param bufnr number Buffer number
function M.clear(bufnr)
  buffer_state[bufnr] = nil
end

--- Get state for a buffer
---@param bufnr number Buffer number
---@return table|nil
function M.get(bufnr)
  return buffer_state[bufnr]
end

--- Set blocks for a buffer
---@param bufnr number Buffer number
---@param blocks table[] List of blocks
function M.set_blocks(bufnr, blocks)
  if not buffer_state[bufnr] then
    return
  end

  buffer_state[bufnr].blocks = blocks

  -- Build line to block mapping
  local line_map = {}
  for _, block in ipairs(blocks) do
    for line = block.start_line, block.end_line do
      line_map[line] = block.id
    end
  end
  buffer_state[bufnr].line_to_block = line_map
end

--- Get blocks for a buffer
---@param bufnr number Buffer number
---@return table[] List of blocks
function M.get_blocks(bufnr)
  if not buffer_state[bufnr] then
    return {}
  end
  return buffer_state[bufnr].blocks
end

--- Get block at a specific line
---@param bufnr number Buffer number
---@param line number 0-indexed line number
---@return table|nil Block at line
function M.get_block_at_line(bufnr, line)
  if not buffer_state[bufnr] then
    return nil
  end

  local block_id = buffer_state[bufnr].line_to_block[line]
  if not block_id then
    return nil
  end

  for _, block in ipairs(buffer_state[bufnr].blocks) do
    if block.id == block_id then
      return block
    end
  end

  return nil
end

--- Get block by ID
---@param bufnr number Buffer number
---@param block_id string Block ID
---@return table|nil Block
function M.get_block_by_id(bufnr, block_id)
  if not buffer_state[bufnr] then
    return nil
  end

  for _, block in ipairs(buffer_state[bufnr].blocks) do
    if block.id == block_id then
      return block
    end
  end

  return nil
end

--- Get next block from a line
---@param bufnr number Buffer number
---@param line number 0-indexed line number
---@return table|nil Next block
function M.get_next_block(bufnr, line)
  if not buffer_state[bufnr] then
    return nil
  end

  local blocks = buffer_state[bufnr].blocks
  for _, block in ipairs(blocks) do
    if block.start_line > line then
      return block
    end
  end

  return nil
end

--- Get previous block from a line
---@param bufnr number Buffer number
---@param line number 0-indexed line number
---@return table|nil Previous block
function M.get_prev_block(bufnr, line)
  if not buffer_state[bufnr] then
    return nil
  end

  local blocks = buffer_state[bufnr].blocks
  local prev = nil
  for _, block in ipairs(blocks) do
    if block.start_line >= line then
      return prev
    end
    prev = block
  end

  return prev
end

--- Check if a block is collapsed
---@param bufnr number Buffer number
---@param block_id string Block ID
---@return boolean
function M.is_collapsed(bufnr, block_id)
  if not buffer_state[bufnr] then
    return false
  end
  return buffer_state[bufnr].collapsed[block_id] == true
end

--- Toggle collapsed state for a block
---@param bufnr number Buffer number
---@param block_id string Block ID
---@return boolean New collapsed state
function M.toggle_collapsed(bufnr, block_id)
  if not buffer_state[bufnr] then
    return false
  end

  local current = buffer_state[bufnr].collapsed[block_id]
  buffer_state[bufnr].collapsed[block_id] = not current
  return not current
end

--- Set collapsed state for a block
---@param bufnr number Buffer number
---@param block_id string Block ID
---@param collapsed boolean Collapsed state
function M.set_collapsed(bufnr, block_id, collapsed)
  if not buffer_state[bufnr] then
    return
  end
  buffer_state[bufnr].collapsed[block_id] = collapsed
end

return M
