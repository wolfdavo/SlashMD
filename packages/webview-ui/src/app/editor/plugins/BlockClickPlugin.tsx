import { useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $getNodeByKey,
  $setSelection,
  $createRangeSelection,
  $isElementNode,
  $isDecoratorNode,
  $isTextNode,
  $createParagraphNode,
  $getRoot,
  $getNearestNodeFromDOMNode,
  LexicalNode,
  NodeKey,
  COMMAND_PRIORITY_LOW,
  KEY_ENTER_COMMAND,
} from 'lexical';

/**
 * BlockClickPlugin - Enables clicking to the right of blocks to place cursor
 *
 * When clicking in empty space to the right of a block's content,
 * this selects that block. For non-editable blocks (images, HRs),
 * pressing Enter will then create a new paragraph below.
 */
export function BlockClickPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    const rootElement = editor.getRootElement();
    if (!rootElement) return;

    const handleClick = (event: MouseEvent) => {
      // Only handle left clicks
      if (event.button !== 0) return;

      const clickX = event.clientX;
      const clickY = event.clientY;

      // Get the content editable bounds
      const rootRect = rootElement.getBoundingClientRect();

      // Must be within editor bounds
      if (clickY < rootRect.top || clickY > rootRect.bottom) return;
      if (clickX < rootRect.left || clickX > rootRect.right) return;

      // Find which block element the click Y coordinate corresponds to
      const targetBlock = findBlockAtY(rootElement, clickY);
      if (!targetBlock) {
        return;
      }

      const blockRect = targetBlock.getBoundingClientRect();

      // Check if click is to the RIGHT of the block's actual content
      // (not inside the block itself)
      if (clickX <= blockRect.right) {
        return;
      }

      // We clicked in the empty space to the right of the block
      event.preventDefault();
      event.stopPropagation();

      // Use Lexical's method to find the node from DOM element
      editor.update(() => {
        const node = $getNearestNodeFromDOMNode(targetBlock);
        if (!node) {
          return;
        }

        // Get the top-level block (direct child of root)
        let topLevelNode: LexicalNode | null = node;
        const root = $getRoot();

        while (topLevelNode && topLevelNode.getParent() !== root) {
          topLevelNode = topLevelNode.getParent();
        }

        if (topLevelNode) {
          selectAfterNode(topLevelNode);
        }
      });

      // Focus the editor
      editor.focus();
    };

    // Use mousedown instead of click to capture before other handlers
    rootElement.addEventListener('mousedown', handleClick);

    return () => {
      rootElement.removeEventListener('mousedown', handleClick);
    };
  }, [editor]);

  // Handle Enter key when a decorator node is selected to insert paragraph after
  useEffect(() => {
    return editor.registerCommand(
      KEY_ENTER_COMMAND,
      (event) => {
        const selection = editor.getEditorState().read(() => {
          const sel = editor.getEditorState()._selection;
          return sel;
        });

        // Check if we have an element selection on a decorator node
        return editor.getEditorState().read(() => {
          const sel = editor.getEditorState()._selection;
          if (!sel || sel.getNodes().length !== 1) return false;

          const node = sel.getNodes()[0];
          if (!$isDecoratorNode(node)) return false;

          // Insert a new paragraph after the decorator node
          editor.update(() => {
            const decoratorNode = $getNodeByKey(node.getKey());
            if (!decoratorNode) return;

            const paragraph = $createParagraphNode();
            decoratorNode.insertAfter(paragraph);
            paragraph.select();
          });

          event?.preventDefault();
          return true;
        });
      },
      COMMAND_PRIORITY_LOW
    );
  }, [editor]);

  return null;
}

/**
 * Find the top-level block element at a given Y coordinate
 */
function findBlockAtY(rootElement: HTMLElement, y: number): HTMLElement | null {
  const children = Array.from(rootElement.children) as HTMLElement[];

  for (const child of children) {
    const rect = child.getBoundingClientRect();

    if (y >= rect.top && y <= rect.bottom) {
      return child;
    }
  }

  // If click is below all blocks, return the last block
  if (children.length > 0) {
    const lastChild = children[children.length - 1];
    const lastRect = lastChild.getBoundingClientRect();
    if (y > lastRect.bottom) {
      return lastChild;
    }
  }

  return null;
}

/**
 * Get the Lexical node key from a DOM element
 */
function getNodeKeyFromElement(element: HTMLElement): NodeKey | null {
  // Check the element itself
  let key = element.getAttribute('data-lexical-node-key');
  if (key) return key;

  // Walk up the tree to find a node with a key (for nested structures)
  let current: HTMLElement | null = element;
  while (current) {
    key = current.getAttribute('data-lexical-node-key');
    if (key) return key;
    current = current.parentElement;
  }

  // For decorator nodes wrapped in a span
  const decoratorSpan = element.querySelector('[data-lexical-decorator]');
  if (decoratorSpan) {
    key = decoratorSpan.getAttribute('data-lexical-node-key');
    if (key) return key;
  }

  // Check any child with a node key
  const childWithKey = element.querySelector('[data-lexical-node-key]');
  if (childWithKey) {
    key = childWithKey.getAttribute('data-lexical-node-key');
    if (key) return key;
  }

  return null;
}

/**
 * Select after a node - inserts a new paragraph after the block and selects it
 */
function selectAfterNode(node: LexicalNode): void {
  // For all block-level nodes, insert a new paragraph after and select it
  // This gives the user a clear place to type
  const paragraph = $createParagraphNode();
  node.insertAfter(paragraph);
  paragraph.select();
}
