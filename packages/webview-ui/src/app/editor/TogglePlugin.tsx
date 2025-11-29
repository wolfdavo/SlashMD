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

  // Handle click on toggle arrow to expand/collapse
  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      // Check if clicked on toggle-title
      const toggleTitle = target.closest('.toggle-title');
      if (!toggleTitle) return;

      // Check if the click is on the arrow area (first 32px)
      const rect = toggleTitle.getBoundingClientRect();
      const clickX = event.clientX - rect.left;

      // Only toggle on arrow click (first 32px) to allow editing title text
      if (clickX > 32) return;

      event.preventDefault();
      event.stopPropagation();

      // Find the toggle container DOM element
      const container = toggleTitle.closest('.toggle-container') as HTMLElement;
      if (!container) return;

      // Find the corresponding Lexical node by traversing editor state
      editor.update(() => {
        const root = $getRoot();

        // Walk through all nodes to find toggle containers
        const findToggleContainer = (element: HTMLElement): ToggleContainerNode | null => {
          // Try to get the node key from the element
          const key = element.getAttribute('data-lexical-node-key');
          if (key) {
            const node = $getNodeByKey(key);
            if ($isToggleContainerNode(node)) {
              return node;
            }
          }

          // Fallback: search for the toggle container by matching DOM elements
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

  // Handle arrow key navigation between title and content
  useEffect(() => {
    const handleArrowDown = () => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return false;

      const anchorNode = selection.anchor.getNode();

      // Check if we're in a paragraph that's inside a toggle title
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
          // Open if closed
          if (!containerNode.getOpen()) {
            containerNode.setOpen(true);
          }

          // Find content node
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

      // Check if we're in a paragraph that's inside toggle content, at the start
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

        // Only move if we're at the very start of the first child
        if ($isToggleContainerNode(containerNode) && firstContentChild) {
          // Check if anchor is at start of first element
          const anchorTop = anchorNode.getTopLevelElement?.() || anchorNode.getParent();
          if (anchorTop === firstContentChild || anchorNode === firstContentChild) {
            // Find title node
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
