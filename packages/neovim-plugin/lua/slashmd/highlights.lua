-- SlashMD Highlight Groups

local M = {}

--- Setup highlight groups
function M.setup()
  local config = require("slashmd.config").get()
  local theme = config.theme

  -- Heading highlights
  local heading_colors = theme.heading_colors
  vim.api.nvim_set_hl(0, "SlashMDHeading1", { fg = heading_colors.h1, bold = true })
  vim.api.nvim_set_hl(0, "SlashMDHeading2", { fg = heading_colors.h2, bold = true })
  vim.api.nvim_set_hl(0, "SlashMDHeading3", { fg = heading_colors.h3, bold = true })
  vim.api.nvim_set_hl(0, "SlashMDHeading4", { fg = heading_colors.h4, bold = true })
  vim.api.nvim_set_hl(0, "SlashMDHeading5", { fg = heading_colors.h5, bold = true })
  vim.api.nvim_set_hl(0, "SlashMDHeading6", { fg = heading_colors.h6, bold = true })

  -- Heading icons (slightly dimmer)
  vim.api.nvim_set_hl(0, "SlashMDHeadingIcon1", { fg = heading_colors.h1 })
  vim.api.nvim_set_hl(0, "SlashMDHeadingIcon2", { fg = heading_colors.h2 })
  vim.api.nvim_set_hl(0, "SlashMDHeadingIcon3", { fg = heading_colors.h3 })
  vim.api.nvim_set_hl(0, "SlashMDHeadingIcon4", { fg = heading_colors.h4 })
  vim.api.nvim_set_hl(0, "SlashMDHeadingIcon5", { fg = heading_colors.h5 })
  vim.api.nvim_set_hl(0, "SlashMDHeadingIcon6", { fg = heading_colors.h6 })

  -- Callout highlights
  local callout_colors = theme.callout_colors
  vim.api.nvim_set_hl(0, "SlashMDCalloutNote", { fg = callout_colors.note })
  vim.api.nvim_set_hl(0, "SlashMDCalloutTip", { fg = callout_colors.tip })
  vim.api.nvim_set_hl(0, "SlashMDCalloutWarning", { fg = callout_colors.warning })
  vim.api.nvim_set_hl(0, "SlashMDCalloutImportant", { fg = callout_colors.important })
  vim.api.nvim_set_hl(0, "SlashMDCalloutCaution", { fg = callout_colors.caution })

  -- Callout backgrounds (subtle)
  vim.api.nvim_set_hl(0, "SlashMDCalloutNoteBg", { bg = M.darken(callout_colors.note, 0.15) })
  vim.api.nvim_set_hl(0, "SlashMDCalloutTipBg", { bg = M.darken(callout_colors.tip, 0.15) })
  vim.api.nvim_set_hl(0, "SlashMDCalloutWarningBg", { bg = M.darken(callout_colors.warning, 0.15) })
  vim.api.nvim_set_hl(0, "SlashMDCalloutImportantBg", { bg = M.darken(callout_colors.important, 0.15) })
  vim.api.nvim_set_hl(0, "SlashMDCalloutCautionBg", { bg = M.darken(callout_colors.caution, 0.15) })

  -- Code block highlights
  local code = theme.code_block
  vim.api.nvim_set_hl(0, "SlashMDCodeBlockBorder", { fg = code.border })
  vim.api.nvim_set_hl(0, "SlashMDCodeBlockBg", { bg = code.background })
  vim.api.nvim_set_hl(0, "SlashMDCodeBlockLang", { fg = code.language_label, italic = true })

  -- Todo highlights
  local todo = theme.todo
  vim.api.nvim_set_hl(0, "SlashMDTodoChecked", { fg = todo.checked, strikethrough = true })
  vim.api.nvim_set_hl(0, "SlashMDTodoUnchecked", { fg = todo.unchecked })
  vim.api.nvim_set_hl(0, "SlashMDTodoCheckbox", { fg = todo.checked, bold = true })
  vim.api.nvim_set_hl(0, "SlashMDTodoCheckboxEmpty", { fg = todo.unchecked })

  -- List highlights
  vim.api.nvim_set_hl(0, "SlashMDBullet", { fg = "#61AFEF" })
  vim.api.nvim_set_hl(0, "SlashMDNumberedList", { fg = "#E5C07B" })

  -- Blockquote
  vim.api.nvim_set_hl(0, "SlashMDBlockquote", { fg = "#5C6370", italic = true })
  vim.api.nvim_set_hl(0, "SlashMDBlockquoteBorder", { fg = "#4B5263" })

  -- Horizontal rule
  vim.api.nvim_set_hl(0, "SlashMDHorizontalRule", { fg = "#3E4451" })

  -- Image
  vim.api.nvim_set_hl(0, "SlashMDImage", { fg = "#C678DD" })
  vim.api.nvim_set_hl(0, "SlashMDImagePath", { fg = "#5C6370", italic = true })

  -- Toggle
  vim.api.nvim_set_hl(0, "SlashMDToggle", { fg = "#ABB2BF" })
  vim.api.nvim_set_hl(0, "SlashMDToggleIcon", { fg = "#61AFEF" })

  -- Inline formatting
  vim.api.nvim_set_hl(0, "SlashMDBold", { bold = true })
  vim.api.nvim_set_hl(0, "SlashMDItalic", { italic = true })
  vim.api.nvim_set_hl(0, "SlashMDStrikethrough", { strikethrough = true })
  vim.api.nvim_set_hl(0, "SlashMDCode", { bg = "#3E4451", fg = "#E5C07B" })
  vim.api.nvim_set_hl(0, "SlashMDLink", { fg = "#61AFEF", underline = true })

  -- Slash menu
  vim.api.nvim_set_hl(0, "SlashMDMenuNormal", { link = "NormalFloat" })
  vim.api.nvim_set_hl(0, "SlashMDMenuBorder", { link = "FloatBorder" })
  vim.api.nvim_set_hl(0, "SlashMDMenuSelected", { link = "PmenuSel" })
  vim.api.nvim_set_hl(0, "SlashMDMenuMatch", { fg = "#E5C07B", bold = true })
end

--- Darken a hex color
---@param hex string Hex color (e.g., "#FF6B6B")
---@param factor number Factor to darken (0-1)
---@return string Darkened hex color
function M.darken(hex, factor)
  -- Parse hex color
  local r = tonumber(hex:sub(2, 3), 16)
  local g = tonumber(hex:sub(4, 5), 16)
  local b = tonumber(hex:sub(6, 7), 16)

  if not r or not g or not b then
    return hex
  end

  -- Darken
  r = math.floor(r * factor)
  g = math.floor(g * factor)
  b = math.floor(b * factor)

  return string.format("#%02x%02x%02x", r, g, b)
end

--- Get highlight group for callout type
---@param callout_type string Callout type
---@return string, string fg_hl, bg_hl
function M.get_callout_hl(callout_type)
  local type_map = {
    note = { "SlashMDCalloutNote", "SlashMDCalloutNoteBg" },
    tip = { "SlashMDCalloutTip", "SlashMDCalloutTipBg" },
    warning = { "SlashMDCalloutWarning", "SlashMDCalloutWarningBg" },
    important = { "SlashMDCalloutImportant", "SlashMDCalloutImportantBg" },
    caution = { "SlashMDCalloutCaution", "SlashMDCalloutCautionBg" },
  }

  local hl = type_map[callout_type] or type_map.note
  return hl[1], hl[2]
end

--- Get highlight group for heading depth
---@param depth number Heading depth (1-6)
---@return string, string text_hl, icon_hl
function M.get_heading_hl(depth)
  local text_hl = "SlashMDHeading" .. depth
  local icon_hl = "SlashMDHeadingIcon" .. depth
  return text_hl, icon_hl
end

return M
