'use client';

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

export function MarkdownShortcutsPlugin(): null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return registerMarkdownShortcuts(editor, [
      // Block-level transformers
      UNORDERED_LIST,
      ORDERED_LIST,
      CHECK_LIST,
      HEADING,
      QUOTE,
      CODE,
      // Inline text format transformers (Slack-style resolution)
      BOLD_ITALIC_STAR,
      BOLD_ITALIC_UNDERSCORE,
      BOLD_STAR,
      BOLD_UNDERSCORE,
      ITALIC_STAR,
      ITALIC_UNDERSCORE,
      STRIKETHROUGH,
      INLINE_CODE,
      HIGHLIGHT,
      // Link transformer
      LINK,
    ]);
  }, [editor]);

  return null;
}
