/**
 * MermaidComponent - React component for rendering and editing Mermaid diagrams
 * Uses Shadow DOM for style isolation
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
import { useCallback, useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { $isMermaidNode } from './MermaidNode';

// Initialize mermaid with default config
mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  securityLevel: 'strict',
  fontFamily: 'inherit',
});

// Mermaid Renderer component using Shadow DOM
function MermaidRenderer({
  code,
  onDoubleClick,
}: {
  code: string;
  onDoubleClick: () => void;
}): JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null);
  const shadowRootRef = useRef<ShadowRoot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const renderIdRef = useRef(0);

  useEffect(() => {
    const container = containerRef.current;
    if (container === null) return;

    // Create shadow root if it doesn't exist
    if (!shadowRootRef.current) {
      shadowRootRef.current = container.attachShadow({ mode: 'open' });
      
      // Add basic styles for the shadow DOM
      const style = document.createElement('style');
      style.textContent = `
        :host {
          display: block;
          width: 100%;
        }
        .mermaid-container {
          display: flex;
          justify-content: center;
          padding: 1rem;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 8px;
          overflow-x: auto;
        }
        .mermaid-container svg {
          max-width: 100%;
          height: auto;
        }
        .mermaid-error {
          color: #ff6b6b;
          padding: 1rem;
          font-family: monospace;
          white-space: pre-wrap;
        }
      `;
      shadowRootRef.current.appendChild(style);
    }

    const shadowRoot = shadowRootRef.current;
    
    // Clear previous content (except style)
    const existingContainer = shadowRoot.querySelector('.mermaid-container, .mermaid-error');
    if (existingContainer) {
      existingContainer.remove();
    }

    // Render the diagram
    const renderDiagram = async () => {
      const currentRenderId = ++renderIdRef.current;
      
      try {
        setError(null);
        
        // Validate syntax first
        await mermaid.parse(code);
        
        // Check if this render is still current
        if (currentRenderId !== renderIdRef.current) return;
        
        // Generate unique ID for this render
        const id = `mermaid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        // Render the diagram
        const { svg } = await mermaid.render(id, code);
        
        // Check again if this render is still current
        if (currentRenderId !== renderIdRef.current) return;
        
        // Create container and add SVG
        const renderContainer = document.createElement('div');
        renderContainer.className = 'mermaid-container';
        renderContainer.innerHTML = svg;
        shadowRoot.appendChild(renderContainer);
      } catch (e) {
        if (currentRenderId !== renderIdRef.current) return;
        
        const errorMessage = e instanceof Error ? e.message : 'Failed to render diagram';
        setError(errorMessage);
        
        // Show error in shadow DOM
        const errorContainer = document.createElement('div');
        errorContainer.className = 'mermaid-error';
        errorContainer.textContent = `Mermaid Error: ${errorMessage}`;
        shadowRoot.appendChild(errorContainer);
      }
    };

    renderDiagram();
  }, [code]);

  return (
    <div
      role="button"
      tabIndex={-1}
      onDoubleClick={onDoubleClick}
      ref={containerRef}
      className="mermaid-renderer"
      style={{ 
        display: 'block',
        cursor: 'pointer',
        minHeight: '100px',
      }}
    />
  );
}

// Mermaid Editor component
function MermaidEditor({
  code,
  setCode,
  onClose,
}: {
  code: string;
  setCode: (code: string) => void;
  onClose: () => void;
}): JSX.Element {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // Focus textarea on mount
    textareaRef.current?.focus();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  return (
    <div className="mermaid-editor-container">
      <div className="mermaid-editor-header">
        <span className="mermaid-editor-label">```mermaid</span>
        <button 
          className="mermaid-editor-close" 
          onClick={onClose}
          title="Close editor (Esc)"
        >
          ✕
        </button>
      </div>
      <textarea
        ref={textareaRef}
        className="mermaid-editor-textarea"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Enter Mermaid diagram code..."
        spellCheck={false}
      />
      <div className="mermaid-editor-footer">
        <span className="mermaid-editor-label">```</span>
      </div>
    </div>
  );
}

// Main MermaidComponent
interface MermaidComponentProps {
  code: string;
  nodeKey: NodeKey;
}

export default function MermaidComponent({
  code,
  nodeKey,
}: MermaidComponentProps): JSX.Element {
  const [editor] = useLexicalComposerContext();
  const [isEditable, setIsEditable] = useState(() => editor.isEditable());
  const [codeValue, setCodeValue] = useState(code);
  const [showEditor, setShowEditor] = useState<boolean>(false);

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
      if ($isMermaidNode(node)) {
        node.setCode(codeValue);
      }
    });
  }, [editor, codeValue, nodeKey]);

  useEffect(() => {
    if (!showEditor && codeValue !== code) {
      setCodeValue(code);
    }
  }, [showEditor, code, codeValue]);

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
      <MermaidEditor
        code={codeValue}
        setCode={setCodeValue}
        onClose={onHide}
      />
    );
  }

  return (
    <MermaidRenderer
      code={codeValue}
      onDoubleClick={() => {
        if (isEditable) {
          setShowEditor(true);
        }
      }}
    />
  );
}
