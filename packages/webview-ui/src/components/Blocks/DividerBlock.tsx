/**
 * Divider Block Component for Phase 2
 * Renders horizontal rule/divider lines
 */

import { 
  DecoratorNode, 
  NodeKey, 
  SerializedLexicalNode,
  Spread
} from 'lexical';

import React from 'react';
import type { DividerContent } from '../../types/blocks';

export interface SerializedDividerNode extends Spread<{
  content: DividerContent;
  blockId: string;
}, SerializedLexicalNode> {}

export class DividerNode extends DecoratorNode<React.ReactElement> {
  __content: DividerContent;
  __blockId: string;

  static getType(): string {
    return 'divider-block';
  }

  static clone(node: DividerNode): DividerNode {
    return new DividerNode(node.__content, node.__blockId, node.__key);
  }

  constructor(content: DividerContent, blockId: string, key?: NodeKey) {
    super(key);
    this.__content = content;
    this.__blockId = blockId;
  }

  createDOM(): HTMLElement {
    const element = document.createElement('div');
    element.className = 'divider-block block-container';
    return element;
  }

  updateDOM(): false {
    return false;
  }

  static importJSON(serializedNode: SerializedDividerNode): DividerNode {
    return new DividerNode(serializedNode.content, serializedNode.blockId);
  }

  exportJSON(): SerializedDividerNode {
    return {
      type: 'divider-block',
      content: this.__content,
      blockId: this.__blockId,
      version: 1,
    };
  }

  getContent(): DividerContent {
    return this.__content;
  }

  getBlockId(): string {
    return this.__blockId;
  }

  setContent(content: DividerContent): void {
    const writable = this.getWritable();
    writable.__content = content;
  }

  decorate(): React.ReactElement {
    return <DividerBlockComponent node={this} />;
  }

  isInline(): false {
    return false;
  }
}

interface DividerBlockComponentProps {
  node: DividerNode;
}

const DividerBlockComponent: React.FC<DividerBlockComponentProps> = ({ node }) => {
  const blockId = node.getBlockId();

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    // Allow navigation past the divider
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      console.log('Navigate past divider');
    }
    
    // Delete divider on backspace/delete
    if (event.key === 'Backspace' || event.key === 'Delete') {
      console.log('Delete divider block');
    }
  };

  return (
    <div 
      className="block-container divider-block" 
      data-block-id={blockId}
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      <div className="drag-handle" title="Drag to move">••</div>
      <div className="divider-content">
        <hr className="divider-line" />
        <div className="divider-label">
          <span className="divider-text">Section Divider</span>
        </div>
      </div>
    </div>
  );
};

export default DividerBlockComponent;