/**
 * FrontmatterNode - A CodeNode variant for YAML frontmatter
 * Extends CodeNode to get all the code editing behavior, but serializes as --- delimited frontmatter
 */

import {
  $applyNodeReplacement,
  DOMConversionMap,
  DOMConversionOutput,
  DOMExportOutput,
  EditorConfig,
  LexicalNode,
  NodeKey,
  Spread,
  $createTextNode,
} from 'lexical';
import { CodeNode, SerializedCodeNode } from '@lexical/code';

export type SerializedFrontmatterNode = Spread<
  {
    type: 'frontmatter';
  },
  SerializedCodeNode
>;

export class FrontmatterNode extends CodeNode {
  static getType(): string {
    return 'frontmatter';
  }

  static clone(node: FrontmatterNode): FrontmatterNode {
    return new FrontmatterNode(node.__key);
  }

  constructor(key?: NodeKey) {
    super('yaml', key);
  }

  // Override to always return yaml
  getLanguage(): string {
    return 'yaml';
  }

  // Prevent language from being changed
  setLanguage(_language: string): void {
    // No-op - frontmatter is always yaml
  }

  createDOM(config: EditorConfig): HTMLElement {
    const dom = super.createDOM(config);
    dom.classList.add('frontmatter-code');
    return dom;
  }

  updateDOM(prevNode: FrontmatterNode, dom: HTMLElement, config: EditorConfig): boolean {
    const updated = super.updateDOM(prevNode, dom, config);
    dom.classList.add('frontmatter-code');
    return updated;
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement('pre');
    element.setAttribute('data-frontmatter', 'true');
    const code = document.createElement('code');
    code.className = 'language-yaml';
    code.textContent = this.getTextContent();
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
            priority: 2, // Higher priority than CodeNode
          };
        }
        return null;
      },
    };
  }

  static importJSON(serializedNode: SerializedFrontmatterNode): FrontmatterNode {
    const node = $createFrontmatterNode();
    return node;
  }

  exportJSON(): SerializedFrontmatterNode {
    return {
      ...super.exportJSON(),
      type: 'frontmatter',
    };
  }
}

function convertPreElement(domNode: Node): DOMConversionOutput {
  const element = domNode as HTMLElement;
  const code = element.querySelector('code');
  const value = code?.textContent || '';
  const node = $createFrontmatterNode();
  if (value) {
    node.append($createTextNode(value));
  }
  return { node };
}

export function $createFrontmatterNode(): FrontmatterNode {
  return $applyNodeReplacement(new FrontmatterNode());
}

export function $isFrontmatterNode(
  node: LexicalNode | null | undefined
): node is FrontmatterNode {
  return node instanceof FrontmatterNode;
}
