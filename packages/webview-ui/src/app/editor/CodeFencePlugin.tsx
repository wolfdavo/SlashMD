import { useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $getSelection,
  $isRangeSelection,
  $isParagraphNode,
  COMMAND_PRIORITY_HIGH,
  KEY_ENTER_COMMAND,
} from 'lexical';
import { $createCodeNode } from '@lexical/code';

// Matches ``` optionally followed by a language identifier at end-of-line
const CODE_FENCE_PATTERN = /^```(\w*)$/;

// Intercepts Enter when the current paragraph contains only ```{lang},
// converts it to a CodeNode with the specified language, and places the cursor inside.
export function CodeFencePlugin(): null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerCommand(
      KEY_ENTER_COMMAND,
      (event: KeyboardEvent | null) => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
          return false;
        }

        const anchor = selection.anchor;
        const anchorNode = anchor.getNode();

        // Resolve the enclosing ParagraphNode
        const paragraphNode = $isParagraphNode(anchorNode)
          ? anchorNode
          : $isParagraphNode(anchorNode.getParent())
          ? anchorNode.getParent()!
          : null;

        if (!paragraphNode) return false;

        // Only fire when the cursor is at the very end of the paragraph
        const lastChild = paragraphNode.getLastChild();
        if (anchorNode !== paragraphNode && anchorNode !== lastChild) return false;
        if (anchorNode !== paragraphNode && anchor.offset !== anchorNode.getTextContentSize()) {
          return false;
        }

        const textContent = paragraphNode.getTextContent();
        const match = textContent.match(CODE_FENCE_PATTERN);
        if (!match) return false;

        event?.preventDefault();

        const language = match[1] || undefined;
        const codeNode = $createCodeNode(language);
        paragraphNode.replace(codeNode);
        codeNode.selectStart();

        return true;
      },
      COMMAND_PRIORITY_HIGH
    );
  }, [editor]);

  return null;
}
