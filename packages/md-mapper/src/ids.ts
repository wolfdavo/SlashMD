/**
 * Stable ID generation for blocks to ensure consistent identification across edits
 */

import { Block, BlockType, SourceRange } from './types';

/**
 * Generate a stable ID for a block based on its content and position
 * Phase 3 enhancement: Better stability across edits and content changes
 */
export function generateBlockId(
  type: BlockType, 
  content: any, 
  sourceRange: SourceRange,
  context?: { documentLength?: number; blockIndex?: number }
): string {
  // Create a stable string representation of the block's essential properties
  const contentStr = normalizeContentForId(content);
  const contentLength = sourceRange.end - sourceRange.start;
  
  // Use relative position rather than absolute for better stability
  const relativePosition = context?.documentLength 
    ? Math.round((sourceRange.start / context.documentLength) * 1000) / 1000
    : 0;
  
  // Include block index for additional uniqueness when content is similar
  const indexPart = context?.blockIndex !== undefined ? `:${context.blockIndex}` : '';
  
  // Create hash input with stable components
  const hashInput = `${type}:${contentStr}:${contentLength}:${relativePosition}${indexPart}`;
  
  // Enhanced hash function (djb2 variant)
  let hash = 5381;
  for (let i = 0; i < hashInput.length; i++) {
    hash = ((hash << 5) + hash) + hashInput.charCodeAt(i);
    // Add bit mixing for better distribution
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  // Convert to positive number and create readable ID
  const hashValue = Math.abs(hash).toString(36);
  return `${type}_${hashValue}`;
}

/**
 * Normalize content for stable ID generation
 * Removes UI-specific and volatile properties
 */
function normalizeContentForId(content: any): string {
  if (typeof content === 'string') {
    // For string content, normalize whitespace for stability
    return content.replace(/\s+/g, ' ').trim();
  }
  
  if (typeof content === 'object' && content !== null) {
    // Create a stable representation of object content
    const normalized: any = {};
    
    // Only include stable properties in ID calculation
    for (const [key, value] of Object.entries(content)) {
      if (shouldIncludeInId(key, value)) {
        if (typeof value === 'string') {
          normalized[key] = value.replace(/\s+/g, ' ').trim();
        } else if (Array.isArray(value)) {
          // For arrays, create a stable representation
          normalized[key] = value.map(item => 
            typeof item === 'object' ? normalizeContentForId(item) : item
          );
        } else {
          normalized[key] = value;
        }
      }
    }
    
    // Sort keys for deterministic stringification
    const sortedKeys = Object.keys(normalized).sort();
    const sortedNormalized: any = {};
    for (const key of sortedKeys) {
      sortedNormalized[key] = normalized[key];
    }
    
    return JSON.stringify(sortedNormalized);
  }
  
  return String(content);
}

/**
 * Check if a property should be included in ID generation
 */
function shouldIncludeInId(key: string, value: any): boolean {
  // Exclude UI-specific properties that shouldn't affect ID
  const excludedProps = new Set([
    'collapsed', 
    'showLineNumbers', 
    'formatting', // Inline formatting can change without affecting block identity
    'dimensions' // Image dimensions shouldn't affect identity
  ]);
  
  if (excludedProps.has(key)) {
    return false;
  }
  
  // Exclude undefined/null values
  if (value === undefined || value === null) {
    return false;
  }
  
  // Exclude empty arrays/objects
  if (Array.isArray(value) && value.length === 0) {
    return false;
  }
  
  if (typeof value === 'object' && Object.keys(value).length === 0) {
    return false;
  }
  
  return true;
}

/**
 * Ensure block ID uniqueness within a document
 */
export function ensureUniqueId(id: string, existingIds: Set<string>): string {
  if (!existingIds.has(id)) {
    return id;
  }

  // If collision, append counter
  let counter = 1;
  let uniqueId = `${id}_${counter}`;
  
  while (existingIds.has(uniqueId)) {
    counter++;
    uniqueId = `${id}_${counter}`;
  }

  return uniqueId;
}

/**
 * Assign IDs to all blocks in a document, ensuring uniqueness
 * Phase 3 enhancement: Better context awareness for stable IDs
 */
export function assignBlockIds(blocks: Block[], documentText?: string): Block[] {
  const existingIds = new Set<string>();
  const documentLength = documentText?.length || 0;

  function processBlock(block: Block, blockIndex: number): Block {
    // Generate base ID with enhanced context
    const context = {
      documentLength,
      blockIndex
    };
    
    const baseId = generateBlockId(block.type, block.content, block.sourceRange, context);
    const uniqueId = ensureUniqueId(baseId, existingIds);
    existingIds.add(uniqueId);

    const updatedBlock: Block = {
      ...block,
      id: uniqueId
    };

    // Process children recursively
    if (block.children) {
      updatedBlock.children = block.children.map((child, childIndex) => 
        processBlock(child, childIndex)
      );
    }

    return updatedBlock;
  }

  return blocks.map((block, index) => processBlock(block, index));
}

/**
 * Update block IDs while preserving existing IDs where possible
 * Useful for incremental updates to maintain UI state
 */
export function updateBlockIds(
  newBlocks: Block[], 
  existingBlocks: Block[], 
  documentText?: string
): Block[] {
  // Create a map of content hash to existing ID for preservation
  const contentToIdMap = new Map<string, string>();
  
  function mapExistingIds(block: Block) {
    const contentHash = hashBlockContent(block);
    contentToIdMap.set(contentHash, block.id);
    
    if (block.children) {
      block.children.forEach(mapExistingIds);
    }
  }
  
  existingBlocks.forEach(mapExistingIds);
  
  // Assign IDs to new blocks, preserving existing ones where possible
  const existingIds = new Set<string>();
  const documentLength = documentText?.length || 0;

  function processBlock(block: Block, blockIndex: number): Block {
    const contentHash = hashBlockContent(block);
    let id: string;
    
    if (contentToIdMap.has(contentHash)) {
      // Preserve existing ID if content matches
      id = contentToIdMap.get(contentHash)!;
    } else {
      // Generate new ID
      const context = { documentLength, blockIndex };
      const baseId = generateBlockId(block.type, block.content, block.sourceRange, context);
      id = ensureUniqueId(baseId, existingIds);
    }
    
    existingIds.add(id);

    const updatedBlock: Block = {
      ...block,
      id
    };

    // Process children recursively
    if (block.children) {
      updatedBlock.children = block.children.map((child, childIndex) => 
        processBlock(child, childIndex)
      );
    }

    return updatedBlock;
  }

  return newBlocks.map((block, index) => processBlock(block, index));
}

/**
 * Create a hash of block content for ID preservation
 */
function hashBlockContent(block: Block): string {
  const normalizedContent = normalizeContentForId(block.content);
  return `${block.type}:${normalizedContent}`;
}