import {
  DecoratorNode,
  DOMConversionMap,
  DOMExportOutput,
  LexicalNode,
  NodeKey,
  SerializedLexicalNode,
  Spread,
} from 'lexical';

export type CalloutType = 'note' | 'tip' | 'warning' | 'important' | 'caution';

export type SerializedCalloutNode = Spread<
  {
    calloutType: CalloutType;
    content: string;
  },
  SerializedLexicalNode
>;

export class CalloutNode extends DecoratorNode<JSX.Element> {
  __calloutType: CalloutType;
  __content: string;

  static getType(): string {
    return 'callout';
  }

  static clone(node: CalloutNode): CalloutNode {
    return new CalloutNode(node.__calloutType, node.__content, node.__key);
  }

  constructor(calloutType: CalloutType, content: string, key?: NodeKey) {
    super(key);
    this.__calloutType = calloutType;
    this.__content = content;
  }

  getCalloutType(): CalloutType {
    return this.__calloutType;
  }

  getContent(): string {
    return this.__content;
  }

  setContent(content: string): void {
    const writable = this.getWritable();
    writable.__content = content;
  }

  setCalloutType(calloutType: CalloutType): void {
    const writable = this.getWritable();
    writable.__calloutType = calloutType;
  }

  createDOM(): HTMLElement {
    const element = document.createElement('div');
    element.className = `callout callout-${this.__calloutType}`;
    return element;
  }

  updateDOM(): boolean {
    return false;
  }

  static importDOM(): DOMConversionMap | null {
    return null;
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement('div');
    element.className = `callout callout-${this.__calloutType}`;
    element.textContent = this.__content;
    return { element };
  }

  static importJSON(serializedNode: SerializedCalloutNode): CalloutNode {
    return new CalloutNode(
      serializedNode.calloutType,
      serializedNode.content
    );
  }

  exportJSON(): SerializedCalloutNode {
    return {
      type: 'callout',
      calloutType: this.__calloutType,
      content: this.__content,
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

export function $createCalloutNode(calloutType: CalloutType, content: string): CalloutNode {
  return new CalloutNode(calloutType, content);
}

export function $isCalloutNode(node: LexicalNode | null | undefined): node is CalloutNode {
  return node instanceof CalloutNode;
}
