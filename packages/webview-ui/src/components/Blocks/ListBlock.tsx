/**
 * List Block Components for Phase 2
 * Handles both ordered and unordered lists with proper nesting
 */

import { DecoratorNode, NodeKey, SerializedLexicalNode, Spread } from "lexical";

import React from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import type { ListContent, ListItemContent } from "../../types/blocks";

// ============================================================================
// LIST CONTAINER NODE
// ============================================================================

export interface SerializedListNode
  extends Spread<
    {
      content: ListContent;
      blockId: string;
    },
    SerializedLexicalNode
  > {}

export class ListNode extends DecoratorNode<React.ReactElement> {
  __content: ListContent;
  __blockId: string;

  static getType(): string {
    return "list-block";
  }

  static clone(node: ListNode): ListNode {
    return new ListNode(node.__content, node.__blockId, node.__key);
  }

  constructor(content: ListContent, blockId: string, key?: NodeKey) {
    super(key);
    this.__content = content;
    this.__blockId = blockId;
  }

  createDOM(): HTMLElement {
    const element = document.createElement("div");
    element.className = "list-block block-container";
    return element;
  }

  updateDOM(): false {
    return false;
  }

  static importJSON(serializedNode: SerializedListNode): ListNode {
    return new ListNode(serializedNode.content, serializedNode.blockId);
  }

  exportJSON(): SerializedListNode {
    return {
      type: "list-block",
      content: this.__content,
      blockId: this.__blockId,
      version: 1
    };
  }

  getContent(): ListContent {
    return this.__content;
  }

  getBlockId(): string {
    return this.__blockId;
  }

  setContent(content: ListContent): void {
    const writable = this.getWritable();
    writable.__content = content;
  }

  decorate(): React.ReactElement {
    return <ListBlockComponent node={this} />;
  }

  isInline(): false {
    return false;
  }
}

// ============================================================================
// LIST ITEM NODE
// ============================================================================

export interface SerializedListItemNode
  extends Spread<
    {
      content: ListItemContent;
      blockId: string;
    },
    SerializedLexicalNode
  > {}

export class ListItemNode extends DecoratorNode<React.ReactElement> {
  __content: ListItemContent;
  __blockId: string;

  static getType(): string {
    return "list-item-block";
  }

  static clone(node: ListItemNode): ListItemNode {
    return new ListItemNode(node.__content, node.__blockId, node.__key);
  }

  constructor(content: ListItemContent, blockId: string, key?: NodeKey) {
    super(key);
    this.__content = content;
    this.__blockId = blockId;
  }

  createDOM(): HTMLElement {
    const element = document.createElement("div");
    element.className = `list-item-block block-container indent-${this.__content.indent}`;
    return element;
  }

  updateDOM(): false {
    return false;
  }

  static importJSON(serializedNode: SerializedListItemNode): ListItemNode {
    return new ListItemNode(serializedNode.content, serializedNode.blockId);
  }

  exportJSON(): SerializedListItemNode {
    return {
      type: "list-item-block",
      content: this.__content,
      blockId: this.__blockId,
      version: 1
    };
  }

  getContent(): ListItemContent {
    return this.__content;
  }

  getBlockId(): string {
    return this.__blockId;
  }

  setContent(content: ListItemContent): void {
    const writable = this.getWritable();
    writable.__content = content;
  }

  decorate(): React.ReactElement {
    return <ListItemBlockComponent node={this} />;
  }

  isInline(): false {
    return false;
  }
}

// ============================================================================
// REACT COMPONENTS
// ============================================================================

interface ListBlockComponentProps {
  node: ListNode;
}

const ListBlockComponent: React.FC<ListBlockComponentProps> = ({ node }) => {
  const [editor] = useLexicalComposerContext();
  const content = node.getContent();
  const blockId = node.getBlockId();
  const contentRef = React.useRef<HTMLDivElement | null>(null);
  const initializedRef = React.useRef(false);

  React.useLayoutEffect(() => {
    if (!initializedRef.current && contentRef.current) {
      contentRef.current.innerHTML = (content as any).text || "";
      initializedRef.current = true;
    }
  }, [blockId]);

  const handleTypeToggle = () => {
    editor.update(() => {
      node.setContent({
        ...content,
        ordered: !content.ordered,
        startNumber: content.ordered ? undefined : 1
      });
    });
  };

  return (
    <div
      className={`block-container list-block ${
        content.ordered ? "ordered" : "unordered"
      }`}
      data-block-id={blockId}
    >
      <div className="drag-handle" title="Drag to move">
        ••
      </div>
      <div className="list-controls">
        <button
          className="list-type-toggle"
          onClick={handleTypeToggle}
          title={`Switch to ${content.ordered ? "unordered" : "ordered"} list`}
        >
          {content.ordered ? "1." : "•"}
        </button>
        <span className="list-label">
          {content.ordered ? "Ordered List" : "Unordered List"}
        </span>
      </div>
      <div className="list-content">
        {/* List items will be rendered as children in the editor */}
        <div className="list-placeholder">
          Click here or press Enter to add list items
        </div>
      </div>
    </div>
  );
};

interface ListItemBlockComponentProps {
  node: ListItemNode;
}

const ListItemBlockComponent: React.FC<ListItemBlockComponentProps> = ({
  node
}) => {
  const [editor] = useLexicalComposerContext();
  const content = node.getContent();
  const blockId = node.getBlockId();
  const contentRef = React.useRef<HTMLDivElement | null>(null);
  const initializedRef = React.useRef(false);

  React.useLayoutEffect(() => {
    if (!initializedRef.current && contentRef.current) {
      contentRef.current.innerHTML = content.text || "";
      initializedRef.current = true;
    }
  }, [blockId]);

  const handleInput = (event: React.FormEvent<HTMLDivElement>) => {
    const text = event.currentTarget.textContent || "";
    editor.update(() => {
      node.setContent({ ...content, text });
    });
  };

  const handleBlur = (event: React.FocusEvent<HTMLDivElement>) => {
    const text = event.currentTarget.textContent || "";
    editor.update(() => {
      node.setContent({ ...content, text });
    });
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      console.log("Enter pressed - would create new list item");
    }

    if (event.key === "Tab") {
      event.preventDefault();
      // Increase indent
      const newIndent = Math.min(content.indent + 1, 3); // Max 3 levels
      editor.update(() => {
        node.setContent({ ...content, indent: newIndent });
      });
    }

    if (event.key === "Tab" && event.shiftKey) {
      event.preventDefault();
      // Decrease indent
      const newIndent = Math.max(content.indent - 1, 0);
      editor.update(() => {
        node.setContent({ ...content, indent: newIndent });
      });
    }
  };

  const indentStyle = {
    paddingLeft: `${content.indent * 24 + 24}px`
  };

  return (
    <div
      className={`block-container list-item-block indent-${content.indent}`}
      data-block-id={blockId}
      style={indentStyle}
    >
      <div className="drag-handle" title="Drag to move">
        ••
      </div>
      <div className="list-item-marker">
        {/* Marker will be styled via CSS based on parent list type */}
      </div>
      <div
        className="block-content list-item-content"
        contentEditable
        suppressContentEditableWarning={true}
        ref={contentRef}
        onInput={handleInput}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        data-placeholder="List item..."
      />
    </div>
  );
};

export default {
  ListNode,
  ListItemNode,
  ListBlockComponent,
  ListItemBlockComponent
};
