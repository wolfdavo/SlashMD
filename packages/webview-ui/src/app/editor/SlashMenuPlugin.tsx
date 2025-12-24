import { useCallback, useEffect, useState, useRef } from 'react';
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

// Compare positions with tolerance to avoid updates for sub-pixel differences
function positionsEqual(
  a: { top: number; left: number } | null,
  b: { top: number; left: number } | null
): boolean {
  if (a === null && b === null) return true;
  if (a === null || b === null) return false;
  return Math.abs(a.top - b.top) < 1 && Math.abs(a.left - b.left) < 1;
}

export function SlashMenuPlugin() {
  const [editor] = useLexicalComposerContext();
  const [menuState, setMenuState] = useState<MenuState>({
    isOpen: false,
    position: null,
    query: '',
  });
  // Use refs to access state without causing effect re-registration
  const menuStateRef = useRef(menuState);
  menuStateRef.current = menuState;

  const closeMenu = useCallback(() => {
    setMenuState({ isOpen: false, position: null, query: '' });
  }, []);

  useEffect(() => {
    const updateListener = editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const selection = $getSelection();

        if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
          if (menuStateRef.current.isOpen) {
            closeMenu();
          }
          return;
        }

        const anchor = selection.anchor;
        const anchorNode = anchor.getNode();

        if (!(anchorNode instanceof TextNode)) {
          if (menuStateRef.current.isOpen) {
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
          if (menuStateRef.current.isOpen) {
            closeMenu();
          }
          return;
        }

        // Check if slash is at start of line or preceded by whitespace
        const beforeSlash = textBeforeCursor.substring(0, slashIndex);
        if (beforeSlash.length > 0 && !/\s$/.test(beforeSlash)) {
          if (menuStateRef.current.isOpen) {
            closeMenu();
          }
          return;
        }

        const query = textBeforeCursor.substring(slashIndex + 1);

        // Don't show menu if there's a space in the query
        if (/\s/.test(query)) {
          if (menuStateRef.current.isOpen) {
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
        const menuHeight = 320; // max-height from CSS
        const menuWidth = 280; // min-width from CSS
        const padding = 4;

        // Check if menu would overflow bottom of viewport
        const spaceBelow = window.innerHeight - rect.bottom - padding;
        const spaceAbove = rect.top - padding;

        let top: number;
        if (spaceBelow >= menuHeight) {
          // Enough space below - position below cursor
          top = rect.bottom + padding;
        } else if (spaceAbove >= menuHeight) {
          // Not enough below, but enough above - position above cursor
          top = rect.top - menuHeight - padding;
        } else {
          // Not enough space either way - position where there's more room
          top =
            spaceBelow > spaceAbove
              ? rect.bottom + padding
              : rect.top - menuHeight - padding;
        }

        // Check horizontal overflow
        let left = rect.left;
        if (left + menuWidth > window.innerWidth) {
          left = Math.max(padding, window.innerWidth - menuWidth - padding);
        }

        const newPosition = { top, left };

        // Only update state if something changed
        const currentState = menuStateRef.current;
        if (
          !currentState.isOpen ||
          currentState.query !== query ||
          !positionsEqual(currentState.position, newPosition)
        ) {
          setMenuState({
            isOpen: true,
            position: newPosition,
            query,
          });
        }
      });
    });

    return updateListener;
  }, [editor, closeMenu]);

  // Close menu on backspace if query is empty and menu is open
  useEffect(() => {
    return editor.registerCommand(
      KEY_BACKSPACE_COMMAND,
      () => {
        if (menuStateRef.current.isOpen && menuStateRef.current.query === '') {
          closeMenu();
        }
        return false;
      },
      COMMAND_PRIORITY_LOW
    );
  }, [editor, closeMenu]);

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
