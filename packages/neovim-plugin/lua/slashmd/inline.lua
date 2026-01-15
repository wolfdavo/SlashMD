-- SlashMD Inline Formatting Module
-- Handles bold, italic, strikethrough, inline code, and links

local M = {}

local state = require("slashmd.state")
local config = require("slashmd.config")

local ns = state.namespace

-- Pattern definitions for inline elements
-- Order matters: more specific patterns should come first
local patterns = {
  -- Bold + Italic (***text*** or ___text___)
  {
    pattern = "%*%*%*(.-)%*%*%*",
    hl_group = "SlashMDBoldItalic",
    marker_len = 3,
  },
  {
    pattern = "___(.-)___",
    hl_group = "SlashMDBoldItalic",
    marker_len = 3,
  },
  -- Bold (**text** or __text__)
  {
    pattern = "%*%*(.-)%*%*",
    hl_group = "SlashMDBold",
    marker_len = 2,
  },
  {
    pattern = "__(.-)__",
    hl_group = "SlashMDBold",
    marker_len = 2,
  },
  -- Italic (*text* or _text_)
  {
    pattern = "%*(.-)%*",
    hl_group = "SlashMDItalic",
    marker_len = 1,
  },
  {
    pattern = "_(.-)_",
    hl_group = "SlashMDItalic",
    marker_len = 1,
  },
  -- Strikethrough (~~text~~)
  {
    pattern = "~~(.-)~~",
    hl_group = "SlashMDStrikethrough",
    marker_len = 2,
  },
  -- Inline code (`text`)
  {
    pattern = "`([^`]+)`",
    hl_group = "SlashMDCode",
    marker_len = 1,
  },
}

-- Link patterns
local link_pattern = "%[([^%]]+)%]%(([^%)]+)%)"
local reference_link_pattern = "%[([^%]]+)%]%[([^%]]+)%]"

--- Find all inline formatting in a line
---@param line string Line content
---@return table[] List of {start, end_pos, hl_group, marker_len, content}
local function find_inline_formats(line)
  local formats = {}

  for _, pat in ipairs(patterns) do
    local search_start = 1
    while true do
      local match_start, match_end, content = line:find(pat.pattern, search_start)
      if not match_start then
        break
      end

      -- Check this isn't inside a code span (if not already a code pattern)
      local is_valid = true
      if pat.hl_group ~= "SlashMDCode" then
        -- Count backticks before this position
        local prefix = line:sub(1, match_start - 1)
        local backtick_count = select(2, prefix:gsub("`", ""))
        if backtick_count % 2 == 1 then
          is_valid = false
        end
      end

      if is_valid then
        table.insert(formats, {
          start = match_start - 1, -- 0-indexed
          end_pos = match_end,
          hl_group = pat.hl_group,
          marker_len = pat.marker_len,
          content = content,
        })
      end

      search_start = match_end + 1
    end
  end

  return formats
end

--- Find all links in a line
---@param line string Line content
---@return table[] List of {start, end_pos, text, url}
local function find_links(line)
  local links = {}
  local search_start = 1

  while true do
    local match_start, match_end, text, url = line:find(link_pattern, search_start)
    if not match_start then
      break
    end

    table.insert(links, {
      start = match_start - 1,
      end_pos = match_end,
      text = text,
      url = url,
    })

    search_start = match_end + 1
  end

  return links
end

--- Render inline formatting for a line
---@param bufnr number Buffer number
---@param line_num number 0-indexed line number
---@param line string Line content
---@param opts table|nil Render options
function M.render_line(bufnr, line_num, line, opts)
  opts = opts or {}

  if not config.get().features.conceal then
    return
  end

  -- Find and render inline formats
  local formats = find_inline_formats(line)

  for _, fmt in ipairs(formats) do
    -- Conceal opening marker
    vim.api.nvim_buf_set_extmark(bufnr, ns, line_num, fmt.start, {
      end_col = fmt.start + fmt.marker_len,
      conceal = "",
      priority = 200,
    })

    -- Conceal closing marker
    vim.api.nvim_buf_set_extmark(bufnr, ns, line_num, fmt.end_pos - fmt.marker_len, {
      end_col = fmt.end_pos,
      conceal = "",
      priority = 200,
    })

    -- Apply highlight to content
    vim.api.nvim_buf_set_extmark(bufnr, ns, line_num, fmt.start + fmt.marker_len, {
      end_col = fmt.end_pos - fmt.marker_len,
      hl_group = fmt.hl_group,
      priority = 150,
    })
  end

  -- Find and render links
  local links = find_links(line)

  for _, link in ipairs(links) do
    -- Conceal the markdown syntax, show just the text
    -- ![text](url) -> text with link highlight

    local bracket_start = link.start
    local bracket_end = link.start + 1 + #link.text + 1 -- [text]
    local paren_start = bracket_end
    local paren_end = link.end_pos

    -- Conceal opening [
    vim.api.nvim_buf_set_extmark(bufnr, ns, line_num, bracket_start, {
      end_col = bracket_start + 1,
      conceal = "",
      priority = 200,
    })

    -- Conceal closing ] and (url)
    vim.api.nvim_buf_set_extmark(bufnr, ns, line_num, bracket_end - 1, {
      end_col = paren_end,
      conceal = "",
      priority = 200,
    })

    -- Highlight link text
    vim.api.nvim_buf_set_extmark(bufnr, ns, line_num, bracket_start + 1, {
      end_col = bracket_end - 1,
      hl_group = "SlashMDLink",
      priority = 150,
    })

    -- Add URL as virtual text on hover (optional)
    if opts.show_url then
      vim.api.nvim_buf_set_extmark(bufnr, ns, line_num, bracket_end - 1, {
        virt_text = { { " → " .. link.url, "Comment" } },
        virt_text_pos = "inline",
        priority = 150,
      })
    end
  end
end

--- Render inline formatting for all lines in a block
---@param bufnr number Buffer number
---@param block table Block with start_line and end_line
---@param opts table|nil Render options
function M.render_block(bufnr, block, opts)
  opts = opts or {}

  -- Skip code blocks - they shouldn't have inline formatting
  if block.type == "code_block" then
    return
  end

  local lines = vim.api.nvim_buf_get_lines(bufnr, block.start_line, block.end_line + 1, false)

  for i, line in ipairs(lines) do
    local line_num = block.start_line + i - 1
    M.render_line(bufnr, line_num, line, opts)
  end
end

--- Setup additional highlight groups for inline formatting
function M.setup_highlights()
  -- Combined bold + italic
  vim.api.nvim_set_hl(0, "SlashMDBoldItalic", { bold = true, italic = true })
end

--- Toggle bold at cursor position
---@param bufnr number Buffer number
function M.toggle_bold(bufnr)
  local row, col = unpack(vim.api.nvim_win_get_cursor(0))
  row = row - 1

  local line = vim.api.nvim_buf_get_lines(bufnr, row, row + 1, false)[1]
  if not line then
    return
  end

  -- Check if cursor is inside bold markers
  local before = line:sub(1, col)
  local after = line:sub(col + 1)

  -- Simple toggle: wrap selection or word under cursor
  local word_start, word_end = line:find("%S+", col + 1)
  if word_start and word_start <= col + 1 then
    -- Find word boundaries
    local ws = col
    while ws > 0 and line:sub(ws, ws):match("%S") do
      ws = ws - 1
    end
    ws = ws + 1

    local we = col + 1
    while we <= #line and line:sub(we, we):match("%S") do
      we = we + 1
    end
    we = we - 1

    local word = line:sub(ws, we)

    -- Check if already bold
    if word:match("^%*%*.*%*%*$") then
      -- Remove bold
      local new_word = word:sub(3, -3)
      local new_line = line:sub(1, ws - 1) .. new_word .. line:sub(we + 1)
      vim.api.nvim_buf_set_lines(bufnr, row, row + 1, false, { new_line })
    else
      -- Add bold
      local new_word = "**" .. word .. "**"
      local new_line = line:sub(1, ws - 1) .. new_word .. line:sub(we + 1)
      vim.api.nvim_buf_set_lines(bufnr, row, row + 1, false, { new_line })
    end
  end
end

--- Toggle italic at cursor position
---@param bufnr number Buffer number
function M.toggle_italic(bufnr)
  local row, col = unpack(vim.api.nvim_win_get_cursor(0))
  row = row - 1

  local line = vim.api.nvim_buf_get_lines(bufnr, row, row + 1, false)[1]
  if not line then
    return
  end

  local ws = col
  while ws > 0 and line:sub(ws, ws):match("%S") do
    ws = ws - 1
  end
  ws = ws + 1

  local we = col + 1
  while we <= #line and line:sub(we, we):match("%S") do
    we = we + 1
  end
  we = we - 1

  local word = line:sub(ws, we)

  if word:match("^%*.*%*$") and not word:match("^%*%*") then
    local new_word = word:sub(2, -2)
    local new_line = line:sub(1, ws - 1) .. new_word .. line:sub(we + 1)
    vim.api.nvim_buf_set_lines(bufnr, row, row + 1, false, { new_line })
  else
    local new_word = "*" .. word .. "*"
    local new_line = line:sub(1, ws - 1) .. new_word .. line:sub(we + 1)
    vim.api.nvim_buf_set_lines(bufnr, row, row + 1, false, { new_line })
  end
end

--- Toggle inline code at cursor position
---@param bufnr number Buffer number
function M.toggle_code(bufnr)
  local row, col = unpack(vim.api.nvim_win_get_cursor(0))
  row = row - 1

  local line = vim.api.nvim_buf_get_lines(bufnr, row, row + 1, false)[1]
  if not line then
    return
  end

  local ws = col
  while ws > 0 and line:sub(ws, ws):match("%S") do
    ws = ws - 1
  end
  ws = ws + 1

  local we = col + 1
  while we <= #line and line:sub(we, we):match("%S") do
    we = we + 1
  end
  we = we - 1

  local word = line:sub(ws, we)

  if word:match("^`.*`$") then
    local new_word = word:sub(2, -2)
    local new_line = line:sub(1, ws - 1) .. new_word .. line:sub(we + 1)
    vim.api.nvim_buf_set_lines(bufnr, row, row + 1, false, { new_line })
  else
    local new_word = "`" .. word .. "`"
    local new_line = line:sub(1, ws - 1) .. new_word .. line:sub(we + 1)
    vim.api.nvim_buf_set_lines(bufnr, row, row + 1, false, { new_line })
  end
end

--- Insert a link
---@param bufnr number Buffer number
---@param text string|nil Link text (uses selection or word under cursor if nil)
---@param url string|nil URL
function M.insert_link(bufnr, text, url)
  local row, col = unpack(vim.api.nvim_win_get_cursor(0))
  row = row - 1

  local line = vim.api.nvim_buf_get_lines(bufnr, row, row + 1, false)[1]
  if not line then
    return
  end

  text = text or ""
  url = url or ""

  local link = "[" .. text .. "](" .. url .. ")"
  local new_line = line:sub(1, col) .. link .. line:sub(col + 1)

  vim.api.nvim_buf_set_lines(bufnr, row, row + 1, false, { new_line })

  -- Position cursor at URL position
  vim.api.nvim_win_set_cursor(0, { row + 1, col + #text + 3 })
end

return M
