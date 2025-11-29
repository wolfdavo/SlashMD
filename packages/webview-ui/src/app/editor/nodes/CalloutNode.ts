import {
  $createParagraphNode,
  $createTextNode,
  DOMConversionMap,
  DOMConversionOutput,
  DOMExportOutput,
  EditorConfig,
  ElementNode,
  LexicalNode,
  NodeKey,
  SerializedElementNode,
  Spread,
} from 'lexical';

export type CalloutType = 'note' | 'tip' | 'warning' | 'important' | 'caution';

export type SerializedCalloutNode = Spread<
  {
    calloutType: CalloutType;
  },
  SerializedElementNode
>;

export class CalloutNode extends ElementNode {
  __calloutType: CalloutType;

  static getType(): string {
    return 'callout';
  }

  static clone(node: CalloutNode): CalloutNode {
    return new CalloutNode(node.__calloutType, node.__key);
  }

  constructor(calloutType: CalloutType, key?: NodeKey) {
    super(key);
    this.__calloutType = calloutType;
  }

  getCalloutType(): CalloutType {
    return this.__calloutType;
  }

  setCalloutType(calloutType: CalloutType): void {
    const writable = this.getWritable();
    writable.__calloutType = calloutType;
  }

  createDOM(config: EditorConfig): HTMLElement {
    const element = document.createElement('div');
    element.className = `callout callout-${this.__calloutType}`;
    element.setAttribute('data-callout-type', this.__calloutType);
    return element;
  }

  updateDOM(prevNode: CalloutNode, dom: HTMLElement): boolean {
    if (prevNode.__calloutType !== this.__calloutType) {
      dom.className = `callout callout-${this.__calloutType}`;
      dom.setAttribute('data-callout-type', this.__calloutType);
    }
    return false;
  }

  static importDOM(): DOMConversionMap | null {
    return {
      div: (domNode: HTMLElement) => {
        if (domNode.classList.contains('callout')) {
          return {
            conversion: convertCalloutElement,
            priority: 1,
          };
        }
        return null;
      },
    };
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement('div');
    element.className = `callout callout-${this.__calloutType}`;
    element.setAttribute('data-callout-type', this.__calloutType);
    return { element };
  }

  static importJSON(serializedNode: SerializedCalloutNode): CalloutNode {
    const node = $createCalloutNode(serializedNode.calloutType);
    return node;
  }

  exportJSON(): SerializedCalloutNode {
    return {
      ...super.exportJSON(),
      type: 'callout',
      calloutType: this.__calloutType,
      version: 1,
    };
  }

  // Allow block-level content inside callouts
  canBeEmpty(): boolean {
    return false;
  }

  isShadowRoot(): boolean {
    return true;
  }
}

function convertCalloutElement(domNode: HTMLElement): DOMConversionOutput | null {
  const calloutType = (domNode.getAttribute('data-callout-type') || 'note') as CalloutType;
  const node = $createCalloutNode(calloutType);
  return { node };
}

export function $createCalloutNode(calloutType: CalloutType, content?: string): CalloutNode {
  const node = new CalloutNode(calloutType);

  // If content is provided, create a paragraph with text inside
  if (content !== undefined) {
    const paragraph = $createParagraphNode();
    if (content) {
      paragraph.append($createTextNode(content));
    }
    node.append(paragraph);
  }

  return node;
}

export function $isCalloutNode(node: LexicalNode | null | undefined): node is CalloutNode {
  return node instanceof CalloutNode;
}
