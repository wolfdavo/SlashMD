-- SlashMD Keymaps Module

local M = {}

local config = require("slashmd.config")

--- Setup keymaps for a buffer
---@param bufnr number Buffer number
function M.setup(bufnr)
  local cfg = config.get()
  local keymaps = cfg.keymaps

  -- Setup buffer-specific commands first
  require("slashmd.commands").setup_buffer_commands(bufnr)

  -- Block navigation
  if cfg.features.block_navigation then
    vim.keymap.set("n", keymaps.next_block, "<cmd>SlashMDNextBlock<cr>", {
      buffer = bufnr,
      desc = "SlashMD: Next block",
    })

    vim.keymap.set("n", keymaps.prev_block, "<cmd>SlashMDPrevBlock<cr>", {
      buffer = bufnr,
      desc = "SlashMD: Previous block",
    })
  end

  -- Block operations
  vim.keymap.set("n", keymaps.delete_block, "<cmd>SlashMDDeleteBlock<cr>", {
    buffer = bufnr,
    desc = "SlashMD: Delete block",
  })

  vim.keymap.set("n", keymaps.move_block_up, "<cmd>SlashMDMoveBlockUp<cr>", {
    buffer = bufnr,
    desc = "SlashMD: Move block up",
  })

  vim.keymap.set("n", keymaps.move_block_down, "<cmd>SlashMDMoveBlockDown<cr>", {
    buffer = bufnr,
    desc = "SlashMD: Move block down",
  })

  vim.keymap.set("n", keymaps.transform_block, "<cmd>SlashMDTransformBlock<cr>", {
    buffer = bufnr,
    desc = "SlashMD: Transform block",
  })

  -- Toggle fold/collapse
  vim.keymap.set("n", keymaps.toggle_fold, function()
    local state = require("slashmd.state")
    local row = vim.api.nvim_win_get_cursor(0)[1] - 1
    local block = state.get_block_at_line(bufnr, row)

    if block then
      if block.type == "todo_list" then
        -- Toggle checkbox for todo items
        vim.cmd("SlashMDToggleCheckbox")
      elseif block.type == "toggle" or block.type == "callout" then
        -- Toggle collapse for toggles and callouts
        state.toggle_collapsed(bufnr, block.id)
        require("slashmd").refresh(bufnr)
      end
    end
  end, {
    buffer = bufnr,
    desc = "SlashMD: Toggle fold/checkbox",
  })

  -- Slash menu trigger in insert mode
  if cfg.features.slash_menu then
    vim.keymap.set("i", "/", function()
      local utils = require("slashmd.utils")
      if utils.at_line_start() then
        require("slashmd.slash_menu").show(bufnr)
        return ""
      else
        return "/"
      end
    end, {
      buffer = bufnr,
      expr = true,
      desc = "SlashMD: Slash menu or insert /",
    })
  end

  -- Quick block creation shortcuts
  vim.keymap.set("n", "<leader>bh", function()
    M.insert_block(bufnr, "heading")
  end, {
    buffer = bufnr,
    desc = "SlashMD: Insert heading",
  })

  vim.keymap.set("n", "<leader>bc", function()
    M.insert_block(bufnr, "code_block")
  end, {
    buffer = bufnr,
    desc = "SlashMD: Insert code block",
  })

  vim.keymap.set("n", "<leader>bl", function()
    M.insert_block(bufnr, "bullet_list")
  end, {
    buffer = bufnr,
    desc = "SlashMD: Insert bullet list",
  })

  vim.keymap.set("n", "<leader>bn", function()
    M.insert_block(bufnr, "callout")
  end, {
    buffer = bufnr,
    desc = "SlashMD: Insert callout (note)",
  })

  -- Inline formatting shortcuts
  local inline = require("slashmd.inline")

  vim.keymap.set("n", "<leader>mb", function()
    inline.toggle_bold(bufnr)
  end, {
    buffer = bufnr,
    desc = "SlashMD: Toggle bold",
  })

  vim.keymap.set("n", "<leader>mi", function()
    inline.toggle_italic(bufnr)
  end, {
    buffer = bufnr,
    desc = "SlashMD: Toggle italic",
  })

  vim.keymap.set("n", "<leader>mc", function()
    inline.toggle_code(bufnr)
  end, {
    buffer = bufnr,
    desc = "SlashMD: Toggle inline code",
  })

  vim.keymap.set("n", "<leader>ml", function()
    inline.insert_link(bufnr)
    vim.cmd("startinsert")
  end, {
    buffer = bufnr,
    desc = "SlashMD: Insert link",
  })
end

--- Remove keymaps from a buffer
---@param bufnr number Buffer number
function M.remove(bufnr)
  local cfg = config.get()
  local keymaps = cfg.keymaps

  -- Remove all keymaps we set
  local keys_to_remove = {
    { "n", keymaps.next_block },
    { "n", keymaps.prev_block },
    { "n", keymaps.delete_block },
    { "n", keymaps.move_block_up },
    { "n", keymaps.move_block_down },
    { "n", keymaps.transform_block },
    { "n", keymaps.toggle_fold },
    { "i", "/" },
    { "n", "<leader>bh" },
    { "n", "<leader>bc" },
    { "n", "<leader>bl" },
    { "n", "<leader>bn" },
    { "n", "<leader>mb" },
    { "n", "<leader>mi" },
    { "n", "<leader>mc" },
    { "n", "<leader>ml" },
  }

  for _, key in ipairs(keys_to_remove) do
    pcall(vim.keymap.del, key[1], key[2], { buffer = bufnr })
  end

  -- Remove buffer commands
  require("slashmd.commands").remove_buffer_commands(bufnr)
end

--- Insert a new block at cursor position
---@param bufnr number Buffer number
---@param block_type string Type of block to insert
function M.insert_block(bufnr, block_type)
  local row = vim.api.nvim_win_get_cursor(0)[1]
  local lines = {}

  if block_type == "heading" then
    lines = { "# " }
  elseif block_type == "code_block" then
    lines = { "```", "", "```" }
  elseif block_type == "bullet_list" then
    lines = { "- " }
  elseif block_type == "numbered_list" then
    lines = { "1. " }
  elseif block_type == "todo_list" then
    lines = { "- [ ] " }
  elseif block_type == "blockquote" then
    lines = { "> " }
  elseif block_type == "callout" then
    lines = { "> [!NOTE]", "> " }
  elseif block_type == "horizontal_rule" then
    lines = { "---" }
  end

  -- Insert after current line
  vim.api.nvim_buf_set_lines(bufnr, row, row, false, lines)

  -- Position cursor appropriately
  if block_type == "code_block" then
    vim.api.nvim_win_set_cursor(0, { row + 2, 0 })
  elseif block_type == "callout" then
    vim.api.nvim_win_set_cursor(0, { row + 2, 2 })
  else
    vim.api.nvim_win_set_cursor(0, { row + 1, #lines[1] })
  end

  -- Enter insert mode
  vim.cmd("startinsert!")
end

return M
