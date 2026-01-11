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
  type TextMatchTransformer,
} from '@lexical/markdown';
import { $createImageNode, ImageNode } from './nodes/ImageNode';

/**
 * Custom IMAGE transformer for ![alt](url) markdown syntax.
 * Creates an ImageNode block when the pattern is completed.
 */
const IMAGE: TextMatchTransformer = {
  dependencies: [ImageNode],
  export: (node) => {
    if (node instanceof ImageNode) {
      const alt = node.getAlt();
      const src = node.getSrc();
      const title = node.getTitle();
      if (title) {
        return `![${alt}](${src} "${title}")`;
      }
      return `![${alt}](${src})`;
    }
    return null;
  },
  importRegExp: /!\[([^\]]*)\]\(([^()\s]+)(?:\s"([^"]*)")?\)/,
  regExp: /!\[([^\]]*)\]\(([^()\s]+)(?:\s"([^"]*)")?\)$/,
  replace: (textNode, match) => {
    const [, alt, src, title] = match;
    const imageNode = $createImageNode(src, alt || '', title);
    textNode.replace(imageNode);
  },
  trigger: ')',
  type: 'text-match',
};

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
      // Link and image transformers
      IMAGE,  // ![alt](url) → image (must come before LINK)
      LINK,   // [text](url) → link
    ]);
  }, [editor]);

  return null;
}
