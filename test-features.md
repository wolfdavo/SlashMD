# SlashMD Feature Showcase

This file demonstrates all the features available in SlashMD. Use it to test the editor!

## Headings

# Heading 1

## Heading 2

### Heading 3

## Text Formatting

This is **bold text** and this is *italic text*.

You can also use ~~strikethrough~~ and `inline code`.

Combine them: *bold and italic*, **bold with code**

## Links

Here's a [link to Google](https://google.com) and another [link to GitHub](https://github.com).

## Lists

### Bullet List

- First item
- Second item
- Third item
  - Nested item 1
  - Nested item 2
- Fourth item

### Numbered List

1. First step
2. Second step
3. Third step
   1. Sub-step A
   2. Sub-step B
4. Fourth step

### Task List

- Completed task
- Another completed task
- Incomplete task
- Another thing to do

## Blockquotes

> This is a blockquote.
> It can span multiple lines.

## Code Blocks

```typescript
function greet(name) {
  console.log(`Hello, ${name}!`);
  return true;
}

greet("World");
```

```python
def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)

print(fibonacci(10))
```

```css
.editor-table {
  width: 100%;
  border-collapse: collapse;
  margin: 16px 0;
}
```

## Tables

### Basic Table

| Tables        | Full support        | Done |
| ------------- | ------------------- | ---- |
| Header toggle | Click H button      | Done |
| Drag columns  | Reorder by dragging | Done |
| Drag rows     | Reorder by dragging | Done |

### Table with More Data

| Name    | Role     | Department  | Location      |
| ------- | -------- | ----------- | ------------- |
| Alice   | Engineer | Engineering | New York      |
| Bob     | Designer | Design      | San Francisco |
| Charlie | Manager  | Operations  | Chicago       |
| Diana   | Analyst  | Data        | Boston        |

### Try These Table Features

1. **Hover on left side** - See row controls (drag handle, H for header, × to delete)
2. **Hover on top** - See column controls (drag handle, × to delete)
3. **Drag row handles** - Reorder rows up/down
4. **Drag column handles** - Reorder columns left/right
5. **Click + buttons** - Insert new rows/columns
6. **Click H button** - Toggle header styling on any row
7. **Click × buttons** - Delete rows or columns
8. **Click 🗑 button** - Delete entire table

| Column A | Column B | Column C |
| -------- | -------- | -------- |
| Try      | dragging | columns  |
| And      | rows     | too!     |
| Add      | more     | rows     |

## Callouts (Admonitions)

> \[!NOTE]
> This is a note callout. Use it for additional information.

> \[!TIP]
> This is a tip callout. Use it for helpful suggestions.

> \[!WARNING]
> This is a warning callout. Use it for important cautions.

> \[!IMPORTANT]
> This is an important callout. Use it for critical information.

> \[!CAUTION]
> This is a caution callout. Use it for dangerous operations.

## Toggle (Collapsible Section)

<details><summary>Click to expand this section</summary>

This content is hidden by default. Click the summary to show/hide it.

You can put any content here:

- Lists
- Text
- Even code!

</details>

<details><summary>Another collapsible section</summary>

More hidden content here. Great for FAQs or optional information.

</details>

## Horizontal Rule (Divider)

Content above the divider.

---

Content below the divider.

---

## Slash Commands

Type `/` anywhere to see the block menu. Available blocks:

- `/paragraph` - Plain text
- `/heading1`, `/heading2`, `/heading3` - Headings
- `/bullet` - Bullet list
- `/numbered` - Numbered list
- `/todo` - Task list
- `/quote` - Blockquote
- `/code` - Code block
- `/table` - Data table (3x3 with headers)
- `/divider` - Horizontal rule
- `/note`, `/tip`, `/warning` - Callouts
- `/toggle` - Collapsible section

## Keyboard Shortcuts

- **Cmd/Ctrl + B** - Bold
- **Cmd/Ctrl + I** - Italic
- **Cmd/Ctrl + E** - Inline code
- **Cmd/Ctrl + K** - Insert link
- **Tab** - Navigate table cells / Indent lists
- **Shift + Tab** - Navigate backwards / Outdent lists

## Drag & Drop

Every block has a drag handle (⋮⋮) on the left side. Hover over any block to see it, then drag to reorder blocks in your document.

---

*End of feature showcase. Happy editing!*
