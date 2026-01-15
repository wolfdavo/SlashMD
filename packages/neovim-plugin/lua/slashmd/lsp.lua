-- SlashMD LSP Integration Module
-- Provides completions, diagnostics, and other LSP features

local M = {}

local config = require("slashmd.config")
local state = require("slashmd.state")
local parser = require("slashmd.parser")

-- Completion source for nvim-cmp
local cmp_source = {}

--- Get completion items for slash commands
---@return table[] Completion items
local function get_slash_completions()
  return {
    { label = "/h1", insertText = "# ", detail = "Heading 1", kind = 14 },
    { label = "/h2", insertText = "## ", detail = "Heading 2", kind = 14 },
    { label = "/h3", insertText = "### ", detail = "Heading 3", kind = 14 },
    { label = "/bullet", insertText = "- ", detail = "Bullet list", kind = 14 },
    { label = "/number", insertText = "1. ", detail = "Numbered list", kind = 14 },
    { label = "/todo", insertText = "- [ ] ", detail = "Todo item", kind = 14 },
    { label = "/code", insertText = "```\n$0\n```", detail = "Code block", kind = 14, insertTextFormat = 2 },
    { label = "/quote", insertText = "> ", detail = "Blockquote", kind = 14 },
    { label = "/note", insertText = "> [!NOTE]\n> ", detail = "Note callout", kind = 14 },
    { label = "/tip", insertText = "> [!TIP]\n> ", detail = "Tip callout", kind = 14 },
    { label = "/warning", insertText = "> [!WARNING]\n> ", detail = "Warning callout", kind = 14 },
    { label = "/important", insertText = "> [!IMPORTANT]\n> ", detail = "Important callout", kind = 14 },
    { label = "/caution", insertText = "> [!CAUTION]\n> ", detail = "Caution callout", kind = 14 },
    { label = "/hr", insertText = "---\n", detail = "Horizontal rule", kind = 14 },
    { label = "/table", insertText = "| Column 1 | Column 2 |\n|----------|----------|\n| Cell 1   | Cell 2   |", detail = "Table", kind = 14 },
    { label = "/image", insertText = "![$1]($0)", detail = "Image", kind = 14, insertTextFormat = 2 },
    { label = "/link", insertText = "[$1]($0)", detail = "Link", kind = 14, insertTextFormat = 2 },
    { label = "/bold", insertText = "**$0**", detail = "Bold text", kind = 14, insertTextFormat = 2 },
    { label = "/italic", insertText = "*$0*", detail = "Italic text", kind = 14, insertTextFormat = 2 },
    { label = "/strike", insertText = "~~$0~~", detail = "Strikethrough", kind = 14, insertTextFormat = 2 },
    { label = "/inline", insertText = "`$0`", detail = "Inline code", kind = 14, insertTextFormat = 2 },
  }
end

--- Get link completions (internal links to headings)
---@param bufnr number Buffer number
---@return table[] Completion items
local function get_link_completions(bufnr)
  local blocks = state.get_blocks(bufnr)
  local items = {}

  for _, block in ipairs(blocks) do
    if block.type == parser.BlockType.HEADING then
      -- Create anchor from heading
      local anchor = block.content:lower():gsub("%s+", "-"):gsub("[^%w%-]", "")
      table.insert(items, {
        label = "#" .. anchor,
        insertText = "(#" .. anchor .. ")",
        detail = block.content,
        kind = 18, -- Reference
      })
    end
  end

  return items
end

--- Get image completions from assets folder
---@param bufnr number Buffer number
---@return table[] Completion items
local function get_image_completions(bufnr)
  local buf_path = vim.api.nvim_buf_get_name(bufnr)
  if buf_path == "" then
    return {}
  end

  local dir = vim.fn.fnamemodify(buf_path, ":h")
  local assets_folder = config.get().assets.folder
  local assets_path = dir .. "/" .. assets_folder

  if vim.fn.isdirectory(assets_path) == 0 then
    return {}
  end

  local files = vim.fn.glob(assets_path .. "/*.{png,jpg,jpeg,gif,webp,svg}", false, true)
  local items = {}

  for _, file in ipairs(files) do
    local name = vim.fn.fnamemodify(file, ":t")
    local path = assets_folder .. "/" .. name
    table.insert(items, {
      label = name,
      insertText = "![](" .. path .. ")",
      detail = "Image: " .. path,
      kind = 17, -- File
    })
  end

  return items
end

--- nvim-cmp source: check if completion is available
function cmp_source:is_available()
  return vim.bo.filetype == "markdown"
end

--- nvim-cmp source: get trigger characters
function cmp_source:get_trigger_characters()
  return { "/", "[", "!" }
end

--- nvim-cmp source: complete
function cmp_source:complete(params, callback)
  local bufnr = vim.api.nvim_get_current_buf()
  local line = params.context.cursor_before_line
  local items = {}

  -- Slash commands at line start
  if line:match("^%s*/$") or line:match("^%s*/[%w]*$") then
    items = get_slash_completions()
  -- Link completions after [
  elseif line:match("%]%($") or line:match("%]%(#[%w%-]*$") then
    items = get_link_completions(bufnr)
  -- Image completions after ![
  elseif line:match("!%[$") or line:match("!%[.-%]%($") then
    items = get_image_completions(bufnr)
  end

  callback({ items = items })
end

--- Register with nvim-cmp if available
function M.setup_cmp()
  local ok, cmp = pcall(require, "cmp")
  if not ok then
    return false
  end

  cmp.register_source("slashmd", cmp_source)

  -- Add to markdown sources
  local sources = cmp.get_config().sources or {}
  table.insert(sources, 1, { name = "slashmd", priority = 100 })

  return true
end

--- Diagnostic: Check for broken links
---@param bufnr number Buffer number
---@return table[] Diagnostics
local function check_broken_links(bufnr)
  local diagnostics = {}
  local lines = vim.api.nvim_buf_get_lines(bufnr, 0, -1, false)
  local buf_path = vim.api.nvim_buf_get_name(bufnr)
  local buf_dir = buf_path ~= "" and vim.fn.fnamemodify(buf_path, ":h") or nil

  for i, line in ipairs(lines) do
    -- Check image links
    for alt, path in line:gmatch("!%[(.-)%]%((.-)%)") do
      if not path:match("^https?://") and buf_dir then
        local full_path = buf_dir .. "/" .. path
        if vim.fn.filereadable(full_path) == 0 then
          local col = line:find(path, 1, true) or 0
          table.insert(diagnostics, {
            lnum = i - 1,
            col = col - 1,
            end_col = col - 1 + #path,
            severity = vim.diagnostic.severity.WARN,
            message = "Image not found: " .. path,
            source = "slashmd",
          })
        end
      end
    end

    -- Check internal anchor links
    for text, anchor in line:gmatch("%[(.-)%]%(#(.-)%)") do
      -- Verify anchor exists in document
      local anchor_found = false
      local blocks = state.get_blocks(bufnr)
      for _, block in ipairs(blocks) do
        if block.type == parser.BlockType.HEADING then
          local heading_anchor = block.content:lower():gsub("%s+", "-"):gsub("[^%w%-]", "")
          if heading_anchor == anchor then
            anchor_found = true
            break
          end
        end
      end

      if not anchor_found then
        local col = line:find("#" .. anchor, 1, true) or 0
        table.insert(diagnostics, {
          lnum = i - 1,
          col = col - 1,
          end_col = col + #anchor,
          severity = vim.diagnostic.severity.WARN,
          message = "Anchor not found: #" .. anchor,
          source = "slashmd",
        })
      end
    end
  end

  return diagnostics
end

--- Diagnostic: Check for common markdown issues
---@param bufnr number Buffer number
---@return table[] Diagnostics
local function check_markdown_issues(bufnr)
  local diagnostics = {}
  local lines = vim.api.nvim_buf_get_lines(bufnr, 0, -1, false)

  for i, line in ipairs(lines) do
    -- Check for unclosed formatting
    local backticks = select(2, line:gsub("`", ""))
    if backticks % 2 == 1 then
      table.insert(diagnostics, {
        lnum = i - 1,
        col = 0,
        severity = vim.diagnostic.severity.HINT,
        message = "Unclosed inline code (odd number of backticks)",
        source = "slashmd",
      })
    end

    -- Check for trailing whitespace (except in code blocks)
    if line:match("%s+$") and not line:match("^%s*```") then
      local trailing_start = #line - #line:match("%s+$")
      table.insert(diagnostics, {
        lnum = i - 1,
        col = trailing_start,
        end_col = #line,
        severity = vim.diagnostic.severity.HINT,
        message = "Trailing whitespace",
        source = "slashmd",
      })
    end
  end

  return diagnostics
end

--- Run diagnostics for a buffer
---@param bufnr number Buffer number
function M.run_diagnostics(bufnr)
  local diagnostics = {}

  -- Collect all diagnostics
  vim.list_extend(diagnostics, check_broken_links(bufnr))
  vim.list_extend(diagnostics, check_markdown_issues(bufnr))

  -- Set diagnostics
  local ns = vim.api.nvim_create_namespace("slashmd_diagnostics")
  vim.diagnostic.set(ns, bufnr, diagnostics)
end

--- Clear diagnostics for a buffer
---@param bufnr number Buffer number
function M.clear_diagnostics(bufnr)
  local ns = vim.api.nvim_create_namespace("slashmd_diagnostics")
  vim.diagnostic.reset(ns, bufnr)
end

--- Setup LSP features for a buffer
---@param bufnr number Buffer number
function M.setup(bufnr)
  -- Try to register cmp source
  M.setup_cmp()

  -- Setup diagnostic autocommands
  local augroup = vim.api.nvim_create_augroup("SlashMDLSP_" .. bufnr, { clear = true })

  vim.api.nvim_create_autocmd({ "BufWritePost", "InsertLeave" }, {
    group = augroup,
    buffer = bufnr,
    callback = function()
      M.run_diagnostics(bufnr)
    end,
    desc = "Run SlashMD diagnostics",
  })

  -- Initial diagnostics
  vim.defer_fn(function()
    if vim.api.nvim_buf_is_valid(bufnr) then
      M.run_diagnostics(bufnr)
    end
  end, 500)
end

--- Remove LSP features from a buffer
---@param bufnr number Buffer number
function M.remove(bufnr)
  M.clear_diagnostics(bufnr)
  pcall(vim.api.nvim_del_augroup_by_name, "SlashMDLSP_" .. bufnr)
end

return M
