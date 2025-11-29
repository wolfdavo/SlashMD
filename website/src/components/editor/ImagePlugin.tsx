'use client';

import { useCallback, useEffect, useState } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getSelection, $isRangeSelection, COMMAND_PRIORITY_EDITOR, createCommand, LexicalCommand } from 'lexical';
import { ImageModal, ImageData } from './ImageModal';
import { $createImageNode } from './nodes';

export const INSERT_IMAGE_COMMAND: LexicalCommand<void> = createCommand('INSERT_IMAGE_COMMAND');

export function ImagePlugin() {
  const [editor] = useLexicalComposerContext();
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    return editor.registerCommand(
      INSERT_IMAGE_COMMAND,
      () => {
        setIsModalOpen(true);
        return true;
      },
      COMMAND_PRIORITY_EDITOR
    );
  }, [editor]);

  const handleClose = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  const handleInsert = useCallback((data: ImageData) => {
    if (data.isLocal && data.dataUri) {
      // For demo, insert with data URI directly (no file system)
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          const imageNode = $createImageNode(data.dataUri!, data.alt);
          selection.insertNodes([imageNode]);
        }
      });
    } else {
      // URL - insert directly
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          const imageNode = $createImageNode(data.src, data.alt);
          selection.insertNodes([imageNode]);
        }
      });
    }
  }, [editor]);

  return (
    <ImageModal
      isOpen={isModalOpen}
      onClose={handleClose}
      onInsert={handleInsert}
    />
  );
}
