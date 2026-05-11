'use client';

import { useEffect, useCallback } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getRoot, $createParagraphNode, $createTextNode, TextNode, $isElementNode, $isTextNode, ElementNode } from 'lexical';
import { $createHeadingNode, $createQuoteNode, $isHeadingNode, $isQuoteNode } from '@lexical/rich-text';
import { $createCodeNode, $isCodeNode } from '@lexical/code';
import { $createListNode, $createListItemNode, $isListNode, $isListItemNode } from '@lexical/list';
import {
  $createTableNode,
  $createTableRowNode,
  $createTableCellNode,
  $isTableNode,
  $isTableRowNode,
  $isTableCellNode,
  TableCellHeaderStates,
} from '@lexical/table';
import {
  $createCalloutNode,
  $isCalloutNode,
  $createHorizontalRuleNode,
  $isHorizontalRuleNode,
  $createToggleContainerNode,
  $createToggleTitleNode,
  $createToggleContentNode,
  $isToggleContainerNode,
} from './nodes';

interface MarkdownSyncPluginProps {
  onMarkdownChange?: (markdown: string) => void;
  externalMarkdown?: string;
  lastExternalUpdate?: number;
}

function parseInlineFormatting(text: string, parent: { append: (node: TextNode) => void }) {
  const parts: { text: string; bold?: boolean; italic?: boolean; code?: boolean }[] = [];
  const regex = /(\*\*(.+?)\*\*|\*(.+?)\*|`([^`]+)`)/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ text: text.slice(lastIndex, match.index) });
    }
    if (match[2]) {
      parts.push({ text: match[2], bold: true });
    } else if (match[3]) {
      parts.push({ text: match[3], italic: true });
    } else if (match[4]) {
      parts.push({ text: match[4], code: true });
    }
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push({ text: text.slice(lastIndex) });
  }

  if (parts.length === 0) {
    parts.push({ text });
  }

  for (const part of parts) {
    const textNode = $createTextNode(part.text);
    if (part.bold) textNode.toggleFormat('bold');
    if (part.italic) textNode.toggleFormat('italic');
    if (part.code) textNode.toggleFormat('code');
    parent.append(textNode);
  }
}

function serializeTextNode(node: TextNode): string {
  let text = node.getTextContent();
  const format = node.getFormat();

  // Check formats (bit flags: 1=bold, 2=italic, 16=code)
  const isBold = (format & 1) !== 0;
  const isItalic = (format & 2) !== 0;
  const isCode = (format & 16) !== 0;

  if (isCode) {
    text = `\`${text}\``;
  }
  if (isBold) {
    text = `**${text}**`;
  }
  if (isItalic) {
    text = `*${text}*`;
  }

  return text;
}

function serializeElementContent(node: ElementNode): string {
  const children = node.getChildren();
  let result = '';

  for (const child of children) {
    if ($isTextNode(child)) {
      result += serializeTextNode(child);
    } else if ($isElementNode(child)) {
      result += serializeElementContent(child);
    }
  }

  return result;
}

function serializeTableCell(cell: ElementNode): string {
  const children = cell.getChildren();
  let result = '';

  for (const child of children) {
    if ($isTextNode(child)) {
      result += serializeTextNode(child);
    } else if ($isElementNode(child)) {
      result += serializeElementContent(child);
    }
  }

  return result.trim();
}

export function MarkdownSyncPlugin({ onMarkdownChange, externalMarkdown, lastExternalUpdate }: MarkdownSyncPluginProps) {
  const [editor] = useLexicalComposerContext();

  // Export markdown from editor
  const exportMarkdown = useCallback(() => {
    return editor.getEditorState().read(() => {
      const root = $getRoot();
      const children = root.getChildren();
      const lines: string[] = [];

      for (const child of children) {
        if ($isHeadingNode(child)) {
          const tag = child.getTag();
          const prefix = tag === 'h1' ? '# ' : tag === 'h2' ? '## ' : '### ';
          lines.push(prefix + serializeElementContent(child));
          lines.push('');
        } else if ($isQuoteNode(child)) {
          lines.push('> ' + serializeElementContent(child));
          lines.push('');
        } else if ($isCodeNode(child)) {
          const language = child.getLanguage() || '';
          lines.push('```' + language);
          lines.push(child.getTextContent());
          lines.push('```');
          lines.push('');
        } else if ($isListNode(child)) {
          const listType = child.getListType();
          const items = child.getChildren();
          let itemNum = 1;
          for (const item of items) {
            if ($isListItemNode(item)) {
              const prefix = listType === 'number' ? `${itemNum}. ` : '- ';
              lines.push(prefix + serializeElementContent(item));
              itemNum++;
            }
          }
          lines.push('');
        } else if ($isCalloutNode(child)) {
          const calloutType = child.getCalloutType();
          lines.push(':::' + calloutType);
          const calloutChildren = child.getChildren();
          for (const calloutChild of calloutChildren) {
            if ($isElementNode(calloutChild)) {
              lines.push(serializeElementContent(calloutChild));
            }
          }
          lines.push(':::');
          lines.push('');
        } else if ($isHorizontalRuleNode(child)) {
          lines.push('---');
          lines.push('');
        } else if ($isToggleContainerNode(child)) {
          // Serialize toggle as details/summary HTML (common markdown extension)
          const toggleChildren = child.getChildren();
          let title = '';
          let content = '';

          for (const toggleChild of toggleChildren) {
            if ($isElementNode(toggleChild)) {
              const className = toggleChild.constructor.name;
              if (className === 'ToggleTitleNode') {
                title = serializeElementContent(toggleChild);
              } else if (className === 'ToggleContentNode') {
                content = serializeElementContent(toggleChild);
              }
            }
          }

          lines.push('<details>');
          lines.push(`<summary>${title}</summary>`);
          lines.push('');
          if (content) {
            lines.push(content);
          }
          lines.push('</details>');
          lines.push('');
        } else if ($isTableNode(child)) {
          const rows = child.getChildren();
          const tableData: string[][] = [];

          for (const row of rows) {
            if ($isTableRowNode(row)) {
              const rowData: string[] = [];
              const cells = row.getChildren();
              for (const cell of cells) {
                if ($isTableCellNode(cell)) {
                  rowData.push(serializeTableCell(cell));
                }
              }
              tableData.push(rowData);
            }
          }

          if (tableData.length > 0) {
            const colCount = tableData[0]?.length || 0;
            const colWidths: number[] = [];
            for (let c = 0; c < colCount; c++) {
              let maxWidth = 3;
              for (const row of tableData) {
                if (row[c]) {
                  maxWidth = Math.max(maxWidth, row[c].length);
                }
              }
              colWidths.push(maxWidth);
            }

            if (tableData[0]) {
              const headerCells = tableData[0].map((cell, idx) => cell.padEnd(colWidths[idx]));
              lines.push('| ' + headerCells.join(' | ') + ' |');
              const separators = colWidths.map(w => '-'.repeat(w));
              lines.push('| ' + separators.join(' | ') + ' |');
            }

            for (let r = 1; r < tableData.length; r++) {
              const rowCells = tableData[r].map((cell, idx) => (cell || '').padEnd(colWidths[idx]));
              lines.push('| ' + rowCells.join(' | ') + ' |');
            }
            lines.push('');
          }
        } else if ($isElementNode(child)) {
          const content = serializeElementContent(child);
          if (content.trim()) {
            lines.push(content);
            lines.push('');
          }
        }
      }

      while (lines.length > 0 && lines[lines.length - 1] === '') {
        lines.pop();
      }

      return lines.join('\n');
    });
  }, [editor]);

  // Import markdown into editor
  const importMarkdown = useCallback((content: string) => {
    editor.update(() => {
      const root = $getRoot();
      root.clear();

      const lines = content.split('\n');
      let i = 0;

      while (i < lines.length) {
        const line = lines[i];

        // Callout blocks (:::note, :::tip, :::warning)
        if (line.startsWith(':::') && line.length > 3) {
          const calloutType = line.slice(3).trim() as 'note' | 'tip' | 'warning';
          const contentLines: string[] = [];
          i++;
          while (i < lines.length && !lines[i].startsWith(':::')) {
            contentLines.push(lines[i]);
            i++;
          }
          const calloutContent = contentLines.join('\n').trim();
          const validType = ['note', 'tip', 'warning'].includes(calloutType) ? calloutType : 'note';
          const calloutNode = $createCalloutNode(validType);
          const paragraph = $createParagraphNode();
          parseInlineFormatting(calloutContent, paragraph);
          calloutNode.append(paragraph);
          root.append(calloutNode);
        }
        // Details/summary (toggle) - HTML format
        else if (line.trim() === '<details>') {
          let title = '';
          let contentLines: string[] = [];
          i++;

          // Parse summary
          while (i < lines.length) {
            const currentLine = lines[i];
            const summaryMatch = currentLine.match(/<summary>(.*?)<\/summary>/);
            if (summaryMatch) {
              title = summaryMatch[1];
              i++;
              break;
            } else if (currentLine.includes('</details>')) {
              break;
            }
            i++;
          }

          // Parse content until </details>
          while (i < lines.length && !lines[i].includes('</details>')) {
            if (lines[i].trim()) {
              contentLines.push(lines[i]);
            }
            i++;
          }

          const toggleContainer = $createToggleContainerNode(true);
          const toggleTitle = $createToggleTitleNode();
          parseInlineFormatting(title, toggleTitle);
          const toggleContent = $createToggleContentNode();
          const contentParagraph = $createParagraphNode();
          parseInlineFormatting(contentLines.join('\n').trim(), contentParagraph);
          toggleContent.append(contentParagraph);
          toggleContainer.append(toggleTitle);
          toggleContainer.append(toggleContent);
          root.append(toggleContainer);
        }
        // Horizontal rule
        else if (line.trim() === '---' || line.trim() === '***' || line.trim() === '___') {
          root.append($createHorizontalRuleNode());
        }
        // Table (starts with |)
        else if (line.trimStart().startsWith('|')) {
          const tableRows: string[][] = [];

          while (i < lines.length && lines[i].trimStart().startsWith('|')) {
            const rowLine = lines[i].trim();
            // Skip separator row (contains only |, -, :, and spaces)
            if (/^\|[-:\s|]+\|?$/.test(rowLine) && rowLine.includes('-')) {
              i++;
              continue;
            }

            // Parse cells - handle both | cell | cell | and | cell | cell formats
            let cells: string[];
            if (rowLine.endsWith('|')) {
              cells = rowLine.split('|').slice(1, -1).map(cell => cell.trim());
            } else {
              cells = rowLine.split('|').slice(1).map(cell => cell.trim());
            }

            if (cells.length > 0 && cells.some(c => c.length > 0 || cells.length > 1)) {
              tableRows.push(cells);
            }
            i++;
          }
          i--;

          if (tableRows.length > 0) {
            const tableNode = $createTableNode();

            // Ensure all rows have the same number of cells
            const maxCols = Math.max(...tableRows.map(r => r.length));

            for (let rowIdx = 0; rowIdx < tableRows.length; rowIdx++) {
              const rowData = tableRows[rowIdx];
              const rowNode = $createTableRowNode();

              for (let colIdx = 0; colIdx < maxCols; colIdx++) {
                const cellContent = rowData[colIdx] || '';
                const isHeader = rowIdx === 0;
                const headerState = isHeader ? TableCellHeaderStates.ROW : TableCellHeaderStates.NO_STATUS;
                const cellNode = $createTableCellNode(headerState);
                const paragraph = $createParagraphNode();
                if (cellContent) {
                  parseInlineFormatting(cellContent, paragraph);
                } else {
                  paragraph.append($createTextNode(''));
                }
                cellNode.append(paragraph);
                rowNode.append(cellNode);
              }

              tableNode.append(rowNode);
            }

            root.append(tableNode);
          }
        }
        // Heading
        else if (line.startsWith('# ')) {
          const heading = $createHeadingNode('h1');
          parseInlineFormatting(line.slice(2), heading);
          root.append(heading);
        } else if (line.startsWith('## ')) {
          const heading = $createHeadingNode('h2');
          parseInlineFormatting(line.slice(3), heading);
          root.append(heading);
        } else if (line.startsWith('### ')) {
          const heading = $createHeadingNode('h3');
          parseInlineFormatting(line.slice(4), heading);
          root.append(heading);
        }
        // Unordered list
        else if (line.startsWith('- ')) {
          const list = $createListNode('bullet');
          while (i < lines.length && lines[i].startsWith('- ')) {
            const item = $createListItemNode();
            parseInlineFormatting(lines[i].slice(2), item);
            list.append(item);
            i++;
          }
          root.append(list);
          i--;
        }
        // Ordered list
        else if (/^\d+\.\s/.test(line)) {
          const list = $createListNode('number');
          while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
            const item = $createListItemNode();
            parseInlineFormatting(lines[i].replace(/^\d+\.\s/, ''), item);
            list.append(item);
            i++;
          }
          root.append(list);
          i--;
        }
        // Quote
        else if (line.startsWith('> ')) {
          const quote = $createQuoteNode();
          parseInlineFormatting(line.slice(2), quote);
          root.append(quote);
        }
        // Code block
        else if (line.startsWith('```')) {
          const language = line.slice(3).trim();
          const codeLines: string[] = [];
          i++;
          while (i < lines.length && !lines[i].startsWith('```')) {
            codeLines.push(lines[i]);
            i++;
          }
          const codeNode = $createCodeNode(language || undefined);
          codeNode.append($createTextNode(codeLines.join('\n')));
          root.append(codeNode);
        }
        // Empty line or closing :::
        else if (line.trim() === '' || line === ':::') {
          // Skip
        }
        // Paragraph
        else {
          const paragraph = $createParagraphNode();
          parseInlineFormatting(line, paragraph);
          root.append(paragraph);
        }

        i++;
      }

      // Add an empty paragraph at the end
      const emptyParagraph = $createParagraphNode();
      root.append(emptyParagraph);
    });
  }, [editor]);

  // Listen for editor changes and export markdown
  useEffect(() => {
    if (!onMarkdownChange) return;

    return editor.registerUpdateListener(({ dirtyElements, dirtyLeaves }) => {
      if (dirtyElements.size === 0 && dirtyLeaves.size === 0) return;

      const markdown = exportMarkdown();
      onMarkdownChange(markdown);
    });
  }, [editor, onMarkdownChange, exportMarkdown]);

  // Import external markdown when it changes
  useEffect(() => {
    if (externalMarkdown !== undefined && lastExternalUpdate) {
      importMarkdown(externalMarkdown);
    }
  }, [lastExternalUpdate, externalMarkdown, importMarkdown]);

  return null;
}
