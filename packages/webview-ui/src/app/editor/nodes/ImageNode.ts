import {
  DecoratorNode,
  DOMConversionMap,
  DOMExportOutput,
  LexicalNode,
  NodeKey,
  SerializedLexicalNode,
  Spread,
} from 'lexical';
import { createElement } from 'react';
import { ImageComponent } from './ImageComponent';

export type SerializedImageNode = Spread<
  {
    src: string;
    alt: string;
    title?: string;
    width?: number;
    height?: number;
  },
  SerializedLexicalNode
>;

export class ImageNode extends DecoratorNode<JSX.Element> {
  __src: string; // Relative path for markdown (e.g., "assets/image.png")
  __alt: string;
  __title: string | undefined;
  __displaySrc: string | undefined; // Webview URI for display
  __width: number | undefined;
  __height: number | undefined;

  static getType(): string {
    return 'image';
  }

  static clone(node: ImageNode): ImageNode {
    const cloned = new ImageNode(node.__src, node.__alt, node.__title, node.__key);
    cloned.__displaySrc = node.__displaySrc;
    cloned.__width = node.__width;
    cloned.__height = node.__height;
    return cloned;
  }

  constructor(src: string, alt: string, title?: string, key?: NodeKey) {
    super(key);
    this.__src = src;
    this.__alt = alt;
    this.__title = title;
    this.__displaySrc = undefined;
    this.__width = undefined;
    this.__height = undefined;
  }

  getSrc(): string {
    return this.__src;
  }

  getAlt(): string {
    return this.__alt;
  }

  getTitle(): string | undefined {
    return this.__title;
  }

  setSrc(src: string): void {
    const writable = this.getWritable();
    writable.__src = src;
  }

  setAlt(alt: string): void {
    const writable = this.getWritable();
    writable.__alt = alt;
  }

  setTitle(title: string | undefined): void {
    const writable = this.getWritable();
    writable.__title = title;
  }

  getDisplaySrc(): string {
    // Return displaySrc if set, otherwise fall back to src (for URLs)
    return this.__displaySrc || this.__src;
  }

  setDisplaySrc(displaySrc: string | undefined): void {
    const writable = this.getWritable();
    writable.__displaySrc = displaySrc;
  }

  getWidth(): number | undefined {
    return this.__width;
  }

  setWidth(width: number | undefined): void {
    const writable = this.getWritable();
    writable.__width = width;
  }

  getHeight(): number | undefined {
    return this.__height;
  }

  setHeight(height: number | undefined): void {
    const writable = this.getWritable();
    writable.__height = height;
  }

  createDOM(): HTMLElement {
    const element = document.createElement('figure');
    element.className = 'image-block';
    return element;
  }

  updateDOM(): boolean {
    return false;
  }

  static importDOM(): DOMConversionMap | null {
    return {
      img: () => ({
        conversion: (domNode: HTMLElement) => {
          const img = domNode as HTMLImageElement;
          const src = img.getAttribute('src') || '';
          const alt = img.getAttribute('alt') || '';
          const title = img.getAttribute('title') || undefined;
          const widthAttr = img.getAttribute('width');
          const heightAttr = img.getAttribute('height');

          const node = new ImageNode(src, alt, title);
          if (widthAttr) {
            node.__width = parseInt(widthAttr, 10);
          }
          if (heightAttr) {
            node.__height = parseInt(heightAttr, 10);
          }
          return { node };
        },
        priority: 0,
      }),
    };
  }

  exportDOM(): DOMExportOutput {
    const figure = document.createElement('figure');
    figure.className = 'image-block';

    const img = document.createElement('img');
    img.src = this.__src;
    img.alt = this.__alt;
    if (this.__title) {
      img.title = this.__title;
    }
    if (this.__width) {
      img.width = this.__width;
    }
    if (this.__height) {
      img.height = this.__height;
    }
    figure.appendChild(img);

    return { element: figure };
  }

  static importJSON(serializedNode: SerializedImageNode): ImageNode {
    const node = new ImageNode(
      serializedNode.src,
      serializedNode.alt,
      serializedNode.title
    );
    if (serializedNode.width) {
      node.__width = serializedNode.width;
    }
    if (serializedNode.height) {
      node.__height = serializedNode.height;
    }
    return node;
  }

  exportJSON(): SerializedImageNode {
    return {
      type: 'image',
      src: this.__src,
      alt: this.__alt,
      title: this.__title,
      width: this.__width,
      height: this.__height,
      version: 1,
    };
  }

  decorate(): JSX.Element {
    return createElement(ImageComponent, {
      src: this.getDisplaySrc(),
      alt: this.__alt,
      title: this.__title,
      width: this.__width,
      height: this.__height,
      nodeKey: this.__key,
    });
  }

  isInline(): boolean {
    return false;
  }
}

export function $createImageNode(
  src: string,
  alt: string,
  title?: string,
  displaySrc?: string
): ImageNode {
  const node = new ImageNode(src, alt, title);
  if (displaySrc) {
    node.__displaySrc = displaySrc;
  }
  return node;
}

export function $isImageNode(node: LexicalNode | null | undefined): node is ImageNode {
  return node instanceof ImageNode;
}
