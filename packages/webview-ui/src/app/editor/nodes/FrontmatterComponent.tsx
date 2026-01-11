/**
 * FrontmatterComponent - React component for rendering and editing YAML frontmatter
 * Displays as a code block with YAML syntax highlighting
 */

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { mergeRegister } from '@lexical/utils';
import {
  $getNodeByKey,
  $getSelection,
  $isNodeSelection,
  COMMAND_PRIORITY_HIGH,
  KEY_ESCAPE_COMMAND,
  NodeKey,
  SELECTION_CHANGE_COMMAND,
} from 'lexical';
import { useCallback, useEffect, useRef, useState, Component, ErrorInfo, ReactNode } from 'react';
import Prism from 'prismjs';
import 'prismjs/components/prism-yaml';
import { $isFrontmatterNode } from './FrontmatterNode';

// Error Boundary for catching render errors
interface ErrorBoundaryProps {
  children: ReactNode;
  fallback: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class FrontmatterErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('FrontmatterComponent Error:', error);
    console.error('Error Info:', errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

// Frontmatter Renderer component with YAML syntax highlighting
function FrontmatterRenderer({
  value,
  onDoubleClick,
}: {
  value: string;
  onDoubleClick: () => void;
}): JSX.Element {
  const codeRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (codeRef.current) {
      try {
        Prism.highlightElement(codeRef.current);
      } catch (e) {
        console.error('Prism highlight error:', e);
      }
    }
  }, [value]);

  return (
    <div 
      className="frontmatter-block"
      role="button"
      tabIndex={-1}
      onDoubleClick={onDoubleClick}
    >
      <div className="frontmatter-label">frontmatter</div>
      <pre className="frontmatter-pre">
        <code ref={codeRef} className="language-yaml">
          {value}
        </code>
      </pre>
    </div>
  );
}

// Frontmatter Editor component
function FrontmatterEditor({
  value,
  setValue,
  onClose,
}: {
  value: string;
  setValue: (value: string) => void;
  onClose: () => void;
}): JSX.Element {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // Focus textarea on mount
    textareaRef.current?.focus();
    // Move cursor to end
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.selectionStart = textarea.value.length;
      textarea.selectionEnd = textarea.value.length;
    }
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  return (
    <div className="frontmatter-editor-container">
      <div className="frontmatter-editor-header">
        <span className="frontmatter-editor-label">---</span>
        <span className="frontmatter-type-label">yaml</span>
        <button 
          className="frontmatter-editor-close" 
          onClick={onClose}
          title="Close editor (Esc)"
        >
          ✕
        </button>
      </div>
      <textarea
        ref={textareaRef}
        className="frontmatter-editor-textarea"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Enter YAML frontmatter..."
        spellCheck={false}
      />
      <div className="frontmatter-editor-footer">
        <span className="frontmatter-editor-label">---</span>
      </div>
    </div>
  );
}

// Main FrontmatterComponent
interface FrontmatterComponentProps {
  value: string;
  nodeKey: NodeKey;
}

export default function FrontmatterComponent({
  value,
  nodeKey,
}: FrontmatterComponentProps): JSX.Element {
  const [editor] = useLexicalComposerContext();
  const [isEditable, setIsEditable] = useState(() => editor.isEditable());
  const [currentValue, setCurrentValue] = useState(value || '');
  const [showEditor, setShowEditor] = useState<boolean>(false);
  
  // Guard against undefined value
  const safeValue = value || '';

  // Listen for editable changes
  useEffect(() => {
    return editor.registerEditableListener((editable) => {
      setIsEditable(editable);
    });
  }, [editor]);

  const onHide = useCallback(() => {
    setShowEditor(false);
    editor.update(() => {
      const node = $getNodeByKey(nodeKey);
      if ($isFrontmatterNode(node)) {
        node.setValue(currentValue);
      }
    });
  }, [editor, currentValue, nodeKey]);

  useEffect(() => {
    if (!showEditor && currentValue !== safeValue) {
      setCurrentValue(safeValue);
    }
  }, [showEditor, safeValue, currentValue]);

  useEffect(() => {
    if (!isEditable) {
      return;
    }
    if (showEditor) {
      return mergeRegister(
        editor.registerCommand(
          SELECTION_CHANGE_COMMAND,
          () => {
            // Don't close on selection change while editing
            return false;
          },
          COMMAND_PRIORITY_HIGH,
        ),
        editor.registerCommand(
          KEY_ESCAPE_COMMAND,
          () => {
            if (showEditor) {
              onHide();
              return true;
            }
            return false;
          },
          COMMAND_PRIORITY_HIGH,
        ),
      );
    } else {
      return editor.registerUpdateListener(({ editorState }) => {
        const isSelected = editorState.read(() => {
          const selection = $getSelection();
          return (
            $isNodeSelection(selection) &&
            selection.has(nodeKey) &&
            selection.getNodes().length === 1
          );
        });
        if (isSelected) {
          setShowEditor(true);
        }
      });
    }
  }, [editor, nodeKey, onHide, showEditor, isEditable]);

  if (showEditor && isEditable) {
    return (
      <FrontmatterEditor
        value={currentValue}
        setValue={setCurrentValue}
        onClose={onHide}
      />
    );
  }

  return (
    <FrontmatterRenderer
      value={currentValue}
      onDoubleClick={() => {
        if (isEditable) {
          setShowEditor(true);
        }
      }}
    />
  );
}
