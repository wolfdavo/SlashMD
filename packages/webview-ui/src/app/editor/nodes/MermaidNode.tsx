/**
 * MermaidNode - Renders Mermaid diagrams
 * Uses DecoratorNode pattern similar to EquationNode
 */

import {
  DecoratorNode,
  DOMConversionMap,
  DOMConversionOutput,
  DOMExportOutput,
  LexicalNode,
  NodeKey,
  SerializedLexicalNode,
  Spread,
  $applyNodeReplacement,
} from 'lexical';
import { createElement, lazy, Suspense } from 'react';

const MermaidComponent = lazy(() => import('./MermaidComponent'));

export type SerializedMermaidNode = Spread<
  {
    code: string;
  },
  SerializedLexicalNode
>;

function $convertMermaidElement(
  domNode: HTMLElement,
): null | DOMConversionOutput {
  const code = domNode.getAttribute('data-lexical-mermaid');
  if (code) {
    // Decode from base64
    const decodedCode = atob(code);
    const node = $createMermaidNode(decodedCode);
    return { node };
  }
  return null;
}

export class MermaidNode extends DecoratorNode<JSX.Element> {
  __code: string;

  static getType(): string {
    return 'mermaid';
  }

  static clone(node: MermaidNode): MermaidNode {
    return new MermaidNode(node.__code, node.__key);
  }

  constructor(code: string, key?: NodeKey) {
    super(key);
    this.__code = code;
  }

  static importJSON(serializedNode: SerializedMermaidNode): MermaidNode {
    return $createMermaidNode(serializedNode.code);
  }

  exportJSON(): SerializedMermaidNode {
    return {
      type: 'mermaid',
      version: 1,
      code: this.getCode(),
    };
  }

  createDOM(): HTMLElement {
    const element = document.createElement('div');
    element.className = 'editor-mermaid';
    return element;
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement('div');
    // Encode as base64 to avoid issues with special characters
    element.setAttribute('data-lexical-mermaid', btoa(this.__code));
    element.className = 'mermaid-export';
    element.textContent = this.__code;
    return { element };
  }

  static importDOM(): DOMConversionMap | null {
    return {
      div: (domNode: HTMLElement) => {
        if (!domNode.hasAttribute('data-lexical-mermaid')) {
          return null;
        }
        return {
          conversion: $convertMermaidElement,
          priority: 2,
        };
      },
    };
  }

  updateDOM(): boolean {
    return false;
  }

  getTextContent(): string {
    return this.__code;
  }

  getCode(): string {
    return this.__code;
  }

  setCode(code: string): void {
    const writable = this.getWritable();
    writable.__code = code;
  }

  decorate(): JSX.Element {
    return createElement(
      Suspense,
      { fallback: createElement('div', { className: 'mermaid-loading' }, 'Loading diagram...') },
      createElement(MermaidComponent, {
        code: this.__code,
        nodeKey: this.__key,
      })
    );
  }
}

export function $createMermaidNode(code = ''): MermaidNode {
  const mermaidNode = new MermaidNode(code);
  return $applyNodeReplacement(mermaidNode);
}

export function $isMermaidNode(
  node: LexicalNode | null | undefined,
): node is MermaidNode {
  return node instanceof MermaidNode;
}
