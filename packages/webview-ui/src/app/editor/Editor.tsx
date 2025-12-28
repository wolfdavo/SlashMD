import { useCallback, useEffect, useRef, useMemo, useState } from 'react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import LexicalErrorBoundary from '@lexical/react/LexicalErrorBoundary';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { CheckListPlugin } from '@lexical/react/LexicalCheckListPlugin';
import { TabIndentationPlugin } from '@lexical/react/LexicalTabIndentationPlugin';
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin';
import { TablePlugin } from '@lexical/react/LexicalTablePlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { ListNode, ListItemNode } from '@lexical/list';
import { CodeNode, CodeHighlightNode, registerCodeHighlighting } from '@lexical/code';
import { LinkNode, AutoLinkNode } from '@lexical/link';
import { TableNode, TableRowNode, TableCellNode } from '@lexical/table';
import { EditorState, LexicalEditor } from 'lexical';

import { Toolbar } from './Toolbar';
import { SlashMenuPlugin } from './SlashMenuPlugin';
import { DragHandlePlugin } from './DragHandlePlugin';
import { MarkdownShortcutsPlugin } from './MarkdownShortcutsPlugin';
import { TableActionsPlugin } from './TableActionsPlugin';
import { CodeBlockPlugin } from './CodeBlockPlugin';
import { TogglePlugin } from './TogglePlugin';
import { ImagePlugin } from './ImagePlugin';
import { BlockClickPlugin } from './BlockClickPlugin';
import { SearchPlugin } from './SearchPlugin';
import { AssetContext, createAssetContextValue } from './AssetContext';
import {
  CalloutNode,
  ToggleContainerNode,
  ToggleTitleNode,
  ToggleContentNode,
  ImageNode,
  HorizontalRuleNode,
} from './nodes';
import { importMarkdownToLexical } from '../mapper/mdastToLexical';
import { exportLexicalToMdast } from '../mapper/lexicalToMdast';
import { parseMarkdown } from '../../markdown/parse';
import { stringifyMarkdown } from '../../markdown/stringify';
import type { ImagePathResolution } from '../../types';

interface EditorProps {
  initialContent: string;
  onChange: (markdown: string) => void;
  assetBaseUri?: string;
  documentDirUri?: string;
  imagePathResolution?: ImagePathResolution;
}

const editorTheme = {
  paragraph: 'editor-paragraph',
  heading: {
    h1: 'editor-heading-h1',
    h2: 'editor-heading-h2',
    h3: 'editor-heading-h3',
    h4: 'editor-heading-h4',
    h5: 'editor-heading-h5',
  },
  list: {
    ul: 'editor-list-ul',
    ol: 'editor-list-ol',
    listitem: 'editor-listitem',
    listitemChecked: 'editor-listitem-checked',
    listitemUnchecked: 'editor-listitem-unchecked',
    nested: {
      listitem: 'editor-nested-listitem',
    },
  },
  quote: 'editor-quote',
  code: 'editor-code',
  codeHighlight: {
    atrule: 'editor-tokenAttr',
    attr: 'editor-tokenAttr',
    boolean: 'editor-tokenProperty',
    builtin: 'editor-tokenSelector',
    cdata: 'editor-tokenComment',
    char: 'editor-tokenSelector',
    class: 'editor-tokenFunction',
    'class-name': 'editor-tokenFunction',
    comment: 'editor-tokenComment',
    constant: 'editor-tokenProperty',
    deleted: 'editor-tokenProperty',
    doctype: 'editor-tokenComment',
    entity: 'editor-tokenOperator',
    function: 'editor-tokenFunction',
    important: 'editor-tokenVariable',
    inserted: 'editor-tokenSelector',
    keyword: 'editor-tokenAttr',
    namespace: 'editor-tokenVariable',
    number: 'editor-tokenProperty',
    operator: 'editor-tokenOperator',
    prolog: 'editor-tokenComment',
    property: 'editor-tokenProperty',
    punctuation: 'editor-tokenPunctuation',
    regex: 'editor-tokenVariable',
    selector: 'editor-tokenSelector',
    string: 'editor-tokenSelector',
    symbol: 'editor-tokenProperty',
    tag: 'editor-tokenProperty',
    url: 'editor-tokenOperator',
    variable: 'editor-tokenVariable',
  },
  link: 'editor-link',
  table: 'editor-table',
  tableRow: 'editor-table-row',
  tableCell: 'editor-table-cell',
  tableCellHeader: 'editor-table-cell-header',
  text: {
    bold: 'editor-text-bold',
    italic: 'editor-text-italic',
    strikethrough: 'editor-text-strikethrough',
    code: 'editor-text-code',
    underline: 'editor-text-underline',
  },
};

function editorOnError(error: Error): void {
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

// Plugin to enable syntax highlighting in code blocks
function CodeHighlightPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return registerCodeHighlighting(editor);
  }, [editor]);

  return null;
}

// Plugin to initialize editor with markdown content
function InitializePlugin({ content }: { content: string }) {
  const [editor] = useLexicalComposerContext();
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    if (content) {
      const { root } = parseMarkdown(content);
      importMarkdownToLexical(editor, root);
    }
  }, [editor, content]);

  return null;
}

// Plugin to auto-focus the editor when it mounts
function AutoFocusPlugin() {
  const [editor] = useLexicalComposerContext();
  const hasFocused = useRef(false);

  useEffect(() => {
    if (hasFocused.current) return;
    hasFocused.current = true;

    // Small delay to ensure the editor is fully ready
    const timeoutId = setTimeout(() => {
      const rootElement = editor.getRootElement();
      if (rootElement) {
        // Focus without scrolling
        rootElement.focus({ preventScroll: true });
      }
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [editor]);

  return null;
}

// Simple hash function for content comparison
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash;
}

// Plugin to handle content updates from extension host
function ExternalUpdatePlugin({
  content,
  lastInternalUpdate,
}: {
  content: string;
  lastInternalUpdate: React.MutableRefObject<number>;
}) {
  const [editor] = useLexicalComposerContext();
  const lastContentHashRef = useRef<number>(0);

  useEffect(() => {
    // Skip if this is our own update echoing back
    const timeSinceUpdate = Date.now() - lastInternalUpdate.current;
    if (timeSinceUpdate < 500) {
      return;
    }

    // Skip if content hash matches (content identical)
    const contentHash = simpleHash(content);
    if (contentHash === lastContentHashRef.current) {
      return;
    }
    lastContentHashRef.current = contentHash;

    const { root } = parseMarkdown(content);
    importMarkdownToLexical(editor, root);
  }, [editor, content, lastInternalUpdate]);

  return null;
}

// Debounce delay in ms - balances responsiveness with performance
const DEBOUNCE_DELAY = 100;

export function Editor({ initialContent, onChange, assetBaseUri, documentDirUri, imagePathResolution }: EditorProps) {
  const lastInternalUpdate = useRef<number>(0);
  const currentContentRef = useRef<string>(initialContent);
  const debounceTimerRef = useRef<number | null>(null);
  const pendingEditorRef = useRef<LexicalEditor | null>(null);

  const assetContextValue = useMemo(
    () => createAssetContextValue({ assetBaseUri, documentDirUri, imagePathResolution }),
    [assetBaseUri, documentDirUri, imagePathResolution]
  );

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current !== null) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const handleChange = useCallback(
    (editorState: EditorState, editor: LexicalEditor) => {
      // Store the latest editor for debounced processing
      pendingEditorRef.current = editor;

      // Clear existing timer
      if (debounceTimerRef.current !== null) {
        clearTimeout(debounceTimerRef.current);
      }

      // Debounce the expensive mdast conversion
      debounceTimerRef.current = window.setTimeout(() => {
        debounceTimerRef.current = null;
        const pendingEditor = pendingEditorRef.current;
        if (!pendingEditor) return;

        const mdast = exportLexicalToMdast(pendingEditor);
        const markdown = stringifyMarkdown(mdast);

        // Only notify if content actually changed
        if (markdown !== currentContentRef.current) {
          currentContentRef.current = markdown;
          lastInternalUpdate.current = Date.now();
          onChange(markdown);
        }
      }, DEBOUNCE_DELAY);
    },
    [onChange]
  );

  const initialConfig = {
    namespace: 'SlashMD',
    theme: editorTheme,
    nodes: editorNodes,
    onError: editorOnError,
  };

  return (
    <AssetContext.Provider value={assetContextValue}>
      <LexicalComposer initialConfig={initialConfig}>
        <div className="editor-container">
          <div className="editor-inner">
            <RichTextPlugin
              contentEditable={
                <ContentEditable className="editor-input" aria-label="Markdown editor" />
              }
              placeholder={
                <div className="editor-placeholder">
                  Type '/' for commands...
                </div>
              }
              ErrorBoundary={LexicalErrorBoundary}
            />
            <HistoryPlugin />
            <ListPlugin />
            <CheckListPlugin />
            <TabIndentationPlugin />
            <LinkPlugin />
            <TablePlugin />
            <CodeHighlightPlugin />
            <OnChangePlugin onChange={handleChange} ignoreSelectionChange />
            <InitializePlugin content={initialContent} />
            <AutoFocusPlugin />
            <ExternalUpdatePlugin
              content={initialContent}
              lastInternalUpdate={lastInternalUpdate}
            />
            <SlashMenuPlugin />
            <DragHandlePlugin />
            <MarkdownShortcutsPlugin />
            <TableActionsPlugin />
            <CodeBlockPlugin />
            <TogglePlugin />
            <ImagePlugin />
            <BlockClickPlugin />
            <Toolbar />
            <SearchPlugin />
          </div>
        </div>
      </LexicalComposer>
    </AssetContext.Provider>
  );
}
