/**
 * Callout Block Component for Phase 2
 * Renders callouts with type selection (note/tip/warning/danger/info)
 */

import { 
  DecoratorNode, 
  NodeKey, 
  SerializedLexicalNode,
  Spread
} from 'lexical';

import React, { useState } from 'react';
import type { CalloutContent } from '../../types/blocks';

export interface SerializedCalloutNode extends Spread<{
  content: CalloutContent;
  blockId: string;
}, SerializedLexicalNode> {}

export class CalloutNode extends DecoratorNode<React.ReactElement> {
  __content: CalloutContent;
  __blockId: string;

  static getType(): string {
    return 'callout-block';
  }

  static clone(node: CalloutNode): CalloutNode {
    return new CalloutNode(node.__content, node.__blockId, node.__key);
  }

  constructor(content: CalloutContent, blockId: string, key?: NodeKey) {
    super(key);
    this.__content = content;
    this.__blockId = blockId;
  }

  createDOM(): HTMLElement {
    const element = document.createElement('div');
    element.className = `callout-block block-container ${this.__content.type}`;
    return element;
  }

  updateDOM(): false {
    return false;
  }

  static importJSON(serializedNode: SerializedCalloutNode): CalloutNode {
    return new CalloutNode(serializedNode.content, serializedNode.blockId);
  }

  exportJSON(): SerializedCalloutNode {
    return {
      type: 'callout-block',
      content: this.__content,
      blockId: this.__blockId,
      version: 1,
    };
  }

  getContent(): CalloutContent {
    return this.__content;
  }

  getBlockId(): string {
    return this.__blockId;
  }

  setContent(content: CalloutContent): void {
    const writable = this.getWritable();
    writable.__content = content;
  }

  decorate(): React.ReactElement {
    return <CalloutBlockComponent node={this} />;
  }

  isInline(): false {
    return false;
  }
}

interface CalloutBlockComponentProps {
  node: CalloutNode;
}

// Callout type configurations
const CALLOUT_TYPES = {
  note: {
    icon: '📝',
    label: 'Note',
    color: '#0078d4'
  },
  tip: {
    icon: '💡',
    label: 'Tip',
    color: '#107c10'
  },
  warning: {
    icon: '⚠️',
    label: 'Warning',
    color: '#ff8c00'
  },
  danger: {
    icon: '🚨',
    label: 'Danger',
    color: '#d13438'
  },
  info: {
    icon: 'ℹ️',
    label: 'Info',
    color: '#0078d4'
  }
} as const;

const CalloutBlockComponent: React.FC<CalloutBlockComponentProps> = ({ node }) => {
  const content = node.getContent();
  const blockId = node.getBlockId();
  const [showTypeSelector, setShowTypeSelector] = useState(false);

  const currentType = CALLOUT_TYPES[content.type];

  const handleTextInput = (event: React.FormEvent<HTMLDivElement>) => {
    const text = event.currentTarget.textContent || '';
    node.setContent({ ...content, text });
  };

  const handleTitleInput = (event: React.FormEvent<HTMLDivElement>) => {
    const title = event.currentTarget.textContent || '';
    node.setContent({ ...content, title: title || undefined });
  };

  const handleTypeChange = (newType: keyof typeof CALLOUT_TYPES) => {
    node.setContent({ ...content, type: newType });
    setShowTypeSelector(false);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      console.log('Enter pressed - would create new paragraph');
    }
  };

  return (
    <div 
      className={`block-container callout-block ${content.type}`} 
      data-block-id={blockId}
      style={{ borderLeftColor: currentType.color }}
    >
      <div className="drag-handle" title="Drag to move">••</div>
      
      <div className="callout-header">
        <div className="callout-type-selector">
          <button
            className="callout-type-button"
            onClick={() => setShowTypeSelector(!showTypeSelector)}
            title="Change callout type"
          >
            <span className="callout-icon">{currentType.icon}</span>
            <span className="callout-label">{currentType.label}</span>
            <span className="dropdown-arrow">▼</span>
          </button>
          
          {showTypeSelector && (
            <div className="callout-type-dropdown">
              {Object.entries(CALLOUT_TYPES).map(([type, config]) => (
                <button
                  key={type}
                  className={`callout-type-option ${type === content.type ? 'selected' : ''}`}
                  onClick={() => handleTypeChange(type as keyof typeof CALLOUT_TYPES)}
                  style={{ borderLeftColor: config.color }}
                >
                  <span className="callout-icon">{config.icon}</span>
                  <span className="callout-label">{config.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {content.title !== undefined && (
          <div
            className="callout-title"
            contentEditable
            suppressContentEditableWarning={true}
            onInput={handleTitleInput}
            onKeyDown={handleKeyDown}
            dangerouslySetInnerHTML={{ __html: content.title }}
            data-placeholder="Callout title..."
          />
        )}
        
        {content.title === undefined && (
          <button
            className="add-title-btn"
            onClick={() => node.setContent({ ...content, title: '' })}
            title="Add title"
          >
            Add Title
          </button>
        )}
      </div>

      <div
        className="callout-content"
        contentEditable
        suppressContentEditableWarning={true}
        onInput={handleTextInput}
        onKeyDown={handleKeyDown}
        dangerouslySetInnerHTML={{ __html: content.text }}
        data-placeholder="Enter your callout text..."
      />
    </div>
  );
};

export default CalloutBlockComponent;