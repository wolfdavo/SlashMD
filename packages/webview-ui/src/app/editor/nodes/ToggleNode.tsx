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
  RangeSelection,
  SerializedElementNode,
  Spread,
} from 'lexical';

// ==================== ToggleContainerNode ====================
// The outer wrapper that contains the title and content

export type SerializedToggleContainerNode = Spread<
  {
    open: boolean;
  },
  SerializedElementNode
>;

export class ToggleContainerNode extends ElementNode {
  __open: boolean;

  static getType(): string {
    return 'toggle-container';
  }

  static clone(node: ToggleContainerNode): ToggleContainerNode {
    return new ToggleContainerNode(node.__open, node.__key);
  }

  constructor(open: boolean = false, key?: NodeKey) {
    super(key);
    this.__open = open;
  }

  createDOM(config: EditorConfig): HTMLElement {
    const dom = document.createElement('div');
    dom.classList.add('toggle-container');
    if (this.__open) {
      dom.classList.add('toggle-container--open');
    }
    return dom;
  }

  updateDOM(prevNode: ToggleContainerNode, dom: HTMLElement): boolean {
    if (prevNode.__open !== this.__open) {
      dom.classList.toggle('toggle-container--open', this.__open);
    }
    return false;
  }

  static importDOM(): DOMConversionMap | null {
    return {
      details: (domNode: HTMLElement) => {
        return {
          conversion: convertDetailsElement,
          priority: 1,
        };
      },
    };
  }

  static importJSON(serializedNode: SerializedToggleContainerNode): ToggleContainerNode {
    const node = $createToggleContainerNode(serializedNode.open);
    return node;
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement('details');
    if (this.__open) {
      element.setAttribute('open', '');
    }
    return { element };
  }

  exportJSON(): SerializedToggleContainerNode {
    return {
      ...super.exportJSON(),
      type: 'toggle-container',
      open: this.__open,
      version: 1,
    };
  }

  setOpen(open: boolean): void {
    const writable = this.getWritable();
    writable.__open = open;
  }

  getOpen(): boolean {
    return this.__open;
  }

  toggleOpen(): void {
    this.setOpen(!this.getOpen());
  }

  // This prevents direct selection in the container
  isShadowRoot(): boolean {
    return true;
  }

  canBeEmpty(): boolean {
    return false;
  }
}

function convertDetailsElement(domNode: HTMLElement): DOMConversionOutput | null {
  const isOpen = domNode.hasAttribute('open');
  const node = $createToggleContainerNode(isOpen);
  return { node };
}

export function $createToggleContainerNode(open: boolean = false): ToggleContainerNode {
  return new ToggleContainerNode(open);
}

export function $isToggleContainerNode(
  node: LexicalNode | null | undefined
): node is ToggleContainerNode {
  return node instanceof ToggleContainerNode;
}

// ==================== ToggleTitleNode ====================
// The clickable title/summary area

export type SerializedToggleTitleNode = SerializedElementNode;

export class ToggleTitleNode extends ElementNode {
  static getType(): string {
    return 'toggle-title';
  }

  static clone(node: ToggleTitleNode): ToggleTitleNode {
    return new ToggleTitleNode(node.__key);
  }

  createDOM(config: EditorConfig): HTMLElement {
    const dom = document.createElement('div');
    dom.classList.add('toggle-title');
    return dom;
  }

  updateDOM(): boolean {
    return false;
  }

  static importDOM(): DOMConversionMap | null {
    return {
      summary: () => ({
        conversion: convertSummaryElement,
        priority: 1,
      }),
    };
  }

  static importJSON(serializedNode: SerializedToggleTitleNode): ToggleTitleNode {
    return $createToggleTitleNode();
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement('summary');
    return { element };
  }

  exportJSON(): SerializedToggleTitleNode {
    return {
      ...super.exportJSON(),
      type: 'toggle-title',
      version: 1,
    };
  }

  // Collapse at start collapses the entire toggle
  collapseAtStart(_selection: RangeSelection): boolean {
    this.getParentOrThrow().insertBefore(this);
    return true;
  }

  // Prevent inserting nodes that aren't allowed
  insertNewAfter(_: RangeSelection, restoreSelection?: boolean): null | ElementNode {
    const containerNode = this.getParentOrThrow();

    if (!$isToggleContainerNode(containerNode)) {
      throw new Error('ToggleTitleNode must be a child of ToggleContainerNode');
    }

    // If closed, open it
    if (!containerNode.getOpen()) {
      containerNode.toggleOpen();
    }

    // Find or create content node
    const children = containerNode.getChildren();
    const contentNode = children.find($isToggleContentNode);

    if (contentNode) {
      const firstChild = contentNode.getFirstChild();
      if (firstChild) {
        firstChild.selectStart();
      } else {
        const paragraph = $createParagraphNode();
        contentNode.append(paragraph);
        paragraph.selectStart();
      }
    }

    return null;
  }
}

function convertSummaryElement(): DOMConversionOutput | null {
  const node = $createToggleTitleNode();
  return { node };
}

export function $createToggleTitleNode(): ToggleTitleNode {
  return new ToggleTitleNode();
}

export function $isToggleTitleNode(
  node: LexicalNode | null | undefined
): node is ToggleTitleNode {
  return node instanceof ToggleTitleNode;
}

// ==================== ToggleContentNode ====================
// The expandable content area that can hold any block content

export type SerializedToggleContentNode = SerializedElementNode;

export class ToggleContentNode extends ElementNode {
  static getType(): string {
    return 'toggle-content';
  }

  static clone(node: ToggleContentNode): ToggleContentNode {
    return new ToggleContentNode(node.__key);
  }

  createDOM(config: EditorConfig): HTMLElement {
    const dom = document.createElement('div');
    dom.classList.add('toggle-content-area');
    return dom;
  }

  updateDOM(): boolean {
    return false;
  }

  static importDOM(): DOMConversionMap | null {
    return null;
  }

  static importJSON(serializedNode: SerializedToggleContentNode): ToggleContentNode {
    return $createToggleContentNode();
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement('div');
    return { element };
  }

  exportJSON(): SerializedToggleContentNode {
    return {
      ...super.exportJSON(),
      type: 'toggle-content',
      version: 1,
    };
  }

  isShadowRoot(): boolean {
    return true;
  }
}

export function $createToggleContentNode(): ToggleContentNode {
  return new ToggleContentNode();
}

export function $isToggleContentNode(
  node: LexicalNode | null | undefined
): node is ToggleContentNode {
  return node instanceof ToggleContentNode;
}

// ==================== Helper Functions ====================

export function $createToggleNode(
  summaryText: string = 'Toggle',
  contentText: string = '',
  open: boolean = false
): ToggleContainerNode {
  const container = $createToggleContainerNode(open);

  const title = $createToggleTitleNode();
  const titleParagraph = $createParagraphNode();
  if (summaryText) {
    titleParagraph.append($createTextNode(summaryText));
  }
  title.append(titleParagraph);

  const content = $createToggleContentNode();
  const contentParagraph = $createParagraphNode();
  if (contentText) {
    contentParagraph.append($createTextNode(contentText));
  }
  content.append(contentParagraph);

  container.append(title);
  container.append(content);

  return container;
}

// Legacy compatibility - now just checks for container
export function $isToggleNode(
  node: LexicalNode | null | undefined
): node is ToggleContainerNode {
  return $isToggleContainerNode(node);
}

// Legacy type alias
export type ToggleNode = ToggleContainerNode;
export type SerializedToggleNode = SerializedToggleContainerNode;
