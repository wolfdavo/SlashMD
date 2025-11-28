import {
  DecoratorNode,
  DOMConversionMap,
  DOMExportOutput,
  LexicalNode,
  NodeKey,
  SerializedLexicalNode,
  Spread,
} from 'lexical';

export type SerializedImageNode = Spread<
  {
    src: string;
    alt: string;
    title?: string;
  },
  SerializedLexicalNode
>;

export class ImageNode extends DecoratorNode<JSX.Element> {
  __src: string;
  __alt: string;
  __title: string | undefined;

  static getType(): string {
    return 'image';
  }

  static clone(node: ImageNode): ImageNode {
    return new ImageNode(node.__src, node.__alt, node.__title, node.__key);
  }

  constructor(src: string, alt: string, title?: string, key?: NodeKey) {
    super(key);
    this.__src = src;
    this.__alt = alt;
    this.__title = title;
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
          return { node: new ImageNode(src, alt, title) };
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
    figure.appendChild(img);

    return { element: figure };
  }

  static importJSON(serializedNode: SerializedImageNode): ImageNode {
    return new ImageNode(
      serializedNode.src,
      serializedNode.alt,
      serializedNode.title
    );
  }

  exportJSON(): SerializedImageNode {
    return {
      type: 'image',
      src: this.__src,
      alt: this.__alt,
      title: this.__title,
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

export function $createImageNode(
  src: string,
  alt: string,
  title?: string
): ImageNode {
  return new ImageNode(src, alt, title);
}

export function $isImageNode(node: LexicalNode | null | undefined): node is ImageNode {
  return node instanceof ImageNode;
}
