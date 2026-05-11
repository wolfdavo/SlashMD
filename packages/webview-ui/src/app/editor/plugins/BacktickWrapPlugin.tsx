import { useEffect } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $getSelection, $isRangeSelection } from "lexical";
import { registerMarkdownShortcuts, INLINE_CODE } from "@lexical/markdown";

export function BacktickWrapPlugin(): null {
  const [editor] = useLexicalComposerContext();

  // Type `word` → inline code
  useEffect(() => {
    return registerMarkdownShortcuts(editor, [INLINE_CODE]);
  }, [editor]);

  // Select text + press ` → toggle inline code
  useEffect(() => {
    const root = editor.getRootElement();
    if (!root) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "`") return;

      let hasSelection = false;

      editor.getEditorState().read(() => {
        const selection = $getSelection();
        hasSelection = $isRangeSelection(selection) && !selection.isCollapsed();
      });

      if (!hasSelection) return;

      event.preventDefault();
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          selection.formatText("code");
        }
      });
    };

    root.addEventListener("keydown", handleKeyDown);
    return () => root.removeEventListener("keydown", handleKeyDown);
  }, [editor]);

  return null;
}
