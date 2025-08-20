/**
 * Drag Handle Component for Phase 3
 * Provides visual drag handles for block reordering and indentation
 */

import React, { useRef, useState } from 'react';

interface DragHandleProps {
  blockId: string;
  onDragStart: (blockId: string, event: React.DragEvent) => void;
  onDragEnd: (blockId: string, event: React.DragEvent) => void;
  onIndent?: (blockId: string, direction: 'in' | 'out') => void;
  canIndent?: boolean;
  canOutdent?: boolean;
}

export const DragHandle: React.FC<DragHandleProps> = ({
  blockId,
  onDragStart,
  onDragEnd,
  onIndent,
  canIndent = false,
  canOutdent = false
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const dragHandleRef = useRef<HTMLDivElement>(null);

  const handleDragStart = (event: React.DragEvent) => {
    setIsDragging(true);
    setDragStartX(event.clientX);
    
    // Create a custom drag image (optional)
    const dragImage = document.createElement('div');
    dragImage.style.cssText = `
      position: absolute;
      top: -1000px;
      padding: 8px 12px;
      background: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
      border-radius: 4px;
      font-size: 12px;
    `;
    dragImage.textContent = '••';
    document.body.appendChild(dragImage);
    
    event.dataTransfer.setDragImage(dragImage, 10, 10);
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', blockId);
    
    // Clean up drag image after a delay
    setTimeout(() => {
      if (document.body.contains(dragImage)) {
        document.body.removeChild(dragImage);
      }
    }, 0);
    
    onDragStart(blockId, event);
  };

  const handleDragEnd = (event: React.DragEvent) => {
    setIsDragging(false);
    
    // Check for horizontal drag (indent/outdent)
    const dragDistance = event.clientX - dragStartX;
    const threshold = 20; // Minimum pixels to trigger indent/outdent
    
    if (Math.abs(dragDistance) > threshold && onIndent) {
      if (dragDistance > 0 && canIndent) {
        // Dragged right - indent
        onIndent(blockId, 'in');
      } else if (dragDistance < 0 && canOutdent) {
        // Dragged left - outdent
        onIndent(blockId, 'out');
      }
    }
    
    onDragEnd(blockId, event);
  };

  const handleMouseDown = (event: React.MouseEvent) => {
    // Prevent text selection when interacting with drag handle
    event.preventDefault();
  };

  const handleClick = (event: React.MouseEvent) => {
    // Prevent click from bubbling to block content
    event.stopPropagation();
  };

  const handleDoubleClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    
    // Double-click to quickly indent/outdent
    if (event.shiftKey && canOutdent && onIndent) {
      onIndent(blockId, 'out');
    } else if (canIndent && onIndent) {
      onIndent(blockId, 'in');
    }
  };

  return (
    <div
      ref={dragHandleRef}
      className={`drag-handle ${isDragging ? 'dragging' : ''}`}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      title={
        canIndent || canOutdent
          ? `Drag to reorder • ${canIndent ? 'Double-click to indent' : ''} ${canOutdent ? 'Shift+double-click to outdent' : ''}`
          : 'Drag to reorder blocks'
      }
      aria-label="Drag handle for block reordering"
    />
  );
};