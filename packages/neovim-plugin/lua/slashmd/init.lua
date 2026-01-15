-- SlashMD for Neo-Vim
-- Main entry point

local M = {}

local config = require("slashmd.config")
local state = require("slashmd.state")
local renderer = require("slashmd.renderer")
local keymaps = require("slashmd.keymaps")
local commands = require("slashmd.commands")

--- Setup SlashMD with user configuration
---@param opts table|nil User configuration options
function M.setup(opts)
  config.setup(opts)

  -- Setup highlight groups
  require("slashmd.highlights").setup()

  -- Setup commands
  commands.setup()
end

--- Enable SlashMD for a buffer
---@param bufnr number|nil Buffer number (defaults to current)
function M.enable(bufnr)
  bufnr = bufnr or vim.api.nvim_get_current_buf()

  -- Check if already enabled
  if state.is_enabled(bufnr) then
    return
  end

  -- Verify buffer is markdown
  local ft = vim.bo[bufnr].filetype
  if ft ~= "markdown" and ft ~= "markdown.mdx" then
    vim.notify("SlashMD: Buffer is not a markdown file", vim.log.levels.WARN)
    return
  end

  -- Initialize state for this buffer
  state.init(bufnr)

  -- Setup keymaps
  keymaps.setup(bufnr)

  -- Parse and render
  M.refresh(bufnr)

  -- Setup autocommands for this buffer
  local augroup = vim.api.nvim_create_augroup("SlashMD_" .. bufnr, { clear = true })

  vim.api.nvim_create_autocmd({ "TextChanged", "TextChangedI" }, {
    group = augroup,
    buffer = bufnr,
    callback = function()
      M.refresh(bufnr)
    end,
    desc = "Re-render SlashMD on text change",
  })

  vim.api.nvim_create_autocmd("BufUnload", {
    group = augroup,
    buffer = bufnr,
    callback = function()
      M.disable(bufnr)
    end,
    desc = "Cleanup SlashMD on buffer unload",
  })

  vim.notify("SlashMD enabled", vim.log.levels.INFO)
end

--- Disable SlashMD for a buffer
---@param bufnr number|nil Buffer number (defaults to current)
function M.disable(bufnr)
  bufnr = bufnr or vim.api.nvim_get_current_buf()

  if not state.is_enabled(bufnr) then
    return
  end

  -- Clear rendering
  renderer.clear(bufnr)

  -- Remove keymaps
  keymaps.remove(bufnr)

  -- Clear state
  state.clear(bufnr)

  -- Remove buffer-specific autocommands
  pcall(vim.api.nvim_del_augroup_by_name, "SlashMD_" .. bufnr)

  vim.notify("SlashMD disabled", vim.log.levels.INFO)
end

--- Toggle SlashMD for a buffer
---@param bufnr number|nil Buffer number (defaults to current)
function M.toggle(bufnr)
  bufnr = bufnr or vim.api.nvim_get_current_buf()

  if state.is_enabled(bufnr) then
    M.disable(bufnr)
  else
    M.enable(bufnr)
  end
end

--- Refresh rendering for a buffer
---@param bufnr number|nil Buffer number (defaults to current)
function M.refresh(bufnr)
  bufnr = bufnr or vim.api.nvim_get_current_buf()

  if not state.is_enabled(bufnr) then
    return
  end

  -- Parse markdown into blocks
  local parser = require("slashmd.parser")
  local blocks = parser.parse(bufnr)

  -- Update state
  state.set_blocks(bufnr, blocks)

  -- Render blocks
  renderer.render(bufnr, blocks)
end

return M
