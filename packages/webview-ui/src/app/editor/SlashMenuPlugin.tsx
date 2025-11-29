import { useCallback, useEffect, useState } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_LOW,
  KEY_BACKSPACE_COMMAND,
  TextNode,
} from 'lexical';
import { SlashMenu } from './SlashMenu';

interface MenuState {
  isOpen: boolean;
  position: { top: number; left: number } | null;
  query: string;
}

export function SlashMenuPlugin() {
  const [editor] = useLexicalComposerContext();
  const [menuState, setMenuState] = useState<MenuState>({
    isOpen: false,
    position: null,
    query: '',
  });

  const closeMenu = useCallback(() => {
    setMenuState({ isOpen: false, position: null, query: '' });
  }, []);

  useEffect(() => {
    const updateListener = editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const selection = $getSelection();

        if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
          if (menuState.isOpen) {
            closeMenu();
          }
          return;
        }

        const anchor = selection.anchor;
        const anchorNode = anchor.getNode();

        if (!(anchorNode instanceof TextNode)) {
          if (menuState.isOpen) {
            closeMenu();
          }
          return;
        }

        const text = anchorNode.getTextContent();
        const offset = anchor.offset;
        const textBeforeCursor = text.substring(0, offset);

        // Find the last "/" in the text before cursor
        const slashIndex = textBeforeCursor.lastIndexOf('/');

        if (slashIndex === -1) {
          if (menuState.isOpen) {
            closeMenu();
          }
          return;
        }

        // Check if slash is at start of line or preceded by whitespace
        const beforeSlash = textBeforeCursor.substring(0, slashIndex);
        if (beforeSlash.length > 0 && !/\s$/.test(beforeSlash)) {
          if (menuState.isOpen) {
            closeMenu();
          }
          return;
        }

        const query = textBeforeCursor.substring(slashIndex + 1);

        // Don't show menu if there's a space in the query
        if (/\s/.test(query)) {
          if (menuState.isOpen) {
            closeMenu();
          }
          return;
        }

        // Get position for menu - position at the slash character
        const nativeSelection = window.getSelection();
        if (!nativeSelection || nativeSelection.rangeCount === 0) {
          return;
        }

        const range = nativeSelection.getRangeAt(0);

        // Create a range that starts at the slash position
        const slashRange = document.createRange();
        const textNode = range.startContainer;
        if (textNode.nodeType === Node.TEXT_NODE) {
          // Find the actual position of the slash in the text node
          const textContent = textNode.textContent || '';
          const slashPosInNode = textContent.lastIndexOf('/');
          if (slashPosInNode >= 0) {
            slashRange.setStart(textNode, slashPosInNode);
            slashRange.setEnd(textNode, slashPosInNode + 1);
          } else {
            slashRange.setStart(textNode, 0);
            slashRange.setEnd(textNode, 0);
          }
        } else {
          slashRange.setStart(textNode, 0);
          slashRange.setEnd(textNode, 0);
        }

        const rect = slashRange.getBoundingClientRect();

        setMenuState({
          isOpen: true,
          position: {
            top: rect.bottom + 4,
            left: rect.left,
          },
          query,
        });
      });
    });

    return updateListener;
  }, [editor, menuState.isOpen, closeMenu]);

  // Close menu on backspace if query is empty and menu is open
  useEffect(() => {
    return editor.registerCommand(
      KEY_BACKSPACE_COMMAND,
      () => {
        if (menuState.isOpen && menuState.query === '') {
          closeMenu();
        }
        return false;
      },
      COMMAND_PRIORITY_LOW
    );
  }, [editor, menuState.isOpen, menuState.query, closeMenu]);

  // Close menu on click outside
  useEffect(() => {
    if (!menuState.isOpen) return;

    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.slash-menu')) {
        closeMenu();
      }
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [menuState.isOpen, closeMenu]);

  return (
    <SlashMenu
      isOpen={menuState.isOpen}
      position={menuState.position}
      query={menuState.query}
      onClose={closeMenu}
    />
  );
}
