/**
 * Drag and Drop Hook for Phase 3
 * Handles block reordering and indentation via drag and drop
 */

import { useState, useCallback, useRef } from 'react';
import type { Block } from '../types/blocks';

interface DragState {
  draggedBlockId: string | null;
  draggedBlock: Block | null;
  dragOverBlockId: string | null;
  dropPosition: 'above' | 'below' | 'into' | null;
  isDragging: boolean;
}

interface UseDragAndDropProps {
  blocks: Block[];
  onMoveBlock: (blockId: string, targetIndex: number) => void;
  onIndentBlock: (blockId: string, direction: 'in' | 'out') => void;
}

export const useDragAndDrop = ({
  blocks,
  onMoveBlock,
  onIndentBlock
}: UseDragAndDropProps) => {
  const [dragState, setDragState] = useState<DragState>({
    draggedBlockId: null,
    draggedBlock: null,
    dragOverBlockId: null,
    dropPosition: null,
    isDragging: false
  });

  const dragStartPosition = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const dragThresholds = useRef({
    horizontal: 30, // Minimum horizontal pixels for indent/outdent
    vertical: 5     // Minimum vertical pixels for reorder
  });

  // Handle drag start
  const handleDragStart = useCallback((blockId: string, event: React.DragEvent) => {
    const block = blocks.find(b => b.id === blockId);
    if (!block) return;

    dragStartPosition.current = { x: event.clientX, y: event.clientY };

    setDragState({
      draggedBlockId: blockId,
      draggedBlock: block,
      dragOverBlockId: null,
      dropPosition: null,
      isDragging: true
    });

    // Set drag data
    event.dataTransfer.setData('text/plain', blockId);
    event.dataTransfer.effectAllowed = 'move';
  }, [blocks]);

  // Handle drag over
  const handleDragOver = useCallback((blockId: string, event: React.DragEvent) => {
    if (!dragState.isDragging || dragState.draggedBlockId === blockId) {
      return;
    }

    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';

    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const y = event.clientY - rect.top;
    const height = rect.height;
    
    // Determine drop position based on mouse position within the block
    let dropPosition: 'above' | 'below' | 'into';
    
    if (y < height * 0.25) {
      dropPosition = 'above';
    } else if (y > height * 0.75) {
      dropPosition = 'below';
    } else {
      // Middle area - check if block can accept children
      const targetBlock = blocks.find(b => b.id === blockId);
      const canAcceptChildren = targetBlock?.type === 'list' || 
                               targetBlock?.type === 'taskList' || 
                               targetBlock?.type === 'toggle';
      dropPosition = canAcceptChildren ? 'into' : 'below';
    }

    setDragState(prev => ({
      ...prev,
      dragOverBlockId: blockId,
      dropPosition
    }));
  }, [dragState.isDragging, dragState.draggedBlockId, blocks]);

  // Handle drag leave
  const handleDragLeave = useCallback((event: React.DragEvent) => {
    // Only clear if we're leaving the container entirely
    const relatedTarget = event.relatedTarget as HTMLElement;
    const currentTarget = event.currentTarget as HTMLElement;
    
    if (!currentTarget.contains(relatedTarget)) {
      setDragState(prev => ({
        ...prev,
        dragOverBlockId: null,
        dropPosition: null
      }));
    }
  }, []);

  // Handle drop
  const handleDrop = useCallback((blockId: string, event: React.DragEvent) => {
    event.preventDefault();

    if (!dragState.draggedBlockId || !dragState.draggedBlock) {
      return;
    }

    const draggedId = dragState.draggedBlockId;
    const dragEndX = event.clientX;
    const dragEndY = event.clientY;
    
    const horizontalDistance = Math.abs(dragEndX - dragStartPosition.current.x);
    const verticalDistance = Math.abs(dragEndY - dragStartPosition.current.y);

    // Check for horizontal drag (indent/outdent)
    if (horizontalDistance > dragThresholds.current.horizontal && 
        verticalDistance < dragThresholds.current.vertical) {
      const direction = dragEndX > dragStartPosition.current.x ? 'in' : 'out';
      onIndentBlock(draggedId, direction);
    } else {
      // Vertical reordering
      const draggedIndex = blocks.findIndex(b => b.id === draggedId);
      const targetIndex = blocks.findIndex(b => b.id === blockId);
      
      if (draggedIndex === -1 || targetIndex === -1) return;

      let newIndex = targetIndex;
      
      // Adjust target index based on drop position
      if (dragState.dropPosition === 'below') {
        newIndex = targetIndex + 1;
      } else if (dragState.dropPosition === 'into') {
        // For containers, add as child (simplified - would need more complex logic)
        newIndex = targetIndex + 1;
      }
      
      // Adjust for the removal of the dragged item
      if (draggedIndex < newIndex) {
        newIndex -= 1;
      }
      
      // Only move if the position actually changes
      if (newIndex !== draggedIndex) {
        onMoveBlock(draggedId, newIndex);
      }
    }

    // Clear drag state
    setDragState({
      draggedBlockId: null,
      draggedBlock: null,
      dragOverBlockId: null,
      dropPosition: null,
      isDragging: false
    });
  }, [dragState, blocks, onMoveBlock, onIndentBlock]);

  // Handle drag end (cleanup)
  const handleDragEnd = useCallback(() => {
    setDragState({
      draggedBlockId: null,
      draggedBlock: null,
      dragOverBlockId: null,
      dropPosition: null,
      isDragging: false
    });
  }, []);

  // Get CSS classes for drag visualization
  const getDragClasses = useCallback((blockId: string) => {
    const classes = [];
    
    if (dragState.draggedBlockId === blockId) {
      classes.push('dragging');
    }
    
    if (dragState.dragOverBlockId === blockId && dragState.dropPosition) {
      classes.push('drag-over');
    }
    
    return classes.join(' ');
  }, [dragState]);

  // Get drop indicator element (for visual feedback)
  const getDropIndicator = useCallback((blockId: string) => {
    if (dragState.dragOverBlockId !== blockId || !dragState.dropPosition) {
      return null;
    }

    const position = dragState.dropPosition === 'above' ? 'above' : 'below';
    return (
      <div className={`drag-indicator ${position}`} />
    );
  }, [dragState]);

  // Check if block can be indented/outdented
  const canIndent = useCallback((blockId: string): boolean => {
    const block = blocks.find(b => b.id === blockId);
    if (!block) return false;
    
    // Can indent list items and task items
    return block.type === 'listItem' || block.type === 'taskItem';
  }, [blocks]);

  const canOutdent = useCallback((blockId: string): boolean => {
    const block = blocks.find(b => b.id === blockId);
    if (!block) return false;
    
    // Can outdent if it's a list/task item with indent > 0
    if (block.type === 'listItem' || block.type === 'taskItem') {
      return 'indent' in block.content && (block.content as any).indent > 0;
    }
    
    return false;
  }, [blocks]);

  return {
    dragState,
    handlers: {
      onDragStart: handleDragStart,
      onDragOver: handleDragOver,
      onDragLeave: handleDragLeave,
      onDrop: handleDrop,
      onDragEnd: handleDragEnd
    },
    utils: {
      getDragClasses,
      getDropIndicator,
      canIndent,
      canOutdent
    }
  };
};