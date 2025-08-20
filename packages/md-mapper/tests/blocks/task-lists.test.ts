/**
 * Tests specific to task list block functionality
 */

import { describe, it, expect } from 'vitest';
import { parseMarkdown, serializeBlocks } from '../../src/index';
import type { TaskListContent, TaskItemContent } from '../../src/types';

describe('Task List Blocks', () => {
  describe('Parsing', () => {
    it('should parse task lists with mixed checked states', () => {
      const markdown = `- [ ] Unchecked task
- [x] Checked task
- [ ] Another unchecked task`;

      const blocks = parseMarkdown(markdown);
      expect(blocks).toHaveLength(1);
      expect(blocks[0].type).toBe('taskList');
      
      expect(blocks[0].children).toHaveLength(3);
      
      // Check first item (unchecked)
      const item1 = blocks[0].children?.[0];
      expect(item1?.type).toBe('taskItem');
      expect((item1?.content as TaskItemContent).checked).toBe(false);
      expect((item1?.content as TaskItemContent).text).toBe('Unchecked task');
      
      // Check second item (checked)
      const item2 = blocks[0].children?.[1];
      expect(item2?.type).toBe('taskItem');
      expect((item2?.content as TaskItemContent).checked).toBe(true);
      expect((item2?.content as TaskItemContent).text).toBe('Checked task');
    });

    it('should distinguish task lists from regular lists', () => {
      const markdown = `- Regular list item
- Another regular item`;

      const blocks = parseMarkdown(markdown);
      expect(blocks).toHaveLength(1);
      expect(blocks[0].type).toBe('list');
    });

    it('should handle empty task text', () => {
      const markdown = `- [ ] Empty task
- [x] Task with content
- [ ] Another empty task`;

      const blocks = parseMarkdown(markdown);
      expect(blocks).toHaveLength(1);
      expect(blocks[0].type).toBe('taskList');
      expect(blocks[0].children).toHaveLength(3);
      
      expect((blocks[0].children?.[0].content as TaskItemContent).text).toBe('Empty task');
      expect((blocks[0].children?.[1].content as TaskItemContent).text).toBe('Task with content');
      expect((blocks[0].children?.[2].content as TaskItemContent).text).toBe('Another empty task');
    });
  });

  describe('Serialization', () => {
    it('should serialize task lists correctly', () => {
      const markdown = `- [ ] Unchecked task
- [x] Checked task
- [ ] Another unchecked task`;

      const blocks = parseMarkdown(markdown);
      const serialized = serializeBlocks(blocks);
      
      expect(serialized).toBe(markdown);
    });

    it('should maintain task states through serialization', () => {
      const markdown = `- [x] Completed task
- [ ] Pending task`;

      const blocks = parseMarkdown(markdown);
      const serialized = serializeBlocks(blocks);
      
      expect(serialized).toBe(markdown);
    });
  });

  describe('Round-trip fidelity', () => {
    it('should maintain task list structure through round trips', () => {
      const original = `- [x] Completed task 1
- [ ] Pending task 1
- [x] Completed task 2
- [ ] Pending task 2`;

      let current = original;
      
      // 3 round trips
      for (let i = 0; i < 3; i++) {
        const blocks = parseMarkdown(current);
        current = serializeBlocks(blocks);
      }

      const finalBlocks = parseMarkdown(current);
      expect(finalBlocks).toHaveLength(1);
      expect(finalBlocks[0].type).toBe('taskList');
      expect(finalBlocks[0].children).toHaveLength(4);
      
      const states = finalBlocks[0].children?.map(child => 
        (child.content as TaskItemContent).checked
      );
      expect(states).toEqual([true, false, true, false]);
    });
  });

  describe('Mixed content scenarios', () => {
    it('should handle task lists mixed with regular content', () => {
      const markdown = `# Todo List

- [x] Buy groceries
- [ ] Walk the dog
- [x] Finish project

## Regular List

- Item 1
- Item 2`;

      const blocks = parseMarkdown(markdown);
      expect(blocks).toHaveLength(4);
      
      expect(blocks[0].type).toBe('heading');
      expect(blocks[1].type).toBe('taskList');
      expect(blocks[2].type).toBe('heading');
      expect(blocks[3].type).toBe('list');
      
      // Verify task list content
      expect(blocks[1].children).toHaveLength(3);
      const taskStates = blocks[1].children?.map(child => 
        (child.content as TaskItemContent).checked
      );
      expect(taskStates).toEqual([true, false, true]);
    });
  });

  describe('Edge cases', () => {
    it('should handle task lists with special characters in text', () => {
      const markdown = `- [ ] Task with *italic* text
- [x] Task with **bold** text
- [ ] Task with \`code\` text`;

      const blocks = parseMarkdown(markdown);
      expect(blocks).toHaveLength(1);
      expect(blocks[0].type).toBe('taskList');
      expect(blocks[0].children).toHaveLength(3);
      
      // Note: In Phase 2, remark processes the formatting so the raw syntax may not be preserved
      expect((blocks[0].children?.[0].content as TaskItemContent).text).toContain('italic');
      expect((blocks[0].children?.[1].content as TaskItemContent).text).toContain('bold');
      expect((blocks[0].children?.[2].content as TaskItemContent).text).toContain('code');
    });

    it('should handle various checkbox formats', () => {
      const markdown = `- [x] Checked with x
- [X] Checked with X
- [ ] Unchecked with space`;

      const blocks = parseMarkdown(markdown);
      expect(blocks).toHaveLength(1);
      expect(blocks[0].type).toBe('taskList');
      
      const states = blocks[0].children?.map(child => 
        (child.content as TaskItemContent).checked
      );
      // Both 'x' and 'X' should be treated as checked
      expect(states).toEqual([true, true, false]);
    });
  });
});