-- SlashMD Clipboard Module
-- Handles clipboard image paste and asset management

local M = {}

local config = require("slashmd.config")
local utils = require("slashmd.utils")

--- Get the assets folder path relative to the buffer's file
---@param bufnr number Buffer number
---@return string|nil Assets folder path
local function get_assets_folder(bufnr)
  local buf_path = vim.api.nvim_buf_get_name(bufnr)
  if buf_path == "" then
    return nil
  end

  local dir = vim.fn.fnamemodify(buf_path, ":h")
  local assets_folder = config.get().assets.folder
  return dir .. "/" .. assets_folder
end

--- Ensure the assets folder exists
---@param folder string Folder path
---@return boolean Success
local function ensure_folder_exists(folder)
  if vim.fn.isdirectory(folder) == 0 then
    local ok = vim.fn.mkdir(folder, "p")
    return ok == 1
  end
  return true
end

--- Generate a unique filename for an image
---@param extension string File extension
---@return string Filename
local function generate_filename(extension)
  local timestamp = os.date("%Y%m%d_%H%M%S")
  local random = math.random(1000, 9999)
  return string.format("image_%s_%d.%s", timestamp, random, extension)
end

--- Check if clipboard has image data (macOS)
---@return boolean
local function clipboard_has_image_macos()
  local result = vim.fn.system("osascript -e 'clipboard info'")
  return result:match("TIFF") ~= nil or result:match("PNG") ~= nil or result:match("JPEG") ~= nil
end

--- Check if clipboard has image data (Linux with xclip)
---@return boolean
local function clipboard_has_image_linux()
  local result = vim.fn.system("xclip -selection clipboard -t TARGETS -o 2>/dev/null")
  return result:match("image/png") ~= nil or result:match("image/jpeg") ~= nil
end

--- Check if clipboard has image data
---@return boolean
function M.has_image()
  if vim.fn.has("mac") == 1 then
    return clipboard_has_image_macos()
  elseif vim.fn.has("unix") == 1 then
    return clipboard_has_image_linux()
  end
  return false
end

--- Save clipboard image to file (macOS)
---@param filepath string Target file path
---@return boolean Success
local function save_image_macos(filepath)
  -- Use AppleScript to save clipboard image as PNG
  local script = string.format(
    [[
    osascript -e '
    set theFile to POSIX file "%s"
    try
      set imageData to the clipboard as «class PNGf»
      set fileRef to open for access theFile with write permission
      write imageData to fileRef
      close access fileRef
      return "success"
    on error
      try
        close access theFile
      end try
      return "error"
    end try
    '
  ]],
    filepath
  )

  local result = vim.fn.system(script)
  return result:match("success") ~= nil
end

--- Save clipboard image to file (Linux with xclip)
---@param filepath string Target file path
---@return boolean Success
local function save_image_linux(filepath)
  local cmd = string.format("xclip -selection clipboard -t image/png -o > %s 2>/dev/null", vim.fn.shellescape(filepath))
  local result = os.execute(cmd)
  return result == 0
end

--- Save clipboard image to file
---@param filepath string Target file path
---@return boolean Success
local function save_image(filepath)
  if vim.fn.has("mac") == 1 then
    return save_image_macos(filepath)
  elseif vim.fn.has("unix") == 1 then
    return save_image_linux(filepath)
  end
  return false
end

--- Paste image from clipboard
---@param bufnr number|nil Buffer number (defaults to current)
---@return string|nil Relative path to saved image
function M.paste_image(bufnr)
  bufnr = bufnr or vim.api.nvim_get_current_buf()

  -- Check if clipboard has image
  if not M.has_image() then
    vim.notify("No image in clipboard", vim.log.levels.WARN)
    return nil
  end

  -- Get assets folder
  local assets_folder = get_assets_folder(bufnr)
  if not assets_folder then
    vim.notify("Buffer has no file path, cannot save image", vim.log.levels.ERROR)
    return nil
  end

  -- Ensure folder exists
  if not ensure_folder_exists(assets_folder) then
    vim.notify("Failed to create assets folder: " .. assets_folder, vim.log.levels.ERROR)
    return nil
  end

  -- Generate filename and full path
  local filename = generate_filename("png")
  local filepath = assets_folder .. "/" .. filename
  local relative_path = config.get().assets.folder .. "/" .. filename

  -- Save image
  if save_image(filepath) then
    vim.notify("Image saved: " .. relative_path, vim.log.levels.INFO)
    return relative_path
  else
    vim.notify("Failed to save clipboard image", vim.log.levels.ERROR)
    return nil
  end
end

--- Paste image and insert markdown reference at cursor
---@param bufnr number|nil Buffer number
function M.paste_image_at_cursor(bufnr)
  bufnr = bufnr or vim.api.nvim_get_current_buf()

  local path = M.paste_image(bufnr)
  if not path then
    return
  end

  -- Insert markdown image reference
  local row = vim.api.nvim_win_get_cursor(0)[1]
  local md_image = string.format("![image](%s)", path)

  vim.api.nvim_buf_set_lines(bufnr, row, row, false, { md_image })
  vim.api.nvim_win_set_cursor(0, { row + 1, 2 })

  -- Refresh rendering
  require("slashmd").refresh(bufnr)
end

--- Open image picker dialog (using telescope if available)
---@param bufnr number|nil Buffer number
---@param callback function Callback with selected path
function M.pick_image(bufnr, callback)
  bufnr = bufnr or vim.api.nvim_get_current_buf()

  local assets_folder = get_assets_folder(bufnr)
  if not assets_folder or vim.fn.isdirectory(assets_folder) == 0 then
    vim.notify("No assets folder found", vim.log.levels.WARN)
    return
  end

  -- Try to use telescope if available
  local ok, telescope = pcall(require, "telescope.builtin")
  if ok then
    telescope.find_files({
      prompt_title = "Select Image",
      cwd = assets_folder,
      find_command = { "find", ".", "-type", "f", "-name", "*.png", "-o", "-name", "*.jpg", "-o", "-name", "*.jpeg", "-o", "-name", "*.gif", "-o", "-name", "*.webp" },
      attach_mappings = function(_, map)
        map("i", "<CR>", function(prompt_bufnr)
          local selection = require("telescope.actions.state").get_selected_entry()
          require("telescope.actions").close(prompt_bufnr)
          if selection and callback then
            callback(config.get().assets.folder .. "/" .. selection.value)
          end
        end)
        return true
      end,
    })
  else
    -- Fallback to vim.ui.select
    local files = vim.fn.glob(assets_folder .. "/*.{png,jpg,jpeg,gif,webp}", false, true)
    if #files == 0 then
      vim.notify("No images found in assets folder", vim.log.levels.INFO)
      return
    end

    -- Convert to relative paths
    local relative_files = {}
    for _, file in ipairs(files) do
      local name = vim.fn.fnamemodify(file, ":t")
      table.insert(relative_files, config.get().assets.folder .. "/" .. name)
    end

    vim.ui.select(relative_files, {
      prompt = "Select image:",
    }, function(choice)
      if choice and callback then
        callback(choice)
      end
    end)
  end
end

--- Insert image from picker at cursor
---@param bufnr number|nil Buffer number
function M.insert_image_from_picker(bufnr)
  bufnr = bufnr or vim.api.nvim_get_current_buf()

  M.pick_image(bufnr, function(path)
    local row = vim.api.nvim_win_get_cursor(0)[1]
    local md_image = string.format("![image](%s)", path)

    vim.api.nvim_buf_set_lines(bufnr, row, row, false, { md_image })
    vim.api.nvim_win_set_cursor(0, { row + 1, 2 })

    require("slashmd").refresh(bufnr)
  end)
end

--- Setup clipboard commands for a buffer
---@param bufnr number Buffer number
function M.setup_commands(bufnr)
  vim.api.nvim_buf_create_user_command(bufnr, "SlashMDPasteImage", function()
    M.paste_image_at_cursor(bufnr)
  end, { desc = "Paste image from clipboard" })

  vim.api.nvim_buf_create_user_command(bufnr, "SlashMDPickImage", function()
    M.insert_image_from_picker(bufnr)
  end, { desc = "Pick and insert image from assets" })
end

--- Remove clipboard commands from a buffer
---@param bufnr number Buffer number
function M.remove_commands(bufnr)
  pcall(vim.api.nvim_buf_del_user_command, bufnr, "SlashMDPasteImage")
  pcall(vim.api.nvim_buf_del_user_command, bufnr, "SlashMDPickImage")
end

return M
