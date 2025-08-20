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
    sourceRange: sharedBlock.sourceRange,
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
      const paragraphContent = uiBlock.content as import('../types/blocks').ParagraphContent;
      return {
        text: paragraphContent.text || '',
        formatting: paragraphContent.formatting || []
      };

    case 'heading':
      const headingContent = uiBlock.content as import('../types/blocks').HeadingContent;
      return {
        level: headingContent.level || 1,
        text: headingContent.text || '',
        formatting: headingContent.formatting || []
      };

    case 'list':
      const listContent = uiBlock.content as import('../types/blocks').ListContent;
      return {
        ordered: listContent.ordered || false,
        startNumber: listContent.startNumber
      };

    case 'listItem':
      const listItemContent = uiBlock.content as import('../types/blocks').ListItemContent;
      return {
        text: listItemContent.text || '',
        formatting: listItemContent.formatting || [],
        indent: listItemContent.indent || 0
      };

    case 'taskList':
      return {}; // No content

    case 'taskItem':
      const taskItemContent = uiBlock.content as import('../types/blocks').TaskItemContent;
      return {
        checked: taskItemContent.checked || false,
        text: taskItemContent.text || '',
        formatting: taskItemContent.formatting || [],
        indent: taskItemContent.indent || 0
      };

    case 'quote':
      const quoteContent = uiBlock.content as import('../types/blocks').QuoteContent;
      return {
        text: quoteContent.text || '',
        formatting: quoteContent.formatting || []
      };

    case 'code':
      const codeContent = uiBlock.content as import('../types/blocks').CodeContent;
      return {
        language: codeContent.language || '',
        code: codeContent.code || '',
        showLineNumbers: codeContent.showLineNumbers || false
      };

    case 'divider':
      return {}; // No content

    case 'table':
      const tableContent = uiBlock.content as import('../types/blocks').TableContent;
      return {
        headers: tableContent.headers || [],
        rows: tableContent.rows || [],
        alignments: tableContent.alignments || []
      };

    case 'image':
      const imageContent = uiBlock.content as import('../types/blocks').ImageContent;
      return {
        src: imageContent.src || '',
        alt: imageContent.alt || '',
        title: imageContent.title,
        dimensions: imageContent.dimensions
      };

    case 'link':
      const linkContent = uiBlock.content as import('../types/blocks').LinkContent;
      return {
        text: linkContent.text || '',
        href: linkContent.href || '',
        title: linkContent.title
      };

    case 'callout':
      const calloutContent = uiBlock.content as import('../types/blocks').CalloutContent;
      return {
        type: calloutContent.type || 'info',
        title: calloutContent.title,
        text: calloutContent.text || '',
        formatting: calloutContent.formatting || []
      };

    case 'toggle':
      const toggleContent = uiBlock.content as import('../types/blocks').ToggleContent;
      return {
        summary: toggleContent.summary || '',
        collapsed: toggleContent.collapsed || false
      };

    default:
      console.warn('[BlockConverter] Unknown UI block type:', uiBlock.type);
      return uiBlock.content;
  }
}