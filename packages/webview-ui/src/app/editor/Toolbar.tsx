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

export function Toolbar() {
  const [editor] = useLexicalComposerContext();
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isStrikethrough, setIsStrikethrough] = useState(false);
  const [isCode, setIsCode] = useState(false);
  const [isLink, setIsLink] = useState(false);
  const [showToolbar, setShowToolbar] = useState(false);
  const [toolbarPosition, setToolbarPosition] = useState({ top: 0, left: 0 });

  const updateToolbar = useCallback(() => {
    const selection = $getSelection();

    if (!$isRangeSelection(selection)) {
      setShowToolbar(false);
      return;
    }

    const isCollapsed = selection.isCollapsed();
    if (isCollapsed) {
      setShowToolbar(false);
      return;
    }

    // Get selection position
    const nativeSelection = window.getSelection();
    if (!nativeSelection || nativeSelection.rangeCount === 0) {
      setShowToolbar(false);
      return;
    }

    const range = nativeSelection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    setToolbarPosition({
      top: rect.top - 45,
      left: rect.left + rect.width / 2,
    });

    // Update format states
    setIsBold(selection.hasFormat('bold'));
    setIsItalic(selection.hasFormat('italic'));
    setIsStrikethrough(selection.hasFormat('strikethrough'));
    setIsCode(selection.hasFormat('code'));

    // Check for link
    const node = getSelectedNode(selection);
    const parent = node.getParent();
    setIsLink($isLinkNode(parent) || $isLinkNode(node));

    setShowToolbar(true);
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
    if (!isLink) {
      const url = prompt('Enter URL:');
      if (url) {
        editor.dispatchCommand(TOGGLE_LINK_COMMAND, url);
      }
    } else {
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
    }
  }, [editor, isLink]);

  if (!showToolbar) return null;

  return (
    <div
      className="toolbar"
      style={{
        position: 'fixed',
        top: toolbarPosition.top,
        left: toolbarPosition.left,
        transform: 'translateX(-50%)',
      }}
    >
      <button
        type="button"
        onClick={() => formatText('bold')}
        className={`toolbar-button ${isBold ? 'active' : ''}`}
        aria-label="Bold"
        title="Bold (Cmd+B)"
      >
        <strong>B</strong>
      </button>
      <button
        type="button"
        onClick={() => formatText('italic')}
        className={`toolbar-button ${isItalic ? 'active' : ''}`}
        aria-label="Italic"
        title="Italic (Cmd+I)"
      >
        <em>I</em>
      </button>
      <button
        type="button"
        onClick={() => formatText('strikethrough')}
        className={`toolbar-button ${isStrikethrough ? 'active' : ''}`}
        aria-label="Strikethrough"
        title="Strikethrough"
      >
        <s>S</s>
      </button>
      <button
        type="button"
        onClick={() => formatText('code')}
        className={`toolbar-button ${isCode ? 'active' : ''}`}
        aria-label="Code"
        title="Inline Code (Cmd+E)"
      >
        {'</>'}
      </button>
      <div className="toolbar-divider" />
      <button
        type="button"
        onClick={insertLink}
        className={`toolbar-button ${isLink ? 'active' : ''}`}
        aria-label="Link"
        title="Link (Cmd+K)"
      >
        🔗
      </button>
    </div>
  );
}
