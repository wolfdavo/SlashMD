/**
 * Block to Markdown conversion with source fidelity
 */

import { Block, ParagraphContent, HeadingContent, DividerContent, ListContent, ListItemContent, TaskItemContent, QuoteContent, CodeContent, TableContent, ImageContent, LinkContent, CalloutContent, ToggleContent } from './types';
import { globalSettings } from './settings';

/**
 * Serialize blocks back to Markdown text
 */
export function serializeBlocks(blocks: Block[]): string {
  // Input validation
  if (!Array.isArray(blocks)) {
    throw new Error(`Expected blocks to be an array, got ${typeof blocks}`);
  }

  try {
    const markdownLines: string[] = [];

    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i];
      
      // Validate each block
      if (!block || typeof block !== 'object') {
        throw new Error(`Block at index ${i} is not a valid object`);
      }

      if (typeof block.type !== 'string' || !block.type) {
        throw new Error(`Block at index ${i} has invalid or missing type`);
      }

      const markdown = blockToMarkdown(block);
      
      if (markdown) {
        markdownLines.push(markdown);
        
        // Add spacing between blocks (except after the last block)
        if (i < blocks.length - 1) {
          // Add extra line break for readability between blocks
          markdownLines.push('');
        }
      }
    }

    const result = markdownLines.join('\n');
    
    // Validate output
    if (typeof result !== 'string') {
      throw new Error('Serialization produced invalid output: expected string');
    }

    return result;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to serialize blocks: ${error.message}`);
    }
    throw new Error(`Failed to serialize blocks: ${String(error)}`);
  }
}

/**
 * Convert a single block to Markdown (Phase 2: standard block types)
 */
function blockToMarkdown(block: Block): string | null {
  switch (block.type) {
    case 'paragraph':
      return serializeParagraph(block.content as ParagraphContent);
    
    case 'heading':
      return serializeHeading(block.content as HeadingContent);
    
    case 'divider':
      return serializeDivider(block.content as DividerContent);
    
    case 'list':
      return serializeList(block);
    
    case 'taskList':
      return serializeTaskList(block);
    
    case 'quote':
      return serializeQuote(block.content as QuoteContent);
    
    case 'code':
      return serializeCode(block.content as CodeContent);
    
    case 'table':
      return serializeTable(block.content as TableContent);
    
    case 'image':
      return serializeImage(block.content as ImageContent);
    
    case 'link':
      return serializeLink(block.content as LinkContent);
    
    case 'callout':
      return serializeCallout(block.content as CalloutContent);
    
    case 'toggle':
      return serializeToggle(block);
    
    default:
      console.warn(`Unsupported block type for serialization in Phase 3: ${block.type}`);
      return null;
  }
}

/**
 * Serialize paragraph content to Markdown
 */
function serializeParagraph(content: ParagraphContent): string {
  // For Phase 1, just return the plain text
  // Phase 2+ will implement inline formatting serialization
  return content.text;
}

/**
 * Serialize heading content to Markdown
 */
function serializeHeading(content: HeadingContent): string {
  const prefix = '#'.repeat(content.level);
  return `${prefix} ${content.text}`;
}

/**
 * Serialize divider content to Markdown
 */
function serializeDivider(content: DividerContent): string {
  // Suppress unused parameter warning - content is empty but needed for interface consistency
  void content;
  
  // Use the standard --- format for horizontal rules
  return '---';
}

/**
 * Escape special Markdown characters in text
 * Phase 1: Basic escaping, will be expanded in later phases
 */
export function escapeMarkdownText(text: string): string {
  // Basic escaping for special characters that could interfere with parsing
  return text
    .replace(/\\/g, '\\\\')  // Backslash
    .replace(/`/g, '\\`')    // Backtick
    .replace(/\*/g, '\\*')   // Asterisk
    .replace(/_/g, '\\_')    // Underscore
    .replace(/\[/g, '\\[')   // Left bracket
    .replace(/\]/g, '\\]')   // Right bracket
    .replace(/\(/g, '\\(')   // Left parenthesis
    .replace(/\)/g, '\\)')   // Right parenthesis
    .replace(/#/g, '\\#')    // Hash
    .replace(/\+/g, '\\+')   // Plus
    .replace(/-/g, '\\-')    // Minus
    .replace(/\./g, '\\.')   // Period
    .replace(/!/g, '\\!');   // Exclamation
}

/**
 * Check if text needs escaping (contains Markdown special characters)
 */
export function needsEscaping(text: string): boolean {
  return /[\\`*_\[\]()#+\-.!]/.test(text);
}

/**
 * Serialize list block to Markdown
 */
function serializeList(block: Block): string {
  const content = block.content as ListContent;
  const children = block.children || [];
  const lines: string[] = [];

  children.forEach((item, index) => {
    if (item.type === 'listItem') {
      const itemContent = item.content as ListItemContent;
      const prefix = content.ordered 
        ? `${(content.startNumber || 1) + index}. `
        : '- ';
      
      const indent = '  '.repeat(itemContent.indent);
      lines.push(`${indent}${prefix}${itemContent.text}`);
      
      // Handle nested items
      if (item.children) {
        item.children.forEach(child => {
          const nestedMarkdown = blockToMarkdown(child);
          if (nestedMarkdown) {
            const nestedLines = nestedMarkdown.split('\n');
            const additionalIndent = '  '.repeat(itemContent.indent + 1);
            nestedLines.forEach(line => {
              lines.push(`${additionalIndent}${line}`);
            });
          }
        });
      }
    }
  });

  return lines.join('\n');
}

/**
 * Serialize task list block to Markdown
 */
function serializeTaskList(block: Block): string {
  const children = block.children || [];
  const lines: string[] = [];

  children.forEach(item => {
    if (item.type === 'taskItem') {
      const itemContent = item.content as TaskItemContent;
      const checkbox = itemContent.checked ? '[x]' : '[ ]';
      const indent = '  '.repeat(itemContent.indent);
      lines.push(`${indent}- ${checkbox} ${itemContent.text}`);
    }
  });

  return lines.join('\n');
}

/**
 * Serialize quote block to Markdown
 */
function serializeQuote(content: QuoteContent): string {
  const lines = content.text.split('\n');
  return lines.map(line => `> ${line}`).join('\n');
}

/**
 * Serialize code block to Markdown
 */
function serializeCode(content: CodeContent): string {
  const fence = '```';
  const language = content.language || '';
  return `${fence}${language}\n${content.code}\n${fence}`;
}

/**
 * Serialize table block to Markdown
 */
function serializeTable(content: TableContent): string {
  const lines: string[] = [];
  
  // Header row
  const headerCells = content.headers.map(cell => cell.text);
  lines.push(`| ${headerCells.join(' | ')} |`);
  
  // Separator row with alignments
  const separators = content.alignments?.map(align => {
    switch (align) {
      case 'left': return ':---';
      case 'center': return ':---:';
      case 'right': return '---:';
      default: return '---';
    }
  }) || content.headers.map(() => '---');
  
  lines.push(`| ${separators.join(' | ')} |`);
  
  // Data rows
  content.rows.forEach(row => {
    const cells = row.map(cell => cell.text);
    lines.push(`| ${cells.join(' | ')} |`);
  });
  
  return lines.join('\n');
}

/**
 * Serialize image block to Markdown
 */
function serializeImage(content: ImageContent): string {
  const title = content.title ? ` "${content.title}"` : '';
  return `![${content.alt}](${content.src}${title})`;
}

/**
 * Serialize link block to Markdown
 */
function serializeLink(content: LinkContent): string {
  const title = content.title ? ` "${content.title}"` : '';
  return `[${content.text}](${content.href}${title})`;
}

/**
 * Serialize callout block to Markdown (Phase 3)
 */
function serializeCallout(content: CalloutContent): string {
  const settings = globalSettings.getSettings();
  const lines: string[] = [];
  
  if (settings.calloutsStyle === 'admonition') {
    // Admonition style: > [!NOTE] Title
    const typeUpper = content.type.toUpperCase();
    const titlePart = content.title ? ` ${content.title}` : '';
    lines.push(`> [!${typeUpper}]${titlePart}`);
    
    // Add content lines with quote prefix
    if (content.text.trim()) {
      const contentLines = content.text.split('\n');
      contentLines.forEach(line => {
        lines.push(`> ${line}`);
      });
    }
  } else {
    // Emoji style: > 💡 Note: Title
    const emoji = getCalloutEmoji(content.type);
    const typeName = getCalloutTypeName(content.type);
    const titlePart = content.title ? ` ${content.title}` : '';
    lines.push(`> ${emoji} ${typeName}:${titlePart}`);
    
    // Add content lines with quote prefix
    if (content.text.trim()) {
      const contentLines = content.text.split('\n');
      contentLines.forEach(line => {
        lines.push(`> ${line}`);
      });
    }
  }
  
  return lines.join('\n');
}

/**
 * Serialize toggle block to Markdown (Phase 3)
 */
function serializeToggle(block: Block): string {
  const content = block.content as ToggleContent;
  const children = block.children || [];
  
  let html = `<details><summary>${content.summary}</summary>`;
  
  if (children.length > 0) {
    html += '\n\n';
    const childrenMarkdown = children
      .map(child => blockToMarkdown(child))
      .filter(markdown => markdown !== null)
      .join('\n\n');
    html += childrenMarkdown;
    html += '\n\n';
  }
  
  html += '</details>';
  
  return html;
}

/**
 * Get emoji for callout type
 */
function getCalloutEmoji(type: CalloutContent['type']): string {
  switch (type) {
    case 'note': return 'ℹ️';
    case 'info': return '💡';
    case 'tip': return '📝';
    case 'warning': return '⚠️';
    case 'danger': return '❌';
    default: return '💡';
  }
}

/**
 * Get readable type name for callout
 */
function getCalloutTypeName(type: CalloutContent['type']): string {
  switch (type) {
    case 'note': return 'Note';
    case 'info': return 'Info';
    case 'tip': return 'Tip';
    case 'warning': return 'Warning';
    case 'danger': return 'Danger';
    default: return 'Note';
  }
}