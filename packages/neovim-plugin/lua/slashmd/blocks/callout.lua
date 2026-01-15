-- SlashMD Callout Block Renderer
-- GitHub-style callouts: > [!NOTE], > [!TIP], > [!WARNING], etc.

local M = {}

local config = require("slashmd.config")
local highlights = require("slashmd.highlights")
local state = require("slashmd.state")

local ns = state.namespace

-- Callout type metadata
local callout_types = {
  note = {
    title = "Note",
    icon = "󰋽 ",
    aliases = { "note", "info" },
  },
  tip = {
    title = "Tip",
    icon = "󰌶 ",
    aliases = { "tip", "hint" },
  },
  warning = {
    title = "Warning",
    icon = "󰀪 ",
    aliases = { "warning", "warn", "attention" },
  },
  important = {
    title = "Important",
    icon = "󰅾 ",
    aliases = { "important" },
  },
  caution = {
    title = "Caution",
    icon = "󰳦 ",
    aliases = { "caution", "danger" },
  },
}

--- Normalize callout type to canonical form
---@param type_str string Callout type string
---@return string Canonical callout type
local function normalize_type(type_str)
  local lower = type_str:lower()
  for canonical, meta in pairs(callout_types) do
    for _, alias in ipairs(meta.aliases) do
      if lower == alias then
        return canonical
      end
    end
  end
  return "note" -- Default fallback
end

--- Get metadata for a callout type
---@param callout_type string Callout type
---@return table Metadata
local function get_callout_meta(callout_type)
  return callout_types[callout_type] or callout_types.note
end

--- Render a callout block
---@param bufnr number Buffer number
---@param block table Callout block
---@param opts table|nil Render options
function M.render(bufnr, block, opts)
  opts = opts or {}

  local callout_type = normalize_type(block.callout_type or "note")
  local meta = get_callout_meta(callout_type)
  local fg_hl, bg_hl = highlights.get_callout_hl(callout_type)

  -- Get icon from config or use default
  local icon = config.get_icon("callout." .. callout_type)
  if icon == "" then
    icon = meta.icon
  end

  local border = config.get_icon("quote")
  local lines = vim.api.nvim_buf_get_lines(bufnr, block.start_line, block.end_line + 1, false)

  if #lines == 0 then
    return
  end

  -- First line: render title
  local first_line = lines[1]
  local custom_title = first_line:match("%[!%w+%]%s*(.+)$")
  local title = custom_title and custom_title ~= "" and custom_title or meta.title

  -- Find end of the callout marker
  local marker_end = first_line:find("%]")
  if marker_end then
    -- Check for custom title after the marker
    local after_marker = first_line:sub(marker_end + 1)
    if after_marker:match("^%s*$") then
      -- No custom title, use default
      title = meta.title
    else
      title = after_marker:gsub("^%s+", "")
    end
  end

  -- Conceal the > [!TYPE] marker
  if marker_end then
    vim.api.nvim_buf_set_extmark(bufnr, ns, block.start_line, 0, {
      end_col = marker_end + 1,
      conceal = "",
      priority = 100,
    })
  end

  -- Add border, icon, and title
  vim.api.nvim_buf_set_extmark(bufnr, ns, block.start_line, 0, {
    virt_text = {
      { border .. " ", fg_hl },
      { icon, fg_hl },
      { title, fg_hl },
    },
    virt_text_pos = "inline",
    priority = 100,
  })

  -- Apply background to first line
  vim.api.nvim_buf_set_extmark(bufnr, ns, block.start_line, 0, {
    end_row = block.start_line + 1,
    hl_group = bg_hl,
    hl_eol = true,
    priority = 25,
  })

  -- Render content lines (lines after the first)
  for i = 2, #lines do
    local line_num = block.start_line + i - 1
    local line = lines[i]

    -- Find and conceal the > marker
    local quote_end = line:find("^>%s*")
    if quote_end then
      vim.api.nvim_buf_set_extmark(bufnr, ns, line_num, 0, {
        end_col = quote_end,
        conceal = "",
        priority = 100,
      })
    end

    -- Add border
    vim.api.nvim_buf_set_extmark(bufnr, ns, line_num, 0, {
      virt_text = { { border .. " ", fg_hl } },
      virt_text_pos = "inline",
      priority = 100,
    })

    -- Apply background
    vim.api.nvim_buf_set_extmark(bufnr, ns, line_num, 0, {
      end_row = line_num + 1,
      hl_group = bg_hl,
      hl_eol = true,
      priority = 25,
    })
  end

  -- Add bottom padding line if configured
  if opts.bottom_padding then
    vim.api.nvim_buf_set_extmark(bufnr, ns, block.end_line, 0, {
      virt_lines = { { { "", "Normal" } } },
      virt_lines_above = false,
      priority = 50,
    })
  end
end

--- Create a callout block
---@param content string|string[] Callout content
---@param callout_type string|nil Callout type (defaults to "note")
---@return string[] Lines to insert
function M.create(content, callout_type)
  callout_type = callout_type or "note"
  local type_upper = callout_type:upper()

  local lines = { "> [!" .. type_upper .. "]" }

  if type(content) == "string" then
    for line in content:gmatch("[^\n]+") do
      table.insert(lines, "> " .. line)
    end
    if content == "" then
      table.insert(lines, "> ")
    end
  else
    for _, line in ipairs(content) do
      table.insert(lines, "> " .. line)
    end
    if #content == 0 then
      table.insert(lines, "> ")
    end
  end

  return lines
end

--- Extract content from a callout
---@param lines string[] Callout lines
---@return string Content, string Callout type
function M.to_content(lines)
  if #lines == 0 then
    return "", "note"
  end

  -- Extract type from first line
  local callout_type = lines[1]:match("%[!(%w+)%]") or "note"

  -- Extract content
  local content_lines = {}
  for i, line in ipairs(lines) do
    if i == 1 then
      -- Check for content after [!TYPE]
      local after = line:match("%[!%w+%]%s*(.+)$")
      if after and after ~= "" then
        table.insert(content_lines, after)
      end
    else
      local content = line:gsub("^>%s*", "")
      table.insert(content_lines, content)
    end
  end

  return table.concat(content_lines, "\n"), callout_type:lower()
end

--- Change callout type
---@param bufnr number Buffer number
---@param block table Callout block
---@param new_type string New callout type
function M.set_type(bufnr, block, new_type)
  local line = vim.api.nvim_buf_get_lines(bufnr, block.start_line, block.start_line + 1, false)[1]
  if not line then
    return
  end

  local new_line = line:gsub("%[!%w+%]", "[!" .. new_type:upper() .. "]")
  vim.api.nvim_buf_set_lines(bufnr, block.start_line, block.start_line + 1, false, { new_line })
end

--- Cycle through callout types
---@param bufnr number Buffer number
---@param block table Callout block
function M.cycle_type(bufnr, block)
  local types = { "note", "tip", "warning", "important", "caution" }
  local current = normalize_type(block.callout_type or "note")

  local current_idx = 1
  for i, t in ipairs(types) do
    if t == current then
      current_idx = i
      break
    end
  end

  local next_idx = (current_idx % #types) + 1
  M.set_type(bufnr, block, types[next_idx])
end

--- Get available callout types
---@return table[] List of {type, title, icon}
function M.get_types()
  local result = {}
  for type_name, meta in pairs(callout_types) do
    table.insert(result, {
      type = type_name,
      title = meta.title,
      icon = meta.icon,
    })
  end
  return result
end

return M
