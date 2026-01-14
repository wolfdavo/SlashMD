import {
  $createLinkNode as $createBaseLinkNode,
  LinkNode,
  SerializedLinkNode,
} from '@lexical/link';
import { DOMConversionMap, DOMConversionOutput, EditorConfig, LexicalNode, Spread } from 'lexical';

export type SerializedCustomLinkNode = SerializedLinkNode;

/**
 * CustomLinkNode - Extends Lexical's LinkNode to prevent VS Code webview link interception
 *
 * The standard LinkNode renders `<a href="...">` which VS Code webviews intercept and
 * open automatically on click. This custom node renders `<a data-href="...">` instead,
 * allowing us to control navigation via JavaScript (Cmd+click to open).
 */
export class CustomLinkNode extends LinkNode {
  static getType(): string {
    return 'link';  // Use same type to replace the default LinkNode
  }

  static clone(node: CustomLinkNode): CustomLinkNode {
    return new CustomLinkNode(
      node.__url,
      { rel: node.__rel, target: node.__target, title: node.__title },
      node.__key
    );
  }

  createDOM(config: EditorConfig): HTMLAnchorElement {
    const element = document.createElement('a');
    // Store URL in data-href instead of href to prevent webview interception
    element.setAttribute('data-href', this.__url);
    if (this.__target !== null) {
      element.target = this.__target;
    }
    if (this.__rel !== null) {
      element.rel = this.__rel;
    }
    if (this.__title !== null) {
      element.title = this.__title;
    }
    // Add visual styling class
    element.className = 'editor-link';
    return element;
  }

  updateDOM(
    prevNode: CustomLinkNode,
    anchor: HTMLAnchorElement,
    config: EditorConfig
  ): boolean {
    const url = this.__url;
    const target = this.__target;
    const rel = this.__rel;
    const title = this.__title;
    if (url !== prevNode.__url) {
      anchor.setAttribute('data-href', url);
    }
    if (target !== prevNode.__target) {
      if (target) {
        anchor.target = target;
      } else {
        anchor.removeAttribute('target');
      }
    }
    if (rel !== prevNode.__rel) {
      if (rel) {
        anchor.rel = rel;
      } else {
        anchor.removeAttribute('rel');
      }
    }
    if (title !== prevNode.__title) {
      if (title) {
        anchor.title = title;
      } else {
        anchor.removeAttribute('title');
      }
    }
    return false;
  }

  static importDOM(): DOMConversionMap | null {
    return {
      a: (node: Node) => ({
        conversion: convertAnchorElement,
        priority: 1,
      }),
    };
  }

  static importJSON(serializedNode: SerializedCustomLinkNode): CustomLinkNode {
    const node = $createCustomLinkNode(serializedNode.url, {
      rel: serializedNode.rel,
      target: serializedNode.target,
      title: serializedNode.title,
    });
    node.setFormat(serializedNode.format);
    node.setIndent(serializedNode.indent);
    node.setDirection(serializedNode.direction);
    return node;
  }

  exportJSON(): SerializedCustomLinkNode {
    return {
      ...super.exportJSON(),
      type: 'link',
      version: 1,
    };
  }
}

function convertAnchorElement(domNode: Node): DOMConversionOutput {
  let node: CustomLinkNode | null = null;
  if (domNode instanceof HTMLAnchorElement) {
    // Check data-href first (our custom attribute), then fall back to href
    const url = domNode.getAttribute('data-href') || domNode.getAttribute('href');
    if (url) {
      node = $createCustomLinkNode(url, {
        rel: domNode.getAttribute('rel'),
        target: domNode.getAttribute('target'),
        title: domNode.getAttribute('title'),
      });
    }
  }
  return { node };
}

export function $createCustomLinkNode(
  url: string,
  attributes?: {
    rel?: null | string;
    target?: null | string;
    title?: null | string;
  }
): CustomLinkNode {
  return new CustomLinkNode(url, attributes);
}

export function $isCustomLinkNode(node: LexicalNode | null | undefined): node is CustomLinkNode {
  return node instanceof CustomLinkNode;
}
