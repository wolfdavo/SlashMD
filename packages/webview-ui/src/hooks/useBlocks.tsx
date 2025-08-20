/**
 * Block data management hook for Phase 1
 * Handles CRUD operations on block data structures
 */

import { useState, useCallback, useRef } from 'react';
import type { Block, BlockType, BlockContent } from '../types/blocks';

export interface UseBlocksReturn {
  blocks: Block[];
  setBlocks: (blocks: Block[]) => void;
  updateBlock: (blockId: string, content: Partial<BlockContent>) => void;
  insertBlock: (afterId: string, blockType: BlockType, content?: Partial<BlockContent>) => string;
  deleteBlock: (blockId: string) => void;
  convertBlock: (blockId: string, newType: BlockType, options?: { level?: 1 | 2 | 3; ordered?: boolean }) => void;
  indentBlock: (blockId: string, direction: 'in' | 'out') => void;
  moveBlock: (blockId: string, targetIndex: number) => void;
  getBlock: (blockId: string) => Block | undefined;
  generateId: () => string;
}

export const useBlocks = (initialBlocks: Block[] = []): UseBlocksReturn => {
  const [blocks, setBlocks] = useState<Block[]>(initialBlocks);
  const idCounterRef = useRef(1000); // Start with a high number to avoid conflicts

  // Generate a unique ID for new blocks
  const generateId = useCallback((): string => {
    return `block-${Date.now()}-${idCounterRef.current++}`;
  }, []);

  // Get a block by ID
  const getBlock = useCallback((blockId: string): Block | undefined => {
    return blocks.find(block => block.id === blockId);
  }, [blocks]);

  // Update a specific block's content
  const updateBlock = useCallback((blockId: string, contentUpdate: Partial<BlockContent>) => {
    setBlocks(prevBlocks => 
      prevBlocks.map(block => 
        block.id === blockId 
          ? { ...block, content: { ...block.content, ...contentUpdate } }
          : block
      )
    );
  }, []);

  // Insert a new block after the specified block
  const insertBlock = useCallback((afterId: string, blockType: BlockType, content?: Partial<BlockContent>): string => {
    const newId = generateId();
    const afterIndex = blocks.findIndex(block => block.id === afterId);
    
    // Create default content based on block type
    const getDefaultContent = (type: BlockType): BlockContent => {
      switch (type) {
        case 'paragraph':
          return { text: '' };
        case 'heading':
          return { level: 1 as const, text: '' };
        case 'list':
          return { ordered: false };
        case 'listItem':
          return { text: '', indent: 0 };
        case 'taskList':
          return {};
        case 'taskItem':
          return { checked: false, text: '', indent: 0 };
        case 'quote':
          return { text: '' };
        case 'code':
          return { language: 'text', code: '' };
        case 'divider':
          return {};
        case 'table':
          return { headers: [], rows: [] };
        case 'image':
          return { src: '', alt: '' };
        case 'link':
          return { text: '', href: '' };
        case 'callout':
          return { type: 'note' as const, text: '' };
        case 'toggle':
          return { summary: '' };
        default:
          return { text: '' } as any;
      }
    };

    const newBlock: Block = {
      id: newId,
      type: blockType,
      content: { ...getDefaultContent(blockType), ...content },
      sourceRange: { start: 0, end: 0 }, // Will be updated by sync engine
      children: blockType === 'taskList' || blockType === 'list' || blockType === 'toggle' ? [] : undefined
    };

    setBlocks(prevBlocks => {
      const newBlocks = [...prevBlocks];
      newBlocks.splice(afterIndex + 1, 0, newBlock);
      return newBlocks;
    });

    return newId;
  }, [blocks, generateId]);

  // Delete a block
  const deleteBlock = useCallback((blockId: string) => {
    setBlocks(prevBlocks => prevBlocks.filter(block => block.id !== blockId));
  }, []);

  // Convert a block to a different type
  const convertBlock = useCallback((blockId: string, newType: BlockType, options?: { level?: 1 | 2 | 3; ordered?: boolean }) => {
    setBlocks(prevBlocks => 
      prevBlocks.map(block => {
        if (block.id !== blockId) return block;

        // Extract text content from current block for conversion
        const extractText = (content: BlockContent): string => {
          if ('text' in content) return content.text || '';
          if ('code' in content) return content.code || '';
          if ('summary' in content) return content.summary || '';
          return '';
        };

        const currentText = extractText(block.content);

        // Create new content based on target type
        let newContent: BlockContent;
        switch (newType) {
          case 'paragraph':
            newContent = { text: currentText };
            break;
          case 'heading':
            newContent = { 
              level: options?.level || (
                block.type === 'heading' && 'level' in block.content 
                  ? (block.content as any).level 
                  : 1
              ) as 1 | 2 | 3, 
              text: currentText 
            };
            break;
          case 'quote':
            newContent = { text: currentText };
            break;
          case 'code':
            newContent = { 
              language: block.type === 'code' && 'language' in block.content 
                ? (block.content as any).language 
                : 'text', 
              code: currentText 
            };
            break;
          case 'list':
            newContent = { 
              ordered: options?.ordered !== undefined 
                ? options.ordered 
                : (block.type === 'list' && 'ordered' in block.content 
                    ? (block.content as any).ordered 
                    : false)
            };
            break;
          case 'listItem':
            newContent = { text: currentText, indent: 0 };
            break;
          case 'taskList':
            newContent = {};
            break;
          case 'taskItem':
            newContent = { checked: false, text: currentText, indent: 0 };
            break;
          case 'divider':
            newContent = {};
            break;
          case 'table':
            newContent = { 
              headers: [{ text: 'Header 1' }, { text: 'Header 2' }],
              rows: [[{ text: currentText || '' }, { text: '' }]],
              alignments: [null, null]
            };
            break;
          case 'image':
            newContent = { src: '', alt: currentText || 'Image' };
            break;
          case 'link':
            newContent = { text: currentText, href: '' };
            break;
          case 'callout':
            newContent = { 
              type: (block.type === 'callout' && 'type' in block.content 
                ? (block.content as any).type 
                : 'note') as 'note' | 'tip' | 'warning' | 'danger' | 'info', 
              text: currentText 
            };
            break;
          case 'toggle':
            newContent = { summary: currentText || 'Toggle' };
            break;
          default:
            newContent = { text: currentText } as any;
        }

        return {
          ...block,
          type: newType,
          content: newContent,
          children: newType === 'taskList' || newType === 'list' || newType === 'toggle' ? [] : undefined
        };
      })
    );
  }, []);

  // Indent a block (for list items and task items)
  const indentBlock = useCallback((blockId: string, direction: 'in' | 'out') => {
    setBlocks(prevBlocks => 
      prevBlocks.map(block => {
        if (block.id !== blockId) return block;
        
        // Only indent list items and task items
        if (block.type !== 'listItem' && block.type !== 'taskItem') return block;
        
        const currentIndent = ('indent' in block.content) ? (block.content as any).indent : 0;
        let newIndent = currentIndent;
        
        if (direction === 'in' && currentIndent < 4) { // Max 4 levels of indentation
          newIndent = currentIndent + 1;
        } else if (direction === 'out' && currentIndent > 0) {
          newIndent = currentIndent - 1;
        }
        
        if (newIndent === currentIndent) return block;
        
        return {
          ...block,
          content: { ...block.content, indent: newIndent }
        };
      })
    );
  }, []);

  // Move a block to a new position
  const moveBlock = useCallback((blockId: string, targetIndex: number) => {
    setBlocks(prevBlocks => {
      const blockIndex = prevBlocks.findIndex(block => block.id === blockId);
      if (blockIndex === -1) return prevBlocks;

      const newBlocks = [...prevBlocks];
      const [movedBlock] = newBlocks.splice(blockIndex, 1);
      newBlocks.splice(targetIndex, 0, movedBlock);
      
      return newBlocks;
    });
  }, []);

  return {
    blocks,
    setBlocks,
    updateBlock,
    insertBlock,
    deleteBlock,
    convertBlock,
    indentBlock,
    moveBlock,
    getBlock,
    generateId
  };
};