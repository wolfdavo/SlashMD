-- SlashMD Renderer Module
-- Renders blocks using extmarks, virtual text, and conceal

local M = {}

local state = require("slashmd.state")
local config = require("slashmd.config")
local highlights = require("slashmd.highlights")
local utils = require("slashmd.utils")
local parser = require("slashmd.parser")

local ns = state.namespace

--- Clear all rendering for a buffer
---@param bufnr number Buffer number
function M.clear(bufnr)
  vim.api.nvim_buf_clear_namespace(bufnr, ns, 0, -1)
end

--- Render all blocks for a buffer
---@param bufnr number Buffer number
---@param blocks table[] List of blocks
function M.render(bufnr, blocks)
  -- Clear existing marks
  M.clear(bufnr)

  -- Render each block
  for _, block in ipairs(blocks) do
    M.render_block(bufnr, block)
  end
end

--- Render a single block
---@param bufnr number Buffer number
---@param block table Block to render
function M.render_block(bufnr, block)
  local block_type = block.type

  if block_type == parser.BlockType.HEADING then
    M.render_heading(bufnr, block)
  elseif block_type == parser.BlockType.CODE_BLOCK then
    M.render_code_block(bufnr, block)
  elseif block_type == parser.BlockType.BULLET_LIST then
    M.render_bullet_list(bufnr, block)
  elseif block_type == parser.BlockType.NUMBERED_LIST then
    M.render_numbered_list(bufnr, block)
  elseif block_type == parser.BlockType.TODO_LIST then
    M.render_todo_list(bufnr, block)
  elseif block_type == parser.BlockType.BLOCKQUOTE then
    M.render_blockquote(bufnr, block)
  elseif block_type == parser.BlockType.CALLOUT then
    M.render_callout(bufnr, block)
  elseif block_type == parser.BlockType.THEMATIC_BREAK then
    M.render_horizontal_rule(bufnr, block)
  elseif block_type == parser.BlockType.IMAGE then
    M.render_image(bufnr, block)
  end
end

--- Render a heading block
---@param bufnr number Buffer number
---@param block table Heading block
function M.render_heading(bufnr, block)
  local depth = block.depth or 1
  local text_hl, icon_hl = highlights.get_heading_hl(depth)

  -- Get icon for this heading level
  local icons = config.get().icons.heading
  local icon = icons[depth] or icons[1]

  -- Add icon as inline virtual text
  vim.api.nvim_buf_set_extmark(bufnr, ns, block.start_line, 0, {
    virt_text = { { icon, icon_hl } },
    virt_text_pos = "inline",
    priority = 100,
  })

  -- Conceal the # markers
  local line = vim.api.nvim_buf_get_lines(bufnr, block.start_line, block.start_line + 1, false)[1]
  if line then
    local hash_end = line:find("%s") or depth + 1
    vim.api.nvim_buf_set_extmark(bufnr, ns, block.start_line, 0, {
      end_col = hash_end,
      conceal = "",
      priority = 100,
    })
  end

  -- Highlight the heading text
  vim.api.nvim_buf_set_extmark(bufnr, ns, block.start_line, 0, {
    end_row = block.end_line + 1,
    hl_group = text_hl,
    priority = 50,
  })
end

--- Render a code block
---@param bufnr number Buffer number
---@param block table Code block
function M.render_code_block(bufnr, block)
  local lang = block.language or ""
  local width = utils.get_term_width() - 4 -- Leave some margin

  -- Top border with language label
  local top_border = utils.box_line(width, "top", lang)
  vim.api.nvim_buf_set_extmark(bufnr, ns, block.start_line, 0, {
    virt_text = { { top_border, "SlashMDCodeBlockBorder" } },
    virt_text_pos = "overlay",
    priority = 100,
  })

  -- Conceal the ``` markers
  vim.api.nvim_buf_set_extmark(bufnr, ns, block.start_line, 0, {
    end_row = block.start_line + 1,
    conceal = "",
    priority = 100,
  })

  -- Bottom border
  if block.end_line > block.start_line then
    local bottom_border = utils.box_line(width, "bottom")
    vim.api.nvim_buf_set_extmark(bufnr, ns, block.end_line, 0, {
      virt_text = { { bottom_border, "SlashMDCodeBlockBorder" } },
      virt_text_pos = "overlay",
      priority = 100,
    })

    -- Conceal closing ```
    vim.api.nvim_buf_set_extmark(bufnr, ns, block.end_line, 0, {
      end_row = block.end_line + 1,
      conceal = "",
      priority = 100,
    })
  end

  -- Background highlight for code content
  for line = block.start_line + 1, block.end_line - 1 do
    vim.api.nvim_buf_set_extmark(bufnr, ns, line, 0, {
      end_row = line + 1,
      hl_group = "SlashMDCodeBlockBg",
      hl_eol = true,
      priority = 25,
    })

    -- Add left border
    vim.api.nvim_buf_set_extmark(bufnr, ns, line, 0, {
      virt_text = { { "│ ", "SlashMDCodeBlockBorder" } },
      virt_text_pos = "inline",
      priority = 100,
    })
  end
end

--- Render a bullet list item
---@param bufnr number Buffer number
---@param block table Bullet list block
function M.render_bullet_list(bufnr, block)
  local bullet = config.get_icon("bullet")

  local line = vim.api.nvim_buf_get_lines(bufnr, block.start_line, block.start_line + 1, false)[1]
  if line then
    -- Find the bullet marker
    local marker_start, marker_end = line:find("^%s*[%-*+]%s")
    if marker_start then
      -- Conceal the original marker
      vim.api.nvim_buf_set_extmark(bufnr, ns, block.start_line, marker_start - 1, {
        end_col = marker_end,
        conceal = "",
        priority = 100,
      })

      -- Add styled bullet
      vim.api.nvim_buf_set_extmark(bufnr, ns, block.start_line, marker_start - 1, {
        virt_text = { { bullet .. " ", "SlashMDBullet" } },
        virt_text_pos = "inline",
        priority = 100,
      })
    end
  end
end

--- Render a numbered list item
---@param bufnr number Buffer number
---@param block table Numbered list block
function M.render_numbered_list(bufnr, block)
  local line = vim.api.nvim_buf_get_lines(bufnr, block.start_line, block.start_line + 1, false)[1]
  if line then
    -- Highlight the number
    local marker_start, marker_end = line:find("^%s*%d+[.)]%s")
    if marker_start then
      vim.api.nvim_buf_set_extmark(bufnr, ns, block.start_line, marker_start - 1, {
        end_col = marker_end - 1,
        hl_group = "SlashMDNumberedList",
        priority = 100,
      })
    end
  end
end

--- Render a todo list item
---@param bufnr number Buffer number
---@param block table Todo list block
function M.render_todo_list(bufnr, block)
  local checked = block.checked
  local checkbox_icon = checked and config.get_icon("checkbox_checked") or config.get_icon("checkbox_unchecked")
  local checkbox_hl = checked and "SlashMDTodoCheckbox" or "SlashMDTodoCheckboxEmpty"
  local text_hl = checked and "SlashMDTodoChecked" or "SlashMDTodoUnchecked"

  local line = vim.api.nvim_buf_get_lines(bufnr, block.start_line, block.start_line + 1, false)[1]
  if line then
    -- Find the checkbox marker
    local marker_start, marker_end = line:find("^%s*[%-*+]%s*%[[ xX]%]%s*")
    if marker_start then
      -- Conceal the original marker
      vim.api.nvim_buf_set_extmark(bufnr, ns, block.start_line, marker_start - 1, {
        end_col = marker_end,
        conceal = "",
        priority = 100,
      })

      -- Add styled checkbox
      vim.api.nvim_buf_set_extmark(bufnr, ns, block.start_line, marker_start - 1, {
        virt_text = { { checkbox_icon .. " ", checkbox_hl } },
        virt_text_pos = "inline",
        priority = 100,
      })

      -- Highlight rest of line
      vim.api.nvim_buf_set_extmark(bufnr, ns, block.start_line, marker_end, {
        end_row = block.start_line,
        end_col = #line,
        hl_group = text_hl,
        priority = 50,
      })
    end
  end
end

--- Render a blockquote
---@param bufnr number Buffer number
---@param block table Blockquote block
function M.render_blockquote(bufnr, block)
  local quote_icon = config.get_icon("quote")

  for line = block.start_line, block.end_line do
    local line_text = vim.api.nvim_buf_get_lines(bufnr, line, line + 1, false)[1]
    if line_text then
      -- Find the > marker
      local marker_end = line_text:find("^>%s*") or 1
      if marker_end then
        -- Conceal the > marker
        vim.api.nvim_buf_set_extmark(bufnr, ns, line, 0, {
          end_col = marker_end,
          conceal = "",
          priority = 100,
        })

        -- Add styled border
        vim.api.nvim_buf_set_extmark(bufnr, ns, line, 0, {
          virt_text = { { quote_icon .. " ", "SlashMDBlockquoteBorder" } },
          virt_text_pos = "inline",
          priority = 100,
        })

        -- Italic text
        vim.api.nvim_buf_set_extmark(bufnr, ns, line, 0, {
          end_row = line + 1,
          hl_group = "SlashMDBlockquote",
          priority = 50,
        })
      end
    end
  end
end

--- Render a callout block
---@param bufnr number Buffer number
---@param block table Callout block
function M.render_callout(bufnr, block)
  local callout_type = block.callout_type or "note"
  local fg_hl, bg_hl = highlights.get_callout_hl(callout_type)

  -- Get callout icon
  local icon = config.get_icon("callout." .. callout_type) or config.get_icon("callout.note")

  -- First line: icon and title
  local title = callout_type:sub(1, 1):upper() .. callout_type:sub(2)

  local first_line = vim.api.nvim_buf_get_lines(bufnr, block.start_line, block.start_line + 1, false)[1]
  if first_line then
    -- Conceal the > [!TYPE] marker
    local marker_end = first_line:find("%]") or 0
    if marker_end > 0 then
      vim.api.nvim_buf_set_extmark(bufnr, ns, block.start_line, 0, {
        end_col = marker_end + 1,
        conceal = "",
        priority = 100,
      })
    end

    -- Add icon and title
    vim.api.nvim_buf_set_extmark(bufnr, ns, block.start_line, 0, {
      virt_text = {
        { config.get_icon("quote") .. " ", fg_hl },
        { icon, fg_hl },
        { title, fg_hl },
      },
      virt_text_pos = "inline",
      priority = 100,
    })
  end

  -- Apply background to all lines
  for line = block.start_line, block.end_line do
    vim.api.nvim_buf_set_extmark(bufnr, ns, line, 0, {
      end_row = line + 1,
      hl_group = bg_hl,
      hl_eol = true,
      priority = 25,
    })

    -- Add border for lines after the first
    if line > block.start_line then
      local line_text = vim.api.nvim_buf_get_lines(bufnr, line, line + 1, false)[1]
      if line_text then
        local marker_end = line_text:find("^>%s*")
        if marker_end then
          vim.api.nvim_buf_set_extmark(bufnr, ns, line, 0, {
            end_col = marker_end,
            conceal = "",
            priority = 100,
          })
        end

        vim.api.nvim_buf_set_extmark(bufnr, ns, line, 0, {
          virt_text = { { config.get_icon("quote") .. " ", fg_hl } },
          virt_text_pos = "inline",
          priority = 100,
        })
      end
    end
  end
end

--- Render a horizontal rule
---@param bufnr number Buffer number
---@param block table Horizontal rule block
function M.render_horizontal_rule(bufnr, block)
  local width = utils.get_term_width() - 4
  local rule_char = config.get_icon("horizontal_rule")
  local rule = string.rep(rule_char, width)

  -- Overlay the entire line
  vim.api.nvim_buf_set_extmark(bufnr, ns, block.start_line, 0, {
    virt_text = { { rule, "SlashMDHorizontalRule" } },
    virt_text_pos = "overlay",
    priority = 100,
  })

  -- Conceal the original
  local line = vim.api.nvim_buf_get_lines(bufnr, block.start_line, block.start_line + 1, false)[1]
  if line then
    vim.api.nvim_buf_set_extmark(bufnr, ns, block.start_line, 0, {
      end_col = #line,
      conceal = "",
      priority = 100,
    })
  end
end

--- Render an image block
---@param bufnr number Buffer number
---@param block table Image block
function M.render_image(bufnr, block)
  local icon = config.get_icon("image")
  local alt = block.content or ""
  local path = block.path or ""

  -- Show image icon and alt text
  vim.api.nvim_buf_set_extmark(bufnr, ns, block.start_line, 0, {
    virt_text = {
      { icon, "SlashMDImage" },
      { " " .. alt .. " ", "SlashMDImage" },
      { "(" .. utils.truncate(path, 40) .. ")", "SlashMDImagePath" },
    },
    virt_text_pos = "overlay",
    priority = 100,
  })

  -- Conceal the original markdown
  local line = vim.api.nvim_buf_get_lines(bufnr, block.start_line, block.start_line + 1, false)[1]
  if line then
    vim.api.nvim_buf_set_extmark(bufnr, ns, block.start_line, 0, {
      end_col = #line,
      conceal = "",
      priority = 100,
    })
  end
end

return M
