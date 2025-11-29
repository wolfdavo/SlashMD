import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $createParagraphNode,
  $createTextNode,
  $getSelection,
  $isRangeSelection,
  TextNode,
  LexicalEditor,
} from 'lexical';
import { $createHeadingNode, $createQuoteNode } from '@lexical/rich-text';
import { $createListNode, $createListItemNode } from '@lexical/list';
import { $createCodeNode } from '@lexical/code';
import { $createHorizontalRuleNode, $createCalloutNode, $createToggleNode } from './nodes';
import {
  $createTableNode,
  $createTableRowNode,
  $createTableCellNode,
  TableCellHeaderStates,
} from '@lexical/table';
import { INSERT_IMAGE_COMMAND } from './ImagePlugin';

interface BlockOption {
  key: string;
  label: string;
  description: string;
  icon: string;
  keywords: string[];
  onSelect: (editor: LexicalEditor) => void;
}

interface SlashMenuProps {
  isOpen: boolean;
  position: { top: number; left: number } | null;
  query: string;
  onClose: () => void;
}

// Block options defined outside component to avoid recreation
const BLOCK_OPTIONS: BlockOption[] = [
  {
    key: 'paragraph',
    label: 'Paragraph',
    description: 'Plain text',
    icon: '¶',
    keywords: ['text', 'plain', 'paragraph'],
    onSelect: (editor) => {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          const node = $createParagraphNode();
          selection.insertNodes([node]);
        }
      });
    },
  },
  {
    key: 'heading1',
    label: 'Heading 1',
    description: 'Large heading',
    icon: 'H1',
    keywords: ['h1', 'heading', 'title', 'large'],
    onSelect: (editor) => {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          const node = $createHeadingNode('h1');
          selection.insertNodes([node]);
        }
      });
    },
  },
  {
    key: 'heading2',
    label: 'Heading 2',
    description: 'Medium heading',
    icon: 'H2',
    keywords: ['h2', 'heading', 'subtitle', 'medium'],
    onSelect: (editor) => {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          const node = $createHeadingNode('h2');
          selection.insertNodes([node]);
        }
      });
    },
  },
  {
    key: 'heading3',
    label: 'Heading 3',
    description: 'Small heading',
    icon: 'H3',
    keywords: ['h3', 'heading', 'small'],
    onSelect: (editor) => {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          const node = $createHeadingNode('h3');
          selection.insertNodes([node]);
        }
      });
    },
  },
  {
    key: 'bulletList',
    label: 'Bullet List',
    description: 'Unordered list',
    icon: '•',
    keywords: ['bullet', 'list', 'unordered', 'ul'],
    onSelect: (editor) => {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          const list = $createListNode('bullet');
          const item = $createListItemNode();
          list.append(item);
          selection.insertNodes([list]);
        }
      });
    },
  },
  {
    key: 'numberedList',
    label: 'Numbered List',
    description: 'Ordered list',
    icon: '1.',
    keywords: ['numbered', 'list', 'ordered', 'ol'],
    onSelect: (editor) => {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          const list = $createListNode('number');
          const item = $createListItemNode();
          list.append(item);
          selection.insertNodes([list]);
        }
      });
    },
  },
  {
    key: 'todoList',
    label: 'Todo List',
    description: 'Task list with checkboxes',
    icon: '☐',
    keywords: ['todo', 'task', 'checkbox', 'check'],
    onSelect: (editor) => {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          const list = $createListNode('check');
          const item = $createListItemNode();
          list.append(item);
          selection.insertNodes([list]);
        }
      });
    },
  },
  {
    key: 'quote',
    label: 'Quote',
    description: 'Blockquote',
    icon: '"',
    keywords: ['quote', 'blockquote', 'citation'],
    onSelect: (editor) => {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          const node = $createQuoteNode();
          selection.insertNodes([node]);
        }
      });
    },
  },
  {
    key: 'code',
    label: 'Code Block',
    description: 'Code with syntax highlighting',
    icon: '</>',
    keywords: ['code', 'snippet', 'programming'],
    onSelect: (editor) => {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          const node = $createCodeNode();
          selection.insertNodes([node]);
        }
      });
    },
  },
  {
    key: 'divider',
    label: 'Divider',
    description: 'Horizontal rule',
    icon: '—',
    keywords: ['divider', 'hr', 'line', 'horizontal'],
    onSelect: (editor) => {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          const node = $createHorizontalRuleNode();
          selection.insertNodes([node]);
        }
      });
    },
  },
  {
    key: 'image',
    label: 'Image',
    description: 'Upload or embed an image',
    icon: '🖼',
    keywords: ['image', 'picture', 'photo', 'img', 'upload'],
    onSelect: (editor) => {
      editor.dispatchCommand(INSERT_IMAGE_COMMAND, undefined);
    },
  },
  {
    key: 'callout-note',
    label: 'Note',
    description: 'Info callout',
    icon: 'ℹ',
    keywords: ['note', 'info', 'callout', 'admonition'],
    onSelect: (editor) => {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          const node = $createCalloutNode('note', '');
          selection.insertNodes([node]);
        }
      });
    },
  },
  {
    key: 'callout-tip',
    label: 'Tip',
    description: 'Helpful tip',
    icon: '💡',
    keywords: ['tip', 'hint', 'callout'],
    onSelect: (editor) => {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          const node = $createCalloutNode('tip', '');
          selection.insertNodes([node]);
        }
      });
    },
  },
  {
    key: 'callout-warning',
    label: 'Warning',
    description: 'Warning callout',
    icon: '⚠',
    keywords: ['warning', 'caution', 'alert', 'callout'],
    onSelect: (editor) => {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          const node = $createCalloutNode('warning', '');
          selection.insertNodes([node]);
        }
      });
    },
  },
  {
    key: 'toggle',
    label: 'Toggle',
    description: 'Collapsible section',
    icon: '▶',
    keywords: ['toggle', 'collapse', 'details', 'accordion'],
    onSelect: (editor) => {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          const node = $createToggleNode('Toggle title', '', false);
          selection.insertNodes([node]);
        }
      });
    },
  },
  {
    key: 'table',
    label: 'Table',
    description: 'Insert a table',
    icon: '⊞',
    keywords: ['table', 'grid', 'matrix', 'spreadsheet'],
    onSelect: (editor) => {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          // Create a 3x3 table with header row
          const table = $createTableNode();

          // Header row
          const headerRow = $createTableRowNode();
          for (let col = 0; col < 3; col++) {
            const cell = $createTableCellNode(TableCellHeaderStates.ROW);
            const paragraph = $createParagraphNode();
            paragraph.append($createTextNode(`Header ${col + 1}`));
            cell.append(paragraph);
            headerRow.append(cell);
          }
          table.append(headerRow);

          // Data rows
          for (let row = 0; row < 2; row++) {
            const tableRow = $createTableRowNode();
            for (let col = 0; col < 3; col++) {
              const cell = $createTableCellNode(TableCellHeaderStates.NO_STATUS);
              const paragraph = $createParagraphNode();
              paragraph.append($createTextNode(''));
              cell.append(paragraph);
              tableRow.append(cell);
            }
            table.append(tableRow);
          }

          selection.insertNodes([table]);
        }
      });
    },
  },
];

export function SlashMenu({ isOpen, position, query, onClose }: SlashMenuProps) {
  const [editor] = useLexicalComposerContext();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const listRef = useRef<HTMLUListElement>(null);

  const filteredOptions = useMemo(() => {
    if (!query) return BLOCK_OPTIONS;

    const lowerQuery = query.toLowerCase();

    // Filter and score options
    const scored = BLOCK_OPTIONS
      .map((option) => {
        const labelLower = option.label.toLowerCase();
        let score = 0;

        // Exact label match gets highest score
        if (labelLower === lowerQuery) {
          score = 100;
        }
        // Label starts with query
        else if (labelLower.startsWith(lowerQuery)) {
          score = 80;
        }
        // Label contains query
        else if (labelLower.includes(lowerQuery)) {
          score = 60;
        }
        // Keyword starts with query
        else if (option.keywords.some((kw) => kw.startsWith(lowerQuery))) {
          score = 40;
        }
        // Keyword contains query
        else if (option.keywords.some((kw) => kw.includes(lowerQuery))) {
          score = 20;
        }

        return { option, score };
      })
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score);

    return scored.map(({ option }) => option);
  }, [query]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current && isOpen) {
      const selectedItem = listRef.current.children[selectedIndex] as HTMLElement;
      if (selectedItem) {
        selectedItem.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex, isOpen]);

  const handleSelect = useCallback(
    (option: BlockOption) => {
      // Remove the slash and query text before inserting
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          const anchor = selection.anchor;
          const anchorNode = anchor.getNode();

          if (anchorNode instanceof TextNode) {
            const text = anchorNode.getTextContent();
            const slashIndex = text.lastIndexOf('/');

            if (slashIndex >= 0) {
              // Remove the "/" and query text
              const before = text.substring(0, slashIndex);
              anchorNode.setTextContent(before);
            }
          }
        }
      });

      option.onSelect(editor);
      onClose();
    },
    [editor, onClose]
  );

  // Handle keyboard navigation with native events (capture phase to intercept before Lexical)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          event.stopPropagation();
          setSelectedIndex((prev) =>
            prev < filteredOptions.length - 1 ? prev + 1 : prev
          );
          break;
        case 'ArrowUp':
          event.preventDefault();
          event.stopPropagation();
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
          break;
        case 'Enter':
          event.preventDefault();
          event.stopPropagation();
          if (filteredOptions[selectedIndex]) {
            handleSelect(filteredOptions[selectedIndex]);
          }
          break;
        case 'Escape':
          event.preventDefault();
          event.stopPropagation();
          onClose();
          break;
      }
    };

    // Use capture phase to intercept events before they reach Lexical
    document.addEventListener('keydown', handleKeyDown, true);

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [isOpen, filteredOptions, selectedIndex, handleSelect, onClose]);

  if (!isOpen || !position) return null;

  return (
    <div
      className="slash-menu"
      style={{
        position: 'fixed',
        top: position.top,
        left: position.left,
      }}
    >
      <div className="slash-menu-header">INSERT BLOCK</div>
      {filteredOptions.length === 0 ? (
        <div className="slash-menu-empty">No matching blocks</div>
      ) : (
        <ul className="slash-menu-list" role="listbox" ref={listRef}>
          {filteredOptions.map((option, index) => (
            <li
              key={option.key}
              role="option"
              aria-selected={index === selectedIndex}
              className={`slash-menu-item ${
                index === selectedIndex ? 'selected' : ''
              }`}
              onClick={() => handleSelect(option)}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <span className="slash-menu-icon">{option.icon}</span>
              <div className="slash-menu-content">
                <span className="slash-menu-label">{option.label}</span>
                <span className="slash-menu-description">
                  {option.description}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
