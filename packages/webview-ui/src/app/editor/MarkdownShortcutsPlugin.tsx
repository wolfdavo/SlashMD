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
} from '@lexical/markdown';

/**
 * Plugin that enables markdown shortcuts for common block types.
 *
 * Supported shortcuts:
 * - "- " or "* " → Bulleted list
 * - "1. " → Numbered list
 * - "[] " or "[ ] " → Todo/checkbox list
 * - "# ", "## ", "### " → Headings
 * - "> " → Block quote
 * - "```" → Code block
 */
export function MarkdownShortcutsPlugin(): null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    // Register only element transformers for block-level shortcuts
    // We skip text format transformers (bold, italic) since we have a toolbar for those
    return registerMarkdownShortcuts(editor, [
      UNORDERED_LIST,
      ORDERED_LIST,
      CHECK_LIST,
      HEADING,
      QUOTE,
      CODE,
    ]);
  }, [editor]);

  return null;
}
