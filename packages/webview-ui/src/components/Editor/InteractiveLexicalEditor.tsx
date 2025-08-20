/**
 * Interactive Lexical Editor Component for Phase 3
 * Integrates all interactive features: slash menu, drag handles, inline toolbar, keyboard shortcuts
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  $getRoot,
  $getSelection,
  $isRangeSelection,
  SELECTION_CHANGE_COMMAND,
  COMMAND_PRIORITY_EDITOR
} from 'lexical';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import LexicalErrorBoundary from '@lexical/react/LexicalErrorBoundary';

// Import Phase 3 components
import { SlashMenu } from './SlashMenu';
import { DragHandle } from './DragHandle';
import { InlineToolbar } from './Toolbar';

// Import hooks
import { useKeyboard } from '../../hooks/useKeyboard';
import { useDragAndDrop } from '../../hooks/useDragAndDrop';

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

import type { Block, BlockType, InlineFormatting } from '../../types/blocks';

// Enhanced editor theme with Phase 3 styles
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
    strikethrough: 'strikethrough',
    underline: 'underline'
  },
  link: 'editor-link'
};

// Slash menu trigger plugin
function SlashMenuPlugin({ 
  onSlashTrigger 
}: { 
  onSlashTrigger: (position: { x: number; y: number }) => void 
}) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    const removeListener = editor.registerTextContentListener((textContent) => {
      // Check for slash at the end of content
      if (textContent.endsWith('/')) {
        // Get cursor position for menu placement
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          const rect = range.getBoundingClientRect();
          onSlashTrigger({ x: rect.left, y: rect.bottom + 5 });
        }
      }
    });

    return removeListener;
  }, [editor, onSlashTrigger]);

  return null;
}

// Selection tracking plugin for inline toolbar
function SelectionPlugin({ 
  onSelectionChange 
}: { 
  onSelectionChange: (selection: { text: string; range: Range | null; formats: Set<InlineFormatting['type']> }) => void 
}) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    const removeListener = editor.registerCommand(
      SELECTION_CHANGE_COMMAND,
      () => {
        editor.getEditorState().read(() => {
          const selection = $getSelection();
          
          if ($isRangeSelection(selection) && !selection.isCollapsed()) {
            const selectedText = selection.getTextContent();
            const domSelection = window.getSelection();
            const range = domSelection?.rangeCount ? domSelection.getRangeAt(0) : null;
            
            // Extract active formatting
            const formats = new Set<InlineFormatting['type']>();
            if (selection.hasFormat('bold')) formats.add('bold');
            if (selection.hasFormat('italic')) formats.add('italic');
            if (selection.hasFormat('code')) formats.add('code');
            if (selection.hasFormat('strikethrough')) formats.add('strikethrough');
            
            onSelectionChange({ text: selectedText, range, formats });
          } else {
            onSelectionChange({ text: '', range: null, formats: new Set() });
          }
        });
        
        return false;
      },
      COMMAND_PRIORITY_EDITOR
    );

    return removeListener;
  }, [editor, onSelectionChange]);

  return null;
}

// Enhanced blocks plugin with drag and drop support
function BlocksPlugin({ 
  blocks, 
  onDragStart,
  onDragEnd,
  onIndent,
  getDragClasses,
  getDropIndicator
}: { 
  blocks: Block[];
  onDragStart: (blockId: string, event: React.DragEvent) => void;
  onDragEnd: (blockId: string, event: React.DragEvent) => void;
  onIndent: (blockId: string, direction: 'in' | 'out') => void;
  getDragClasses: (blockId: string) => string;
  getDropIndicator: (blockId: string) => React.ReactNode;
}) {
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

  // Render drag handles and drop indicators
  return (
    <div className="blocks-container">
      {blocks.map(block => {
        const canIndent = block.type === 'listItem' || block.type === 'taskItem';
        const canOutdent = canIndent && 'indent' in block.content && (block.content as any).indent > 0;
        
        return (
          <div key={block.id} className={`block-container ${getDragClasses(block.id)}`}>
            <DragHandle
              blockId={block.id}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
              onIndent={onIndent}
              canIndent={canIndent}
              canOutdent={canOutdent}
            />
            {getDropIndicator(block.id)}
          </div>
        );
      })}
    </div>
  );
}

interface InteractiveLexicalEditorProps {
  blocks: Block[];
  onChange?: (blocks: Block[]) => void;
  onConvertBlock: (blockId: string, newType: BlockType, options?: { level?: 1 | 2 | 3; ordered?: boolean }) => void;
  onIndentBlock: (blockId: string, direction: 'in' | 'out') => void;
  onMoveBlock: (blockId: string, targetIndex: number) => void;
  onInsertBlock: (afterId: string, blockType: BlockType) => string;
  placeholder?: string;
}

export const InteractiveLexicalEditor: React.FC<InteractiveLexicalEditorProps> = ({ 
  blocks, 
  onChange,
  onConvertBlock,
  onIndentBlock,
  onMoveBlock,
  onInsertBlock,
  placeholder = "Start typing or use / for commands..." 
}) => {
  // State for interactive features
  const [slashMenuState, setSlashMenuState] = useState({
    visible: false,
    position: { x: 0, y: 0 },
    searchTerm: ''
  });
  
  const [toolbarState, setToolbarState] = useState({
    visible: false,
    position: { x: 0, y: 0 },
    selectedText: '',
    activeFormats: new Set<InlineFormatting['type']>()
  });

  const editorRef = useRef<HTMLDivElement>(null);
  
  // Initialize drag and drop functionality
  const dragAndDrop = useDragAndDrop({
    blocks,
    onMoveBlock,
    onIndentBlock
  });

  // Handle slash menu triggers
  const handleSlashTrigger = useCallback((position: { x: number; y: number }) => {
    setSlashMenuState({
      visible: true,
      position,
      searchTerm: ''
    });
  }, []);

  const handleSlashSelect = useCallback((blockType: BlockType) => {
    // For now, insert after the first block - in a real implementation,
    // this would insert after the current block
    if (blocks.length > 0) {
      onInsertBlock(blocks[0].id, blockType);
    }
    setSlashMenuState(prev => ({ ...prev, visible: false }));
  }, [blocks, onInsertBlock]);

  const handleSlashClose = useCallback(() => {
    setSlashMenuState(prev => ({ ...prev, visible: false }));
  }, []);

  // Handle text selection for inline toolbar
  const handleSelectionChange = useCallback((selection: { 
    text: string; 
    range: Range | null; 
    formats: Set<InlineFormatting['type']> 
  }) => {
    if (selection.text && selection.range) {
      const rect = selection.range.getBoundingClientRect();
      setToolbarState({
        visible: true,
        position: { x: rect.left + rect.width / 2, y: rect.top - 10 },
        selectedText: selection.text,
        activeFormats: selection.formats
      });
    } else {
      setToolbarState(prev => ({ ...prev, visible: false }));
    }
  }, []);

  const handleFormat = useCallback((format: InlineFormatting['type']) => {
    // This would integrate with Lexical's formatting commands
    console.log('Format:', format);
  }, []);

  const handleLink = useCallback((href: string) => {
    // This would integrate with Lexical's link commands
    console.log('Link:', href);
  }, []);

  const handleToolbarClose = useCallback(() => {
    setToolbarState(prev => ({ ...prev, visible: false }));
  }, []);

  // Set up keyboard shortcuts
  useKeyboard({
    onFormat: handleFormat,
    onLink: () => console.log('Link shortcut'),
    onSlashCommand: () => handleSlashTrigger({ x: 100, y: 100 }),
    onBlockNavigation: (direction) => console.log('Navigate:', direction),
    onBlockIndent: (direction) => {
      // For now, apply to first block - in real implementation would apply to current block
      if (blocks.length > 0) {
        onIndentBlock(blocks[0].id, direction);
      }
    },
    onConvertBlock: (type) => {
      // For now, apply to first block - in real implementation would apply to current block
      if (blocks.length > 0) {
        onConvertBlock(blocks[0].id, type);
      }
    },
    enabled: true
  });

  // Initial editor configuration
  const initialConfig = {
    namespace: 'SlashMD-Interactive',
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
    <div className="editor-container" ref={editorRef}>
      <LexicalComposer initialConfig={initialConfig}>
        <div className="editor-root">
          <RichTextPlugin
            contentEditable={<ContentEditable className="editor-content" />}
            placeholder={
              <div className="editor-placeholder">{placeholder}</div>
            }
            ErrorBoundary={LexicalErrorBoundary}
          />
          
          <HistoryPlugin />
          <OnChangePlugin onChange={() => onChange?.(blocks)} />
          
          {/* Phase 3 Interactive Plugins */}
          <SlashMenuPlugin onSlashTrigger={handleSlashTrigger} />
          <SelectionPlugin onSelectionChange={handleSelectionChange} />
          
          <BlocksPlugin 
            blocks={blocks}
            onDragStart={dragAndDrop.handlers.onDragStart}
            onDragEnd={dragAndDrop.handlers.onDragEnd}
            onIndent={onIndentBlock}
            getDragClasses={dragAndDrop.utils.getDragClasses}
            getDropIndicator={dragAndDrop.utils.getDropIndicator}
          />
        </div>
      </LexicalComposer>

      {/* Phase 3 Interactive UI Components */}
      <SlashMenu
        isVisible={slashMenuState.visible}
        position={slashMenuState.position}
        searchTerm={slashMenuState.searchTerm}
        onSelect={handleSlashSelect}
        onClose={handleSlashClose}
      />

      <InlineToolbar
        isVisible={toolbarState.visible}
        position={toolbarState.position}
        selectedText={toolbarState.selectedText}
        activeFormats={toolbarState.activeFormats}
        onFormat={handleFormat}
        onLink={handleLink}
        onClose={handleToolbarClose}
      />
    </div>
  );
};