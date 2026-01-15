-- SlashMD for Neo-Vim
-- Auto-load setup file

if vim.g.loaded_slashmd then
  return
end
vim.g.loaded_slashmd = true

-- Require Neo-Vim 0.9+ for tree-sitter and extmark features
if vim.fn.has("nvim-0.9") ~= 1 then
  vim.notify("SlashMD requires Neo-Vim 0.9 or later", vim.log.levels.ERROR)
  return
end

-- Create user commands
vim.api.nvim_create_user_command("SlashMD", function(opts)
  require("slashmd.commands").execute(opts.args)
end, {
  nargs = "?",
  complete = function()
    return { "enable", "disable", "toggle", "refresh" }
  end,
  desc = "SlashMD commands",
})

-- Create autocommand group
local augroup = vim.api.nvim_create_augroup("SlashMD", { clear = true })

-- Auto-enable for markdown files (if configured)
vim.api.nvim_create_autocmd("FileType", {
  group = augroup,
  pattern = { "markdown", "markdown.mdx" },
  callback = function(args)
    local config = require("slashmd.config")
    if config.get().auto_enable then
      require("slashmd").enable(args.buf)
    end
  end,
  desc = "Auto-enable SlashMD for markdown files",
})
