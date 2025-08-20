/**
 * Task Block Components for Phase 2
 * Handles todo lists with checkboxes and proper nesting
 */

import { 
  DecoratorNode, 
  NodeKey, 
  SerializedLexicalNode,
  Spread
} from 'lexical';

import React from 'react';
import type { TaskListContent, TaskItemContent } from '../../types/blocks';

// ============================================================================
// TASK LIST CONTAINER NODE
// ============================================================================

export interface SerializedTaskListNode extends Spread<{
  content: TaskListContent;
  blockId: string;
}, SerializedLexicalNode> {}

export class TaskListNode extends DecoratorNode<React.ReactElement> {
  __content: TaskListContent;
  __blockId: string;

  static getType(): string {
    return 'task-list-block';
  }

  static clone(node: TaskListNode): TaskListNode {
    return new TaskListNode(node.__content, node.__blockId, node.__key);
  }

  constructor(content: TaskListContent, blockId: string, key?: NodeKey) {
    super(key);
    this.__content = content;
    this.__blockId = blockId;
  }

  createDOM(): HTMLElement {
    const element = document.createElement('div');
    element.className = 'task-list-block block-container';
    return element;
  }

  updateDOM(): false {
    return false;
  }

  static importJSON(serializedNode: SerializedTaskListNode): TaskListNode {
    return new TaskListNode(serializedNode.content, serializedNode.blockId);
  }

  exportJSON(): SerializedTaskListNode {
    return {
      type: 'task-list-block',
      content: this.__content,
      blockId: this.__blockId,
      version: 1,
    };
  }

  getContent(): TaskListContent {
    return this.__content;
  }

  getBlockId(): string {
    return this.__blockId;
  }

  setContent(content: TaskListContent): void {
    const writable = this.getWritable();
    writable.__content = content;
  }

  decorate(): React.ReactElement {
    return <TaskListBlockComponent node={this} />;
  }

  isInline(): false {
    return false;
  }
}

// ============================================================================
// TASK ITEM NODE  
// ============================================================================

export interface SerializedTaskItemNode extends Spread<{
  content: TaskItemContent;
  blockId: string;
}, SerializedLexicalNode> {}

export class TaskItemNode extends DecoratorNode<React.ReactElement> {
  __content: TaskItemContent;
  __blockId: string;

  static getType(): string {
    return 'task-item-block';
  }

  static clone(node: TaskItemNode): TaskItemNode {
    return new TaskItemNode(node.__content, node.__blockId, node.__key);
  }

  constructor(content: TaskItemContent, blockId: string, key?: NodeKey) {
    super(key);
    this.__content = content;
    this.__blockId = blockId;
  }

  createDOM(): HTMLElement {
    const element = document.createElement('div');
    element.className = `task-item-block block-container indent-${this.__content.indent} ${this.__content.checked ? 'completed' : ''}`;
    return element;
  }

  updateDOM(): false {
    return false;
  }

  static importJSON(serializedNode: SerializedTaskItemNode): TaskItemNode {
    return new TaskItemNode(serializedNode.content, serializedNode.blockId);
  }

  exportJSON(): SerializedTaskItemNode {
    return {
      type: 'task-item-block',
      content: this.__content,
      blockId: this.__blockId,
      version: 1,
    };
  }

  getContent(): TaskItemContent {
    return this.__content;
  }

  getBlockId(): string {
    return this.__blockId;
  }

  setContent(content: TaskItemContent): void {
    const writable = this.getWritable();
    writable.__content = content;
  }

  decorate(): React.ReactElement {
    return <TaskItemBlockComponent node={this} />;
  }

  isInline(): false {
    return false;
  }
}

// ============================================================================
// REACT COMPONENTS
// ============================================================================

interface TaskListBlockComponentProps {
  node: TaskListNode;
}

const TaskListBlockComponent: React.FC<TaskListBlockComponentProps> = ({ node }) => {
  const blockId = node.getBlockId();

  return (
    <div className="block-container task-list-block" data-block-id={blockId}>
      <div className="drag-handle" title="Drag to move">••</div>
      <div className="task-list-controls">
        <span className="task-list-icon">☑</span>
        <span className="task-list-label">Task List</span>
      </div>
      <div className="task-list-content">
        {/* Task items will be rendered as children in the editor */}
        <div className="task-list-placeholder">
          Click here or press Enter to add tasks
        </div>
      </div>
    </div>
  );
};

interface TaskItemBlockComponentProps {
  node: TaskItemNode;
}

const TaskItemBlockComponent: React.FC<TaskItemBlockComponentProps> = ({ node }) => {
  const content = node.getContent();
  const blockId = node.getBlockId();

  const handleInput = (event: React.FormEvent<HTMLDivElement>) => {
    const text = event.currentTarget.textContent || '';
    node.setContent({ ...content, text });
  };

  const handleCheckboxChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const checked = event.target.checked;
    node.setContent({ ...content, checked });
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      console.log('Enter pressed - would create new task item');
    }
    
    if (event.key === 'Tab') {
      event.preventDefault();
      // Increase indent
      const newIndent = Math.min(content.indent + 1, 3); // Max 3 levels
      node.setContent({ ...content, indent: newIndent });
    }
    
    if (event.key === 'Tab' && event.shiftKey) {
      event.preventDefault();
      // Decrease indent
      const newIndent = Math.max(content.indent - 1, 0);
      node.setContent({ ...content, indent: newIndent });
    }
  };

  const indentStyle = {
    paddingLeft: `${content.indent * 24 + 28}px`
  };

  return (
    <div 
      className={`block-container task-item-block indent-${content.indent} ${content.checked ? 'completed' : ''}`} 
      data-block-id={blockId}
      style={indentStyle}
    >
      <div className="drag-handle" title="Drag to move">••</div>
      <input
        type="checkbox"
        className="task-checkbox"
        checked={content.checked}
        onChange={handleCheckboxChange}
        aria-label="Mark task as complete"
      />
      <div
        className={`block-content task-item-content ${content.checked ? 'completed-text' : ''}`}
        contentEditable
        suppressContentEditableWarning={true}
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        dangerouslySetInnerHTML={{ __html: content.text }}
        data-placeholder="Task..."
      />
    </div>
  );
};

export default { TaskListNode, TaskItemNode, TaskListBlockComponent, TaskItemBlockComponent };