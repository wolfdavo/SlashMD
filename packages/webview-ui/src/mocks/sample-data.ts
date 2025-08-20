/**
 * Comprehensive sample data for Phase 2 testing
 * Demonstrates all block types with realistic content
 */

import type { Block } from '../types/blocks';

export const comprehensiveSampleDocument: Block[] = [
  // Document title
  {
    id: 'heading-1',
    type: 'heading',
    content: {
      level: 1,
      text: 'SlashMD Editor - Block Types Demo'
    },
    sourceRange: { start: 0, end: 36 }
  },

  // Introduction paragraph
  {
    id: 'paragraph-1',
    type: 'paragraph',
    content: {
      text: 'This document demonstrates all the block types available in the SlashMD editor. Each block type has its own unique editing experience and features.'
    },
    sourceRange: { start: 37, end: 184 }
  },

  // Divider
  {
    id: 'divider-1',
    type: 'divider',
    content: {},
    sourceRange: { start: 185, end: 188 }
  },

  // Text blocks section
  {
    id: 'heading-2',
    type: 'heading',
    content: {
      level: 2,
      text: 'Text Blocks'
    },
    sourceRange: { start: 189, end: 203 }
  },

  {
    id: 'paragraph-2',
    type: 'paragraph',
    content: {
      text: 'Regular paragraph text can contain <strong>bold</strong>, <em>italic</em>, and <code>inline code</code> formatting.'
    },
    sourceRange: { start: 204, end: 318 }
  },

  {
    id: 'quote-1',
    type: 'quote',
    content: {
      text: 'This is a blockquote. It\'s perfect for highlighting important information or including quotes from other sources.'
    },
    sourceRange: { start: 319, end: 433 }
  },

  // Code block
  {
    id: 'code-1',
    type: 'code',
    content: {
      language: 'typescript',
      code: `// Example TypeScript code
interface Block {
  id: string;
  type: BlockType;
  content: BlockContent;
}

const createBlock = (type: BlockType): Block => {
  return {
    id: generateId(),
    type,
    content: getDefaultContent(type)
  };
};`,
      showLineNumbers: true
    },
    sourceRange: { start: 434, end: 672 }
  },

  // Lists section
  {
    id: 'heading-3',
    type: 'heading',
    content: {
      level: 2,
      text: 'Lists and Tasks'
    },
    sourceRange: { start: 673, end: 690 }
  },

  // Unordered list container
  {
    id: 'list-1',
    type: 'list',
    content: {
      ordered: false
    },
    sourceRange: { start: 691, end: 691 },
    children: [
      {
        id: 'list-item-1',
        type: 'listItem',
        content: {
          text: 'First unordered list item',
          indent: 0
        },
        sourceRange: { start: 692, end: 719 }
      },
      {
        id: 'list-item-2',
        type: 'listItem',
        content: {
          text: 'Second item with nested content',
          indent: 0
        },
        sourceRange: { start: 720, end: 753 }
      },
      {
        id: 'list-item-3',
        type: 'listItem',
        content: {
          text: 'Nested item level 1',
          indent: 1
        },
        sourceRange: { start: 754, end: 775 }
      },
      {
        id: 'list-item-4',
        type: 'listItem',
        content: {
          text: 'Nested item level 2',
          indent: 2
        },
        sourceRange: { start: 776, end: 797 }
      }
    ]
  },

  // Ordered list container
  {
    id: 'list-2',
    type: 'list',
    content: {
      ordered: true,
      startNumber: 1
    },
    sourceRange: { start: 798, end: 798 },
    children: [
      {
        id: 'list-item-5',
        type: 'listItem',
        content: {
          text: 'First ordered list item',
          indent: 0
        },
        sourceRange: { start: 799, end: 824 }
      },
      {
        id: 'list-item-6',
        type: 'listItem',
        content: {
          text: 'Second ordered item',
          indent: 0
        },
        sourceRange: { start: 825, end: 846 }
      },
      {
        id: 'list-item-7',
        type: 'listItem',
        content: {
          text: 'Third item',
          indent: 0
        },
        sourceRange: { start: 847, end: 859 }
      }
    ]
  },

  // Task list container
  {
    id: 'task-list-1',
    type: 'taskList',
    content: {},
    sourceRange: { start: 860, end: 860 },
    children: [
      {
        id: 'task-item-1',
        type: 'taskItem',
        content: {
          checked: true,
          text: 'Completed task item',
          indent: 0
        },
        sourceRange: { start: 861, end: 882 }
      },
      {
        id: 'task-item-2',
        type: 'taskItem',
        content: {
          checked: false,
          text: 'Incomplete task item',
          indent: 0
        },
        sourceRange: { start: 883, end: 905 }
      },
      {
        id: 'task-item-3',
        type: 'taskItem',
        content: {
          checked: false,
          text: 'Nested task',
          indent: 1
        },
        sourceRange: { start: 906, end: 919 }
      }
    ]
  },

  // Rich content section
  {
    id: 'heading-4',
    type: 'heading',
    content: {
      level: 2,
      text: 'Rich Content'
    },
    sourceRange: { start: 920, end: 935 }
  },

  // Table block
  {
    id: 'table-1',
    type: 'table',
    content: {
      headers: [
        { text: 'Feature' },
        { text: 'Description' },
        { text: 'Status' }
      ],
      rows: [
        [
          { text: 'Block Editor' },
          { text: 'Notion-like editing experience' },
          { text: '✅ Complete' }
        ],
        [
          { text: 'Markdown Export' },
          { text: 'Export to standard Markdown' },
          { text: '🚧 In Progress' }
        ],
        [
          { text: 'Collaboration' },
          { text: 'Real-time collaborative editing' },
          { text: '📋 Planned' }
        ]
      ],
      alignments: ['left', 'left', 'center']
    },
    sourceRange: { start: 936, end: 1200 }
  },

  // Image block (placeholder)
  {
    id: 'image-1',
    type: 'image',
    content: {
      src: './assets/sample-diagram.png',
      alt: 'Sample architecture diagram showing the SlashMD editor components',
      title: 'SlashMD Architecture',
      dimensions: { width: 600, height: 400 }
    },
    sourceRange: { start: 1201, end: 1250 }
  },

  // Callouts section
  {
    id: 'heading-5',
    type: 'heading',
    content: {
      level: 2,
      text: 'Callouts and Alerts'
    },
    sourceRange: { start: 1251, end: 1273 }
  },

  // Different callout types
  {
    id: 'callout-1',
    type: 'callout',
    content: {
      type: 'note',
      title: 'Important Note',
      text: 'This is a note callout. Use it to highlight important information that users should be aware of.'
    },
    sourceRange: { start: 1274, end: 1370 }
  },

  {
    id: 'callout-2',
    type: 'callout',
    content: {
      type: 'tip',
      text: 'This is a tip callout without a title. Perfect for sharing helpful hints and best practices.'
    },
    sourceRange: { start: 1371, end: 1465 }
  },

  {
    id: 'callout-3',
    type: 'callout',
    content: {
      type: 'warning',
      title: 'Be Careful!',
      text: 'This is a warning callout. Use it to alert users about potential issues or things to watch out for.'
    },
    sourceRange: { start: 1466, end: 1570 }
  },

  {
    id: 'callout-4',
    type: 'callout',
    content: {
      type: 'danger',
      title: 'Critical Alert',
      text: 'This is a danger callout. Use it for critical information that could cause problems if ignored.'
    },
    sourceRange: { start: 1571, end: 1670 }
  },

  // Interactive content section
  {
    id: 'heading-6',
    type: 'heading',
    content: {
      level: 2,
      text: 'Interactive Content'
    },
    sourceRange: { start: 1671, end: 1693 }
  },

  // Toggle block
  {
    id: 'toggle-1',
    type: 'toggle',
    content: {
      summary: 'Click to expand: Implementation Details',
      collapsed: true
    },
    sourceRange: { start: 1694, end: 1694 },
    children: [
      {
        id: 'paragraph-3',
        type: 'paragraph',
        content: {
          text: 'This content is hidden inside a toggle block. Toggle blocks are perfect for organizing long documents and creating expandable sections.'
        },
        sourceRange: { start: 1695, end: 1840 }
      },
      {
        id: 'list-3',
        type: 'list',
        content: {
          ordered: false
        },
        sourceRange: { start: 1841, end: 1841 },
        children: [
          {
            id: 'list-item-8',
            type: 'listItem',
            content: {
              text: 'Toggle blocks can contain any other block types',
              indent: 0
            },
            sourceRange: { start: 1842, end: 1890 }
          },
          {
            id: 'list-item-9',
            type: 'listItem',
            content: {
              text: 'They help organize long documents',
              indent: 0
            },
            sourceRange: { start: 1891, end: 1926 }
          },
          {
            id: 'list-item-10',
            type: 'listItem',
            content: {
              text: 'Great for FAQ sections and detailed explanations',
              indent: 0
            },
            sourceRange: { start: 1927, end: 1976 }
          }
        ]
      }
    ]
  },

  // Another toggle with code
  {
    id: 'toggle-2',
    type: 'toggle',
    content: {
      summary: 'Code Example: Creating a New Block',
      collapsed: false
    },
    sourceRange: { start: 1977, end: 1977 },
    children: [
      {
        id: 'code-2',
        type: 'code',
        content: {
          language: 'javascript',
          code: `// Create a new paragraph block
const newBlock = {
  id: generateId(),
  type: 'paragraph',
  content: { text: 'Hello, world!' },
  sourceRange: { start: 0, end: 13 }
};

// Add it to the editor
editor.insertBlock(afterId, newBlock);`,
          showLineNumbers: false
        },
        sourceRange: { start: 1978, end: 2150 }
      }
    ]
  },

  // Final section
  {
    id: 'heading-7',
    type: 'heading',
    content: {
      level: 2,
      text: 'Conclusion'
    },
    sourceRange: { start: 2151, end: 2164 }
  },

  {
    id: 'paragraph-4',
    type: 'paragraph',
    content: {
      text: 'This document demonstrates all the core block types available in SlashMD. Each block type provides a unique editing experience while maintaining compatibility with standard Markdown.'
    },
    sourceRange: { start: 2165, end: 2340 }
  },

  // Final divider
  {
    id: 'divider-2',
    type: 'divider',
    content: {},
    sourceRange: { start: 2341, end: 2344 }
  }
];

// Simplified sample for quick testing
export const basicSampleDocument: Block[] = [
  {
    id: 'h1-1',
    type: 'heading',
    content: { level: 1, text: 'Welcome to SlashMD' },
    sourceRange: { start: 0, end: 20 }
  },
  {
    id: 'p-1',
    type: 'paragraph',
    content: { text: 'This is a paragraph with some text.' },
    sourceRange: { start: 21, end: 57 }
  },
  {
    id: 'task-list-basic',
    type: 'taskList',
    content: {},
    sourceRange: { start: 58, end: 58 },
    children: [
      {
        id: 'task-1',
        type: 'taskItem',
        content: { checked: false, text: 'Try editing this task', indent: 0 },
        sourceRange: { start: 59, end: 82 }
      },
      {
        id: 'task-2',
        type: 'taskItem',
        content: { checked: true, text: 'This task is completed', indent: 0 },
        sourceRange: { start: 83, end: 107 }
      }
    ]
  },
  {
    id: 'quote-basic',
    type: 'quote',
    content: { text: 'A simple quote block for inspiration.' },
    sourceRange: { start: 108, end: 147 }
  }
];

// Block type examples for development
export const blockTypeExamples: { [key: string]: Block } = {
  paragraph: {
    id: 'example-paragraph',
    type: 'paragraph',
    content: { text: 'This is an example paragraph.' },
    sourceRange: { start: 0, end: 30 }
  },
  heading: {
    id: 'example-heading',
    type: 'heading',
    content: { level: 2, text: 'Example Heading' },
    sourceRange: { start: 0, end: 17 }
  },
  quote: {
    id: 'example-quote',
    type: 'quote',
    content: { text: 'An example quote block.' },
    sourceRange: { start: 0, end: 24 }
  },
  code: {
    id: 'example-code',
    type: 'code',
    content: { language: 'javascript', code: 'console.log("Hello, world!");' },
    sourceRange: { start: 0, end: 31 }
  },
  callout: {
    id: 'example-callout',
    type: 'callout',
    content: { type: 'tip', text: 'This is a helpful tip!' },
    sourceRange: { start: 0, end: 23 }
  }
};