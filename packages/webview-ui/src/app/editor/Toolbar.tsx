import { useCallback, useEffect, useState } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $getSelection,
  $isRangeSelection,
  FORMAT_TEXT_COMMAND,
  SELECTION_CHANGE_COMMAND,
  COMMAND_PRIORITY_CRITICAL,
  TextFormatType,
} from 'lexical';
import { $isLinkNode, TOGGLE_LINK_COMMAND } from '@lexical/link';
import { getSelectedNode } from './utils';

// Consolidated toolbar state to batch updates
interface ToolbarState {
  isVisible: boolean;
  isBold: boolean;
  isItalic: boolean;
  isStrikethrough: boolean;
  isCode: boolean;
  isLink: boolean;
  position: { top: number; left: number };
}

const initialToolbarState: ToolbarState = {
  isVisible: false,
  isBold: false,
  isItalic: false,
  isStrikethrough: false,
  isCode: false,
  isLink: false,
  position: { top: 0, left: 0 },
};

export function Toolbar() {
  const [editor] = useLexicalComposerContext();
  const [state, setState] = useState<ToolbarState>(initialToolbarState);

  const updateToolbar = useCallback(() => {
    const selection = $getSelection();

    if (!$isRangeSelection(selection)) {
      setState(prev => prev.isVisible ? { ...prev, isVisible: false } : prev);
      return;
    }

    const isCollapsed = selection.isCollapsed();
    if (isCollapsed) {
      setState(prev => prev.isVisible ? { ...prev, isVisible: false } : prev);
      return;
    }

    // Get selection position
    const nativeSelection = window.getSelection();
    if (!nativeSelection || nativeSelection.rangeCount === 0) {
      setState(prev => prev.isVisible ? { ...prev, isVisible: false } : prev);
      return;
    }

    const range = nativeSelection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    // Check for link
    const node = getSelectedNode(selection);
    const parent = node.getParent();
    const isLink = $isLinkNode(parent) || $isLinkNode(node);

    // Batch all state updates into a single setState call
    setState({
      isVisible: true,
      isBold: selection.hasFormat('bold'),
      isItalic: selection.hasFormat('italic'),
      isStrikethrough: selection.hasFormat('strikethrough'),
      isCode: selection.hasFormat('code'),
      isLink,
      position: {
        top: rect.top - 45,
        left: rect.left + rect.width / 2,
      },
    });
  }, []);

  useEffect(() => {
    return editor.registerCommand(
      SELECTION_CHANGE_COMMAND,
      () => {
        updateToolbar();
        return false;
      },
      COMMAND_PRIORITY_CRITICAL
    );
  }, [editor, updateToolbar]);

  const formatText = useCallback(
    (format: TextFormatType) => {
      editor.dispatchCommand(FORMAT_TEXT_COMMAND, format);
    },
    [editor]
  );

  const insertLink = useCallback(() => {
    if (!state.isLink) {
      const url = prompt('Enter URL:');
      if (url) {
        editor.dispatchCommand(TOGGLE_LINK_COMMAND, url);
      }
    } else {
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
    }
  }, [editor, state.isLink]);

  if (!state.isVisible) return null;

  return (
    <div
      className="toolbar"
      style={{
        position: 'fixed',
        top: state.position.top,
        left: state.position.left,
        transform: 'translateX(-50%)',
      }}
    >
      <button
        type="button"
        onClick={() => formatText('bold')}
        className={`toolbar-button ${state.isBold ? 'active' : ''}`}
        aria-label="Bold"
        title="Bold (Cmd+B)"
      >
        <strong>B</strong>
      </button>
      <button
        type="button"
        onClick={() => formatText('italic')}
        className={`toolbar-button ${state.isItalic ? 'active' : ''}`}
        aria-label="Italic"
        title="Italic (Cmd+I)"
      >
        <em>I</em>
      </button>
      <button
        type="button"
        onClick={() => formatText('strikethrough')}
        className={`toolbar-button ${state.isStrikethrough ? 'active' : ''}`}
        aria-label="Strikethrough"
        title="Strikethrough"
      >
        <s>S</s>
      </button>
      <button
        type="button"
        onClick={() => formatText('code')}
        className={`toolbar-button ${state.isCode ? 'active' : ''}`}
        aria-label="Code"
        title="Inline Code (Cmd+E)"
      >
        {'</>'}
      </button>
      <div className="toolbar-divider" />
      <button
        type="button"
        onClick={insertLink}
        className={`toolbar-button ${state.isLink ? 'active' : ''}`}
        aria-label="Link"
        title="Link (Cmd+K)"
      >
        🔗
      </button>
    </div>
  );
}
