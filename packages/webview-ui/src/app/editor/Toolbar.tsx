import { useCallback, useEffect, useState, useRef } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $getSelection,
  $isRangeSelection,
  FORMAT_TEXT_COMMAND,
  SELECTION_CHANGE_COMMAND,
  COMMAND_PRIORITY_CRITICAL,
  COMMAND_PRIORITY_LOW,
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
  showLinkInput: boolean;
  linkUrl: string;
}

const initialToolbarState: ToolbarState = {
  isVisible: false,
  isBold: false,
  isItalic: false,
  isStrikethrough: false,
  isCode: false,
  isLink: false,
  position: { top: 0, left: 0 },
  showLinkInput: false,
  linkUrl: '',
};

export function Toolbar() {
  const [editor] = useLexicalComposerContext();
  const [state, setState] = useState<ToolbarState>(initialToolbarState);
  const linkInputRef = useRef<HTMLInputElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const dismissedByClickRef = useRef(false);

  const updateToolbar = useCallback(() => {
    // Don't show toolbar if it was just dismissed by clicking outside
    if (dismissedByClickRef.current) {
      return;
    }

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
    setState(prev => ({
      ...prev,
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
    }));
  }, []);

  useEffect(() => {
    const unregisterSelection = editor.registerCommand(
      SELECTION_CHANGE_COMMAND,
      () => {
        editor.getEditorState().read(() => {
          updateToolbar();
        });
        return false;
      },
      COMMAND_PRIORITY_CRITICAL
    );

    // Also listen for format changes to update button states
    const unregisterFormat = editor.registerCommand(
      FORMAT_TEXT_COMMAND,
      () => {
        // Defer the update to run after the format is applied
        setTimeout(() => {
          editor.getEditorState().read(() => {
            updateToolbar();
          });
        }, 0);
        return false;
      },
      COMMAND_PRIORITY_LOW
    );

    return () => {
      unregisterSelection();
      unregisterFormat();
    };
  }, [editor, updateToolbar]);

  // Dismiss toolbar immediately on mousedown outside
  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      // If toolbar is not visible, nothing to do
      if (!state.isVisible) return;

      // If click is inside the toolbar, don't dismiss
      if (toolbarRef.current && toolbarRef.current.contains(e.target as Node)) {
        return;
      }

      // Set flag to prevent selection change from re-showing toolbar
      dismissedByClickRef.current = true;

      // Dismiss immediately
      setState(prev => ({ ...prev, isVisible: false, showLinkInput: false }));

      // Reset flag after selection events have settled
      setTimeout(() => {
        dismissedByClickRef.current = false;
      }, 100);
    };

    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [state.isVisible]);

  const formatText = useCallback(
    (format: TextFormatType) => {
      editor.dispatchCommand(FORMAT_TEXT_COMMAND, format);
    },
    [editor]
  );

  const openLinkInput = useCallback(() => {
    if (state.isLink) {
      // Remove link
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
    } else {
      // Show link input
      setState(prev => ({ ...prev, showLinkInput: true, linkUrl: '' }));
      // Focus the input after it renders
      setTimeout(() => linkInputRef.current?.focus(), 0);
    }
  }, [editor, state.isLink]);

  const submitLink = useCallback(() => {
    if (state.linkUrl) {
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, state.linkUrl);
    }
    setState(prev => ({ ...prev, showLinkInput: false, linkUrl: '' }));
  }, [editor, state.linkUrl]);

  const cancelLink = useCallback(() => {
    setState(prev => ({ ...prev, showLinkInput: false, linkUrl: '' }));
  }, []);

  if (!state.isVisible) return null;

  return (
    <div
      ref={toolbarRef}
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
        onMouseDown={(e) => {
          e.preventDefault();
          formatText('bold');
        }}
        className={`toolbar-button ${state.isBold ? 'active' : ''}`}
        aria-label="Bold"
        title="Bold (Cmd+B)"
      >
        <strong>B</strong>
      </button>
      <button
        type="button"
        onMouseDown={(e) => {
          e.preventDefault();
          formatText('italic');
        }}
        className={`toolbar-button ${state.isItalic ? 'active' : ''}`}
        aria-label="Italic"
        title="Italic (Cmd+I)"
      >
        <em>I</em>
      </button>
      <button
        type="button"
        onMouseDown={(e) => {
          e.preventDefault();
          formatText('strikethrough');
        }}
        className={`toolbar-button ${state.isStrikethrough ? 'active' : ''}`}
        aria-label="Strikethrough"
        title="Strikethrough"
      >
        <s>S</s>
      </button>
      <button
        type="button"
        onMouseDown={(e) => {
          e.preventDefault();
          formatText('code');
        }}
        className={`toolbar-button ${state.isCode ? 'active' : ''}`}
        aria-label="Code"
        title="Inline Code (Cmd+E)"
      >
        {'</>'}
      </button>
      <div className="toolbar-divider" />
      <button
        type="button"
        onMouseDown={(e) => {
          e.preventDefault();
          openLinkInput();
        }}
        className={`toolbar-button ${state.isLink ? 'active' : ''}`}
        aria-label="Link"
        title="Link (Cmd+K)"
      >
        🔗
      </button>
      {state.showLinkInput && (
        <div className="toolbar-link-input">
          <input
            ref={linkInputRef}
            type="text"
            placeholder="Enter URL..."
            value={state.linkUrl}
            onChange={(e) => setState(prev => ({ ...prev, linkUrl: e.target.value }))}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                submitLink();
              } else if (e.key === 'Escape') {
                e.preventDefault();
                cancelLink();
              }
            }}
            onBlur={cancelLink}
          />
        </div>
      )}
    </div>
  );
}
