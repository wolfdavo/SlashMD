'use client';

import { useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $getNodeByKey,
  $getRoot,
  COMMAND_PRIORITY_LOW,
  KEY_ARROW_DOWN_COMMAND,
  KEY_ARROW_UP_COMMAND,
  $getSelection,
  $isRangeSelection,
} from 'lexical';
import {
  $isToggleContainerNode,
  $isToggleTitleNode,
  $isToggleContentNode,
  ToggleContainerNode,
} from './nodes';

export function TogglePlugin(): null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      const toggleTitle = target.closest('.toggle-title');
      if (!toggleTitle) return;

      const rect = toggleTitle.getBoundingClientRect();
      const clickX = event.clientX - rect.left;

      if (clickX > 32) return;

      event.preventDefault();
      event.stopPropagation();

      const container = toggleTitle.closest('.toggle-container') as HTMLElement;
      if (!container) return;

      editor.update(() => {
        const root = $getRoot();

        const findToggleContainer = (element: HTMLElement): ToggleContainerNode | null => {
          const key = element.getAttribute('data-lexical-node-key');
          if (key) {
            const node = $getNodeByKey(key);
            if ($isToggleContainerNode(node)) {
              return node;
            }
          }

          for (const child of root.getChildren()) {
            if ($isToggleContainerNode(child)) {
              const domElement = editor.getElementByKey(child.getKey());
              if (domElement === container) {
                return child;
              }
            }
          }
          return null;
        };

        const toggleNode = findToggleContainer(container);
        if (toggleNode) {
          toggleNode.toggleOpen();
        }
      });
    };

    const rootElement = editor.getRootElement();
    if (rootElement) {
      rootElement.addEventListener('click', handleClick);
      return () => {
        rootElement.removeEventListener('click', handleClick);
      };
    }
  }, [editor]);

  useEffect(() => {
    const handleArrowDown = () => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return false;

      const anchorNode = selection.anchor.getNode();

      let titleNode = null;
      let node = anchorNode;
      while (node) {
        const parent = node.getParent();
        if ($isToggleTitleNode(parent)) {
          titleNode = parent;
          break;
        }
        if ($isToggleTitleNode(node)) {
          titleNode = node;
          break;
        }
        node = parent as any;
      }

      if (titleNode) {
        const containerNode = titleNode.getParent();

        if ($isToggleContainerNode(containerNode)) {
          if (!containerNode.getOpen()) {
            containerNode.setOpen(true);
          }

          const children = containerNode.getChildren();
          const contentNode = children.find($isToggleContentNode);
          if (contentNode) {
            const firstChild = contentNode.getFirstChild();
            if (firstChild) {
              firstChild.selectStart();
              return true;
            }
          }
        }
      }

      return false;
    };

    const handleArrowUp = () => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return false;

      const anchorNode = selection.anchor.getNode();

      let contentNode = null;
      let node = anchorNode;
      while (node) {
        const parent = node.getParent();
        if ($isToggleContentNode(parent)) {
          contentNode = parent;
          break;
        }
        if ($isToggleContentNode(node)) {
          contentNode = node;
          break;
        }
        node = parent as any;
      }

      if (contentNode && selection.anchor.offset === 0) {
        const containerNode = contentNode.getParent();
        const firstContentChild = contentNode.getFirstChild();

        if ($isToggleContainerNode(containerNode) && firstContentChild) {
          const anchorTop = anchorNode.getTopLevelElement?.() || anchorNode.getParent();
          if (anchorTop === firstContentChild || anchorNode === firstContentChild) {
            const children = containerNode.getChildren();
            const titleNode = children.find($isToggleTitleNode);
            if (titleNode) {
              const titleParagraph = titleNode.getFirstChild();
              if (titleParagraph) {
                titleParagraph.selectEnd();
                return true;
              }
            }
          }
        }
      }

      return false;
    };

    const removeDown = editor.registerCommand(
      KEY_ARROW_DOWN_COMMAND,
      handleArrowDown,
      COMMAND_PRIORITY_LOW
    );

    const removeUp = editor.registerCommand(
      KEY_ARROW_UP_COMMAND,
      handleArrowUp,
      COMMAND_PRIORITY_LOW
    );

    return () => {
      removeDown();
      removeUp();
    };
  }, [editor]);

  return null;
}
