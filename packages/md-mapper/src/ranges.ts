/**
 * Source range tracking utilities for precise Markdown mapping
 */

import { SourceRange } from './types';
import type { Node } from 'mdast';

/**
 * Create a source range from MDAST node position
 */
export function createSourceRange(node: Node): SourceRange {
  if (!node.position) {
    throw new Error('Node missing position information');
  }

  const start = positionToOffset(node.position.start);
  const end = positionToOffset(node.position.end);

  return { start, end };
}

/**
 * Convert MDAST position (line/column) to character offset
 */
export function positionToOffset(pos: { line: number; column: number; offset?: number | undefined }): number {
  // Use the offset if available, otherwise we'll need to calculate it
  if (pos.offset !== undefined && pos.offset !== null) {
    return pos.offset;
  }
  
  // If no offset is available, we need the original text to calculate it
  // This is a limitation we'll need to handle in the parser by ensuring positions include offsets
  throw new Error('Position missing offset information - ensure remark plugins provide character offsets');
}

/**
 * Check if a source range contains another range
 */
export function containsRange(container: SourceRange, contained: SourceRange): boolean {
  return container.start <= contained.start && container.end >= contained.end;
}

/**
 * Check if two source ranges overlap
 */
export function rangesOverlap(a: SourceRange, b: SourceRange): boolean {
  return a.start < b.end && b.start < a.end;
}

/**
 * Merge multiple source ranges into a single range spanning all of them
 */
export function mergeRanges(...ranges: SourceRange[]): SourceRange {
  if (ranges.length === 0) {
    throw new Error('Cannot merge empty range array');
  }

  const start = Math.min(...ranges.map(r => r.start));
  const end = Math.max(...ranges.map(r => r.end));

  return { start, end };
}

/**
 * Adjust source ranges after a text edit
 */
export function adjustRangeAfterEdit(
  range: SourceRange,
  editStart: number,
  editEnd: number,
  newTextLength: number
): SourceRange {
  const deletedLength = editEnd - editStart;
  const delta = newTextLength - deletedLength;

  // If range is entirely before the edit, no change needed
  if (range.end <= editStart) {
    return range;
  }

  // If range is entirely after the edit, shift by delta
  if (range.start >= editEnd) {
    return {
      start: range.start + delta,
      end: range.end + delta
    };
  }

  // Range overlaps with edit - this is complex and may require re-parsing
  // For now, mark the range as needing recalculation
  return {
    start: Math.min(range.start, editStart),
    end: Math.max(range.start, editStart + newTextLength)
  };
}

/**
 * Convert character offset to line/column position in text
 */
export function offsetToPosition(text: string, offset: number): { line: number; column: number } {
  const lines = text.substring(0, offset).split('\n');
  return {
    line: lines.length,
    column: lines[lines.length - 1].length + 1
  };
}

/**
 * Extract text content from a source range
 */
export function extractRangeText(text: string, range: SourceRange): string {
  return text.substring(range.start, range.end);
}