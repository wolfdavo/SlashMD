-- SlashMD Image Block Renderer
-- Supports ASCII placeholder, Kitty graphics protocol, and iTerm2 inline images

local M = {}

local config = require("slashmd.config")
local state = require("slashmd.state")
local utils = require("slashmd.utils")

local ns = state.namespace

--- Check if a path is a URL
---@param path string Image path
---@return boolean
local function is_url(path)
  return path:match("^https?://") ~= nil
end

--- Check if a path is relative
---@param path string Image path
---@return boolean
local function is_relative(path)
  return not path:match("^[/~]") and not is_url(path)
end

--- Resolve image path relative to buffer
---@param bufnr number Buffer number
---@param path string Image path
---@return string Resolved path
local function resolve_path(bufnr, path)
  if is_url(path) or not is_relative(path) then
    return path
  end

  local buf_path = vim.api.nvim_buf_get_name(bufnr)
  if buf_path == "" then
    return path
  end

  local dir = vim.fn.fnamemodify(buf_path, ":h")
  return dir .. "/" .. path
end

--- Check if file exists
---@param path string File path
---@return boolean
local function file_exists(path)
  return vim.fn.filereadable(path) == 1
end

--- Get image dimensions (placeholder - would need external tool)
---@param path string Image path
---@return number|nil, number|nil width, height
local function get_image_size(path)
  -- This would require an external tool like ImageMagick's identify
  -- For now, return nil to indicate unknown size
  return nil, nil
end

--- Render image as ASCII placeholder
---@param bufnr number Buffer number
---@param block table Image block
---@param opts table|nil Render options
local function render_ascii(bufnr, block, opts)
  opts = opts or {}

  local icon = config.get_icon("image")
  local alt = block.content or ""
  local path = block.path or ""

  local line = vim.api.nvim_buf_get_lines(bufnr, block.start_line, block.start_line + 1, false)[1]
  if not line then
    return
  end

  -- Build display text
  local display_parts = {
    { icon, "SlashMDImage" },
    { " ", "Normal" },
  }

  if alt ~= "" then
    table.insert(display_parts, { alt, "SlashMDImage" })
    table.insert(display_parts, { " ", "Normal" })
  end

  -- Show path (truncated)
  local display_path = utils.truncate(path, 50)
  table.insert(display_parts, { "(" .. display_path .. ")", "SlashMDImagePath" })

  -- Check if file exists for local files
  if not is_url(path) then
    local resolved = resolve_path(bufnr, path)
    if not file_exists(resolved) then
      table.insert(display_parts, { " [not found]", "ErrorMsg" })
    end
  end

  -- Overlay the line
  vim.api.nvim_buf_set_extmark(bufnr, ns, block.start_line, 0, {
    virt_text = display_parts,
    virt_text_pos = "overlay",
    priority = 100,
  })

  -- Conceal original markdown
  vim.api.nvim_buf_set_extmark(bufnr, ns, block.start_line, 0, {
    end_col = #line,
    conceal = "",
    priority = 100,
  })
end

--- Render image using Kitty graphics protocol
---@param bufnr number Buffer number
---@param block table Image block
---@param opts table|nil Render options
local function render_kitty(bufnr, block, opts)
  opts = opts or {}

  local path = block.path or ""
  local resolved = resolve_path(bufnr, path)

  -- Fall back to ASCII if file doesn't exist or is a URL
  if is_url(path) or not file_exists(resolved) then
    render_ascii(bufnr, block, opts)
    return
  end

  -- For now, render ASCII placeholder
  -- Full Kitty implementation would require:
  -- 1. Reading the image file
  -- 2. Base64 encoding it
  -- 3. Sending escape sequences to the terminal
  -- This is complex and terminal-specific

  render_ascii(bufnr, block, opts)

  -- Add a note that Kitty rendering is available
  -- In a full implementation, we would use virtual lines to show the image
end

--- Render image using iTerm2 inline images
---@param bufnr number Buffer number
---@param block table Image block
---@param opts table|nil Render options
local function render_iterm(bufnr, block, opts)
  -- Similar to Kitty, this requires terminal escape sequences
  -- Fall back to ASCII for now
  render_ascii(bufnr, block, opts)
end

--- Main render function
---@param bufnr number Buffer number
---@param block table Image block
---@param opts table|nil Render options
function M.render(bufnr, block, opts)
  opts = opts or {}

  local image_mode = config.get().features.images

  if image_mode == "kitty" and utils.supports_kitty_graphics() then
    render_kitty(bufnr, block, opts)
  elseif image_mode == "iterm" and utils.supports_iterm_images() then
    render_iterm(bufnr, block, opts)
  else
    render_ascii(bufnr, block, opts)
  end
end

--- Create an image reference
---@param alt string Alt text
---@param path string Image path
---@return string[] Lines to insert
function M.create(alt, path)
  return { "![" .. (alt or "") .. "](" .. (path or "") .. ")" }
end

--- Extract image info from markdown
---@param line string Image line
---@return string|nil, string|nil Alt text, path
function M.parse(line)
  local alt, path = line:match("!%[(.-)%]%((.-)%)")
  return alt, path
end

--- Open image in external viewer
---@param block table Image block
---@param bufnr number Buffer number
function M.open_external(block, bufnr)
  local path = block.path or ""

  if is_url(path) then
    -- Open URL in browser
    local cmd
    if vim.fn.has("mac") == 1 then
      cmd = { "open", path }
    elseif vim.fn.has("unix") == 1 then
      cmd = { "xdg-open", path }
    else
      vim.notify("Cannot open URL on this platform", vim.log.levels.WARN)
      return
    end
    vim.fn.jobstart(cmd, { detach = true })
  else
    local resolved = resolve_path(bufnr, path)
    if file_exists(resolved) then
      local cmd
      if vim.fn.has("mac") == 1 then
        cmd = { "open", resolved }
      elseif vim.fn.has("unix") == 1 then
        cmd = { "xdg-open", resolved }
      else
        vim.notify("Cannot open file on this platform", vim.log.levels.WARN)
        return
      end
      vim.fn.jobstart(cmd, { detach = true })
    else
      vim.notify("Image file not found: " .. resolved, vim.log.levels.WARN)
    end
  end
end

--- Copy image path to clipboard
---@param block table Image block
---@param bufnr number Buffer number
function M.copy_path(block, bufnr)
  local path = block.path or ""
  local resolved = resolve_path(bufnr, path)

  vim.fn.setreg("+", resolved)
  vim.fn.setreg('"', resolved)
  vim.notify("Image path copied: " .. resolved, vim.log.levels.INFO)
end

--- Paste image from clipboard (placeholder for future implementation)
---@param bufnr number Buffer number
---@param line number Line to insert at
function M.paste_from_clipboard(bufnr, line)
  -- This would require:
  -- 1. Checking clipboard for image data
  -- 2. Saving to assets folder
  -- 3. Inserting markdown reference

  vim.notify("Clipboard paste not yet implemented", vim.log.levels.INFO)

  -- For now, insert a placeholder
  local timestamp = os.date("%Y%m%d_%H%M%S")
  local filename = "image_" .. timestamp .. ".png"
  local md = M.create("", "assets/" .. filename)

  vim.api.nvim_buf_set_lines(bufnr, line, line, false, md)
end

return M
