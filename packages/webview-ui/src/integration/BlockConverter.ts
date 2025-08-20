/**
 * Block Converter for SlashMD Integration
 * Handles conversion between webview-ui Block types and shared Block types
 */

import type { Block as SharedBlock, BlockType } from '../types/shared';
import type { Block as UIBlock } from '../types/blocks';

/**
 * Convert shared Block to UI Block
 */
export function sharedToUIBlock(sharedBlock: SharedBlock): UIBlock {
  const uiBlock: UIBlock = {
    id: sharedBlock.id,
    type: sharedBlock.type as UIBlock['type'], // Type assertion for now
    content: convertSharedContent(sharedBlock),
    children: sharedBlock.children?.map(sharedToUIBlock) || []
  };

  return uiBlock;
}

/**
 * Convert UI Block to shared Block
 */
export function uiToSharedBlock(uiBlock: UIBlock): SharedBlock {
  const sharedBlock: SharedBlock = {
    id: uiBlock.id,
    type: uiBlock.type as BlockType, // Type assertion for now
    sourceRange: { start: 0, end: 0 }, // Will be computed by sync engine
    content: convertUIContent(uiBlock),
    children: uiBlock.children?.map(uiToSharedBlock) || []
  };

  return sharedBlock;
}

/**
 * Convert array of shared blocks to UI blocks
 */
export function sharedToUIBlocks(sharedBlocks: SharedBlock[]): UIBlock[] {
  return sharedBlocks.map(sharedToUIBlock);
}

/**
 * Convert array of UI blocks to shared blocks
 */
export function uiToSharedBlocks(uiBlocks: UIBlock[]): SharedBlock[] {
  return uiBlocks.map(uiToSharedBlock);
}

/**
 * Convert shared block content to UI block content
 */
function convertSharedContent(sharedBlock: SharedBlock): any {
  // The content structures are very similar, so mostly just pass through
  switch (sharedBlock.type) {
    case 'paragraph':
      return {
        text: (sharedBlock.content as any).text || '',
        formatting: (sharedBlock.content as any).formatting || []
      };

    case 'heading':
      return {
        level: (sharedBlock.content as any).level || 1,
        text: (sharedBlock.content as any).text || '',
        formatting: (sharedBlock.content as any).formatting || []
      };

    case 'list':
      return {
        ordered: (sharedBlock.content as any).ordered || false,
        startNumber: (sharedBlock.content as any).startNumber
      };

    case 'listItem':
      return {
        text: (sharedBlock.content as any).text || '',
        formatting: (sharedBlock.content as any).formatting || [],
        indent: (sharedBlock.content as any).indent || 0
      };

    case 'taskList':
      return {}; // No content for task list container

    case 'taskItem':
      return {
        checked: (sharedBlock.content as any).checked || false,
        text: (sharedBlock.content as any).text || '',
        formatting: (sharedBlock.content as any).formatting || [],
        indent: (sharedBlock.content as any).indent || 0
      };

    case 'quote':
      return {
        text: (sharedBlock.content as any).text || '',
        formatting: (sharedBlock.content as any).formatting || []
      };

    case 'code':
      return {
        language: (sharedBlock.content as any).language || '',
        code: (sharedBlock.content as any).code || '',
        showLineNumbers: (sharedBlock.content as any).showLineNumbers || false
      };

    case 'divider':
      return {}; // No content for divider

    case 'table':
      return {
        headers: (sharedBlock.content as any).headers || [],
        rows: (sharedBlock.content as any).rows || [],
        alignments: (sharedBlock.content as any).alignments || []
      };

    case 'image':
      return {
        src: (sharedBlock.content as any).src || '',
        alt: (sharedBlock.content as any).alt || '',
        title: (sharedBlock.content as any).title,
        dimensions: (sharedBlock.content as any).dimensions
      };

    case 'link':
      return {
        text: (sharedBlock.content as any).text || '',
        href: (sharedBlock.content as any).href || '',
        title: (sharedBlock.content as any).title
      };

    case 'callout':
      return {
        type: (sharedBlock.content as any).type || 'info',
        title: (sharedBlock.content as any).title,
        text: (sharedBlock.content as any).text || '',
        formatting: (sharedBlock.content as any).formatting || []
      };

    case 'toggle':
      return {
        summary: (sharedBlock.content as any).summary || '',
        collapsed: (sharedBlock.content as any).collapsed || false
      };

    default:
      console.warn('[BlockConverter] Unknown shared block type:', sharedBlock.type);
      return sharedBlock.content;
  }
}

/**
 * Convert UI block content to shared block content
 */
function convertUIContent(uiBlock: UIBlock): any {
  // Similar conversion in reverse
  switch (uiBlock.type) {
    case 'paragraph':
      return {
        text: uiBlock.content.text || '',
        formatting: uiBlock.content.formatting || []
      };

    case 'heading':
      return {
        level: uiBlock.content.level || 1,
        text: uiBlock.content.text || '',
        formatting: uiBlock.content.formatting || []
      };

    case 'list':
      return {
        ordered: uiBlock.content.ordered || false,
        startNumber: uiBlock.content.startNumber
      };

    case 'listItem':
      return {
        text: uiBlock.content.text || '',
        formatting: uiBlock.content.formatting || [],
        indent: uiBlock.content.indent || 0
      };

    case 'taskList':
      return {}; // No content

    case 'taskItem':
      return {
        checked: uiBlock.content.checked || false,
        text: uiBlock.content.text || '',
        formatting: uiBlock.content.formatting || [],
        indent: uiBlock.content.indent || 0
      };

    case 'quote':
      return {
        text: uiBlock.content.text || '',
        formatting: uiBlock.content.formatting || []
      };

    case 'code':
      return {
        language: uiBlock.content.language || '',
        code: uiBlock.content.code || '',
        showLineNumbers: uiBlock.content.showLineNumbers || false
      };

    case 'divider':
      return {}; // No content

    case 'table':
      return {
        headers: uiBlock.content.headers || [],
        rows: uiBlock.content.rows || [],
        alignments: uiBlock.content.alignments || []
      };

    case 'image':
      return {
        src: uiBlock.content.src || '',
        alt: uiBlock.content.alt || '',
        title: uiBlock.content.title,
        dimensions: uiBlock.content.dimensions
      };

    case 'link':
      return {
        text: uiBlock.content.text || '',
        href: uiBlock.content.href || '',
        title: uiBlock.content.title
      };

    case 'callout':
      return {
        type: uiBlock.content.type || 'info',
        title: uiBlock.content.title,
        text: uiBlock.content.text || '',
        formatting: uiBlock.content.formatting || []
      };

    case 'toggle':
      return {
        summary: uiBlock.content.summary || '',
        collapsed: uiBlock.content.collapsed || false
      };

    default:
      console.warn('[BlockConverter] Unknown UI block type:', uiBlock.type);
      return uiBlock.content;
  }
}