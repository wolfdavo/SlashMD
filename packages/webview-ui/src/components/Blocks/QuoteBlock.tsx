/**
 * Quote Block Component for Phase 2
 * Renders blockquote content with proper styling
 */

import { 
  DecoratorNode, 
  NodeKey, 
  SerializedLexicalNode,
  Spread
} from 'lexical';

import React from 'react';
import type { QuoteContent } from '../../types/blocks';

export interface SerializedQuoteNode extends Spread<{
  content: QuoteContent;
  blockId: string;
}, SerializedLexicalNode> {}

export class QuoteNode extends DecoratorNode<React.ReactElement> {
  __content: QuoteContent;
  __blockId: string;

  static getType(): string {
    return 'quote-block';
  }

  static clone(node: QuoteNode): QuoteNode {
    return new QuoteNode(node.__content, node.__blockId, node.__key);
  }

  constructor(content: QuoteContent, blockId: string, key?: NodeKey) {
    super(key);
    this.__content = content;
    this.__blockId = blockId;
  }

  createDOM(): HTMLElement {
    const element = document.createElement('div');
    element.className = 'quote-block block-container';
    return element;
  }

  updateDOM(): false {
    return false;
  }

  static importJSON(serializedNode: SerializedQuoteNode): QuoteNode {
    return new QuoteNode(serializedNode.content, serializedNode.blockId);
  }

  exportJSON(): SerializedQuoteNode {
    return {
      type: 'quote-block',
      content: this.__content,
      blockId: this.__blockId,
      version: 1,
    };
  }

  getContent(): QuoteContent {
    return this.__content;
  }

  getBlockId(): string {
    return this.__blockId;
  }

  setContent(content: QuoteContent): void {
    const writable = this.getWritable();
    writable.__content = content;
  }

  decorate(): React.ReactElement {
    return <QuoteBlockComponent node={this} />;
  }

  isInline(): false {
    return false;
  }
}

interface QuoteBlockComponentProps {
  node: QuoteNode;
}

const QuoteBlockComponent: React.FC<QuoteBlockComponentProps> = ({ node }) => {
  const content = node.getContent();
  const blockId = node.getBlockId();

  const handleInput = (event: React.FormEvent<HTMLDivElement>) => {
    const text = event.currentTarget.textContent || '';
    node.setContent({ ...content, text });
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      console.log('Enter pressed - would create new paragraph');
    }
  };

  return (
    <div className="block-container quote-block" data-block-id={blockId}>
      <div className="drag-handle" title="Drag to move">••</div>
      <blockquote className="quote-content">
        <div className="quote-marker">"</div>
        <div
          className="block-content quote-text"
          contentEditable
          suppressContentEditableWarning={true}
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          dangerouslySetInnerHTML={{ __html: content.text }}
          data-placeholder="Enter a quote..."
        />
      </blockquote>
    </div>
  );
};

export default QuoteBlockComponent;