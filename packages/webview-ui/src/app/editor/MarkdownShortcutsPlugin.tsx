import { useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  registerMarkdownShortcuts,
  UNORDERED_LIST,
  ORDERED_LIST,
  CHECK_LIST,
  HEADING,
  QUOTE,
  CODE,
  // Text format transformers for inline markdown syntax
  BOLD_STAR,
  BOLD_UNDERSCORE,
  BOLD_ITALIC_STAR,
  BOLD_ITALIC_UNDERSCORE,
  ITALIC_STAR,
  ITALIC_UNDERSCORE,
  STRIKETHROUGH,
  INLINE_CODE,
  HIGHLIGHT,
  // Text match transformers for links
  LINK,
} from '@lexical/markdown';

/**
 * Plugin that enables markdown shortcuts for block types and inline formatting.
 *
 * Block shortcuts (triggered at start of line):
 * - "- " or "* " → Bulleted list
 * - "1. " → Numbered list
 * - "[] " or "[ ] " → Todo/checkbox list
 * - "# ", "## ", "### " → Headings (h1-h6)
 * - "> " → Block quote
 * - "```" → Code block
 *
 * Inline formatting (Slack-style - transforms when closing delimiter is typed):
 * - *text* → Italic
 * - **text** → Bold
 * - ***text*** → Bold + Italic
 * - _text_ → Italic
 * - __text__ → Bold
 * - ___text___ → Bold + Italic
 * - `text` → Inline code
 * - ~~text~~ → Strikethrough
 * - ==text== → Highlight
 * - [text](url) → Link
 */
export function MarkdownShortcutsPlugin(): null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    // Register both element (block) and text format (inline) transformers
    // This enables "live preview" markdown editing where typing *text* becomes italic, **text** becomes bold
    return registerMarkdownShortcuts(editor, [
      // Block-level transformers
      UNORDERED_LIST,
      ORDERED_LIST,
      CHECK_LIST,
      HEADING,
      QUOTE,
      CODE,
      // Inline text format transformers (Slack-style resolution)
      // Order matters: more specific patterns (longer) should come first
      BOLD_ITALIC_STAR,      // ***text*** → bold + italic
      BOLD_ITALIC_UNDERSCORE, // ___text___ → bold + italic
      BOLD_STAR,             // **text** → bold
      BOLD_UNDERSCORE,       // __text__ → bold
      ITALIC_STAR,           // *text* → italic
      ITALIC_UNDERSCORE,     // _text_ → italic
      STRIKETHROUGH,         // ~~text~~ → strikethrough
      INLINE_CODE,           // `text` → code
      HIGHLIGHT,             // ==text== → highlight
      // Link transformer
      LINK,                  // [text](url) → link
    ]);
  }, [editor]);

  return null;
}
