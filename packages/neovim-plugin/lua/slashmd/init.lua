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

  -- Try to setup nvim-cmp integration
  pcall(function()
    require("slashmd.lsp").setup_cmp()
  end)
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

  -- Setup clipboard commands
  require("slashmd.clipboard").setup_commands(bufnr)

  -- Setup preview commands
  require("slashmd.preview").setup_commands(bufnr)

  -- Setup LSP features (diagnostics, etc.)
  require("slashmd.lsp").setup(bufnr)

  -- Setup markdown shortcuts
  require("slashmd.shortcuts").setup(bufnr)

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

  -- Remove clipboard commands
  require("slashmd.clipboard").remove_commands(bufnr)

  -- Remove preview commands
  require("slashmd.preview").remove_commands(bufnr)

  -- Remove LSP features
  require("slashmd.lsp").remove(bufnr)

  -- Remove shortcuts
  require("slashmd.shortcuts").remove(bufnr)

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

--- Paste image from clipboard
---@param bufnr number|nil Buffer number
function M.paste_image(bufnr)
  require("slashmd.clipboard").paste_image_at_cursor(bufnr)
end

--- Open preview in browser
---@param bufnr number|nil Buffer number
function M.preview(bufnr)
  require("slashmd.preview").open_in_browser(bufnr)
end

--- Export to HTML
---@param bufnr number|nil Buffer number
---@param output_path string|nil Output path
function M.export_html(bufnr, output_path)
  require("slashmd.preview").export_html(bufnr, output_path)
end

--- Export to PDF
---@param bufnr number|nil Buffer number
---@param output_path string|nil Output path
function M.export_pdf(bufnr, output_path)
  require("slashmd.preview").export_pdf(bufnr, output_path)
end

return M
