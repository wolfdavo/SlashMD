import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $createParagraphNode,
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_LOW,
  KEY_ARROW_DOWN_COMMAND,
  KEY_ARROW_UP_COMMAND,
  KEY_ENTER_COMMAND,
  KEY_ESCAPE_COMMAND,
  TextNode,
} from 'lexical';
import { $createHeadingNode, $createQuoteNode } from '@lexical/rich-text';
import { $createListNode, $createListItemNode } from '@lexical/list';
import { $createCodeNode } from '@lexical/code';
import { $createHorizontalRuleNode, $createCalloutNode, $createToggleNode } from './nodes';

interface BlockOption {
  key: string;
  label: string;
  description: string;
  icon: string;
  keywords: string[];
  onSelect: () => void;
}

interface SlashMenuProps {
  isOpen: boolean;
  position: { top: number; left: number } | null;
  query: string;
  onClose: () => void;
}

export function SlashMenu({ isOpen, position, query, onClose }: SlashMenuProps) {
  const [editor] = useLexicalComposerContext();
  const [selectedIndex, setSelectedIndex] = useState(0);

  const blockOptions: BlockOption[] = useMemo(
    () => [
      {
        key: 'paragraph',
        label: 'Paragraph',
        description: 'Plain text',
        icon: '¶',
        keywords: ['text', 'plain', 'paragraph'],
        onSelect: () => {
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
        onSelect: () => {
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
        onSelect: () => {
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
        onSelect: () => {
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
        onSelect: () => {
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
        onSelect: () => {
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
        onSelect: () => {
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
        onSelect: () => {
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
        onSelect: () => {
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
        onSelect: () => {
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
        key: 'callout-note',
        label: 'Note',
        description: 'Info callout',
        icon: 'ℹ',
        keywords: ['note', 'info', 'callout', 'admonition'],
        onSelect: () => {
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
        onSelect: () => {
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
        onSelect: () => {
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
        onSelect: () => {
          editor.update(() => {
            const selection = $getSelection();
            if ($isRangeSelection(selection)) {
              const node = $createToggleNode('Toggle title', '', false);
              selection.insertNodes([node]);
            }
          });
        },
      },
    ],
    [editor]
  );

  const filteredOptions = useMemo(() => {
    if (!query) return blockOptions;

    const lowerQuery = query.toLowerCase();
    return blockOptions.filter(
      (option) =>
        option.label.toLowerCase().includes(lowerQuery) ||
        option.keywords.some((kw) => kw.includes(lowerQuery))
    );
  }, [blockOptions, query]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

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

      option.onSelect();
      onClose();
    },
    [editor, onClose]
  );

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const removeArrowDown = editor.registerCommand(
      KEY_ARROW_DOWN_COMMAND,
      () => {
        setSelectedIndex((prev) =>
          prev < filteredOptions.length - 1 ? prev + 1 : prev
        );
        return true;
      },
      COMMAND_PRIORITY_LOW
    );

    const removeArrowUp = editor.registerCommand(
      KEY_ARROW_UP_COMMAND,
      () => {
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
        return true;
      },
      COMMAND_PRIORITY_LOW
    );

    const removeEnter = editor.registerCommand(
      KEY_ENTER_COMMAND,
      () => {
        if (filteredOptions[selectedIndex]) {
          handleSelect(filteredOptions[selectedIndex]);
        }
        return true;
      },
      COMMAND_PRIORITY_LOW
    );

    const removeEscape = editor.registerCommand(
      KEY_ESCAPE_COMMAND,
      () => {
        onClose();
        return true;
      },
      COMMAND_PRIORITY_LOW
    );

    return () => {
      removeArrowDown();
      removeArrowUp();
      removeEnter();
      removeEscape();
    };
  }, [editor, isOpen, filteredOptions, selectedIndex, handleSelect, onClose]);

  if (!isOpen || !position) return null;

  return (
    <div
      className="slash-menu"
      style={{
        position: 'absolute',
        top: position.top,
        left: position.left,
      }}
    >
      <div className="slash-menu-header">Insert block</div>
      {filteredOptions.length === 0 ? (
        <div className="slash-menu-empty">No matching blocks</div>
      ) : (
        <ul className="slash-menu-list" role="listbox">
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
