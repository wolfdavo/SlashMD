import { useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { PASTE_COMMAND, COMMAND_PRIORITY_HIGH, $getSelection, $isRangeSelection } from 'lexical';
import { toggleLink } from '@lexical/link';

function isUrl(text: string): boolean {
  try {
    const url = new URL(text.trim());
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export function PasteLinkPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerCommand(
      PASTE_COMMAND,
      (event: ClipboardEvent) => {
        const text = event.clipboardData?.getData('text/plain').trim() ?? '';
        if (!isUrl(text)) return false;

        const selection = $getSelection();
        if (!$isRangeSelection(selection) || selection.isCollapsed()) return false;

        toggleLink(text);
        return true;
      },
      COMMAND_PRIORITY_HIGH
    );
  }, [editor]);

  return null;
}
