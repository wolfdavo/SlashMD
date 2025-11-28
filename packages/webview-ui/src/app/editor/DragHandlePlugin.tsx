import { useEffect, useRef, useState } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $getNodeByKey,
  $getRoot,
  COMMAND_PRIORITY_LOW,
  DRAGOVER_COMMAND,
  DROP_COMMAND,
  LexicalNode,
} from 'lexical';

interface DragHandleState {
  isVisible: boolean;
  position: { top: number; left: number };
  nodeKey: string | null;
}

export function DragHandlePlugin() {
  const [editor] = useLexicalComposerContext();
  const [dragState, setDragState] = useState<DragHandleState>({
    isVisible: false,
    position: { top: 0, left: 0 },
    nodeKey: null,
  });
  const [isDragging, setIsDragging] = useState(false);
  const draggedNodeKey = useRef<string | null>(null);
  const dropTargetKey = useRef<string | null>(null);

  useEffect(() => {
    const editorElement = editor.getRootElement();
    if (!editorElement) return;

    const handleMouseMove = (event: MouseEvent) => {
      if (isDragging) return;

      const target = event.target as HTMLElement;
      const blockElement = target.closest('[data-lexical-node-key]') as HTMLElement | null;

      if (blockElement) {
        const nodeKey = blockElement.getAttribute('data-lexical-node-key');
        const rect = blockElement.getBoundingClientRect();
        const editorRect = editorElement.getBoundingClientRect();

        setDragState({
          isVisible: true,
          position: {
            top: rect.top - editorRect.top,
            left: -24,
          },
          nodeKey,
        });
      } else {
        setDragState((prev) => ({ ...prev, isVisible: false }));
      }
    };

    const handleMouseLeave = () => {
      if (!isDragging) {
        setDragState((prev) => ({ ...prev, isVisible: false }));
      }
    };

    editorElement.addEventListener('mousemove', handleMouseMove);
    editorElement.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      editorElement.removeEventListener('mousemove', handleMouseMove);
      editorElement.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [editor, isDragging]);

  useEffect(() => {
    return editor.registerCommand(
      DRAGOVER_COMMAND,
      (event) => {
        const target = event.target as HTMLElement;
        const blockElement = target.closest('[data-lexical-node-key]') as HTMLElement | null;

        if (blockElement) {
          dropTargetKey.current = blockElement.getAttribute('data-lexical-node-key');
        }

        return false;
      },
      COMMAND_PRIORITY_LOW
    );
  }, [editor]);

  useEffect(() => {
    return editor.registerCommand(
      DROP_COMMAND,
      (_event) => {
        if (draggedNodeKey.current && dropTargetKey.current) {
          editor.update(() => {
            const draggedNode = $getNodeByKey(draggedNodeKey.current!);
            const targetNode = $getNodeByKey(dropTargetKey.current!);

            if (draggedNode && targetNode && draggedNode !== targetNode) {
              // Remove from current position
              const parent = draggedNode.getParent();
              if (parent) {
                // Insert after target
                targetNode.insertAfter(draggedNode);
              }
            }
          });

          draggedNodeKey.current = null;
          dropTargetKey.current = null;
          setIsDragging(false);
        }

        return true;
      },
      COMMAND_PRIORITY_LOW
    );
  }, [editor]);

  const handleDragStart = (event: React.DragEvent) => {
    if (dragState.nodeKey) {
      draggedNodeKey.current = dragState.nodeKey;
      setIsDragging(true);
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', dragState.nodeKey);
    }
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    draggedNodeKey.current = null;
    dropTargetKey.current = null;
  };

  if (!dragState.isVisible && !isDragging) return null;

  return (
    <div
      className={`drag-handle ${isDragging ? 'dragging' : ''}`}
      style={{
        position: 'absolute',
        top: dragState.position.top,
        left: dragState.position.left,
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
  );
}
