-- SlashMD Configuration Module

local M = {}

---@class SlashMDFeatures
---@field slash_menu boolean Enable slash menu
---@field block_navigation boolean Enable block navigation keymaps
---@field conceal boolean Enable concealing markdown syntax
---@field icons boolean Enable icons (requires nerd font)
---@field images string Image display mode: "kitty", "iterm", "ascii", "none"

---@class SlashMDTheme
---@field heading_colors table<string, string> Colors for h1-h6
---@field callout_colors table<string, string> Colors for callout types

---@class SlashMDKeymaps
---@field next_block string Keymap to go to next block
---@field prev_block string Keymap to go to previous block
---@field toggle_fold string Keymap to toggle fold
---@field delete_block string Keymap to delete block
---@field move_block_up string Keymap to move block up
---@field move_block_down string Keymap to move block down

---@class SlashMDAssets
---@field folder string Folder name for assets
---@field clipboard_paste boolean Enable clipboard paste for images

---@class SlashMDConfig
---@field auto_enable boolean Auto-enable for markdown files
---@field features SlashMDFeatures
---@field theme SlashMDTheme
---@field keymaps SlashMDKeymaps
---@field assets SlashMDAssets

---@type SlashMDConfig
local defaults = {
  auto_enable = true,

  features = {
    slash_menu = true,
    block_navigation = true,
    conceal = true,
    icons = true,
    images = "none", -- Start conservative, can enable kitty/iterm later
  },

  theme = {
    heading_colors = {
      h1 = "#FF6B6B",
      h2 = "#4ECDC4",
      h3 = "#45B7D1",
      h4 = "#96CEB4",
      h5 = "#FFEAA7",
      h6 = "#DDA0DD",
    },
    callout_colors = {
      note = "#61AFEF",
      tip = "#98C379",
      warning = "#E5C07B",
      important = "#C678DD",
      caution = "#E06C75",
    },
    code_block = {
      border = "#3E4451",
      background = "#282C34",
      language_label = "#ABB2BF",
    },
    todo = {
      checked = "#98C379",
      unchecked = "#5C6370",
    },
  },

  keymaps = {
    next_block = "]b",
    prev_block = "[b",
    toggle_fold = "<Tab>",
    delete_block = "<leader>bd",
    move_block_up = "<leader>bk",
    move_block_down = "<leader>bj",
    transform_block = "<leader>bt",
  },

  assets = {
    folder = "assets",
    clipboard_paste = true,
  },

  -- Icons (requires nerd font)
  icons = {
    heading = { "󰉫 ", "󰉬 ", "󰉭 ", "󰉮 ", "󰉯 ", "󰉰 " },
    bullet = "•",
    checkbox_checked = "☑",
    checkbox_unchecked = "☐",
    quote = "┃",
    callout = {
      note = "󰋽 ",
      tip = "󰌶 ",
      warning = "󰀪 ",
      important = "󰅾 ",
      caution = "󰳦 ",
    },
    toggle_collapsed = "▶",
    toggle_expanded = "▼",
    horizontal_rule = "─",
    code_block = "󰅩 ",
    image = "󰥶 ",
  },
}

---@type SlashMDConfig
local config = vim.deepcopy(defaults)

--- Deep merge two tables
---@param t1 table Base table
---@param t2 table Table to merge
---@return table Merged table
local function deep_merge(t1, t2)
  local result = vim.deepcopy(t1)
  for k, v in pairs(t2) do
    if type(v) == "table" and type(result[k]) == "table" then
      result[k] = deep_merge(result[k], v)
    else
      result[k] = v
    end
  end
  return result
end

--- Setup configuration with user options
---@param opts table|nil User options
function M.setup(opts)
  if opts then
    config = deep_merge(defaults, opts)
  else
    config = vim.deepcopy(defaults)
  end
end

--- Get current configuration
---@return SlashMDConfig
function M.get()
  return config
end

--- Get a specific config value by path
---@param path string Dot-separated path (e.g., "theme.heading_colors.h1")
---@return any
function M.get_value(path)
  local parts = vim.split(path, ".", { plain = true })
  local value = config
  for _, part in ipairs(parts) do
    if type(value) ~= "table" then
      return nil
    end
    value = value[part]
  end
  return value
end

--- Get icon by name
---@param name string Icon name
---@return string
function M.get_icon(name)
  if not config.features.icons then
    return ""
  end

  local parts = vim.split(name, ".", { plain = true })
  local icon = config.icons
  for _, part in ipairs(parts) do
    if type(icon) ~= "table" then
      return ""
    end
    icon = icon[part]
  end

  return type(icon) == "string" and icon or ""
end

return M
