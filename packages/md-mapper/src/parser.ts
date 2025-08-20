/**
 * Markdown to Block conversion using unified/remark pipeline
 */

import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkFrontmatter from 'remark-frontmatter';
import { toString } from 'mdast-util-to-string';
import type { Root, Paragraph, Heading, ThematicBreak, List, ListItem, Blockquote, Code, Table, Image, Link, HTML } from 'mdast';

import { Block, ParagraphContent, HeadingContent, DividerContent, ListContent, ListItemContent, TaskListContent, TaskItemContent, QuoteContent, CodeContent, TableContent, ImageContent, LinkContent, CalloutContent, ToggleContent, TableCell } from './types';
import { createSourceRange } from './ranges';
import { assignBlockIds } from './ids';
// import { globalSettings } from './settings'; // TODO: Use for configuration

/**
 * Create the remark processor for parsing Markdown
 */
function createProcessor() {
  return unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkFrontmatter);
}

/**
 * Parse Markdown text into structured blocks
 */
export function parseMarkdown(markdown: string): Block[] {
  // Input validation
  if (typeof markdown !== 'string') {
    throw new Error(`Expected markdown input to be a string, got ${typeof markdown}`);
  }

  // Check for extremely large inputs that might cause performance issues
  const MAX_SIZE = 50 * 1024 * 1024; // 50MB limit
  if (markdown.length > MAX_SIZE) {
    throw new Error(`Markdown input is too large: ${markdown.length} bytes (max: ${MAX_SIZE} bytes)`);
  }

  try {
    const processor = createProcessor();
    const tree = processor.parse(markdown) as Root;

    // Convert MDAST nodes to blocks
    const blocks = tree.children
      .map(node => nodeToBlock(node))
      .filter(block => block !== null) as Block[];

    // Post-process to combine toggle blocks with their content
    const processedBlocks = postProcessToggleBlocks(blocks);

    // Assign stable IDs to all blocks with document context
    const finalBlocks = assignBlockIds(processedBlocks, markdown);

    // Validate output
    if (!Array.isArray(finalBlocks)) {
      throw new Error('Parser produced invalid output: expected array of blocks');
    }

    return finalBlocks;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to parse markdown: ${error.message}`);
    }
    throw new Error(`Failed to parse markdown: ${String(error)}`);
  }
}

/**
 * Convert MDAST node to Block (Phase 2: standard block types)
 */
function nodeToBlock(node: any): Block | null {
  try {
    const sourceRange = createSourceRange(node);

    switch (node.type) {
      case 'paragraph':
        return createParagraphBlock(node as Paragraph, sourceRange);
      
      case 'heading':
        return createHeadingBlock(node as Heading, sourceRange);
      
      case 'thematicBreak':
        return createDividerBlock(node as ThematicBreak, sourceRange);
      
      case 'list':
        return createListBlock(node as List, sourceRange);
      
      case 'blockquote':
        return createQuoteBlock(node as Blockquote, sourceRange);
      
      case 'code':
        return createCodeBlock(node as Code, sourceRange);
      
      case 'table':
        return createTableBlock(node as Table, sourceRange);
      
      case 'image':
        return createImageBlock(node as Image, sourceRange);
      
      case 'html':
        return createHTMLBlock(node as HTML, sourceRange);
      
      default:
        // Phase 3 note: Some inline elements like links are handled within paragraphs
        console.warn(`Unsupported node type in Phase 3: ${node.type}`);
        return null;
    }
  } catch (error) {
    console.error(`Error processing node type ${node.type}:`, error);
    return null;
  }
}

/**
 * Create paragraph block from MDAST paragraph node
 */
function createParagraphBlock(node: Paragraph, sourceRange: any): Block {
  // Check if this paragraph contains only a single image (standalone image)
  if (node.children.length === 1 && node.children[0].type === 'image') {
    const imageNode = node.children[0] as Image;
    return createImageBlock(imageNode, sourceRange);
  }
  
  // Check if this paragraph contains only a single link (standalone link)
  if (node.children.length === 1 && node.children[0].type === 'link') {
    const linkNode = node.children[0] as Link;
    return createLinkBlock(linkNode, sourceRange);
  }
  
  const text = toString(node);
  
  const content: ParagraphContent = {
    text,
    // TODO: Phase 2+ will implement inline formatting extraction
    formatting: []
  };

  return {
    id: '', // Will be assigned by assignBlockIds
    type: 'paragraph',
    sourceRange,
    content
  };
}

/**
 * Create link block from MDAST link node
 */
function createLinkBlock(node: Link, sourceRange: any): Block {
  const content: LinkContent = {
    text: toString(node),
    href: node.url || ''
  };
  
  if (node.title) {
    content.title = node.title;
  }

  return {
    id: '',
    type: 'link',
    sourceRange,
    content
  };
}

/**
 * Create heading block from MDAST heading node
 */
function createHeadingBlock(node: Heading, sourceRange: any): Block {
  const text = toString(node);
  const level = Math.min(Math.max(node.depth, 1), 3) as 1 | 2 | 3; // Clamp to 1-3
  
  const content: HeadingContent = {
    level,
    text,
    // TODO: Phase 2+ will implement inline formatting extraction
    formatting: []
  };

  return {
    id: '', // Will be assigned by assignBlockIds
    type: 'heading',
    sourceRange,
    content
  };
}

/**
 * Create divider block from MDAST thematicBreak node
 */
function createDividerBlock(node: ThematicBreak, sourceRange: any): Block {
  // Suppress unused parameter warning - node may be used in future phases for styling
  void node;
  
  const content: DividerContent = {};

  return {
    id: '', // Will be assigned by assignBlockIds
    type: 'divider',
    sourceRange,
    content
  };
}

/**
 * Create list block from MDAST list node
 */
function createListBlock(node: List, sourceRange: any): Block {
  // Check if this is a task list by looking for checkbox syntax
  const isTaskList = node.children.some((item: any) => 
    item.checked !== undefined && item.checked !== null
  );

  if (isTaskList) {
    const content: TaskListContent = {};
    const children = node.children
      .map((item: any) => createTaskItemBlock(item, createSourceRange(item), 0))
      .filter(item => item !== null) as Block[];

    return {
      id: '',
      type: 'taskList',
      sourceRange,
      content,
      children
    };
  } else {
    const content: ListContent = {
      ordered: node.ordered || false,
      startNumber: node.start || 1
    };

    const children = node.children
      .map((item: any) => createListItemBlock(item, createSourceRange(item), 0))
      .filter(item => item !== null) as Block[];

    return {
      id: '',
      type: 'list',
      sourceRange,
      content,
      children
    };
  }
}

/**
 * Create list item block from MDAST listItem node
 */
function createListItemBlock(node: ListItem, sourceRange: any, indent: number): Block | null {
  // Extract text from the first paragraph if it exists
  const firstChild = node.children[0];
  let text = '';
  
  if (firstChild && firstChild.type === 'paragraph') {
    text = toString(firstChild);
  }

  const content: ListItemContent = {
    text,
    formatting: [], // TODO: Extract inline formatting
    indent
  };

  const children: Block[] = [];
  
  // Handle nested lists
  for (let i = 1; i < node.children.length; i++) {
    const child = node.children[i];
    if (child.type === 'list') {
      const nestedList = createListBlock(child as List, createSourceRange(child));
      if (nestedList) {
        // Increase indent for nested items
        if (nestedList.children) {
          nestedList.children = nestedList.children.map(item => ({
            ...item,
            content: {
              ...item.content,
              indent: indent + 1
            }
          }));
        }
        children.push(nestedList);
      }
    }
  }

  const block: Block = {
    id: '',
    type: 'listItem',
    sourceRange,
    content
  };
  
  if (children.length > 0) {
    block.children = children;
  }
  
  return block;
}

/**
 * Create task item block from MDAST listItem node for task lists
 */
function createTaskItemBlock(node: ListItem, sourceRange: any, indent: number): Block | null {
  // Use the checked property from the MDAST node (set by remark-gfm)
  const checked = node.checked === true;
  
  const firstChild = node.children[0];
  if (!firstChild || firstChild.type !== 'paragraph') {
    return null;
  }

  const text = toString(firstChild);

  const content: TaskItemContent = {
    checked,
    text,
    formatting: [], // TODO: Extract inline formatting
    indent
  };

  return {
    id: '',
    type: 'taskItem',
    sourceRange,
    content
  };
}

/**
 * Create quote block from MDAST blockquote node
 * Phase 3: Detect callout syntax within blockquotes
 */
function createQuoteBlock(node: Blockquote, sourceRange: any): Block {
  const text = toString(node);
  
  // Check if this blockquote is actually a callout
  const calloutData = detectCallout(text);
  if (calloutData) {
    const content: CalloutContent = {
      type: calloutData.type,
      ...(calloutData.title && { title: calloutData.title }),
      text: calloutData.text,
      formatting: [] // TODO: Extract inline formatting
    };
    
    return {
      id: '',
      type: 'callout',
      sourceRange,
      content
    };
  }
  
  // Regular blockquote
  const content: QuoteContent = {
    text,
    formatting: [] // TODO: Extract inline formatting
  };

  return {
    id: '',
    type: 'quote',
    sourceRange,
    content
  };
}

/**
 * Create code block from MDAST code node
 */
function createCodeBlock(node: Code, sourceRange: any): Block {
  const content: CodeContent = {
    language: node.lang || '',
    code: node.value || '',
    showLineNumbers: false // Default value
  };

  return {
    id: '',
    type: 'code',
    sourceRange,
    content
  };
}

/**
 * Create table block from MDAST table node
 */
function createTableBlock(node: Table, sourceRange: any): Block {
  const rows = node.children || [];
  
  if (rows.length === 0) {
    const content: TableContent = {
      headers: [],
      rows: [],
      alignments: []
    };
    
    return {
      id: '',
      type: 'table',
      sourceRange,
      content
    };
  }

  // First row is headers
  const headerRow = rows[0];
  const headers: TableCell[] = headerRow.children.map((cell: any) => ({
    text: toString(cell),
    formatting: [] // TODO: Extract inline formatting
  }));

  // Remaining rows are data
  const dataRows: TableCell[][] = rows.slice(1).map((row: any) => 
    row.children.map((cell: any) => ({
      text: toString(cell),
      formatting: [] // TODO: Extract inline formatting
    }))
  );

  // Extract alignments from table node (if available)
  const alignments = node.align || [];

  const content: TableContent = {
    headers,
    rows: dataRows,
    alignments
  };

  return {
    id: '',
    type: 'table',
    sourceRange,
    content
  };
}

/**
 * Create image block from MDAST image node
 */
function createImageBlock(node: Image, sourceRange: any): Block {
  const content: ImageContent = {
    src: node.url || '',
    alt: node.alt || ''
  };
  
  if (node.title) {
    content.title = node.title;
  }

  return {
    id: '',
    type: 'image',
    sourceRange,
    content
  };
}

/**
 * Create block from HTML node (Phase 3: Toggle support)
 */
function createHTMLBlock(node: HTML, sourceRange: any): Block | null {
  const html = node.value || '';
  
  // Check if this is a toggle (details/summary)
  const toggleData = detectToggle(html);
  if (toggleData) {
    const content: ToggleContent = {
      summary: toggleData.summary,
      collapsed: false // UI state, not persisted to Markdown
    };
    
    const block: Block = {
      id: '',
      type: 'toggle',
      sourceRange,
      content
    };
    
    // Add toggle content as children if present
    if (toggleData.content && toggleData.content.trim()) {
      // Parse the content inside the toggle as markdown
      const innerBlocks = parseMarkdownContent(toggleData.content);
      if (innerBlocks.length > 0) {
        block.children = innerBlocks;
      }
    }
    
    return block;
  }
  
  // For now, we don't support other HTML blocks
  return null;
}

/**
 * Detect callout syntax in blockquote text
 */
function detectCallout(text: string): { type: CalloutContent['type']; title?: string; text: string } | null {
  const lines = text.split('\n').map(line => line.trim());
  if (lines.length === 0) return null;
  
  const firstLine = lines[0];
  
  // Admonition style: [!NOTE], [!TIP], [!WARNING], etc.
  const admonitionMatch = firstLine.match(/^\[!(NOTE|TIP|WARNING|DANGER|INFO)\](.*)$/i);
  if (admonitionMatch) {
    const typeMap: Record<string, CalloutContent['type']> = {
      'NOTE': 'note',
      'TIP': 'tip', 
      'WARNING': 'warning',
      'DANGER': 'danger',
      'INFO': 'info'
    };
    
    const type = typeMap[admonitionMatch[1].toUpperCase()] || 'note';
    const titleText = admonitionMatch[2]?.trim() || '';
    const title = titleText ? titleText : undefined;
    const contentLines = lines.slice(1);
    return {
      type,
      ...(title && { title }),
      text: contentLines.join('\n').trim()
    };
  }
  
  // Emoji style: 💡 Note:, ⚠️ Warning:, etc.
  const emojiPatterns = [
    { regex: /^💡\s+(?:Note|INFO?|Tip)[:.]?\s*(.*)$/i, type: 'info' as const },
    { regex: /^📝\s+(?:Note|TIP|Tip)[:.]?\s*(.*)$/i, type: 'tip' as const },
    { regex: /^⚠️?\s+(?:Warning|WARN)[:.]?\s*(.*)$/i, type: 'warning' as const },
    { regex: /^❌\s+(?:Danger|ERROR)[:.]?\s*(.*)$/i, type: 'danger' as const },
    { regex: /^ℹ️?\s+(?:Info|NOTE)[:.]?\s*(.*)$/i, type: 'note' as const },
  ];
  
  for (const pattern of emojiPatterns) {
    const match = firstLine.match(pattern.regex);
    if (match) {
      const title = match[1]?.trim() || undefined;
      const contentLines = lines.slice(1);
      return {
        type: pattern.type,
        ...(title && { title }),
        text: contentLines.join('\n').trim()
      };
    }
  }
  
  return null;
}

/**
 * Detect toggle syntax in HTML
 */
function detectToggle(html: string): { summary: string; content?: string } | null {
  // Match <details><summary>...</summary>...</details>
  const detailsMatch = html.match(/<details(?:[^>]*)?>\s*<summary(?:[^>]*)?>([^<]*)<\/summary>\s*(.*?)\s*<\/details>/is);
  if (detailsMatch) {
    return {
      summary: detailsMatch[1].trim(),
      content: detailsMatch[2].trim()
    };
  }
  
  // Match standalone <summary> (incomplete toggle)
  const summaryMatch = html.match(/<summary(?:[^>]*)?>([^<]*)<\/summary>/i);
  if (summaryMatch) {
    return {
      summary: summaryMatch[1].trim()
    };
  }
  
  return null;
}

/**
 * Parse markdown content (for toggle children)
 */
function parseMarkdownContent(content: string): Block[] {
  try {
    const processor = createProcessor();
    const tree = processor.parse(content) as Root;
    
    const blocks = tree.children
      .map(node => nodeToBlock(node))
      .filter(block => block !== null) as Block[];
    
    return assignBlockIds(blocks);
  } catch (error) {
    console.error('Error parsing toggle content:', error);
    return [];
  }
}

/**
 * Post-process blocks to combine toggle HTML blocks with their content
 * Phase 3: Handle the fact that remark treats HTML and content as separate blocks
 */
function postProcessToggleBlocks(blocks: Block[]): Block[] {
  const processed: Block[] = [];
  let i = 0;
  
  while (i < blocks.length) {
    const block = blocks[i];
    
    if (block.type === 'toggle') {
      // Look ahead to collect content that belongs to this toggle
      const toggleBlock = block;
      const children: Block[] = [];
      
      // Find the closing tag by looking for the next toggle (which might be the closing tag)
      // or by collecting all content until we find a clear break
      let j = i + 1;
      let insideToggle = true;
      
      while (j < blocks.length && insideToggle) {
        const nextBlock = blocks[j];
        
        // Check if this is another HTML block that might be the closing tag
        if (nextBlock.type === 'toggle' || 
            (nextBlock.type === 'paragraph' && isEndOfToggleContent(nextBlock))) {
          insideToggle = false;
          break;
        }
        
        // Add this block as a child of the toggle
        children.push(nextBlock);
        j++;
      }
      
      // Update the toggle block with its children
      if (children.length > 0) {
        toggleBlock.children = children;
        i = j; // Skip the children we've processed
      } else {
        i++; // No children, just move to next block
      }
      
      processed.push(toggleBlock);
    } else {
      processed.push(block);
      i++;
    }
  }
  
  return processed;
}

/**
 * Check if this block marks the end of toggle content
 */
function isEndOfToggleContent(_block: Block): boolean {
  // This is a heuristic - we could look for HTML blocks that contain </details>
  // For now, we'll use a simple approach
  return false;
}