-- SlashMD Toggle Block Renderer
-- Collapsible sections using <details>/<summary> HTML

local M = {}

local config = require("slashmd.config")
local state = require("slashmd.state")
local utils = require("slashmd.utils")

local ns = state.namespace

--- Parse a toggle block to extract summary and content
---@param lines string[] Block lines
---@return string, string[] Summary, content lines
local function parse_toggle(lines)
  local summary = "Details"
  local content = {}
  local in_content = false

  for _, line in ipairs(lines) do
    if line:match("<summary>") then
      summary = line:match("<summary>(.+)</summary>") or line:match("<summary>(.+)") or "Details"
      summary = summary:gsub("</summary>", "")
    elseif line:match("</summary>") then
      -- Summary closed, content starts
      in_content = true
    elseif line:match("<details") or line:match("</details>") then
      -- Skip opening/closing tags
    elseif in_content or not line:match("<summary") then
      -- Part of content
      if line:match("^%s*$") == nil or #content > 0 then
        table.insert(content, line)
      end
    end
  end

  -- Trim trailing empty lines
  while #content > 0 and content[#content]:match("^%s*$") do
    table.remove(content)
  end

  return summary, content
end

--- Render a toggle block
---@param bufnr number Buffer number
---@param block table Toggle block
---@param opts table|nil Render options
function M.render(bufnr, block, opts)
  opts = opts or {}

  local lines = vim.api.nvim_buf_get_lines(bufnr, block.start_line, block.end_line + 1, false)
  if #lines == 0 then
    return
  end

  local summary, content = parse_toggle(lines)
  local is_collapsed = state.is_collapsed(bufnr, block.id)

  -- Get icons
  local icon = is_collapsed and config.get_icon("toggle_collapsed") or config.get_icon("toggle_expanded")

  -- Render the summary line
  local first_line = lines[1]
  local summary_parts = {
    { icon .. " ", "SlashMDToggleIcon" },
    { summary, "SlashMDToggle" },
  }

  vim.api.nvim_buf_set_extmark(bufnr, ns, block.start_line, 0, {
    virt_text = summary_parts,
    virt_text_pos = "overlay",
    priority = 100,
  })

  -- Conceal the <details><summary> line
  vim.api.nvim_buf_set_extmark(bufnr, ns, block.start_line, 0, {
    end_col = #first_line,
    conceal = "",
    priority = 100,
  })

  if is_collapsed then
    -- Hide all content lines when collapsed
    for i = 2, #lines do
      local line_num = block.start_line + i - 1
      vim.api.nvim_buf_set_extmark(bufnr, ns, line_num, 0, {
        end_col = #lines[i],
        conceal = "",
        priority = 100,
      })

      -- Make the line appear empty
      vim.api.nvim_buf_set_extmark(bufnr, ns, line_num, 0, {
        virt_text = { { "", "Normal" } },
        virt_text_pos = "overlay",
        priority = 100,
      })
    end
  else
    -- Show content with indentation
    for i = 2, #lines do
      local line_num = block.start_line + i - 1
      local line = lines[i]

      -- Skip HTML tags
      if line:match("</summary>") or line:match("</details>") then
        vim.api.nvim_buf_set_extmark(bufnr, ns, line_num, 0, {
          end_col = #line,
          conceal = "",
          priority = 100,
        })
      else
        -- Add indentation for content
        vim.api.nvim_buf_set_extmark(bufnr, ns, line_num, 0, {
          virt_text = { { "  ", "Normal" } },
          virt_text_pos = "inline",
          priority = 100,
        })
      end
    end
  end
end

--- Toggle the collapsed state
---@param bufnr number Buffer number
---@param block table Toggle block
---@return boolean New collapsed state
function M.toggle(bufnr, block)
  return state.toggle_collapsed(bufnr, block.id)
end

--- Create a toggle block
---@param summary string Summary text
---@param content string|string[] Content
---@return string[] Lines to insert
function M.create(summary, content)
  local lines = {
    "<details>",
    "<summary>" .. (summary or "Details") .. "</summary>",
    "",
  }

  if type(content) == "string" then
    for line in content:gmatch("[^\n]+") do
      table.insert(lines, line)
    end
  else
    for _, line in ipairs(content or {}) do
      table.insert(lines, line)
    end
  end

  if #lines == 3 then
    table.insert(lines, "")
  end

  table.insert(lines, "</details>")

  return lines
end

--- Convert a block to a toggle
---@param summary string Summary text
---@param content_lines string[] Content lines
---@return string[] Toggle lines
function M.from_content(summary, content_lines)
  return M.create(summary, content_lines)
end

--- Extract content from a toggle
---@param lines string[] Toggle lines
---@return string, string[] Summary, content
function M.to_content(lines)
  return parse_toggle(lines)
end

--- Check if a line starts a toggle block
---@param line string Line to check
---@return boolean
function M.is_toggle_start(line)
  return line:match("<details") ~= nil
end

--- Check if a line ends a toggle block
---@param line string Line to check
---@return boolean
function M.is_toggle_end(line)
  return line:match("</details>") ~= nil
end

--- Set the summary text
---@param bufnr number Buffer number
---@param block table Toggle block
---@param new_summary string New summary
function M.set_summary(bufnr, block, new_summary)
  local lines = vim.api.nvim_buf_get_lines(bufnr, block.start_line, block.end_line + 1, false)

  for i, line in ipairs(lines) do
    if line:match("<summary>") then
      local new_line = "<summary>" .. new_summary .. "</summary>"
      vim.api.nvim_buf_set_lines(bufnr, block.start_line + i - 1, block.start_line + i, false, { new_line })
      return
    end
  end
end

return M
