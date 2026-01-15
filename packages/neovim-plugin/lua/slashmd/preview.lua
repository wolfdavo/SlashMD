-- SlashMD Preview Module
-- Live preview sync with external viewers

local M = {}

local config = require("slashmd.config")
local state = require("slashmd.state")

-- Preview server state
local server = {
  job_id = nil,
  port = 3333,
  clients = {},
}

--- Start a simple WebSocket server for preview sync
--- This is a placeholder - full implementation would need a proper server
---@param port number|nil Port number
function M.start_server(port)
  server.port = port or 3333

  -- Check if we have a preview server script
  local plugin_path = debug.getinfo(1, "S").source:sub(2):match("(.*/)")
  local server_script = plugin_path .. "../../scripts/preview_server.js"

  if vim.fn.filereadable(server_script) == 0 then
    vim.notify("Preview server script not found", vim.log.levels.WARN)
    return false
  end

  -- Start the server
  server.job_id = vim.fn.jobstart({ "node", server_script, tostring(server.port) }, {
    on_stdout = function(_, data)
      for _, line in ipairs(data) do
        if line ~= "" then
          vim.notify("Preview: " .. line, vim.log.levels.DEBUG)
        end
      end
    end,
    on_stderr = function(_, data)
      for _, line in ipairs(data) do
        if line ~= "" then
          vim.notify("Preview error: " .. line, vim.log.levels.ERROR)
        end
      end
    end,
    on_exit = function()
      server.job_id = nil
      vim.notify("Preview server stopped", vim.log.levels.INFO)
    end,
  })

  if server.job_id > 0 then
    vim.notify("Preview server started on port " .. server.port, vim.log.levels.INFO)
    return true
  end

  return false
end

--- Stop the preview server
function M.stop_server()
  if server.job_id then
    vim.fn.jobstop(server.job_id)
    server.job_id = nil
  end
end

--- Check if preview server is running
---@return boolean
function M.is_running()
  return server.job_id ~= nil
end

--- Send cursor position to preview
---@param bufnr number Buffer number
---@param line number Line number
function M.sync_cursor(bufnr, line)
  if not M.is_running() then
    return
  end

  -- Get block at current line
  local block = state.get_block_at_line(bufnr, line)
  local block_id = block and block.id or nil

  -- This would send to WebSocket clients
  -- For now, write to a temp file that a browser extension could watch
  local sync_file = vim.fn.stdpath("cache") .. "/slashmd_preview_sync.json"
  local data = vim.fn.json_encode({
    line = line,
    block_id = block_id,
    file = vim.api.nvim_buf_get_name(bufnr),
    timestamp = vim.loop.now(),
  })

  local f = io.open(sync_file, "w")
  if f then
    f:write(data)
    f:close()
  end
end

--- Open preview in browser
---@param bufnr number|nil Buffer number
function M.open_in_browser(bufnr)
  bufnr = bufnr or vim.api.nvim_get_current_buf()

  local file = vim.api.nvim_buf_get_name(bufnr)
  if file == "" then
    vim.notify("Buffer has no file", vim.log.levels.WARN)
    return
  end

  -- Try different preview tools
  local preview_tools = {
    -- Grip (GitHub-flavored markdown)
    { cmd = "grip", args = { file, "--browser" }, check = "grip" },
    -- Glow (terminal preview)
    { cmd = "glow", args = { file }, check = "glow" },
    -- mdcat (terminal preview)
    { cmd = "mdcat", args = { file }, check = "mdcat" },
    -- Pandoc to HTML then open
    { cmd = "pandoc", args = { file, "-o", "/tmp/preview.html", "&&", "open", "/tmp/preview.html" }, check = "pandoc" },
  }

  for _, tool in ipairs(preview_tools) do
    if vim.fn.executable(tool.check) == 1 then
      vim.fn.jobstart(vim.list_extend({ tool.cmd }, tool.args), { detach = true })
      vim.notify("Opening preview with " .. tool.cmd, vim.log.levels.INFO)
      return
    end
  end

  -- Fallback: open file directly (OS will use default app)
  local open_cmd
  if vim.fn.has("mac") == 1 then
    open_cmd = "open"
  elseif vim.fn.has("unix") == 1 then
    open_cmd = "xdg-open"
  end

  if open_cmd then
    vim.fn.jobstart({ open_cmd, file }, { detach = true })
  else
    vim.notify("No preview tool found. Install grip, glow, or mdcat.", vim.log.levels.WARN)
  end
end

--- Export buffer to HTML
---@param bufnr number|nil Buffer number
---@param output_path string|nil Output file path
function M.export_html(bufnr, output_path)
  bufnr = bufnr or vim.api.nvim_get_current_buf()

  local file = vim.api.nvim_buf_get_name(bufnr)
  if file == "" then
    vim.notify("Buffer has no file", vim.log.levels.WARN)
    return
  end

  output_path = output_path or file:gsub("%.md$", ".html")

  if vim.fn.executable("pandoc") == 1 then
    local cmd = string.format(
      "pandoc %s -o %s --standalone --metadata title=%s",
      vim.fn.shellescape(file),
      vim.fn.shellescape(output_path),
      vim.fn.shellescape(vim.fn.fnamemodify(file, ":t:r"))
    )

    vim.fn.jobstart(cmd, {
      on_exit = function(_, code)
        if code == 0 then
          vim.notify("Exported to: " .. output_path, vim.log.levels.INFO)
        else
          vim.notify("Export failed", vim.log.levels.ERROR)
        end
      end,
    })
  else
    vim.notify("pandoc not found. Install pandoc for HTML export.", vim.log.levels.WARN)
  end
end

--- Export buffer to PDF
---@param bufnr number|nil Buffer number
---@param output_path string|nil Output file path
function M.export_pdf(bufnr, output_path)
  bufnr = bufnr or vim.api.nvim_get_current_buf()

  local file = vim.api.nvim_buf_get_name(bufnr)
  if file == "" then
    vim.notify("Buffer has no file", vim.log.levels.WARN)
    return
  end

  output_path = output_path or file:gsub("%.md$", ".pdf")

  if vim.fn.executable("pandoc") == 1 then
    local cmd = string.format(
      "pandoc %s -o %s --pdf-engine=xelatex",
      vim.fn.shellescape(file),
      vim.fn.shellescape(output_path)
    )

    vim.fn.jobstart(cmd, {
      on_exit = function(_, code)
        if code == 0 then
          vim.notify("Exported to: " .. output_path, vim.log.levels.INFO)
        else
          vim.notify("PDF export failed (requires xelatex)", vim.log.levels.ERROR)
        end
      end,
    })
  else
    vim.notify("pandoc not found. Install pandoc for PDF export.", vim.log.levels.WARN)
  end
end

--- Setup preview autocommands for cursor sync
---@param bufnr number Buffer number
function M.setup_sync(bufnr)
  local augroup = vim.api.nvim_create_augroup("SlashMDPreview_" .. bufnr, { clear = true })

  vim.api.nvim_create_autocmd("CursorMoved", {
    group = augroup,
    buffer = bufnr,
    callback = function()
      local line = vim.api.nvim_win_get_cursor(0)[1] - 1
      M.sync_cursor(bufnr, line)
    end,
    desc = "Sync cursor to preview",
  })
end

--- Remove preview autocommands
---@param bufnr number Buffer number
function M.remove_sync(bufnr)
  pcall(vim.api.nvim_del_augroup_by_name, "SlashMDPreview_" .. bufnr)
end

--- Setup preview commands for a buffer
---@param bufnr number Buffer number
function M.setup_commands(bufnr)
  vim.api.nvim_buf_create_user_command(bufnr, "SlashMDPreview", function()
    M.open_in_browser(bufnr)
  end, { desc = "Open markdown preview" })

  vim.api.nvim_buf_create_user_command(bufnr, "SlashMDExportHTML", function(opts)
    M.export_html(bufnr, opts.args ~= "" and opts.args or nil)
  end, { nargs = "?", desc = "Export to HTML" })

  vim.api.nvim_buf_create_user_command(bufnr, "SlashMDExportPDF", function(opts)
    M.export_pdf(bufnr, opts.args ~= "" and opts.args or nil)
  end, { nargs = "?", desc = "Export to PDF" })
end

--- Remove preview commands
---@param bufnr number Buffer number
function M.remove_commands(bufnr)
  pcall(vim.api.nvim_buf_del_user_command, bufnr, "SlashMDPreview")
  pcall(vim.api.nvim_buf_del_user_command, bufnr, "SlashMDExportHTML")
  pcall(vim.api.nvim_buf_del_user_command, bufnr, "SlashMDExportPDF")
end

return M
