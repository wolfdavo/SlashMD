# Test Markdown File

This file is for testing the live markdown input feature.

## Instructions

Open this file in the SlashMD editor (it should open automatically for .md files).
Then try typing the following markdown syntax and see if it transforms:

## Test Cases

### Inline Formatting (type these and see if they transform)

1. Type: `*bold text*` - should become **bold**
2. Type: `**also bold**` - should become **bold**
3. Type: `_italic text_` - should become *italic*
4. Type: `__also bold__` - should become **bold** (double underscore)
5. Type: `` `inline code` `` - should become `code`
6. Type: `~~strikethrough~~` - should become ~~strikethrough~~
7. Type: `[link text](https://example.com)` - should become a link

### Block Formatting (these should already work)

- Bullet list (type "- " at start of line)

1. Numbered list (type "1. " at start of line)

- Checkbox (type "\[] " at start of line)

> Blockquote (type "> " at start of line)

````javascript
Code block (type "```" at start of line)
````

## Notes

The inline formatting uses "Slack-style" resolution - the markdown syntax
shows as you type until you complete the pattern (e.g., type the closing `*`),
then it transforms into formatted text.

## Image Test

Try typing ![test](assets/image.png)

Yup that worked well enough. What's the raw text look like? And what about this? Why are these spaces? Good cleanup worked. hah!

<img src="assets/image2.png" alt="" width="90" height="81">
