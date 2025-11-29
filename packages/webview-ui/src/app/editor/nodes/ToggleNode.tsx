import { useCallback } from 'react';
import {
  DecoratorNode,
  DOMConversionMap,
  DOMExportOutput,
  LexicalNode,
  NodeKey,
  SerializedLexicalNode,
  Spread,
} from 'lexical';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';

export type SerializedToggleNode = Spread<
  {
    summary: string;
    content: string;
    isOpen: boolean;
  },
  SerializedLexicalNode
>;

// React component for rendering the toggle
function ToggleComponent({
  nodeKey,
  summary,
  content,
  isOpen,
}: {
  nodeKey: NodeKey;
  summary: string;
  content: string;
  isOpen: boolean;
}) {
  const [editor] = useLexicalComposerContext();

  const handleToggle = useCallback(() => {
    editor.update(() => {
      const node = editor.getEditorState().read(() => {
        return editor.getEditorState()._nodeMap.get(nodeKey) as ToggleNode | undefined;
      });
      if (node) {
        const writable = node.getWritable();
        writable.__isOpen = !writable.__isOpen;
      }
    });
  }, [editor, nodeKey]);

  const handleSummaryChange = useCallback(
    (e: React.FocusEvent<HTMLSpanElement>) => {
      const newSummary = e.currentTarget.textContent || '';
      editor.update(() => {
        const node = editor.getEditorState()._nodeMap.get(nodeKey) as ToggleNode | undefined;
        if (node) {
          const writable = node.getWritable();
          writable.__summary = newSummary;
        }
      });
    },
    [editor, nodeKey]
  );

  const handleContentChange = useCallback(
    (e: React.FocusEvent<HTMLDivElement>) => {
      const newContent = e.currentTarget.textContent || '';
      editor.update(() => {
        const node = editor.getEditorState()._nodeMap.get(nodeKey) as ToggleNode | undefined;
        if (node) {
          const writable = node.getWritable();
          writable.__content = newContent;
        }
      });
    },
    [editor, nodeKey]
  );

  return (
    <div className="toggle-block">
      <div className="toggle-header" onClick={handleToggle}>
        <span className={`toggle-arrow ${isOpen ? 'open' : ''}`}>▶</span>
        <span
          className="toggle-summary"
          contentEditable
          suppressContentEditableWarning
          onBlur={handleSummaryChange}
        >
          {summary}
        </span>
      </div>
      {isOpen && (
        <div
          className="toggle-content"
          contentEditable
          suppressContentEditableWarning
          onBlur={handleContentChange}
        >
          {content}
        </div>
      )}
    </div>
  );
}

export class ToggleNode extends DecoratorNode<JSX.Element> {
  __summary: string;
  __content: string;
  __isOpen: boolean;

  static getType(): string {
    return 'toggle';
  }

  static clone(node: ToggleNode): ToggleNode {
    return new ToggleNode(
      node.__summary,
      node.__content,
      node.__isOpen,
      node.__key
    );
  }

  constructor(
    summary: string,
    content: string,
    isOpen: boolean = false,
    key?: NodeKey
  ) {
    super(key);
    this.__summary = summary;
    this.__content = content;
    this.__isOpen = isOpen;
  }

  getSummary(): string {
    return this.__summary;
  }

  getContent(): string {
    return this.__content;
  }

  getIsOpen(): boolean {
    return this.__isOpen;
  }

  setSummary(summary: string): void {
    const writable = this.getWritable();
    writable.__summary = summary;
  }

  setContent(content: string): void {
    const writable = this.getWritable();
    writable.__content = content;
  }

  setIsOpen(isOpen: boolean): void {
    const writable = this.getWritable();
    writable.__isOpen = isOpen;
  }

  toggleOpen(): void {
    const writable = this.getWritable();
    writable.__isOpen = !writable.__isOpen;
  }

  createDOM(): HTMLElement {
    const element = document.createElement('div');
    element.className = 'toggle-wrapper';
    return element;
  }

  updateDOM(): boolean {
    return false;
  }

  static importDOM(): DOMConversionMap | null {
    return null;
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement('details');
    if (this.__isOpen) {
      element.setAttribute('open', '');
    }

    const summary = document.createElement('summary');
    summary.textContent = this.__summary;
    element.appendChild(summary);

    const content = document.createElement('div');
    content.textContent = this.__content;
    element.appendChild(content);

    return { element };
  }

  static importJSON(serializedNode: SerializedToggleNode): ToggleNode {
    return new ToggleNode(
      serializedNode.summary,
      serializedNode.content,
      serializedNode.isOpen
    );
  }

  exportJSON(): SerializedToggleNode {
    return {
      type: 'toggle',
      summary: this.__summary,
      content: this.__content,
      isOpen: this.__isOpen,
      version: 1,
    };
  }

  decorate(): JSX.Element {
    return (
      <ToggleComponent
        nodeKey={this.__key}
        summary={this.__summary}
        content={this.__content}
        isOpen={this.__isOpen}
      />
    );
  }

  isInline(): boolean {
    return false;
  }
}

export function $createToggleNode(
  summary: string,
  content: string,
  isOpen: boolean = false
): ToggleNode {
  return new ToggleNode(summary, content, isOpen);
}

export function $isToggleNode(node: LexicalNode | null | undefined): node is ToggleNode {
  return node instanceof ToggleNode;
}
