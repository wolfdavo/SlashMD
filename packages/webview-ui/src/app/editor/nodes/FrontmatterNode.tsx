import {
  $applyNodeReplacement,
  DecoratorNode,
  DOMConversionMap,
  DOMConversionOutput,
  DOMExportOutput,
  LexicalNode,
  NodeKey,
  SerializedLexicalNode,
  Spread,
} from 'lexical';
import { createElement } from 'react';
import FrontmatterComponent from './FrontmatterComponent';

export type SerializedFrontmatterNode = Spread<
  {
    value: string;
  },
  SerializedLexicalNode
>;

export class FrontmatterNode extends DecoratorNode<JSX.Element> {
  __value: string;

  static getType(): string {
    return 'frontmatter';
  }

  static clone(node: FrontmatterNode): FrontmatterNode {
    return new FrontmatterNode(node.__value, node.__key);
  }

  constructor(value: string, key?: NodeKey) {
    super(key);
    this.__value = value;
  }

  getValue(): string {
    return this.__value;
  }

  setValue(value: string): void {
    const writable = this.getWritable();
    writable.__value = value;
  }

  createDOM(): HTMLElement {
    const div = document.createElement('div');
    div.className = 'frontmatter-container';
    return div;
  }

  updateDOM(): boolean {
    return false;
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement('pre');
    element.setAttribute('data-frontmatter', 'true');
    const code = document.createElement('code');
    code.className = 'language-yaml';
    code.textContent = this.__value;
    element.appendChild(code);
    return { element };
  }

  static importDOM(): DOMConversionMap | null {
    return {
      pre: (node: Node) => {
        const element = node as HTMLElement;
        if (element.getAttribute('data-frontmatter') === 'true') {
          return {
            conversion: convertPreElement,
            priority: 1,
          };
        }
        return null;
      },
    };
  }

  static importJSON(serializedNode: SerializedFrontmatterNode): FrontmatterNode {
    return $createFrontmatterNode(serializedNode.value);
  }

  exportJSON(): SerializedFrontmatterNode {
    return {
      type: 'frontmatter',
      value: this.__value,
      version: 1,
    };
  }

  decorate(): JSX.Element {
    return createElement(FrontmatterComponent, {
      value: this.__value,
      nodeKey: this.__key,
    });
  }

  isInline(): boolean {
    return false;
  }

  isTopLevel(): boolean {
    return true;
  }
}

function convertPreElement(domNode: Node): DOMConversionOutput {
  const element = domNode as HTMLElement;
  const code = element.querySelector('code');
  const value = code?.textContent || '';
  return { node: $createFrontmatterNode(value) };
}

export function $createFrontmatterNode(value: string): FrontmatterNode {
  return $applyNodeReplacement(new FrontmatterNode(value));
}

export function $isFrontmatterNode(
  node: LexicalNode | null | undefined
): node is FrontmatterNode {
  return node instanceof FrontmatterNode;
}
