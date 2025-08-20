/**
 * Heading Block Component for Phase 1
 * Renders editable heading content (H1, H2, H3) using Lexical
 */

import { 
  DecoratorNode, 
  NodeKey, 
  SerializedLexicalNode,
  Spread
} from 'lexical';

import React from 'react';
import type { HeadingContent } from '../../types/blocks';

export interface SerializedHeadingNode extends Spread<{
  content: HeadingContent;
  blockId: string;
}, SerializedLexicalNode> {}

export class HeadingNode extends DecoratorNode<React.ReactElement> {
  __content: HeadingContent;
  __blockId: string;

  static getType(): string {
    return 'heading-block';
  }

  static clone(node: HeadingNode): HeadingNode {
    return new HeadingNode(node.__content, node.__blockId, node.__key);
  }

  constructor(content: HeadingContent, blockId: string, key?: NodeKey) {
    super(key);
    this.__content = content;
    this.__blockId = blockId;
  }

  createDOM(): HTMLElement {
    const element = document.createElement('div');
    element.className = `heading-block block-container level-${this.__content.level}`;
    return element;
  }

  updateDOM(): false {
    return false;
  }

  static importJSON(serializedNode: SerializedHeadingNode): HeadingNode {
    return new HeadingNode(serializedNode.content, serializedNode.blockId);
  }

  exportJSON(): SerializedHeadingNode {
    return {
      type: 'heading-block',
      content: this.__content,
      blockId: this.__blockId,
      version: 1,
    };
  }

  getContent(): HeadingContent {
    return this.__content;
  }

  getBlockId(): string {
    return this.__blockId;
  }

  setContent(content: HeadingContent): void {
    const writable = this.getWritable();
    writable.__content = content;
  }

  decorate(): React.ReactElement {
    return <HeadingBlockComponent node={this} />;
  }

  isInline(): false {
    return false;
  }
}

interface HeadingBlockComponentProps {
  node: HeadingNode;
}

const HeadingBlockComponent: React.FC<HeadingBlockComponentProps> = ({ node }) => {
  const content = node.getContent();
  const blockId = node.getBlockId();

  const handleInput = (event: React.FormEvent<HTMLDivElement>) => {
    const text = event.currentTarget.textContent || '';
    node.setContent({ ...content, text });
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    // Handle Enter key to create new paragraph
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      // This will be handled by the parent editor in later phases
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
    <div className={`block-container heading-block level-${content.level}`} data-block-id={blockId}>
      <div className="drag-handle" title="Drag to move">••</div>
      <HeadingTag
        className="block-content"
        contentEditable
        suppressContentEditableWarning={true}
        onInput={handleInput as any}
        onKeyDown={handleKeyDown as any}
        dangerouslySetInnerHTML={{ __html: content.text }}
        data-placeholder={`Heading ${content.level}`}
      />
    </div>
  );
};

export default HeadingBlockComponent;