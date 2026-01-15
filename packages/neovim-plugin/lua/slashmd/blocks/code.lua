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

--- Render a code block
---@param bufnr number Buffer number
---@param block table Code block
---@param opts table|nil Render options
function M.render(bufnr, block, opts)
  opts = opts or {}

  local lang = block.language or ""
  local lang_display = get_language_display(lang)
  local width = opts.width or (utils.get_term_width() - 4)

  -- Get lines
  local lines = vim.api.nvim_buf_get_lines(bufnr, block.start_line, block.end_line + 1, false)
  if #lines == 0 then
    return
  end

  -- Top border with language label
  local top_border = utils.box_line(width, "top", lang_display)
  vim.api.nvim_buf_set_extmark(bufnr, ns, block.start_line, 0, {
    virt_text = { { top_border, "SlashMDCodeBlockBorder" } },
    virt_text_pos = "overlay",
    priority = 100,
  })

  -- Conceal opening fence
  vim.api.nvim_buf_set_extmark(bufnr, ns, block.start_line, 0, {
    end_row = block.start_line,
    end_col = #lines[1],
    conceal = "",
    priority = 100,
  })

  -- Render content lines
  for i = 2, #lines - 1 do
    local line_num = block.start_line + i - 1

    -- Background highlight
    vim.api.nvim_buf_set_extmark(bufnr, ns, line_num, 0, {
      end_row = line_num + 1,
      hl_group = "SlashMDCodeBlockBg",
      hl_eol = true,
      priority = 25,
    })

    -- Left border
    vim.api.nvim_buf_set_extmark(bufnr, ns, line_num, 0, {
      virt_text = { { "│ ", "SlashMDCodeBlockBorder" } },
      virt_text_pos = "inline",
      priority = 100,
    })

    -- Right border (as virtual text at end of line)
    if opts.right_border then
      local line_content = lines[i]
      local padding = math.max(0, width - #line_content - 4)
      vim.api.nvim_buf_set_extmark(bufnr, ns, line_num, #line_content, {
        virt_text = { { string.rep(" ", padding) .. " │", "SlashMDCodeBlockBorder" } },
        virt_text_pos = "eol",
        priority = 100,
      })
    end
  end

  -- Bottom border
  if #lines > 1 then
    local bottom_border = utils.box_line(width, "bottom")
    vim.api.nvim_buf_set_extmark(bufnr, ns, block.end_line, 0, {
      virt_text = { { bottom_border, "SlashMDCodeBlockBorder" } },
      virt_text_pos = "overlay",
      priority = 100,
    })

    -- Conceal closing fence
    vim.api.nvim_buf_set_extmark(bufnr, ns, block.end_line, 0, {
      end_row = block.end_line,
      end_col = #lines[#lines],
      conceal = "",
      priority = 100,
    })
  end

  -- Add line numbers if configured
  if opts.line_numbers then
    for i = 2, #lines - 1 do
      local line_num = block.start_line + i - 1
      local display_num = tostring(i - 1)
      vim.api.nvim_buf_set_extmark(bufnr, ns, line_num, 0, {
        sign_text = display_num,
        sign_hl_group = "SlashMDCodeBlockLang",
        priority = 50,
      })
    end
  end
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
