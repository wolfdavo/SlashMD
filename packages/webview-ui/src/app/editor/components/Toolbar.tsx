import { useCallback, useEffect, useState, useRef } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $getSelection,
  $isRangeSelection,
  FORMAT_TEXT_COMMAND,
  SELECTION_CHANGE_COMMAND,
  COMMAND_PRIORITY_CRITICAL,
  COMMAND_PRIORITY_LOW,
  TextFormatType,
} from "lexical";
import { $isLinkNode, TOGGLE_LINK_COMMAND } from "@lexical/link";
import { getSelectedNode } from "../utils";
import { openUrl } from "../../../messaging";

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

interface LinkPopupState {
  visible: boolean;
  url: string;
  editUrl: string;
  isEditing: boolean;
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
  showLinkInput: false,
  linkUrl: "",
};

const initialLinkPopup: LinkPopupState = {
  visible: false,
  url: "",
  editUrl: "",
  isEditing: false,
  position: { top: 0, left: 0 },
};

export function Toolbar() {
  const [editor] = useLexicalComposerContext();
  const [state, setState] = useState<ToolbarState>(initialToolbarState);
  const [linkPopup, setLinkPopup] = useState<LinkPopupState>(initialLinkPopup);
  const linkInputRef = useRef<HTMLInputElement>(null);
  const popupInputRef = useRef<HTMLInputElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const dismissedByClickRef = useRef(false);

  // Only manages the formatting toolbar — link popup is click-driven, not selection-driven
  const updateToolbar = useCallback(() => {
    if (dismissedByClickRef.current) return;

    const selection = $getSelection();

    if (!$isRangeSelection(selection) || selection.isCollapsed()) {
      setState((prev) =>
        prev.isVisible ? { ...prev, isVisible: false } : prev,
      );
      return;
    }

    const nativeSelection = window.getSelection();
    if (!nativeSelection || nativeSelection.rangeCount === 0) {
      setState((prev) =>
        prev.isVisible ? { ...prev, isVisible: false } : prev,
      );
      return;
    }

    const node = getSelectedNode(selection);
    const parent = node.getParent();
    const isLink = $isLinkNode(parent) || $isLinkNode(node);

    const range = nativeSelection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    setState((prev) => ({
      ...prev,
      isVisible: true,
      isBold: selection.hasFormat("bold"),
      isItalic: selection.hasFormat("italic"),
      isStrikethrough: selection.hasFormat("strikethrough"),
      isCode: selection.hasFormat("code"),
      isLink,
      position: { top: rect.top - 45, left: rect.left + rect.width / 2 },
    }));
  }, []);

  useEffect(() => {
    const unregisterSelection = editor.registerCommand(
      SELECTION_CHANGE_COMMAND,
      () => {
        editor.getEditorState().read(() => updateToolbar());
        return false;
      },
      COMMAND_PRIORITY_CRITICAL,
    );

    const unregisterFormat = editor.registerCommand(
      FORMAT_TEXT_COMMAND,
      () => {
        setTimeout(
          () => editor.getEditorState().read(() => updateToolbar()),
          0,
        );
        return false;
      },
      COMMAND_PRIORITY_LOW,
    );

    return () => {
      unregisterSelection();
      unregisterFormat();
    };
  }, [editor, updateToolbar]);

  // Intercept clicks on links inside the editor — prevent navigation, show popup instead
  useEffect(() => {
    const root = editor.getRootElement();
    if (!root) return;

    const handleLinkClick = (e: MouseEvent) => {
      const target = e.target as Element;
      const linkEl = target.closest("a");
      if (!linkEl) return;

      e.preventDefault();
      e.stopPropagation();

      const rect = linkEl.getBoundingClientRect();
      const url = linkEl.getAttribute("href") ?? "";
      setLinkPopup({
        visible: true,
        url,
        editUrl: url,
        isEditing: false,
        position: { top: rect.bottom + 6, left: rect.left + rect.width / 2 },
      });
    };

    root.addEventListener("click", handleLinkClick);
    return () => root.removeEventListener("click", handleLinkClick);
  }, [editor]);

  // Dismiss toolbar and popup on mousedown outside
  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      const target = e.target as Node;
      const inToolbar = toolbarRef.current?.contains(target);
      const inPopup = popupRef.current?.contains(target);

      if (!inToolbar && !inPopup) {
        dismissedByClickRef.current = true;
        setState((prev) => ({
          ...prev,
          isVisible: false,
          showLinkInput: false,
        }));
        setLinkPopup(initialLinkPopup);
        setTimeout(() => {
          dismissedByClickRef.current = false;
        }, 100);
      }
    };

    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, []);

  const formatText = useCallback(
    (format: TextFormatType) => {
      editor.dispatchCommand(FORMAT_TEXT_COMMAND, format);
    },
    [editor],
  );

  const submitLink = useCallback(() => {
    if (state.linkUrl) {
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, state.linkUrl);
    }
    setState((prev) => ({ ...prev, showLinkInput: false, linkUrl: "" }));
  }, [editor, state.linkUrl]);

  const cancelLink = useCallback(() => {
    setState((prev) => ({ ...prev, showLinkInput: false, linkUrl: "" }));
  }, []);

  const startEditingPopup = useCallback(() => {
    setLinkPopup((prev) => ({ ...prev, isEditing: true, editUrl: prev.url }));
    setTimeout(() => popupInputRef.current?.focus(), 0);
  }, []);

  const savePopupLink = useCallback(() => {
    editor.dispatchCommand(TOGGLE_LINK_COMMAND, linkPopup.editUrl || null);
    setLinkPopup(initialLinkPopup);
  }, [editor, linkPopup.editUrl]);

  const removePopupLink = useCallback(() => {
    editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
    setLinkPopup(initialLinkPopup);
  }, [editor]);

  return (
    <>
      {/* Formatting toolbar (shown on non-collapsed text selection) */}
      {state.isVisible && (
        <div
          ref={toolbarRef}
          className="toolbar"
          style={{
            position: "fixed",
            top: state.position.top,
            left: state.position.left,
            transform: "translateX(-50%)",
          }}
        >
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              formatText("bold");
            }}
            className={`toolbar-button ${state.isBold ? "active" : ""}`}
            title="Bold (Cmd+B)"
          >
            <strong>B</strong>
          </button>
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              formatText("italic");
            }}
            className={`toolbar-button ${state.isItalic ? "active" : ""}`}
            title="Italic (Cmd+I)"
          >
            <em>I</em>
          </button>
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              formatText("strikethrough");
            }}
            className={`toolbar-button ${state.isStrikethrough ? "active" : ""}`}
            title="Strikethrough"
          >
            <s>S</s>
          </button>
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              formatText("code");
            }}
            className={`toolbar-button ${state.isCode ? "active" : ""}`}
            title="Inline Code (Cmd+E)"
          >
            {"</>"}
          </button>

          {state.showLinkInput && (
            <div className="toolbar-link-input">
              <input
                ref={linkInputRef}
                type="text"
                placeholder="Enter URL..."
                value={state.linkUrl}
                onChange={(e) =>
                  setState((prev) => ({ ...prev, linkUrl: e.target.value }))
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    submitLink();
                  } else if (e.key === "Escape") {
                    e.preventDefault();
                    cancelLink();
                  }
                }}
                onBlur={cancelLink}
              />
            </div>
          )}
        </div>
      )}

      {/* Link popup (shown when clicking a link in the editor) */}
      {linkPopup.visible && (
        <div
          ref={popupRef}
          className="link-popup"
          style={{
            position: "fixed",
            top: linkPopup.position.top,
            left: linkPopup.position.left,
            transform: "translateX(-50%)",
          }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {linkPopup.isEditing ? (
            <>
              <input
                ref={popupInputRef}
                className="link-popup-input"
                type="text"
                value={linkPopup.editUrl}
                onChange={(e) =>
                  setLinkPopup((prev) => ({ ...prev, editUrl: e.target.value }))
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    savePopupLink();
                  } else if (e.key === "Escape") {
                    e.preventDefault();
                    setLinkPopup((prev) => ({ ...prev, isEditing: false }));
                  }
                }}
              />
              <button
                type="button"
                className="link-popup-button"
                onClick={savePopupLink}
              >
                Save
              </button>
            </>
          ) : (
            <>
              <span
                className="link-popup-url"
                title={linkPopup.url}
                onClick={() => openUrl(linkPopup.url)}
              >
                {linkPopup.url.length > 40
                  ? linkPopup.url.slice(0, 40) + "…"
                  : linkPopup.url}
              </span>
              <div className="toolbar-divider" />
              <button
                type="button"
                className="link-popup-button"
                onClick={startEditingPopup}
                title="Edit link"
              >
                ✏️
              </button>
              <button
                type="button"
                className="link-popup-button"
                onClick={removePopupLink}
                title="Remove link"
              >
                🗑️
              </button>
            </>
          )}
        </div>
      )}
    </>
  );
}
