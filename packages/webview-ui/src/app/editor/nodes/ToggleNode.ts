import {
  DecoratorNode,
  DOMConversionMap,
  DOMExportOutput,
  LexicalNode,
  NodeKey,
  SerializedLexicalNode,
  Spread,
} from 'lexical';

export type SerializedToggleNode = Spread<
  {
    summary: string;
    content: string;
    isOpen: boolean;
  },
  SerializedLexicalNode
>;

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
    const element = document.createElement('details');
    element.className = 'toggle-block';
    if (this.__isOpen) {
      element.setAttribute('open', '');
    }
    return element;
  }

  updateDOM(prevNode: ToggleNode, dom: HTMLDetailsElement): boolean {
    if (prevNode.__isOpen !== this.__isOpen) {
      if (this.__isOpen) {
        dom.setAttribute('open', '');
      } else {
        dom.removeAttribute('open');
      }
    }
    return false;
  }

  static importDOM(): DOMConversionMap | null {
    return null;
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement('details');
    element.className = 'toggle-block';
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
    // This will be rendered by React
    return null as unknown as JSX.Element;
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
