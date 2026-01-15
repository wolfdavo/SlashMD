-- SlashMD Block Operations Module
-- Handles block manipulation: move, delete, transform

local M = {}

local state = require("slashmd.state")
local parser = require("slashmd.parser")

--- Delete a block from the buffer
---@param bufnr number Buffer number
---@param block table Block to delete
function M.delete_block(bufnr, block)
  -- Delete lines from start to end (inclusive)
  vim.api.nvim_buf_set_lines(bufnr, block.start_line, block.end_line + 1, false, {})

  -- Refresh will be triggered by TextChanged autocmd
end

--- Move a block up
---@param bufnr number Buffer number
---@param block table Block to move
function M.move_block_up(bufnr, block)
  -- Find the previous block
  local prev_block = state.get_prev_block(bufnr, block.start_line)

  if not prev_block then
    vim.notify("Cannot move block up", vim.log.levels.INFO)
    return
  end

  -- Get the lines of current block
  local block_lines = vim.api.nvim_buf_get_lines(bufnr, block.start_line, block.end_line + 1, false)

  -- Delete current block
  vim.api.nvim_buf_set_lines(bufnr, block.start_line, block.end_line + 1, false, {})

  -- Insert before the previous block
  vim.api.nvim_buf_set_lines(bufnr, prev_block.start_line, prev_block.start_line, false, block_lines)

  -- Move cursor to the new position
  vim.api.nvim_win_set_cursor(0, { prev_block.start_line + 1, 0 })
end

--- Move a block down
---@param bufnr number Buffer number
---@param block table Block to move
function M.move_block_down(bufnr, block)
  -- Find the next block
  local next_block = state.get_next_block(bufnr, block.end_line)

  if not next_block then
    vim.notify("Cannot move block down", vim.log.levels.INFO)
    return
  end

  -- Get the lines of current block
  local block_lines = vim.api.nvim_buf_get_lines(bufnr, block.start_line, block.end_line + 1, false)

  -- Delete current block
  vim.api.nvim_buf_set_lines(bufnr, block.start_line, block.end_line + 1, false, {})

  -- Adjust next_block position since we deleted lines above it
  local lines_removed = block.end_line - block.start_line + 1
  local insert_pos = next_block.end_line - lines_removed + 1

  -- Insert after the next block
  vim.api.nvim_buf_set_lines(bufnr, insert_pos + 1, insert_pos + 1, false, block_lines)

  -- Move cursor to the new position
  vim.api.nvim_win_set_cursor(0, { insert_pos + 2, 0 })
end

--- Toggle checkbox state for a todo item
---@param bufnr number Buffer number
---@param block table Todo block
function M.toggle_checkbox(bufnr, block)
  local line = vim.api.nvim_buf_get_lines(bufnr, block.start_line, block.start_line + 1, false)[1]

  if not line then
    return
  end

  local new_line
  if line:match("%[%s%]") then
    new_line = line:gsub("%[%s%]", "[x]", 1)
  elseif line:match("%[[xX]%]") then
    new_line = line:gsub("%[[xX]%]", "[ ]", 1)
  else
    return
  end

  vim.api.nvim_buf_set_lines(bufnr, block.start_line, block.start_line + 1, false, { new_line })
end

--- Transform a block to a different type
---@param bufnr number Buffer number
---@param block table Block to transform
---@param new_type string New block type
function M.transform_block(bufnr, block, new_type)
  local lines = vim.api.nvim_buf_get_lines(bufnr, block.start_line, block.end_line + 1, false)

  if #lines == 0 then
    return
  end

  -- Extract content from current block
  local content = M.extract_content(block, lines)

  -- Generate new lines for the target type
  local new_lines = M.generate_block_lines(new_type, content)

  -- Replace the block
  vim.api.nvim_buf_set_lines(bufnr, block.start_line, block.end_line + 1, false, new_lines)

  -- Position cursor at end of first line
  vim.api.nvim_win_set_cursor(0, { block.start_line + 1, #new_lines[1] })
end

--- Extract plain text content from a block
---@param block table Block
---@param lines string[] Block lines
---@return string Content
function M.extract_content(block, lines)
  local block_type = block.type

  if block_type == parser.BlockType.HEADING then
    -- Strip # markers
    return lines[1]:gsub("^#+%s*", "")
  elseif block_type == parser.BlockType.BULLET_LIST then
    -- Strip bullet marker
    return lines[1]:gsub("^%s*[%-*+]%s*", "")
  elseif block_type == parser.BlockType.NUMBERED_LIST then
    -- Strip number marker
    return lines[1]:gsub("^%s*%d+[.)]%s*", "")
  elseif block_type == parser.BlockType.TODO_LIST then
    -- Strip todo marker
    return lines[1]:gsub("^%s*[%-*+]%s*%[[ xX]%]%s*", "")
  elseif block_type == parser.BlockType.BLOCKQUOTE then
    -- Strip > markers and join lines
    local content_lines = {}
    for _, line in ipairs(lines) do
      table.insert(content_lines, line:gsub("^>%s*", ""))
    end
    return table.concat(content_lines, "\n")
  elseif block_type == parser.BlockType.CODE_BLOCK then
    -- Return content without fences
    local content_lines = {}
    for i = 2, #lines - 1 do
      table.insert(content_lines, lines[i])
    end
    return table.concat(content_lines, "\n")
  elseif block_type == parser.BlockType.CALLOUT then
    -- Strip callout markers
    local content_lines = {}
    for i, line in ipairs(lines) do
      if i == 1 then
        -- Remove > [!TYPE] from first line
        local stripped = line:gsub("^>%s*%[!%w+%]%s*", "")
        if stripped ~= "" then
          table.insert(content_lines, stripped)
        end
      else
        table.insert(content_lines, line:gsub("^>%s*", ""))
      end
    end
    return table.concat(content_lines, "\n")
  else
    -- Default: return as-is
    return table.concat(lines, "\n")
  end
end

--- Generate lines for a new block type
---@param block_type string Target block type
---@param content string Content to include
---@return string[] Generated lines
function M.generate_block_lines(block_type, content)
  local lines = vim.split(content, "\n")
  local first_line = lines[1] or ""

  if block_type == "heading" then
    return { "# " .. first_line }
  elseif block_type == "paragraph" then
    return lines
  elseif block_type == "bullet_list" then
    local result = {}
    for _, line in ipairs(lines) do
      table.insert(result, "- " .. line)
    end
    return result
  elseif block_type == "numbered_list" then
    local result = {}
    for i, line in ipairs(lines) do
      table.insert(result, i .. ". " .. line)
    end
    return result
  elseif block_type == "todo_list" then
    local result = {}
    for _, line in ipairs(lines) do
      table.insert(result, "- [ ] " .. line)
    end
    return result
  elseif block_type == "blockquote" then
    local result = {}
    for _, line in ipairs(lines) do
      table.insert(result, "> " .. line)
    end
    return result
  elseif block_type == "code_block" then
    local result = { "```" }
    for _, line in ipairs(lines) do
      table.insert(result, line)
    end
    table.insert(result, "```")
    return result
  elseif block_type == "callout" then
    local result = { "> [!NOTE]" }
    for _, line in ipairs(lines) do
      table.insert(result, "> " .. line)
    end
    return result
  else
    return lines
  end
end

--- Duplicate a block
---@param bufnr number Buffer number
---@param block table Block to duplicate
function M.duplicate_block(bufnr, block)
  local lines = vim.api.nvim_buf_get_lines(bufnr, block.start_line, block.end_line + 1, false)

  -- Insert after the block
  vim.api.nvim_buf_set_lines(bufnr, block.end_line + 1, block.end_line + 1, false, lines)

  -- Move cursor to the duplicated block
  vim.api.nvim_win_set_cursor(0, { block.end_line + 2, 0 })
end

--- Indent a block (increase nesting level)
---@param bufnr number Buffer number
---@param block table Block to indent
function M.indent_block(bufnr, block)
  local lines = vim.api.nvim_buf_get_lines(bufnr, block.start_line, block.end_line + 1, false)

  for i, line in ipairs(lines) do
    lines[i] = "  " .. line
  end

  vim.api.nvim_buf_set_lines(bufnr, block.start_line, block.end_line + 1, false, lines)
end

--- Outdent a block (decrease nesting level)
---@param bufnr number Buffer number
---@param block table Block to outdent
function M.outdent_block(bufnr, block)
  local lines = vim.api.nvim_buf_get_lines(bufnr, block.start_line, block.end_line + 1, false)

  for i, line in ipairs(lines) do
    -- Remove up to 2 spaces or 1 tab
    if line:match("^\t") then
      lines[i] = line:sub(2)
    elseif line:match("^  ") then
      lines[i] = line:sub(3)
    elseif line:match("^ ") then
      lines[i] = line:sub(2)
    end
  end

  vim.api.nvim_buf_set_lines(bufnr, block.start_line, block.end_line + 1, false, lines)
end

return M
