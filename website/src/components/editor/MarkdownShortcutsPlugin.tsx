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
} from '@lexical/markdown';

export function MarkdownShortcutsPlugin(): null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
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
