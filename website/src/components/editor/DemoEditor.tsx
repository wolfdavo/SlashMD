'use client';

import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { CheckListPlugin } from '@lexical/react/LexicalCheckListPlugin';
import { TabIndentationPlugin } from '@lexical/react/LexicalTabIndentationPlugin';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin';
import { TablePlugin } from '@lexical/react/LexicalTablePlugin';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { ListNode, ListItemNode } from '@lexical/list';
import { CodeNode, CodeHighlightNode } from '@lexical/code';
import { LinkNode, AutoLinkNode } from '@lexical/link';
import { TableNode, TableRowNode, TableCellNode } from '@lexical/table';

import { SlashMenuPlugin } from './SlashMenuPlugin';
import { InitializePlugin } from './InitializePlugin';
import { DragHandlePlugin } from './DragHandlePlugin';
import { MarkdownShortcutsPlugin } from './MarkdownShortcutsPlugin';
import { TogglePlugin } from './TogglePlugin';
import { CodeBlockPlugin } from './CodeBlockPlugin';
import { CodeHighlightPlugin } from './CodeHighlightPlugin';
import { BlockClickPlugin } from './BlockClickPlugin';
import { Toolbar } from './Toolbar';
import { ImagePlugin } from './ImagePlugin';
import { TableActionsPlugin } from './TableActionsPlugin';
import {
  CalloutNode,
  ToggleContainerNode,
  ToggleTitleNode,
  ToggleContentNode,
  ImageNode,
  HorizontalRuleNode,
} from './nodes';

const editorTheme = {
  paragraph: 'demo-editor-paragraph',
  heading: {
    h1: 'demo-editor-heading-h1',
    h2: 'demo-editor-heading-h2',
    h3: 'demo-editor-heading-h3',
  },
  list: {
    ul: 'demo-editor-list-ul',
    ol: 'demo-editor-list-ol',
    listitem: 'demo-editor-listitem',
    listitemChecked: 'demo-editor-listitem-checked',
    listitemUnchecked: 'demo-editor-listitem-unchecked',
    checklist: 'demo-editor-checklist',
    nested: {
      listitem: 'demo-editor-nested-listitem',
    },
  },
  quote: 'demo-editor-quote',
  code: 'demo-editor-code',
  codeHighlight: {
    atrule: 'demo-editor-tokenAttr',
    attr: 'demo-editor-tokenAttr',
    boolean: 'demo-editor-tokenProperty',
    builtin: 'demo-editor-tokenSelector',
    cdata: 'demo-editor-tokenComment',
    char: 'demo-editor-tokenSelector',
    class: 'demo-editor-tokenFunction',
    'class-name': 'demo-editor-tokenFunction',
    comment: 'demo-editor-tokenComment',
    constant: 'demo-editor-tokenProperty',
    deleted: 'demo-editor-tokenProperty',
    doctype: 'demo-editor-tokenComment',
    entity: 'demo-editor-tokenOperator',
    function: 'demo-editor-tokenFunction',
    important: 'demo-editor-tokenVariable',
    inserted: 'demo-editor-tokenSelector',
    keyword: 'demo-editor-tokenAttr',
    namespace: 'demo-editor-tokenVariable',
    number: 'demo-editor-tokenProperty',
    operator: 'demo-editor-tokenOperator',
    prolog: 'demo-editor-tokenComment',
    property: 'demo-editor-tokenProperty',
    punctuation: 'demo-editor-tokenPunctuation',
    regex: 'demo-editor-tokenVariable',
    selector: 'demo-editor-tokenSelector',
    string: 'demo-editor-tokenSelector',
    symbol: 'demo-editor-tokenProperty',
    tag: 'demo-editor-tokenProperty',
    url: 'demo-editor-tokenOperator',
    variable: 'demo-editor-tokenVariable',
  },
  text: {
    bold: 'demo-editor-text-bold',
    italic: 'demo-editor-text-italic',
    strikethrough: 'demo-editor-text-strikethrough',
    code: 'demo-editor-text-code',
    underline: 'demo-editor-text-underline',
  },
  link: 'demo-editor-link',
  table: 'demo-editor-table',
  tableCell: 'demo-editor-table-cell',
  tableCellHeader: 'demo-editor-table-cell-header',
  tableRow: 'demo-editor-table-row',
};

function onError(error: Error): void {
  console.error('Lexical error:', error);
}

const editorNodes = [
  HeadingNode,
  QuoteNode,
  ListNode,
  ListItemNode,
  CodeNode,
  CodeHighlightNode,
  LinkNode,
  AutoLinkNode,
  TableNode,
  TableRowNode,
  TableCellNode,
  CalloutNode,
  ToggleContainerNode,
  ToggleTitleNode,
  ToggleContentNode,
  ImageNode,
  HorizontalRuleNode,
];

const initialContent = `# Welcome to SlashMD

A beautiful block-based editor for your Markdown files. Everything stays as **plain Markdown** on disk.

:::tip
**Try it out!** Type \`/\` anywhere to see all available blocks. Select text to format it.
:::

## Quick Start

- Type \`/\` for the **slash menu**
- Select text for **formatting options**
- Drag blocks to **reorder** them

:::note
All your content is saved as standard Markdown. No vendor lock-in, ever.
:::

\`\`\`typescript
// Your code stays beautifully formatted
const editor = new SlashMD();
editor.open("README.md");
\`\`\`

:::warning
This is a live demo! Your changes won't be saved when you leave the page.
:::
`;

export function DemoEditor() {
  const initialConfig = {
    namespace: 'SlashMD-Demo',
    theme: editorTheme,
    nodes: editorNodes,
    onError,
  };

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <div className="demo-editor-container">
        <RichTextPlugin
          contentEditable={
            <ContentEditable
              className="demo-editor-input"
              aria-label="Demo editor"
            />
          }
          placeholder={
            <div className="demo-editor-placeholder">
              Type &apos;/&apos; for commands...
            </div>
          }
          ErrorBoundary={LexicalErrorBoundary}
        />
        <HistoryPlugin />
        <ListPlugin />
        <CheckListPlugin />
        <LinkPlugin />
        <TablePlugin />
        <TabIndentationPlugin />
        <InitializePlugin content={initialContent} />
        <SlashMenuPlugin />
        <DragHandlePlugin />
        <MarkdownShortcutsPlugin />
        <TogglePlugin />
        <CodeBlockPlugin />
        <CodeHighlightPlugin />
        <BlockClickPlugin />
        <Toolbar />
        <ImagePlugin />
        <TableActionsPlugin />
      </div>
    </LexicalComposer>
  );
}
