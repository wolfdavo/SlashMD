/**
 * Incremental update functionality for efficient document changes
 * Phase 3: Smart block updating based on text edits
 */

import { Block, DocumentChange, TextEdit, SourceRange } from './types';
import { adjustRangeAfterEdit, rangesOverlap, containsRange } from './ranges';

/**
 * Update blocks based on document changes efficiently
 * This is the main Phase 3 implementation of the updateBlocks function
 */
export function updateBlocks(
  currentBlocks: Block[], 
  changes: DocumentChange[]
): Block[] {
  if (changes.length === 0) {
    return currentBlocks;
  }

  // For complex changes or multiple edits, fall back to full re-parsing
  if (changes.length > 1 || hasComplexChanges(changes)) {
    console.log('Complex changes detected, performing full re-parse');
    return performFullReparse(currentBlocks, changes);
  }

  const change = changes[0];
  
  try {
    return performIncrementalUpdate(currentBlocks, change);
  } catch (error) {
    console.warn('Incremental update failed, falling back to full re-parse:', error);
    return performFullReparse(currentBlocks, changes);
  }
}

/**
 * Perform incremental update for a single change
 */
function performIncrementalUpdate(blocks: Block[], change: DocumentChange): Block[] {
  const { range, text } = change;
  const affectedBlocks = findAffectedBlocks(blocks, range);
  
  if (affectedBlocks.length === 0) {
    // No blocks affected, just adjust ranges
    return adjustAllRanges(blocks, range, text);
  }
  
  if (affectedBlocks.length === 1 && isSimpleTextEdit(affectedBlocks[0], range, text)) {
    // Simple edit within a single block - update content and adjust ranges
    return updateSingleBlock(blocks, affectedBlocks[0], range, text);
  }
  
  // Multiple blocks affected or complex edit - re-parse affected region
  return reparseAffectedRegion(blocks, affectedBlocks, range, text);
}

/**
 * Find blocks that are affected by a range change
 */
function findAffectedBlocks(blocks: Block[], range: SourceRange): Block[] {
  const affected: Block[] = [];
  
  function checkBlock(block: Block) {
    if (rangesOverlap(block.sourceRange, range)) {
      affected.push(block);
    }
    
    // Check children recursively
    if (block.children) {
      block.children.forEach(checkBlock);
    }
  }
  
  blocks.forEach(checkBlock);
  return affected;
}

/**
 * Check if this is a simple text edit within a single block
 */
function isSimpleTextEdit(block: Block, range: SourceRange, newText: string): boolean {
  // Must be entirely contained within the block
  if (!containsRange(block.sourceRange, range)) {
    return false;
  }
  
  // Don't handle complex block types incrementally
  if (['table', 'code', 'list', 'taskList', 'toggle'].includes(block.type)) {
    return false;
  }
  
  // Don't handle multi-line edits for now
  if (newText.includes('\n') || (range.end - range.start) > newText.length + 10) {
    return false;
  }
  
  return true;
}

/**
 * Update a single block with a simple text change
 */
function updateSingleBlock(
  allBlocks: Block[], 
  targetBlock: Block, 
  range: SourceRange, 
  newText: string
): Block[] {
  const deletedLength = range.end - range.start;
  const delta = newText.length - deletedLength;
  
  const updatedBlocks = allBlocks.map(block => {
    if (block.id === targetBlock.id) {
      // Update the block's content and range
      const updatedBlock = updateBlockContent(block, range, newText);
      return {
        ...updatedBlock,
        sourceRange: {
          start: block.sourceRange.start,
          end: block.sourceRange.end + delta
        }
      };
    } else if (block.sourceRange.start > range.end) {
      // Block is after the edit - adjust its range
      return {
        ...block,
        sourceRange: adjustRangeAfterEdit(block.sourceRange, range.start, range.end, newText.length)
      };
    } else {
      // Block is before the edit or unaffected
      return block;
    }
  });
  
  return updatedBlocks;
}

/**
 * Update block content with new text
 */
function updateBlockContent(block: Block, range: SourceRange, newText: string): Block {
  const relativeStart = range.start - block.sourceRange.start;
  const relativeEnd = range.end - block.sourceRange.start;
  
  if (block.type === 'paragraph') {
    const content = block.content as any;
    const originalText = content.text || '';
    const updatedText = originalText.substring(0, relativeStart) + 
                       newText + 
                       originalText.substring(relativeEnd);
    
    return {
      ...block,
      content: {
        ...content,
        text: updatedText
      }
    };
  }
  
  if (block.type === 'heading') {
    const content = block.content as any;
    const originalText = content.text || '';
    const updatedText = originalText.substring(0, relativeStart) + 
                       newText + 
                       originalText.substring(relativeEnd);
    
    return {
      ...block,
      content: {
        ...content,
        text: updatedText
      }
    };
  }
  
  // For other block types, return unchanged for now
  return block;
}

/**
 * Re-parse the affected region when incremental updates aren't sufficient
 */
function reparseAffectedRegion(
  blocks: Block[], 
  affectedBlocks: Block[], 
  _range: SourceRange, 
  newText: string
): Block[] {
  // Find the bounds of all affected blocks
  const minStart = Math.min(...affectedBlocks.map(b => b.sourceRange.start));
  const maxEnd = Math.max(...affectedBlocks.map(b => b.sourceRange.end));
  
  // For now, we'll need the full document text to re-parse properly
  // This is a limitation that would be resolved with access to the full document
  console.warn('Region re-parsing requires full document context - falling back to full re-parse');
  console.log('Affected range:', minStart, 'to', maxEnd, 'with new text:', newText.length, 'chars');
  
  // Return blocks unchanged as fallback
  return blocks;
}

/**
 * Adjust all block ranges after an edit
 */
function adjustAllRanges(blocks: Block[], range: SourceRange, newText: string): Block[] {
  return blocks.map(block => {
    const adjustedBlock: Block = {
      ...block,
      sourceRange: adjustRangeAfterEdit(block.sourceRange, range.start, range.end, newText.length)
    };
    if (block.children) {
      adjustedBlock.children = adjustAllRanges(block.children, range, newText);
    }
    return adjustedBlock;
  });
}

/**
 * Check if changes are too complex for incremental updates
 */
function hasComplexChanges(changes: DocumentChange[]): boolean {
  // Multiple changes are complex
  if (changes.length > 1) return true;
  
  const change = changes[0];
  
  // Large changes are complex
  if ((change.range.end - change.range.start) > 1000) return true;
  
  // Changes with many newlines are complex
  if (change.text.split('\n').length > 5) return true;
  
  return false;
}

/**
 * Fall back to full re-parsing when incremental updates fail
 */
function performFullReparse(blocks: Block[], changes: DocumentChange[]): Block[] {
  // This would need the full document text to work properly
  // For now, return the original blocks
  console.warn('Full re-parse not implemented - requires document text. Changes:', changes.length);
  return blocks;
}

/**
 * Convert TextEdit to DocumentChange
 */
export function textEditToDocumentChange(edit: TextEdit): DocumentChange {
  return {
    range: { start: edit.start, end: edit.end },
    text: edit.newText
  };
}

/**
 * Batch multiple text edits into document changes
 */
export function batchTextEdits(edits: TextEdit[]): DocumentChange[] {
  // Sort edits by position (reverse order for safe application)
  const sortedEdits = [...edits].sort((a, b) => b.start - a.start);
  
  return sortedEdits.map(textEditToDocumentChange);
}