/**
 * Simplified Editor Component for Phase 1
 * Demonstrates basic block editing with contentEditable elements
 * Will be enhanced with full Lexical integration in later phases
 */

import React from 'react';
import type { Block, ParagraphContent, HeadingContent } from '../../types/blocks';

interface BlockComponentProps {
  block: Block;
  onUpdate: (blockId: string, content: any) => void;
}

const ParagraphBlockComponent: React.FC<BlockComponentProps> = ({ block, onUpdate }) => {
  const content = block.content as ParagraphContent;

  const handleInput = (event: React.FormEvent<HTMLDivElement>) => {
    const text = event.currentTarget.textContent || '';
    onUpdate(block.id, { text });
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      // In later phases, this will create a new block
      console.log('Enter pressed - would create new paragraph');
    }
  };

  return (
    <div className="block-container paragraph-block" data-block-id={block.id}>
      <div className="drag-handle" title="Drag to move">••</div>
      <div
        className="block-content"
        contentEditable
        suppressContentEditableWarning={true}
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        dangerouslySetInnerHTML={{ __html: content.text }}
        style={{ outline: 'none' }}
        data-placeholder="Type something..."
      />
    </div>
  );
};

const HeadingBlockComponent: React.FC<BlockComponentProps> = ({ block, onUpdate }) => {
  const content = block.content as HeadingContent;

  const handleInput = (event: React.FormEvent<HTMLDivElement>) => {
    const text = event.currentTarget.textContent || '';
    onUpdate(block.id, { ...content, text });
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      console.log('Enter pressed - would create new paragraph');
    }
  };

  const getHeadingTag = () => {
    switch (content.level) {
      case 1: return 'h1';
      case 2: return 'h2';
      case 3: return 'h3';
      default: return 'h1';
    }
  };

  const HeadingTag = getHeadingTag() as keyof JSX.IntrinsicElements;

  return (
    <div className={`block-container heading-block level-${content.level}`} data-block-id={block.id}>
      <div className="drag-handle" title="Drag to move">••</div>
      <HeadingTag
        className="block-content"
        contentEditable
        suppressContentEditableWarning={true}
        onInput={handleInput as any}
        onKeyDown={handleKeyDown as any}
        dangerouslySetInnerHTML={{ __html: content.text }}
        style={{ outline: 'none' }}
        data-placeholder={`Heading ${content.level}`}
      />
    </div>
  );
};

const renderBlock = (block: Block, onUpdate: (blockId: string, content: any) => void) => {
  const props = { block, onUpdate, key: block.id };

  switch (block.type) {
    case 'paragraph':
      return <ParagraphBlockComponent {...props} />;
    case 'heading':
      return <HeadingBlockComponent {...props} />;
    default:
      // Fallback for unsupported blocks in Phase 1
      return (
        <div key={block.id} className="block-container unsupported-block">
          <div className="drag-handle">••</div>
          <div className="block-content">
            Unsupported block type: {block.type}
          </div>
        </div>
      );
  }
};

interface SimpleEditorProps {
  blocks: Block[];
  onChange?: (blocks: Block[]) => void;
}

export const SimpleEditor: React.FC<SimpleEditorProps> = ({ blocks, onChange }) => {
  const handleBlockUpdate = (blockId: string, content: any) => {
    if (!onChange) return;

    const updatedBlocks = blocks.map(block =>
      block.id === blockId 
        ? { ...block, content: { ...block.content, ...content } }
        : block
    );
    
    onChange(updatedBlocks);
  };

  return (
    <div className="editor-container">
      <div className="editor-root">
        {blocks.map(block => renderBlock(block, handleBlockUpdate))}
        
        {blocks.length === 0 && (
          <div className="empty-editor">
            <div className="empty-message">
              Start typing to create your first block...
            </div>
          </div>
        )}
      </div>
    </div>
  );
};