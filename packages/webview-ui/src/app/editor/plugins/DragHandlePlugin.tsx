import { useEffect, useRef, useState, useCallback } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getNodeByKey, $getSelection, $isRangeSelection, $createParagraphNode } from 'lexical';

interface DragHandleState {
  isVisible: boolean;
  position: { top: number; left: number };
  nodeKey: string | null;
  blockElement: HTMLElement | null;
}

// Find the top-level block element (direct child of editor root)
function getBlockElement(
  target: HTMLElement,
  editorRoot: HTMLElement
): HTMLElement | null {
  let element: HTMLElement | null = target;

  // Walk up until we find a direct child of the editor root
  while (element && element.parentElement !== editorRoot) {
    element = element.parentElement;
  }

  // Return the element if it's a valid block (direct child of editor root)
  if (element && element.parentElement === editorRoot) {
    return element;
  }

  return null;
}

// Find block element based on Y position
function getBlockElementAtY(
  y: number,
  editorRoot: HTMLElement
): HTMLElement | null {
  const children = editorRoot.children;
  for (let i = 0; i < children.length; i++) {
    const child = children[i] as HTMLElement;
    const rect = child.getBoundingClientRect();
    if (y >= rect.top && y <= rect.bottom) {
      return child;
    }
  }
  return null;
}

// Get the node key from a block element's internal Lexical property
function getNodeKeyFromBlockElement(element: HTMLElement): string | null {
  // Lexical stores the key in __lexicalKey_[editorKey] property
  const keys = Object.keys(element);
  for (const key of keys) {
    if (key.startsWith('__lexicalKey_')) {
      return (element as unknown as Record<string, string>)[key] || null;
    }
  }
  return null;
}

export function DragHandlePlugin() {
  const [editor] = useLexicalComposerContext();
  const [dragState, setDragState] = useState<DragHandleState>({
    isVisible: false,
    position: { top: 0, left: 0 },
    nodeKey: null,
    blockElement: null,
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dropIndicator, setDropIndicator] = useState<{ top: number } | null>(null);
  const draggedNodeKey = useRef<string | null>(null);
  const dropTargetKey = useRef<string | null>(null);
  const dropPosition = useRef<'before' | 'after'>('after');
  const handleRef = useRef<HTMLDivElement | null>(null);
  // Use ref to access isDragging in event handlers without causing re-registration
  const isDraggingRef = useRef(false);
  isDraggingRef.current = isDragging;

  // Listen for selection changes to hide handle when navigating via keyboard
  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      if (isDraggingRef.current) return;

      editorState.read(() => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) {
          setDragState((prev) => ({ ...prev, isVisible: false }));
          return;
        }

        // Get the current anchor node and find its top-level block
        const anchorNode = selection.anchor.getNode();
        const topLevelElement = anchorNode.getTopLevelElement();

        if (!topLevelElement) {
          setDragState((prev) => ({ ...prev, isVisible: false }));
          return;
        }

        const nodeKey = topLevelElement.getKey();
        const editorElement = editor.getRootElement();
        if (!editorElement) return;

        // Find the DOM element for this node
        const blockElement = editor.getElementByKey(nodeKey);
        if (!blockElement) {
          setDragState((prev) => ({ ...prev, isVisible: false }));
          return;
        }

        const rect = blockElement.getBoundingClientRect();
        const editorRect = editorElement.getBoundingClientRect();

        setDragState({
          isVisible: true,
          position: {
            top: rect.top - editorRect.top,
            left: 0,
          },
          nodeKey,
          blockElement,
        });
      });
    });
  }, [editor]);

  useEffect(() => {
    const editorElement = editor.getRootElement();
    if (!editorElement) return;

    // Get the .editor-inner container (parent of editor root)
    const editorInner = editorElement.closest('.editor-inner');
    if (!editorInner) return;

    const handleMouseMove = (event: MouseEvent) => {
      if (isDraggingRef.current) return;

      const target = event.target as HTMLElement;

      // Ignore if hovering over the drag handle itself
      if (target.closest('.drag-handle')) {
        return;
      }

      // Try to find block element directly under cursor
      let blockElement = getBlockElement(target, editorElement);

      // If not found (e.g., in padding area), find by Y position
      if (!blockElement) {
        blockElement = getBlockElementAtY(event.clientY, editorElement);
      }

      if (blockElement) {
        const nodeKey = getNodeKeyFromBlockElement(blockElement);
        if (nodeKey) {
          const rect = blockElement.getBoundingClientRect();
          const editorRect = editorElement.getBoundingClientRect();

          setDragState({
            isVisible: true,
            position: {
              top: rect.top - editorRect.top,
              left: 0,
            },
            nodeKey,
            blockElement,
          });
        }
      } else {
        setDragState((prev) => ({ ...prev, isVisible: false }));
      }
    };

    const handleMouseLeave = () => {
      if (isDraggingRef.current) return;
      setDragState((prev) => ({ ...prev, isVisible: false }));
    };

    // Native drag events for drop handling
    const handleDragOver = (event: DragEvent) => {
      if (!draggedNodeKey.current) return;

      event.preventDefault();
      event.dataTransfer!.dropEffect = 'move';

      const target = event.target as HTMLElement;
      let blockElement = getBlockElement(target, editorElement);
      if (!blockElement) {
        blockElement = getBlockElementAtY(event.clientY, editorElement);
      }

      if (blockElement) {
        const nodeKey = getNodeKeyFromBlockElement(blockElement);
        if (nodeKey && nodeKey !== draggedNodeKey.current) {
          dropTargetKey.current = nodeKey;

          // Determine if dropping before or after based on cursor position
          const rect = blockElement.getBoundingClientRect();
          const midpoint = rect.top + rect.height / 2;
          dropPosition.current = event.clientY < midpoint ? 'before' : 'after';

          // Show drop indicator
          const editorRect = editorElement.getBoundingClientRect();
          const indicatorTop = dropPosition.current === 'before'
            ? rect.top - editorRect.top
            : rect.bottom - editorRect.top;
          setDropIndicator({ top: indicatorTop });
        }
      }
    };

    const handleDrop = (event: DragEvent) => {
      event.preventDefault();

      if (draggedNodeKey.current && dropTargetKey.current) {
        editor.update(() => {
          const draggedNode = $getNodeByKey(draggedNodeKey.current!);
          const targetNode = $getNodeByKey(dropTargetKey.current!);

          if (draggedNode && targetNode && draggedNode !== targetNode) {
            if (dropPosition.current === 'before') {
              targetNode.insertBefore(draggedNode);
            } else {
              targetNode.insertAfter(draggedNode);
            }
          }
        });
      }

      // Reset state
      draggedNodeKey.current = null;
      dropTargetKey.current = null;
      setIsDragging(false);
      setDropIndicator(null);
    };

    const handleDragLeave = (event: DragEvent) => {
      // Only hide indicator if leaving the editor entirely
      const relatedTarget = event.relatedTarget as HTMLElement | null;
      if (!relatedTarget || !editorInner.contains(relatedTarget)) {
        setDropIndicator(null);
      }
    };

    editorInner.addEventListener('mousemove', handleMouseMove);
    editorInner.addEventListener('mouseleave', handleMouseLeave);
    editorInner.addEventListener('dragover', handleDragOver);
    editorInner.addEventListener('drop', handleDrop);
    editorInner.addEventListener('dragleave', handleDragLeave);

    return () => {
      editorInner.removeEventListener('mousemove', handleMouseMove);
      editorInner.removeEventListener('mouseleave', handleMouseLeave);
      editorInner.removeEventListener('dragover', handleDragOver);
      editorInner.removeEventListener('drop', handleDrop);
      editorInner.removeEventListener('dragleave', handleDragLeave);
    };
  }, [editor]);

  const handleDragStart = (event: React.DragEvent) => {
    if (dragState.nodeKey) {
      draggedNodeKey.current = dragState.nodeKey;
      setIsDragging(true);
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', dragState.nodeKey);

      // Set a drag image
      if (dragState.blockElement) {
        event.dataTransfer.setDragImage(dragState.blockElement, 0, 0);
      }
    }
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    setDropIndicator(null);
    draggedNodeKey.current = null;
    dropTargetKey.current = null;
  };

  const handleDelete = useCallback(() => {
    if (!dragState.nodeKey) return;

    editor.update(() => {
      const node = $getNodeByKey(dragState.nodeKey!);
      if (node) {
        // If this is the only node, replace with empty paragraph
        const parent = node.getParent();
        if (parent && parent.getChildrenSize() === 1) {
          const paragraph = $createParagraphNode();
          node.replace(paragraph);
          paragraph.selectStart();
        } else {
          // Select the next or previous node before removing
          const nextSibling = node.getNextSibling();
          const prevSibling = node.getPreviousSibling();
          node.remove();

          if (nextSibling) {
            nextSibling.selectStart();
          } else if (prevSibling) {
            prevSibling.selectEnd();
          }
        }
      }
    });

    setDragState((prev) => ({ ...prev, isVisible: false }));
  }, [editor, dragState.nodeKey]);

  return (
    <>
      {dragState.isVisible && (
        <>
          {/* Drag handle on the left */}
          <div
            ref={handleRef}
            className={`drag-handle ${isDragging ? 'dragging' : ''}`}
            style={{
              position: 'absolute',
              top: dragState.position.top,
              left: dragState.position.left,
              transform: 'translateX(-100%)',
            }}
            draggable
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            aria-label="Drag to reorder block"
            role="button"
            tabIndex={0}
          >
            <span className="drag-handle-icon">⋮⋮</span>
          </div>

          {/* Delete button on the right */}
          <button
            className="block-delete-button"
            style={{
              position: 'absolute',
              top: dragState.position.top,
              right: 0,
              transform: 'translateX(100%)',
            }}
            onClick={handleDelete}
            aria-label="Delete block"
            title="Delete block"
            tabIndex={0}
          >
            <span className="block-delete-icon">×</span>
          </button>
        </>
      )}
      {dropIndicator && (
        <div
          className="drop-indicator"
          style={{
            position: 'absolute',
            top: dropIndicator.top,
            left: 0,
            right: 0,
            height: 2,
            background: 'var(--vscode-focusBorder, #007acc)',
            pointerEvents: 'none',
            zIndex: 100,
          }}
        />
      )}
    </>
  );
}
