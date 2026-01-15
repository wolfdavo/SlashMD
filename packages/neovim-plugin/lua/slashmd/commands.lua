-- SlashMD Commands Module

local M = {}

--- Setup user commands
function M.setup()
  -- Commands are created in plugin/slashmd.lua
  -- This module handles execution
end

--- Execute a SlashMD command
---@param args string Command arguments
function M.execute(args)
  local slashmd = require("slashmd")

  if args == "" or args == "toggle" then
    slashmd.toggle()
  elseif args == "enable" then
    slashmd.enable()
  elseif args == "disable" then
    slashmd.disable()
  elseif args == "refresh" then
    slashmd.refresh()
  else
    vim.notify("SlashMD: Unknown command '" .. args .. "'", vim.log.levels.ERROR)
  end
end

--- Create block-specific commands
---@param bufnr number Buffer number
function M.setup_buffer_commands(bufnr)
  local state = require("slashmd.state")
  local block_ops = require("slashmd.block_ops")

  -- Navigate to next block
  vim.api.nvim_buf_create_user_command(bufnr, "SlashMDNextBlock", function()
    local row = vim.api.nvim_win_get_cursor(0)[1] - 1
    local block = state.get_next_block(bufnr, row)
    if block then
      vim.api.nvim_win_set_cursor(0, { block.start_line + 1, 0 })
    end
  end, { desc = "Go to next block" })

  -- Navigate to previous block
  vim.api.nvim_buf_create_user_command(bufnr, "SlashMDPrevBlock", function()
    local row = vim.api.nvim_win_get_cursor(0)[1] - 1
    local block = state.get_prev_block(bufnr, row)
    if block then
      vim.api.nvim_win_set_cursor(0, { block.start_line + 1, 0 })
    end
  end, { desc = "Go to previous block" })

  -- Delete current block
  vim.api.nvim_buf_create_user_command(bufnr, "SlashMDDeleteBlock", function()
    local row = vim.api.nvim_win_get_cursor(0)[1] - 1
    local block = state.get_block_at_line(bufnr, row)
    if block then
      block_ops.delete_block(bufnr, block)
    end
  end, { desc = "Delete current block" })

  -- Move block up
  vim.api.nvim_buf_create_user_command(bufnr, "SlashMDMoveBlockUp", function()
    local row = vim.api.nvim_win_get_cursor(0)[1] - 1
    local block = state.get_block_at_line(bufnr, row)
    if block then
      block_ops.move_block_up(bufnr, block)
    end
  end, { desc = "Move block up" })

  -- Move block down
  vim.api.nvim_buf_create_user_command(bufnr, "SlashMDMoveBlockDown", function()
    local row = vim.api.nvim_win_get_cursor(0)[1] - 1
    local block = state.get_block_at_line(bufnr, row)
    if block then
      block_ops.move_block_down(bufnr, block)
    end
  end, { desc = "Move block down" })

  -- Toggle checkbox (for todo items)
  vim.api.nvim_buf_create_user_command(bufnr, "SlashMDToggleCheckbox", function()
    local row = vim.api.nvim_win_get_cursor(0)[1] - 1
    local block = state.get_block_at_line(bufnr, row)
    if block and block.type == "todo_list" then
      block_ops.toggle_checkbox(bufnr, block)
    end
  end, { desc = "Toggle checkbox" })

  -- Transform block type
  vim.api.nvim_buf_create_user_command(bufnr, "SlashMDTransformBlock", function(opts)
    local row = vim.api.nvim_win_get_cursor(0)[1] - 1
    local block = state.get_block_at_line(bufnr, row)
    if block then
      if opts.args and opts.args ~= "" then
        block_ops.transform_block(bufnr, block, opts.args)
      else
        -- Show selection menu
        vim.ui.select({
          "heading",
          "paragraph",
          "bullet_list",
          "numbered_list",
          "todo_list",
          "blockquote",
          "code_block",
        }, {
          prompt = "Transform to:",
        }, function(choice)
          if choice then
            block_ops.transform_block(bufnr, block, choice)
          end
        end)
      end
    end
  end, {
    nargs = "?",
    complete = function()
      return { "heading", "paragraph", "bullet_list", "numbered_list", "todo_list", "blockquote", "code_block" }
    end,
    desc = "Transform block type",
  })

  -- Show slash menu
  vim.api.nvim_buf_create_user_command(bufnr, "SlashMDSlashMenu", function()
    require("slashmd.slash_menu").show(bufnr)
  end, { desc = "Show slash menu" })
end

--- Remove buffer-specific commands
---@param bufnr number Buffer number
function M.remove_buffer_commands(bufnr)
  local commands = {
    "SlashMDNextBlock",
    "SlashMDPrevBlock",
    "SlashMDDeleteBlock",
    "SlashMDMoveBlockUp",
    "SlashMDMoveBlockDown",
    "SlashMDToggleCheckbox",
    "SlashMDTransformBlock",
    "SlashMDSlashMenu",
  }

  for _, cmd in ipairs(commands) do
    pcall(vim.api.nvim_buf_del_user_command, bufnr, cmd)
  end
end

return M
