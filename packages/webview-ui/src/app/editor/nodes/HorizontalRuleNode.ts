import {
  DecoratorNode,
  DOMConversionMap,
  DOMExportOutput,
  LexicalNode,
  NodeKey,
  SerializedLexicalNode,
} from 'lexical';

export type SerializedHorizontalRuleNode = SerializedLexicalNode;

export class HorizontalRuleNode extends DecoratorNode<JSX.Element> {
  static getType(): string {
    return 'horizontalrule';
  }

  static clone(node: HorizontalRuleNode): HorizontalRuleNode {
    return new HorizontalRuleNode(node.__key);
  }

  constructor(key?: NodeKey) {
    super(key);
  }

  createDOM(): HTMLElement {
    const element = document.createElement('hr');
    element.className = 'divider-block';
    return element;
  }

  updateDOM(): boolean {
    return false;
  }

  static importDOM(): DOMConversionMap | null {
    return {
      hr: () => ({
        conversion: () => {
          return { node: new HorizontalRuleNode() };
        },
        priority: 0,
      }),
    };
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement('hr');
    element.className = 'divider-block';
    return { element };
  }

  static importJSON(_serializedNode: SerializedHorizontalRuleNode): HorizontalRuleNode {
    return new HorizontalRuleNode();
  }

  exportJSON(): SerializedHorizontalRuleNode {
    return {
      type: 'horizontalrule',
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

export function $createHorizontalRuleNode(): HorizontalRuleNode {
  return new HorizontalRuleNode();
}

export function $isHorizontalRuleNode(
  node: LexicalNode | null | undefined
): node is HorizontalRuleNode {
  return node instanceof HorizontalRuleNode;
}
