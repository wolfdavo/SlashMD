import {
  $getRoot,
  $isTextNode,
  $isParagraphNode,
  LexicalEditor,
  LexicalNode,
  TextNode,
  ElementNode,
} from 'lexical';
import { $isHeadingNode, $isQuoteNode } from '@lexical/rich-text';
import { $isListNode, $isListItemNode, ListNode, ListItemNode } from '@lexical/list';
import { $isCodeNode } from '@lexical/code';
import { $isLinkNode } from '@lexical/link';
import { $isTableNode, $isTableRowNode, $isTableCellNode, TableNode, TableRowNode, TableCellNode } from '@lexical/table';
import {
  $isHorizontalRuleNode,
  $isImageNode,
  $isCalloutNode,
  $isToggleContainerNode,
  $isToggleTitleNode,
  $isToggleContentNode,
  ImageNode,
  CalloutNode,
  ToggleContainerNode,
  ToggleTitleNode,
  ToggleContentNode,
} from '../editor/nodes';
import type {
  Root,
  Content,
  PhrasingContent,
  Paragraph,
  Heading,
  Blockquote,
  List,
  ListItem,
  Code,
  ThematicBreak,
  Table,
  TableRow,
  TableCell,
  Image,
  Text,
  Strong,
  Emphasis,
  InlineCode,
  Link,
  Delete,
  Html,
} from 'mdast';

// Convert Lexical editor state to mdast tree
export function exportLexicalToMdast(editor: LexicalEditor): Root {
  let root: Root = { type: 'root', children: [] };

  editor.getEditorState().read(() => {
    const lexicalRoot = $getRoot();
    const children: Content[] = [];

    for (const child of lexicalRoot.getChildren()) {
      const nodes = convertLexicalNode(child);
      children.push(...nodes);
    }

    root = { type: 'root', children };
  });

  return root;
}

function convertLexicalNode(node: LexicalNode): Content[] {
  if ($isParagraphNode(node)) {
    return [convertParagraphNode(node)];
  }

  if ($isHeadingNode(node)) {
    return [convertHeadingNode(node)];
  }

  if ($isQuoteNode(node)) {
    return [convertQuoteNode(node)];
  }

  if ($isListNode(node)) {
    return [convertListNode(node)];
  }

  if ($isCodeNode(node)) {
    return [convertCodeNode(node)];
  }

  if ($isHorizontalRuleNode(node)) {
    return [convertHorizontalRuleNode()];
  }

  if ($isTableNode(node)) {
    return [convertTableNode(node)];
  }

  if ($isImageNode(node)) {
    return [convertImageNode(node)];
  }

  if ($isCalloutNode(node)) {
    return [convertCalloutNode(node)];
  }

  if ($isToggleContainerNode(node)) {
    return convertToggleContainerNode(node);
  }

  // Fallback: create paragraph
  const paragraph: Paragraph = {
    type: 'paragraph',
    children: [{ type: 'text', value: '' }],
  };
  return [paragraph];
}

function convertParagraphNode(node: ElementNode): Paragraph {
  const children = convertInlineChildren(node);
  return {
    type: 'paragraph',
    children: children.length > 0 ? children : [{ type: 'text', value: '' }],
  };
}

function convertHeadingNode(node: ElementNode): Heading {
  const tag = (node as unknown as { getTag: () => string }).getTag();
  const depth = parseInt(tag.charAt(1), 10) as 1 | 2 | 3 | 4 | 5 | 6;
  const children = convertInlineChildren(node);

  return {
    type: 'heading',
    depth,
    children: children.length > 0 ? children : [{ type: 'text', value: '' }],
  };
}

function convertQuoteNode(node: ElementNode): Blockquote {
  const paragraph: Paragraph = {
    type: 'paragraph',
    children: convertInlineChildren(node),
  };

  return {
    type: 'blockquote',
    children: [paragraph],
  };
}

function convertListNode(node: ListNode): List {
  const listType = node.getListType();
  const ordered = listType === 'number';
  const children: ListItem[] = [];

  for (const child of node.getChildren()) {
    if ($isListItemNode(child)) {
      children.push(convertListItemNode(child, ordered));
    }
  }

  return {
    type: 'list',
    ordered,
    spread: false,
    children,
  };
}

function convertListItemNode(node: ListItemNode, _ordered: boolean): ListItem {
  const children: (Paragraph | List)[] = [];
  const inlineChildren: PhrasingContent[] = [];

  for (const child of node.getChildren()) {
    if ($isListNode(child)) {
      // Nested list
      if (inlineChildren.length > 0) {
        children.push({ type: 'paragraph', children: [...inlineChildren] });
        inlineChildren.length = 0;
      }
      children.push(convertListNode(child));
    } else if ($isTextNode(child)) {
      inlineChildren.push(...convertTextNode(child));
    } else if ($isLinkNode(child)) {
      inlineChildren.push(convertLinkNode(child as unknown as ElementNode));
    }
  }

  if (inlineChildren.length > 0) {
    children.push({ type: 'paragraph', children: inlineChildren });
  }

  const checked = node.getChecked?.();

  return {
    type: 'listItem',
    spread: false,
    checked: checked !== undefined ? checked : null,
    children: children.length > 0 ? children : [{ type: 'paragraph', children: [{ type: 'text', value: '' }] }],
  };
}

function convertCodeNode(node: ElementNode): Code {
  // Use getTextContent() which handles both TextNode and CodeHighlightNode children
  const value = node.getTextContent();
  const lang = (node as unknown as { getLanguage?: () => string }).getLanguage?.() || undefined;

  return {
    type: 'code',
    lang,
    value,
  };
}

function convertHorizontalRuleNode(): ThematicBreak {
  return { type: 'thematicBreak' };
}

function convertTableNode(node: TableNode): Table {
  const rows: TableRow[] = [];
  const align: ('left' | 'right' | 'center' | null)[] = [];

  let isFirstRow = true;
  for (const child of node.getChildren()) {
    if ($isTableRowNode(child)) {
      const row = convertTableRowNode(child);
      rows.push(row);

      // Get alignment from first row
      if (isFirstRow) {
        for (const cell of child.getChildren()) {
          align.push(null); // Default alignment
        }
        isFirstRow = false;
      }
    }
  }

  return {
    type: 'table',
    align,
    children: rows,
  };
}

function convertTableRowNode(node: TableRowNode): TableRow {
  const cells: TableCell[] = [];

  for (const child of node.getChildren()) {
    if ($isTableCellNode(child)) {
      cells.push(convertTableCellNode(child));
    }
  }

  return {
    type: 'tableRow',
    children: cells,
  };
}

function convertTableCellNode(node: TableCellNode): TableCell {
  const children: PhrasingContent[] = [];

  for (const child of node.getChildren()) {
    if ($isParagraphNode(child)) {
      children.push(...convertInlineChildren(child));
    }
  }

  return {
    type: 'tableCell',
    children: children.length > 0 ? children : [{ type: 'text', value: '' }],
  };
}

function convertImageNode(node: ImageNode): Paragraph | Html {
  const width = node.getWidth();
  const height = node.getHeight();

  // If image has custom dimensions, output as HTML img tag
  if (width || height) {
    let html = `<img src="${node.getSrc()}" alt="${node.getAlt()}"`;
    if (width) {
      html += ` width="${width}"`;
    }
    if (height) {
      html += ` height="${height}"`;
    }
    if (node.getTitle()) {
      html += ` title="${node.getTitle()}"`;
    }
    html += '>';

    return {
      type: 'html',
      value: html,
    };
  }

  // Standard markdown image syntax
  const image: Image = {
    type: 'image',
    url: node.getSrc(),
    alt: node.getAlt(),
    title: node.getTitle(),
  };

  return {
    type: 'paragraph',
    children: [image],
  };
}

function convertCalloutNode(node: CalloutNode): Blockquote {
  const calloutType = node.getCalloutType().toUpperCase();
  const children: Paragraph[] = [];

  // Iterate through callout's children (paragraphs)
  let isFirst = true;
  for (const child of node.getChildren()) {
    if ($isParagraphNode(child)) {
      const inlineChildren = convertInlineChildren(child);

      if (isFirst) {
        // First paragraph gets the [!TYPE] prefix
        const prefix: Text = { type: 'text', value: `[!${calloutType}]` };
        const contentChildren: PhrasingContent[] = [prefix];

        if (inlineChildren.length > 0) {
          // Add newline before content if there is content
          contentChildren.push({ type: 'text', value: '\n' });
          contentChildren.push(...inlineChildren);
        }

        children.push({
          type: 'paragraph',
          children: contentChildren,
        });
        isFirst = false;
      } else {
        // Subsequent paragraphs are added as-is
        children.push({
          type: 'paragraph',
          children: inlineChildren.length > 0 ? inlineChildren : [{ type: 'text', value: '' }],
        });
      }
    }
  }

  // Ensure at least one paragraph with the type marker
  if (children.length === 0) {
    children.push({
      type: 'paragraph',
      children: [{ type: 'text', value: `[!${calloutType}]` }],
    });
  }

  return {
    type: 'blockquote',
    children,
  };
}

function convertToggleContainerNode(node: ToggleContainerNode): Content[] {
  const result: Content[] = [];
  let summaryText = '';
  const contentNodes: Content[] = [];

  // Iterate through children to find title and content
  for (const child of node.getChildren()) {
    if ($isToggleTitleNode(child)) {
      // Extract text from title
      summaryText = child.getTextContent();
    } else if ($isToggleContentNode(child)) {
      // Convert content children to mdast
      for (const contentChild of child.getChildren()) {
        const converted = convertLexicalNode(contentChild);
        contentNodes.push(...converted);
      }
    }
  }

  // Build the opening HTML tag
  const isOpen = node.getOpen();
  result.push({
    type: 'html',
    value: `<details${isOpen ? ' open' : ''}><summary>${summaryText}</summary>`,
  } as Html);

  // Add all the content nodes (they will be serialized as markdown)
  result.push(...contentNodes);

  // Add the closing tag
  result.push({
    type: 'html',
    value: '</details>',
  } as Html);

  return result;
}

function convertInlineChildren(node: ElementNode): PhrasingContent[] {
  const children: PhrasingContent[] = [];

  for (const child of node.getChildren()) {
    if ($isTextNode(child)) {
      children.push(...convertTextNode(child));
    } else if ($isLinkNode(child)) {
      children.push(convertLinkNode(child as unknown as ElementNode));
    }
  }

  return children;
}

function convertTextNode(node: TextNode): PhrasingContent[] {
  const text = node.getTextContent();
  const format = node.getFormat();

  if (text === '') {
    return [];
  }

  let result: PhrasingContent = { type: 'text', value: text };

  // Apply formatting
  if (format & 1) {
    // Bold
    result = { type: 'strong', children: [result as Text] };
  }

  if (format & 2) {
    // Italic
    result = { type: 'emphasis', children: [result as Text] };
  }

  if (format & 4) {
    // Strikethrough
    result = { type: 'delete', children: [result as Text] };
  }

  if (format & 16) {
    // Code
    return [{ type: 'inlineCode', value: text }];
  }

  return [result];
}

function convertLinkNode(node: ElementNode): Link {
  const url = (node as unknown as { getURL: () => string }).getURL();
  const children: PhrasingContent[] = [];

  for (const child of node.getChildren()) {
    if ($isTextNode(child)) {
      children.push(...convertTextNode(child));
    }
  }

  return {
    type: 'link',
    url,
    children: children.length > 0 ? children : [{ type: 'text', value: '' }],
  };
}
