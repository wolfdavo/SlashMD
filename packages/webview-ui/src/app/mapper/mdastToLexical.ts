import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  LexicalEditor,
  ParagraphNode,
  TextNode,
  LexicalNode,
} from 'lexical';
import { $createHeadingNode, $createQuoteNode, HeadingNode, QuoteNode } from '@lexical/rich-text';
import { $createListNode, $createListItemNode, ListNode, ListItemNode } from '@lexical/list';
import { $createCodeNode, CodeNode } from '@lexical/code';
import { $createLinkNode, LinkNode } from '@lexical/link';
import {
  $createHorizontalRuleNode,
  $createImageNode,
  $createCalloutNode,
  $createToggleNode,
  HorizontalRuleNode,
  ImageNode,
  CalloutNode,
  ToggleNode,
  CalloutType,
} from '../editor/nodes';
import { $createTableNode, $createTableRowNode, $createTableCellNode, TableNode, TableRowNode, TableCellNode, TableCellHeaderStates } from '@lexical/table';
import type { Root, Content, PhrasingContent, List, ListItem, Table, TableRow, TableCell, Heading, Paragraph, Blockquote, Code, ThematicBreak, Image, Link, Text, Strong, Emphasis, InlineCode, Delete, Html } from 'mdast';

type LexicalBlockNode =
  | ParagraphNode
  | HeadingNode
  | QuoteNode
  | ListNode
  | CodeNode
  | HorizontalRuleNode
  | ImageNode
  | CalloutNode
  | ToggleNode
  | TableNode;

// Convert mdast tree to Lexical editor state
export function importMarkdownToLexical(
  editor: LexicalEditor,
  root: Root
): void {
  editor.update(() => {
    const lexicalRoot = $getRoot();
    lexicalRoot.clear();

    for (const child of root.children) {
      const nodes = convertBlockNode(child);
      for (const node of nodes) {
        lexicalRoot.append(node);
      }
    }
  });
}

function convertBlockNode(node: Content): LexicalBlockNode[] {
  switch (node.type) {
    case 'paragraph':
      return [convertParagraph(node)];
    case 'heading':
      return [convertHeading(node)];
    case 'blockquote':
      return convertBlockquote(node);
    case 'list':
      return [convertList(node)];
    case 'code':
      return [convertCode(node)];
    case 'thematicBreak':
      return [convertThematicBreak()];
    case 'table':
      return [convertTable(node)];
    case 'html':
      return convertHtml(node);
    default:
      // For unknown nodes, create a paragraph with their text content
      const paragraph = $createParagraphNode();
      paragraph.append($createTextNode(String(node)));
      return [paragraph];
  }
}

function convertParagraph(node: Paragraph): ParagraphNode {
  const paragraph = $createParagraphNode();

  // Check if this is just an image
  if (
    node.children.length === 1 &&
    node.children[0].type === 'image'
  ) {
    const img = node.children[0] as Image;
    const imageNode = $createImageNode(img.url, img.alt || '', img.title);
    // Images are block-level in our editor, but mdast wraps them in paragraphs
    // We'll return the paragraph with the image representation for now
    paragraph.append($createTextNode(`![${img.alt || ''}](${img.url})`));
    return paragraph;
  }

  for (const child of node.children) {
    const nodes = convertInlineNode(child);
    for (const n of nodes) {
      paragraph.append(n);
    }
  }

  return paragraph;
}

function convertHeading(node: Heading): HeadingNode {
  const tag = `h${node.depth}` as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  const heading = $createHeadingNode(tag);

  for (const child of node.children) {
    const nodes = convertInlineNode(child);
    for (const n of nodes) {
      heading.append(n);
    }
  }

  return heading;
}

function convertBlockquote(node: Blockquote): LexicalBlockNode[] {
  // Check if this is a callout (admonition)
  if (node.children.length > 0) {
    const firstChild = node.children[0];
    if (firstChild.type === 'paragraph' && firstChild.children.length > 0) {
      const firstText = firstChild.children[0];
      if (firstText.type === 'text') {
        const calloutMatch = firstText.value.match(/^\[!(NOTE|TIP|WARNING|IMPORTANT|CAUTION)\]/i);
        if (calloutMatch) {
          const calloutType = calloutMatch[1].toLowerCase() as CalloutType;
          const restOfText = firstText.value.slice(calloutMatch[0].length).trim();

          // Collect content from remaining children
          let content = restOfText;
          for (let i = 1; i < node.children.length; i++) {
            const child = node.children[i];
            if (child.type === 'paragraph') {
              content += '\n' + extractTextFromParagraph(child);
            }
          }

          return [$createCalloutNode(calloutType, content)];
        }
      }
    }
  }

  // Regular blockquote
  const quote = $createQuoteNode();

  for (const child of node.children) {
    if (child.type === 'paragraph') {
      for (const inlineChild of child.children) {
        const nodes = convertInlineNode(inlineChild);
        for (const n of nodes) {
          quote.append(n);
        }
      }
    }
  }

  return [quote];
}

function extractTextFromParagraph(node: Paragraph): string {
  let text = '';
  for (const child of node.children) {
    if (child.type === 'text') {
      text += child.value;
    } else if ('children' in child) {
      for (const grandchild of child.children as PhrasingContent[]) {
        if (grandchild.type === 'text') {
          text += grandchild.value;
        }
      }
    }
  }
  return text;
}

function convertList(node: List): ListNode {
  const listType = node.ordered ? 'number' : 'bullet';
  const list = $createListNode(listType);

  for (const item of node.children) {
    const listItem = convertListItem(item, node);
    list.append(listItem);
  }

  return list;
}

function convertListItem(node: ListItem, parentList: List): ListItemNode {
  const listItem = $createListItemNode(
    parentList.ordered === false && node.checked !== null ? node.checked : undefined
  );

  for (const child of node.children) {
    if (child.type === 'paragraph') {
      for (const inlineChild of child.children) {
        const nodes = convertInlineNode(inlineChild);
        for (const n of nodes) {
          listItem.append(n);
        }
      }
    } else if (child.type === 'list') {
      // Nested list
      const nestedList = convertList(child);
      listItem.append(nestedList);
    }
  }

  return listItem;
}

function convertCode(node: Code): CodeNode {
  const code = $createCodeNode(node.lang || undefined);
  code.append($createTextNode(node.value));
  return code;
}

function convertThematicBreak(): HorizontalRuleNode {
  return $createHorizontalRuleNode();
}

function convertTable(node: Table): TableNode {
  const table = $createTableNode();

  for (let i = 0; i < node.children.length; i++) {
    const row = node.children[i];
    const isHeader = i === 0;
    const tableRow = convertTableRow(row, isHeader, node.align);
    table.append(tableRow);
  }

  return table;
}

function convertTableRow(
  node: TableRow,
  isHeader: boolean,
  alignments: Table['align']
): TableRowNode {
  const row = $createTableRowNode();

  for (let i = 0; i < node.children.length; i++) {
    const cell = node.children[i];
    const align = alignments?.[i] || null;
    const tableCell = convertTableCell(cell, isHeader, align);
    row.append(tableCell);
  }

  return row;
}

function convertTableCell(
  node: TableCell,
  isHeader: boolean,
  _align: 'left' | 'right' | 'center' | null
): TableCellNode {
  const cell = $createTableCellNode(isHeader ? TableCellHeaderStates.ROW : TableCellHeaderStates.NO_STATUS);

  const paragraph = $createParagraphNode();
  for (const child of node.children) {
    const nodes = convertInlineNode(child);
    for (const n of nodes) {
      paragraph.append(n);
    }
  }
  cell.append(paragraph);

  return cell;
}

function convertHtml(node: Html): LexicalBlockNode[] {
  const html = node.value;

  // Check for toggle/details
  const detailsMatch = html.match(/<details>\s*<summary>([\s\S]*?)<\/summary>([\s\S]*?)<\/details>/i);
  if (detailsMatch) {
    const summary = detailsMatch[1].trim();
    const content = detailsMatch[2].trim();
    return [$createToggleNode(summary, content, false)];
  }

  // For other HTML, create a code block to preserve it
  const code = $createCodeNode('html');
  code.append($createTextNode(html));
  return [code];
}

function convertInlineNode(node: PhrasingContent): (TextNode | LinkNode)[] {
  switch (node.type) {
    case 'text':
      return [convertText(node)];
    case 'strong':
      return convertStrong(node);
    case 'emphasis':
      return convertEmphasis(node);
    case 'inlineCode':
      return [convertInlineCode(node)];
    case 'link':
      return [convertLink(node)];
    case 'delete':
      return convertDelete(node);
    case 'image':
      // Images in inline context become text placeholder
      return [$createTextNode(`![${node.alt || ''}](${node.url})`)];
    default:
      return [$createTextNode('')];
  }
}

function convertText(node: Text): TextNode {
  return $createTextNode(node.value);
}

function convertStrong(node: Strong): TextNode[] {
  const nodes: TextNode[] = [];
  for (const child of node.children) {
    const converted = convertInlineNode(child);
    for (const n of converted) {
      if (n instanceof TextNode) {
        n.setFormat('bold');
        nodes.push(n);
      }
    }
  }
  return nodes;
}

function convertEmphasis(node: Emphasis): TextNode[] {
  const nodes: TextNode[] = [];
  for (const child of node.children) {
    const converted = convertInlineNode(child);
    for (const n of converted) {
      if (n instanceof TextNode) {
        n.setFormat('italic');
        nodes.push(n);
      }
    }
  }
  return nodes;
}

function convertInlineCode(node: InlineCode): TextNode {
  const textNode = $createTextNode(node.value);
  textNode.setFormat('code');
  return textNode;
}

function convertLink(node: Link): LinkNode {
  const link = $createLinkNode(node.url);

  for (const child of node.children) {
    const nodes = convertInlineNode(child);
    for (const n of nodes) {
      link.append(n);
    }
  }

  return link;
}

function convertDelete(node: Delete): TextNode[] {
  const nodes: TextNode[] = [];
  for (const child of node.children) {
    const converted = convertInlineNode(child);
    for (const n of converted) {
      if (n instanceof TextNode) {
        n.setFormat('strikethrough');
        nodes.push(n);
      }
    }
  }
  return nodes;
}
