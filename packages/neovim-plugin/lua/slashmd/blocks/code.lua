-- SlashMD Code Block Renderer

local M = {}

local config = require("slashmd.config")
local state = require("slashmd.state")
local utils = require("slashmd.utils")

local ns = state.namespace

-- Language display names
local language_names = {
  js = "JavaScript",
  ts = "TypeScript",
  py = "Python",
  rb = "Ruby",
  rs = "Rust",
  go = "Go",
  lua = "Lua",
  sh = "Shell",
  bash = "Bash",
  zsh = "Zsh",
  fish = "Fish",
  json = "JSON",
  yaml = "YAML",
  yml = "YAML",
  toml = "TOML",
  xml = "XML",
  html = "HTML",
  css = "CSS",
  scss = "SCSS",
  sql = "SQL",
  md = "Markdown",
  vim = "Vim",
  c = "C",
  cpp = "C++",
  java = "Java",
  kotlin = "Kotlin",
  swift = "Swift",
  php = "PHP",
  dockerfile = "Dockerfile",
}

--- Get display name for a language
---@param lang string|nil Language identifier
---@return string Display name
local function get_language_display(lang)
  if not lang or lang == "" then
    return ""
  end
  return language_names[lang:lower()] or lang
end

--- Apply tree-sitter syntax highlighting to code block content
---@param bufnr number Buffer number
---@param block table Code block
---@param lang string Language identifier
local function apply_syntax_highlighting(bufnr, block, lang)
  if not lang or lang == "" then
    return
  end

  -- Map common language aliases
  local lang_map = {
    js = "javascript",
    ts = "typescript",
    py = "python",
    rb = "ruby",
    rs = "rust",
    sh = "bash",
    yml = "yaml",
    zsh = "bash",
    fish = "bash",
    shell = "bash",
  }
  local ts_lang = lang_map[lang:lower()] or lang:lower()

  -- Check if parser exists for this language
  local lang_ok = pcall(vim.treesitter.language.inspect, ts_lang)
  if not lang_ok then
    -- Try to add the language if it's available
    pcall(vim.treesitter.language.add, ts_lang)
    lang_ok = pcall(vim.treesitter.language.inspect, ts_lang)
    if not lang_ok then
      return
    end
  end

  -- Get the content lines (excluding fences)
  local start_line = block.start_line + 1
  local end_line = block.end_line - 1

  if end_line < start_line then
    return
  end

  -- Apply highlighting using tree-sitter
  local success, err = pcall(function()
    local content_lines = vim.api.nvim_buf_get_lines(bufnr, start_line, end_line + 1, false)
    if #content_lines == 0 then
      return
    end

    local content = table.concat(content_lines, "\n")
    if content == "" then
      return
    end

    local ts_parser = vim.treesitter.get_string_parser(content, ts_lang)
    if not ts_parser then
      return
    end

    local trees = ts_parser:parse()
    if not trees or #trees == 0 then
      return
    end

    local tree = trees[1]
    if not tree then
      return
    end

    local query = vim.treesitter.query.get(ts_lang, "highlights")
    if not query then
      return
    end

    for id, node, _ in query:iter_captures(tree:root(), content) do
      local name = query.captures[id]
      if name then
        -- Try language-specific highlight first, then generic
        local hl_group = "@" .. name .. "." .. ts_lang
        if vim.fn.hlexists(hl_group) == 0 then
          hl_group = "@" .. name
        end

        local node_start_row, node_start_col, node_end_row, node_end_col = node:range()

        -- Offset by the block start position
        local buf_start_row = start_line + node_start_row
        local buf_end_row = start_line + node_end_row

        -- Apply highlight with high priority (higher than background)
        vim.api.nvim_buf_set_extmark(bufnr, ns, buf_start_row, node_start_col, {
          end_row = buf_end_row,
          end_col = node_end_col,
          hl_group = hl_group,
          priority = 125, -- Higher than background (10), shows through
        })
      end
    end
  end)

  if not success and err then
    -- Silently fail - syntax highlighting is optional
  end
end

--- Render a code block
---@param bufnr number Buffer number
---@param block table Code block
---@param opts table|nil Render options
function M.render(bufnr, block, opts)
  opts = opts or {}

  local lang = block.language or ""
  local lang_display = get_language_display(lang)
  local width = opts.width or (utils.get_term_width() - 4)

  -- Get lines - fetch a few extra to find the closing fence if needed
  local search_end = math.min(block.end_line + 3, vim.api.nvim_buf_line_count(bufnr) - 1)
  local lines = vim.api.nvim_buf_get_lines(bufnr, block.start_line, search_end + 1, false)
  if #lines == 0 then
    return
  end

  -- Find the actual closing fence line (search for ```)
  local closing_line = block.end_line
  local closing_line_content = ""
  local closing_line_idx = nil

  for i, line in ipairs(lines) do
    if i > 1 and line:match("^```%s*$") then
      closing_line = block.start_line + i - 1
      closing_line_content = line
      closing_line_idx = i
      break
    end
  end

  -- If we didn't find a closing fence, use the block end
  if not closing_line_idx then
    closing_line = block.end_line
    local idx = closing_line - block.start_line + 1
    if idx <= #lines then
      closing_line_content = lines[idx]
    end
    closing_line_idx = idx
  end

  -- Limit lines to just the code block content
  local block_lines = {}
  for i = 1, closing_line_idx do
    table.insert(block_lines, lines[i])
  end
  lines = block_lines

  -- Top border with language label
  local top_border = utils.box_line(width, "top", lang_display)
  vim.api.nvim_buf_set_extmark(bufnr, ns, block.start_line, 0, {
    virt_text = { { top_border, "SlashMDCodeBlockBorder" } },
    virt_text_pos = "overlay",
    priority = 100,
  })

  -- Conceal opening fence (entire line)
  local opening_line_len = #lines[1]
  if opening_line_len > 0 then
    vim.api.nvim_buf_set_extmark(bufnr, ns, block.start_line, 0, {
      end_col = opening_line_len,
      conceal = "",
      priority = 100,
    })
  end

  -- Render content lines (between fences)
  local content_end = closing_line_idx and (closing_line_idx - 1) or (#lines - 1)
  for i = 2, content_end do
    local line_num = block.start_line + i - 1

    -- Background highlight (low priority so syntax highlighting shows through)
    vim.api.nvim_buf_set_extmark(bufnr, ns, line_num, 0, {
      end_row = line_num + 1,
      hl_group = "SlashMDCodeBlockBg",
      hl_eol = true,
      priority = 10,
    })

    -- Left border
    vim.api.nvim_buf_set_extmark(bufnr, ns, line_num, 0, {
      virt_text = { { "│ ", "SlashMDCodeBlockBorder" } },
      virt_text_pos = "inline",
      priority = 100,
    })
  end

  -- Bottom border and conceal closing fence
  if closing_line_idx and closing_line_idx > 1 then
    local bottom_border = utils.box_line(width, "bottom")

    -- Pad the bottom border to ensure it covers the ``` underneath
    local closing_len = #closing_line_content
    local padded_border = bottom_border .. string.rep(" ", math.max(0, closing_len - vim.fn.strdisplaywidth(bottom_border) + 5))

    -- Overlay bottom border (padded to cover underlying text)
    vim.api.nvim_buf_set_extmark(bufnr, ns, closing_line, 0, {
      virt_text = { { padded_border, "SlashMDCodeBlockBorder" } },
      virt_text_pos = "overlay",
      priority = 200,
    })

    -- Conceal the closing fence characters
    if closing_len > 0 then
      vim.api.nvim_buf_set_extmark(bufnr, ns, closing_line, 0, {
        end_col = closing_len,
        conceal = "",
        priority = 200,
      })
    end
  end

  -- Note: Syntax highlighting is handled by native tree-sitter markdown injections
  -- No custom highlighting needed - just ensure tree-sitter is enabled for the buffer
end

--- Create a code block
---@param content string|string[] Code content
---@param language string|nil Language identifier
---@return string[] Lines to insert
function M.create(content, language)
  local lines = { "```" .. (language or "") }

  if type(content) == "string" then
    for line in content:gmatch("[^\n]+") do
      table.insert(lines, line)
    end
    if content == "" or content:sub(-1) == "\n" then
      table.insert(lines, "")
    end
  else
    for _, line in ipairs(content) do
      table.insert(lines, line)
    end
  end

  table.insert(lines, "```")
  return lines
end

--- Extract content from a code block
---@param lines string[] Code block lines
---@return string Content, string|nil Language
function M.to_content(lines)
  if #lines < 2 then
    return "", nil
  end

  -- Extract language from first line
  local lang = lines[1]:match("^```(%S*)")

  -- Extract content (excluding fences)
  local content_lines = {}
  for i = 2, #lines - 1 do
    table.insert(content_lines, lines[i])
  end

  return table.concat(content_lines, "\n"), lang
end

--- Change the language of a code block
---@param bufnr number Buffer number
---@param block table Code block
---@param new_language string New language
function M.set_language(bufnr, block, new_language)
  local line = vim.api.nvim_buf_get_lines(bufnr, block.start_line, block.start_line + 1, false)[1]
  if not line then
    return
  end

  local new_line = "```" .. (new_language or "")
  vim.api.nvim_buf_set_lines(bufnr, block.start_line, block.start_line + 1, false, { new_line })
end

--- Copy code block content to clipboard
---@param block table Code block
function M.copy_content(block)
  local content = block.content or ""
  vim.fn.setreg("+", content)
  vim.fn.setreg('"', content)
  vim.notify("Code copied to clipboard", vim.log.levels.INFO)
end

return M
