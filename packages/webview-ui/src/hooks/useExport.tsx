/**
 * Export functionality hook for Phase 4
 * Handles exporting blocks to various formats (JSON, Markdown, HTML)
 */

import { useCallback } from 'react';
import type { Block } from '../types/blocks';

export type ExportFormat = 'json' | 'markdown' | 'html';

interface ExportOptions {
  format: ExportFormat;
  includeMetadata?: boolean;
  prettyPrint?: boolean;
  filename?: string;
}

export const useExport = () => {
  // Convert blocks to Markdown (simplified for demo)
  const blocksToMarkdown = useCallback((blocks: Block[]): string => {
    return blocks.map(block => {
      switch (block.type) {
        case 'heading':
          const headingContent = block.content as import('../types/blocks').HeadingContent;
          const level = '#'.repeat(headingContent.level || 1);
          return `${level} ${headingContent.text}\n`;
        
        case 'paragraph':
          const paragraphContent = block.content as import('../types/blocks').ParagraphContent;
          return `${paragraphContent.text}\n`;
        
        case 'quote':
          const quoteContent = block.content as import('../types/blocks').QuoteContent;
          return `> ${quoteContent.text}\n`;
        
        case 'code':
          const codeContent = block.content as import('../types/blocks').CodeContent;
          return `\`\`\`${codeContent.language || ''}\n${codeContent.code}\n\`\`\`\n`;
        
        case 'list':
          if (block.children) {
            const listContent = block.content as import('../types/blocks').ListContent;
            const marker = listContent.ordered ? '1.' : '-';
            return block.children.map((child, index) => {
              const itemMarker = listContent.ordered ? `${index + 1}.` : marker;
              const childContent = child.content as import('../types/blocks').ListItemContent;
              const indent = '  '.repeat(childContent.indent || 0);
              return `${indent}${itemMarker} ${childContent.text}`;
            }).join('\n') + '\n';
          }
          return '';
        
        case 'taskList':
          if (block.children) {
            return block.children.map(child => {
              const taskContent = child.content as import('../types/blocks').TaskItemContent;
              const checkbox = taskContent.checked ? '[x]' : '[ ]';
              const indent = '  '.repeat(taskContent.indent || 0);
              return `${indent}- ${checkbox} ${taskContent.text}`;
            }).join('\n') + '\n';
          }
          return '';
        
        case 'divider':
          return '---\n';
        
        case 'table':
          const tableContent = block.content as import('../types/blocks').TableContent;
          if (tableContent.headers && tableContent.rows) {
            const headers = tableContent.headers.map(h => h.text).join(' | ');
            const separator = tableContent.headers.map(() => '---').join(' | ');
            const rows = tableContent.rows.map(row => 
              row.map(cell => cell.text).join(' | ')
            ).join('\n');
            return `| ${headers} |\n| ${separator} |\n| ${rows.split('\n').join(' |\n| ')} |\n`;
          }
          return '';
        
        case 'image':
          const imageContent = block.content as import('../types/blocks').ImageContent;
          const title = imageContent.title ? ` "${imageContent.title}"` : '';
          return `![${imageContent.alt}](${imageContent.src}${title})\n`;
        
        case 'callout':
          const calloutContent = block.content as import('../types/blocks').CalloutContent;
          const emoji = {
            note: '📝',
            tip: '💡',
            warning: '⚠️',
            danger: '🚨',
            info: 'ℹ️'
          }[calloutContent.type];
          const calloutTitle = calloutContent.title ? ` ${calloutContent.title}` : '';
          return `> ${emoji}${calloutTitle}\n>\n> ${calloutContent.text}\n`;
        
        case 'toggle':
          const toggleContent = block.content as import('../types/blocks').ToggleContent;
          const summary = toggleContent.summary || 'Details';
          return `<details>\n<summary>${summary}</summary>\n\n<!-- Toggle content would go here -->\n\n</details>\n`;
        
        default:
          return '';
      }
    }).join('\n');
  }, []);

  // Convert blocks to HTML (simplified for demo)
  const blocksToHtml = useCallback((blocks: Block[]): string => {
    const htmlBlocks = blocks.map(block => {
      switch (block.type) {
        case 'heading':
          const headingContent = block.content as import('../types/blocks').HeadingContent;
          const level = headingContent.level || 1;
          return `<h${level}>${headingContent.text}</h${level}>`;
        
        case 'paragraph':
          const paragraphContent = block.content as import('../types/blocks').ParagraphContent;
          return `<p>${paragraphContent.text}</p>`;
        
        case 'quote':
          const quoteContent = block.content as import('../types/blocks').QuoteContent;
          return `<blockquote>${quoteContent.text}</blockquote>`;
        
        case 'code':
          const codeContent = block.content as import('../types/blocks').CodeContent;
          return `<pre><code class="language-${codeContent.language}">${codeContent.code}</code></pre>`;
        
        case 'divider':
          return '<hr>';
        
        case 'image':
          const imageContent = block.content as import('../types/blocks').ImageContent;
          return `<img src="${imageContent.src}" alt="${imageContent.alt}" title="${imageContent.title || ''}" />`;
        
        case 'callout':
          const calloutContent = block.content as import('../types/blocks').CalloutContent;
          const emoji = {
            note: '📝',
            tip: '💡',
            warning: '⚠️',
            danger: '🚨',
            info: 'ℹ️'
          }[calloutContent.type];
          return `<div class="callout callout-${calloutContent.type}">
            <div class="callout-header">${emoji} ${calloutContent.title || calloutContent.type}</div>
            <div class="callout-content">${calloutContent.text}</div>
          </div>`;
        
        default:
          return `<div data-block-type="${block.type}"><!-- ${block.type} block --></div>`;
      }
    });

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>SlashMD Export</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 2rem; }
    h1, h2, h3 { margin-top: 2rem; }
    code { background: #f5f5f5; padding: 0.2rem 0.4rem; border-radius: 3px; }
    pre { background: #f5f5f5; padding: 1rem; border-radius: 5px; overflow-x: auto; }
    blockquote { border-left: 4px solid #ddd; margin: 0; padding-left: 1rem; }
    .callout { border: 1px solid #ddd; border-radius: 5px; padding: 1rem; margin: 1rem 0; }
    .callout-note { border-color: #0078d4; background: #f0f8ff; }
    .callout-tip { border-color: #107c10; background: #f0fff0; }
    .callout-warning { border-color: #ff8c00; background: #fff8f0; }
    .callout-danger { border-color: #d13438; background: #fff0f0; }
  </style>
</head>
<body>
  ${htmlBlocks.join('\n  ')}
</body>
</html>`;
  }, []);

  // Export blocks to specified format
  const exportBlocks = useCallback((blocks: Block[], options: ExportOptions) => {
    let content: string;
    let mimeType: string;
    let extension: string;

    switch (options.format) {
      case 'json':
        const exportData = {
          blocks,
          metadata: options.includeMetadata ? {
            exportDate: new Date().toISOString(),
            blockCount: blocks.length,
            version: '1.0.0'
          } : undefined
        };
        content = options.prettyPrint ? 
          JSON.stringify(exportData, null, 2) : 
          JSON.stringify(exportData);
        mimeType = 'application/json';
        extension = 'json';
        break;
      
      case 'markdown':
        content = blocksToMarkdown(blocks);
        mimeType = 'text/markdown';
        extension = 'md';
        break;
      
      case 'html':
        content = blocksToHtml(blocks);
        mimeType = 'text/html';
        extension = 'html';
        break;
      
      default:
        throw new Error(`Unsupported export format: ${options.format}`);
    }

    return {
      content,
      mimeType,
      extension,
      filename: options.filename || `slashmd-export.${extension}`
    };
  }, [blocksToMarkdown, blocksToHtml]);

  // Download exported content
  const downloadExport = useCallback((blocks: Block[], options: ExportOptions) => {
    try {
      const exportResult = exportBlocks(blocks, options);
      const blob = new Blob([exportResult.content], { type: exportResult.mimeType });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = exportResult.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
      return true;
    } catch (error) {
      console.error('Export failed:', error);
      return false;
    }
  }, [exportBlocks]);

  // Copy export to clipboard
  const copyToClipboard = useCallback(async (blocks: Block[], options: Omit<ExportOptions, 'filename'>) => {
    try {
      const exportResult = exportBlocks(blocks, options);
      await navigator.clipboard.writeText(exportResult.content);
      return true;
    } catch (error) {
      console.error('Copy to clipboard failed:', error);
      return false;
    }
  }, [exportBlocks]);

  // Get export preview
  const getExportPreview = useCallback((blocks: Block[], format: ExportFormat, maxLength = 500) => {
    const exportResult = exportBlocks(blocks, { format, prettyPrint: true });
    return exportResult.content.length > maxLength ? 
      exportResult.content.substring(0, maxLength) + '...' : 
      exportResult.content;
  }, [exportBlocks]);

  return {
    exportBlocks,
    downloadExport,
    copyToClipboard,
    getExportPreview,
    blocksToMarkdown,
    blocksToHtml
  };
};