'use client';

import { useEffect, useRef } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getRoot, $createParagraphNode, $createTextNode, TextNode } from 'lexical';
import { $createHeadingNode, $createQuoteNode } from '@lexical/rich-text';
import { $createCodeNode } from '@lexical/code';
import { $createListNode, $createListItemNode } from '@lexical/list';
import { $createCalloutNode } from './nodes';

interface InitializePluginProps {
  content: string;
}

function parseInlineFormatting(text: string, parent: { append: (node: TextNode) => void }) {
  // Simple regex-based parsing for bold, italic, and code
  const parts: { text: string; bold?: boolean; italic?: boolean; code?: boolean }[] = [];

  // This is a simplified parser - for demo purposes
  const regex = /(\*\*(.+?)\*\*|\*(.+?)\*|`([^`]+)`)/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    // Add text before match
    if (match.index > lastIndex) {
      parts.push({ text: text.slice(lastIndex, match.index) });
    }

    if (match[2]) {
      // Bold **text**
      parts.push({ text: match[2], bold: true });
    } else if (match[3]) {
      // Italic *text*
      parts.push({ text: match[3], italic: true });
    } else if (match[4]) {
      // Code `text`
      parts.push({ text: match[4], code: true });
    }

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push({ text: text.slice(lastIndex) });
  }

  // If no formatting found, just add plain text
  if (parts.length === 0) {
    parts.push({ text });
  }

  // Create text nodes with formatting
  for (const part of parts) {
    const textNode = $createTextNode(part.text);
    if (part.bold) textNode.toggleFormat('bold');
    if (part.italic) textNode.toggleFormat('italic');
    if (part.code) textNode.toggleFormat('code');
    parent.append(textNode);
  }
}

export function InitializePlugin({ content }: InitializePluginProps) {
  const [editor] = useLexicalComposerContext();
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

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
          // Create callout without content (we'll add a paragraph with formatted text)
          const calloutNode = $createCalloutNode(validType);
          // Create a paragraph inside the callout for the content
          const paragraph = $createParagraphNode();
          parseInlineFormatting(calloutContent, paragraph);
          calloutNode.append(paragraph);
          root.append(calloutNode);
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
          i--; // Adjust since the while loop will increment
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
          i--; // Adjust since the while loop will increment
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
        // Empty line
        else if (line.trim() === '') {
          // Skip empty lines between blocks
        }
        // Closing ::: for callouts (skip it)
        else if (line === ':::') {
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

      // Add an empty paragraph at the end for typing
      const emptyParagraph = $createParagraphNode();
      root.append(emptyParagraph);
    });
  }, [editor, content]);

  return null;
}
