; SlashMD custom tree-sitter highlights for markdown

; Headings
(atx_heading
  (atx_h1_marker) @slashmd.heading.marker
  heading_content: (_) @slashmd.heading.h1)

(atx_heading
  (atx_h2_marker) @slashmd.heading.marker
  heading_content: (_) @slashmd.heading.h2)

(atx_heading
  (atx_h3_marker) @slashmd.heading.marker
  heading_content: (_) @slashmd.heading.h3)

(atx_heading
  (atx_h4_marker) @slashmd.heading.marker
  heading_content: (_) @slashmd.heading.h4)

(atx_heading
  (atx_h5_marker) @slashmd.heading.marker
  heading_content: (_) @slashmd.heading.h5)

(atx_heading
  (atx_h6_marker) @slashmd.heading.marker
  heading_content: (_) @slashmd.heading.h6)

; Code blocks
(fenced_code_block
  (fenced_code_block_delimiter) @slashmd.code.fence
  (info_string) @slashmd.code.language
  (code_fence_content) @slashmd.code.content)

; Blockquotes
(block_quote
  (block_quote_marker) @slashmd.quote.marker) @slashmd.quote

; Lists
(list_item
  (list_marker_minus) @slashmd.list.bullet)
(list_item
  (list_marker_plus) @slashmd.list.bullet)
(list_item
  (list_marker_star) @slashmd.list.bullet)
(list_item
  (list_marker_dot) @slashmd.list.number)
(list_item
  (list_marker_parenthesis) @slashmd.list.number)

; Task list items
(task_list_marker_checked) @slashmd.todo.checked
(task_list_marker_unchecked) @slashmd.todo.unchecked

; Thematic breaks
(thematic_break) @slashmd.hr

; Links
(inline_link
  (link_text) @slashmd.link.text
  (link_destination) @slashmd.link.url)

; Images
(image
  (image_description) @slashmd.image.alt
  (link_destination) @slashmd.image.path)

; Inline formatting
(emphasis) @slashmd.italic
(strong_emphasis) @slashmd.bold
(strikethrough) @slashmd.strikethrough
(code_span) @slashmd.inline_code

; Tables
(pipe_table_header) @slashmd.table.header
(pipe_table_delimiter_row) @slashmd.table.delimiter
(pipe_table_row) @slashmd.table.row
(pipe_table_cell) @slashmd.table.cell
