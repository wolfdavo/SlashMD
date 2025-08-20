/**
 * Toggle Block Component for Phase 2
 * Renders collapsible content with summary and expandable body
 */

import { 
  DecoratorNode, 
  NodeKey, 
  SerializedLexicalNode,
  Spread
} from 'lexical';

import React, { useState, useRef, useEffect } from 'react';
import type { ToggleContent } from '../../types/blocks';

export interface SerializedToggleNode extends Spread<{
  content: ToggleContent;
  blockId: string;
}, SerializedLexicalNode> {}

export class ToggleNode extends DecoratorNode<React.ReactElement> {
  __content: ToggleContent;
  __blockId: string;

  static getType(): string {
    return 'toggle-block';
  }

  static clone(node: ToggleNode): ToggleNode {
    return new ToggleNode(node.__content, node.__blockId, node.__key);
  }

  constructor(content: ToggleContent, blockId: string, key?: NodeKey) {
    super(key);
    this.__content = content;
    this.__blockId = blockId;
  }

  createDOM(): HTMLElement {
    const element = document.createElement('div');
    element.className = 'toggle-block block-container';
    return element;
  }

  updateDOM(): false {
    return false;
  }

  static importJSON(serializedNode: SerializedToggleNode): ToggleNode {
    return new ToggleNode(serializedNode.content, serializedNode.blockId);
  }

  exportJSON(): SerializedToggleNode {
    return {
      type: 'toggle-block',
      content: this.__content,
      blockId: this.__blockId,
      version: 1,
    };
  }

  getContent(): ToggleContent {
    return this.__content;
  }

  getBlockId(): string {
    return this.__blockId;
  }

  setContent(content: ToggleContent): void {
    const writable = this.getWritable();
    writable.__content = content;
  }

  decorate(): React.ReactElement {
    return <ToggleBlockComponent node={this} />;
  }

  isInline(): false {
    return false;
  }
}

interface ToggleBlockComponentProps {
  node: ToggleNode;
}

const ToggleBlockComponent: React.FC<ToggleBlockComponentProps> = ({ node }) => {
  const content = node.getContent();
  const blockId = node.getBlockId();
  const [isExpanded, setIsExpanded] = useState(!content.collapsed);
  const [isAnimating, setIsAnimating] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState<number>(0);

  const handleSummaryInput = (event: React.FormEvent<HTMLDivElement>) => {
    const summary = event.currentTarget.textContent || '';
    node.setContent({ ...content, summary });
  };

  // Update content height when content changes
  useEffect(() => {
    if (contentRef.current && isExpanded) {
      const height = contentRef.current.scrollHeight;
      setContentHeight(height);
    }
  }, [isExpanded]);

  const handleToggleExpand = async () => {
    setIsAnimating(true);
    const newExpanded = !isExpanded;
    
    if (newExpanded && contentRef.current) {
      // Measure height before expanding
      setContentHeight(contentRef.current.scrollHeight);
    }
    
    setIsExpanded(newExpanded);
    node.setContent({ ...content, collapsed: !newExpanded });
    
    // End animation after transition
    setTimeout(() => {
      setIsAnimating(false);
    }, 300);
  };

  const handleSummaryKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      // Focus should move to content area when expanded
      if (isExpanded) {
        console.log('Focus content area');
      } else {
        // Expand and focus content area
        setIsExpanded(true);
        node.setContent({ ...content, collapsed: false });
      }
    }
    
    // Allow arrow keys to toggle
    if (event.key === 'ArrowRight' && !isExpanded) {
      event.preventDefault();
      handleToggleExpand();
    }
    if (event.key === 'ArrowLeft' && isExpanded) {
      event.preventDefault();
      handleToggleExpand();
    }
  };

  return (
    <div className={`block-container toggle-block ${isExpanded ? 'expanded' : 'collapsed'} ${isAnimating ? 'animating' : ''}`} data-block-id={blockId}>
      <div className="drag-handle" title="Drag to move">••</div>
      
      <div className="toggle-summary-wrapper">
        <button
          className="toggle-arrow"
          onClick={handleToggleExpand}
          aria-expanded={isExpanded}
          title={isExpanded ? 'Collapse' : 'Expand'}
          disabled={isAnimating}
        >
          <span className={`arrow-icon ${isExpanded ? 'expanded' : ''} ${isAnimating ? 'rotating' : ''}`}>▶</span>
        </button>
        
        <div
          className="toggle-summary"
          contentEditable
          suppressContentEditableWarning={true}
          onInput={handleSummaryInput}
          onKeyDown={handleSummaryKeyDown}
          dangerouslySetInnerHTML={{ __html: content.summary }}
          data-placeholder="Toggle summary..."
          role="button"
          tabIndex={0}
          onClick={handleToggleExpand}
        />
      </div>

      <div 
        className="toggle-content-wrapper"
        style={{
          height: isExpanded ? (contentHeight > 0 ? `${contentHeight}px` : 'auto') : '0px',
          overflow: 'hidden',
          transition: 'height 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        <div 
          ref={contentRef}
          className="toggle-content"
        >
          {/* Enhanced content area with better UX */}
          <div className="toggle-content-inner">
            <div className="toggle-content-placeholder">
              <div className="placeholder-icon">📝</div>
              <div className="placeholder-text">
                Click here to add content to this toggle section
              </div>
              <div className="placeholder-hint">
                You can add paragraphs, lists, images, and more
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ToggleBlockComponent;