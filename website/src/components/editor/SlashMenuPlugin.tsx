'use client';

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

        const slashIndex = textBeforeCursor.lastIndexOf('/');

        if (slashIndex === -1) {
          if (menuStateRef.current.isOpen) {
            closeMenu();
          }
          return;
        }

        const beforeSlash = textBeforeCursor.substring(0, slashIndex);
        if (beforeSlash.length > 0 && !/\s$/.test(beforeSlash)) {
          if (menuStateRef.current.isOpen) {
            closeMenu();
          }
          return;
        }

        const query = textBeforeCursor.substring(slashIndex + 1);

        if (/\s/.test(query)) {
          if (menuStateRef.current.isOpen) {
            closeMenu();
          }
          return;
        }

        const nativeSelection = window.getSelection();
        if (!nativeSelection || nativeSelection.rangeCount === 0) {
          return;
        }

        const range = nativeSelection.getRangeAt(0);
        const slashRange = document.createRange();
        const textNode = range.startContainer;

        if (textNode.nodeType === Node.TEXT_NODE) {
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
        const newPosition = {
          top: rect.bottom + 4,
          left: rect.left,
        };

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
