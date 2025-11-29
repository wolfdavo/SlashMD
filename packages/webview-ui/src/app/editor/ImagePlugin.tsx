import { useCallback, useEffect, useState, useRef } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getSelection, $isRangeSelection, COMMAND_PRIORITY_EDITOR, createCommand, LexicalCommand } from 'lexical';
import { ImageModal, ImageData } from './ImageModal';
import { $createImageNode } from './nodes';
import { writeAsset, addMessageHandler } from '../../messaging';
import type { HostToUIMessage } from '../../types';

// Command to open the image modal
export const INSERT_IMAGE_COMMAND: LexicalCommand<void> = createCommand('INSERT_IMAGE_COMMAND');

export function ImagePlugin() {
  const [editor] = useLexicalComposerContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const pendingImageRef = useRef<{ alt: string } | null>(null);

  // Listen for INSERT_IMAGE_COMMAND
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

  // Listen for ASSET_WRITTEN messages
  useEffect(() => {
    const removeHandler = addMessageHandler((message: HostToUIMessage) => {
      if (message.type === 'ASSET_WRITTEN' && pendingImageRef.current) {
        const { alt } = pendingImageRef.current;
        const relPath = message.relPath;
        const webviewUri = message.webviewUri;
        pendingImageRef.current = null;

        // Insert the image node with relative path (for markdown) and webview URI (for display)
        editor.update(() => {
          const selection = $getSelection();
          if ($isRangeSelection(selection)) {
            const imageNode = $createImageNode(relPath, alt, undefined, webviewUri);
            selection.insertNodes([imageNode]);
          }
        });
      }
    });

    return removeHandler;
  }, [editor]);

  const handleClose = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  const handleInsert = useCallback((data: ImageData) => {
    if (data.isLocal && data.dataUri) {
      // Upload the file first, then insert on callback
      pendingImageRef.current = { alt: data.alt };
      writeAsset(data.dataUri);
    } else {
      // Direct URL - insert immediately
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
