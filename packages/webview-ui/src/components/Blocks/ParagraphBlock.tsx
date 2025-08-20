/**
 * Paragraph Block Component for Phase 1
 * Renders editable paragraph content using Lexical
 */

import { DecoratorNode, NodeKey, SerializedLexicalNode, Spread } from "lexical";

import React from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import type { ParagraphContent } from "../../types/blocks";

export interface SerializedParagraphNode
  extends Spread<
    {
      content: ParagraphContent;
      blockId: string;
    },
    SerializedLexicalNode
  > {}

export class ParagraphNode extends DecoratorNode<React.ReactElement> {
  __content: ParagraphContent;
  __blockId: string;

  static getType(): string {
    return "paragraph-block";
  }

  static clone(node: ParagraphNode): ParagraphNode {
    return new ParagraphNode(node.__content, node.__blockId, node.__key);
  }

  constructor(content: ParagraphContent, blockId: string, key?: NodeKey) {
    super(key);
    this.__content = content;
    this.__blockId = blockId;
  }

  createDOM(): HTMLElement {
    const element = document.createElement("div");
    element.className = "paragraph-block block-container";
    return element;
  }

  updateDOM(): false {
    return false;
  }

  static importJSON(serializedNode: SerializedParagraphNode): ParagraphNode {
    return new ParagraphNode(serializedNode.content, serializedNode.blockId);
  }

  exportJSON(): SerializedParagraphNode {
    return {
      type: "paragraph-block",
      content: this.__content,
      blockId: this.__blockId,
      version: 1
    };
  }

  getContent(): ParagraphContent {
    return this.__content;
  }

  getBlockId(): string {
    return this.__blockId;
  }

  setContent(content: ParagraphContent): void {
    const writable = this.getWritable();
    writable.__content = content;
  }

  decorate(): React.ReactElement {
    return <ParagraphBlockComponent node={this} />;
  }

  isInline(): false {
    return false;
  }
}

interface ParagraphBlockComponentProps {
  node: ParagraphNode;
}

const ParagraphBlockComponent: React.FC<ParagraphBlockComponentProps> = ({
  node
}) => {
  const [editor] = useLexicalComposerContext();
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
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
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      editor.update(() => {
        node.setContent({ ...content, text });
      });
    }, 150);
  };

  const handleBlur = (event: React.FocusEvent<HTMLDivElement>) => {
    const text = event.currentTarget.textContent || "";
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    editor.update(() => {
      node.setContent({ ...content, text });
    });
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    // Handle Enter key to create new paragraph
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      // This will be handled by the parent editor in later phases
      console.log("Enter pressed - would create new paragraph");
    }
  };

  return (
    <div className="block-container paragraph-block" data-block-id={blockId}>
      <div className="drag-handle" title="Drag to move">
        ••
      </div>
      <div
        className="block-content"
        contentEditable
        suppressContentEditableWarning={true}
        ref={contentRef}
        onInput={handleInput}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        data-placeholder="Type something..."
      />
    </div>
  );
};

export default ParagraphBlockComponent;
