/**
 * Main Lexical Editor Component for Phase 2
 * Sets up Lexical editor with all block types
 */

import React, { useEffect } from 'react';
import {
  $getRoot
} from 'lexical';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { PlainTextPlugin } from '@lexical/react/LexicalPlainTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import LexicalErrorBoundary from '@lexical/react/LexicalErrorBoundary';

// Import all block node types
import { ParagraphNode } from '../Blocks/ParagraphBlock';
import { HeadingNode } from '../Blocks/HeadingBlock';
import { ListNode, ListItemNode } from '../Blocks/ListBlock';
import { TaskListNode, TaskItemNode } from '../Blocks/TaskBlock';
import { QuoteNode } from '../Blocks/QuoteBlock';
import { CodeNode } from '../Blocks/CodeBlock';
import { DividerNode } from '../Blocks/DividerBlock';
import { TableNode } from '../Blocks/TableBlock';
import { ImageNode } from '../Blocks/ImageBlock';
import { CalloutNode } from '../Blocks/CalloutBlock';
import { ToggleNode } from '../Blocks/ToggleBlock';
import type { Block } from '../../types/blocks';

// Editor theme configuration
const theme = {
  paragraph: 'paragraph-block',
  heading: {
    h1: 'heading-block level-1',
    h2: 'heading-block level-2', 
    h3: 'heading-block level-3'
  },
  list: {
    ul: 'list-block unordered',
    ol: 'list-block ordered',
    listitem: 'list-item-block'
  },
  quote: 'quote-block',
  code: 'code-block',
  text: {
    bold: 'font-bold',
    italic: 'italic',
    code: 'inline-code',
    strikethrough: 'strikethrough'
  },
  link: 'editor-link'
};

// Plugin to populate editor with block data
function BlocksPlugin({ blocks }: { blocks: Block[] }) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (blocks.length === 0) return;

    editor.update(() => {
      const root = $getRoot();
      root.clear();

      blocks.forEach(block => {
        let node;
        
        switch (block.type) {
          case 'paragraph':
            if ('text' in block.content) {
              node = new ParagraphNode(block.content as any, block.id);
            }
            break;
          case 'heading':
            if ('text' in block.content && 'level' in block.content) {
              node = new HeadingNode(block.content as any, block.id);
            }
            break;
          case 'list':
            if ('ordered' in block.content) {
              node = new ListNode(block.content as any, block.id);
            }
            break;
          case 'listItem':
            if ('text' in block.content && 'indent' in block.content) {
              node = new ListItemNode(block.content as any, block.id);
            }
            break;
          case 'taskList':
            node = new TaskListNode(block.content as any, block.id);
            break;
          case 'taskItem':
            if ('checked' in block.content && 'text' in block.content) {
              node = new TaskItemNode(block.content as any, block.id);
            }
            break;
          case 'quote':
            if ('text' in block.content) {
              node = new QuoteNode(block.content as any, block.id);
            }
            break;
          case 'code':
            if ('language' in block.content && 'code' in block.content) {
              node = new CodeNode(block.content as any, block.id);
            }
            break;
          case 'divider':
            node = new DividerNode(block.content as any, block.id);
            break;
          case 'table':
            if ('headers' in block.content && 'rows' in block.content) {
              node = new TableNode(block.content as any, block.id);
            }
            break;
          case 'image':
            if ('src' in block.content && 'alt' in block.content) {
              node = new ImageNode(block.content as any, block.id);
            }
            break;
          case 'callout':
            if ('type' in block.content && 'text' in block.content) {
              node = new CalloutNode(block.content as any, block.id);
            }
            break;
          case 'toggle':
            if ('summary' in block.content) {
              node = new ToggleNode(block.content as any, block.id);
            }
            break;
        }
        
        if (node) {
          root.append(node);
        }
      });
    });
  }, [editor, blocks]);

  return null;
}

// Plugin to handle editor changes
function OnChangeHandler({ onChange }: { onChange?: (blocks: Block[]) => void }) {

  const handleChange = () => {
    // For Phase 1, we'll just log changes
    // Full change handling will be implemented in later phases
    console.log('Editor content changed');
    
    if (onChange) {
      // Extract blocks from editor state - simplified for Phase 1
      const blocks: Block[] = [];
      onChange(blocks);
    }
  };

  return <OnChangePlugin onChange={handleChange} />;
}

interface LexicalEditorProps {
  blocks: Block[];
  onChange?: (blocks: Block[]) => void;
  placeholder?: string;
}

export const LexicalEditor: React.FC<LexicalEditorProps> = ({ 
  blocks, 
  onChange,
  placeholder = "Start typing..." 
}) => {
  // Initial editor configuration
  const initialConfig = {
    namespace: 'SlashMD',
    theme,
    onError: (error: Error) => {
      console.error('Lexical error:', error);
    },
    nodes: [
      ParagraphNode,
      HeadingNode,
      ListNode,
      ListItemNode,
      TaskListNode,
      TaskItemNode,
      QuoteNode,
      CodeNode,
      DividerNode,
      TableNode,
      ImageNode,
      CalloutNode,
      ToggleNode
    ]
  };

  return (
    <div className="editor-container">
      <LexicalComposer initialConfig={initialConfig}>
        <div className="editor-root">
          <PlainTextPlugin
            contentEditable={<ContentEditable className="editor-content" />}
            placeholder={
              <div className="editor-placeholder">{placeholder}</div>
            }
            ErrorBoundary={LexicalErrorBoundary}
          />
          <HistoryPlugin />
          <OnChangeHandler onChange={onChange} />
          <BlocksPlugin blocks={blocks} />
        </div>
      </LexicalComposer>
    </div>
  );
};