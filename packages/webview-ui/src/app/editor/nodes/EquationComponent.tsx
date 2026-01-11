/**
 * EquationComponent - React component for rendering and editing LaTeX equations
 * Ported from Lexical playground with modifications for SlashMD
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
import { useCallback, useEffect, useRef, useState, ChangeEvent, forwardRef, RefObject } from 'react';
import katex from 'katex';
// Import KaTeX CSS as a string for injection into Shadow DOM (uses raw-css-loader plugin)
// @ts-ignore - esbuild plugin handles this
import katexCss from 'katex/dist/katex.min.css?raw';
import { $isEquationNode } from './EquationNode';

// KaTeX Renderer component using Shadow DOM for style isolation
function KatexRenderer({
  equation,
  inline,
  onDoubleClick,
}: {
  equation: string;
  inline: boolean;
  onDoubleClick: () => void;
}): JSX.Element {
  const containerRef = useRef<HTMLSpanElement>(null);
  const shadowRootRef = useRef<ShadowRoot | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (container === null) return;

    // Create shadow root if it doesn't exist
    if (!shadowRootRef.current) {
      shadowRootRef.current = container.attachShadow({ mode: 'open' });
      
      // Inject KaTeX CSS into shadow DOM with custom overrides
      const style = document.createElement('style');
      style.textContent = katexCss + `
        /* Custom overrides for SlashMD */
        :host {
          display: block;
        }
        :host(.block) .katex-render-target {
          display: block;
          text-align: center;
        }
        :host(.inline) .katex-render-target {
          display: inline;
        }
        .katex-display {
          margin: 0;
        }
      `;
      shadowRootRef.current.appendChild(style);
    }

    const shadowRoot = shadowRootRef.current;
    
    // Find or create the render target
    let renderTarget = shadowRoot.querySelector('.katex-render-target');
    if (!renderTarget) {
      renderTarget = document.createElement('span');
      renderTarget.className = 'katex-render-target';
      shadowRoot.appendChild(renderTarget);
    }

    // Render the equation
    try {
      katex.render(equation, renderTarget as HTMLElement, {
        displayMode: !inline,
        errorColor: '#cc0000',
        output: 'html',
        strict: 'warn',
        throwOnError: false,
        trust: false,
      });
    } catch (e) {
      // KaTeX will handle the error display
    }
  }, [equation, inline]);

  return (
    <span
      role="button"
      tabIndex={-1}
      onDoubleClick={onDoubleClick}
      ref={containerRef}
      className={`equation-renderer ${inline ? 'inline' : 'block'}`}
      style={{ display: inline ? 'inline' : 'block', textAlign: inline ? 'inherit' : 'center' }}
    />
  );
}

// Equation Editor component
interface EquationEditorProps {
  equation: string;
  inline: boolean;
  setEquation: (equation: string) => void;
}

const EquationEditor = forwardRef<HTMLInputElement | HTMLTextAreaElement, EquationEditorProps>(
  function EquationEditor({ equation, setEquation, inline }, forwardedRef) {
    const onChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setEquation(event.target.value);
    };

    if (inline) {
      return (
        <span className="equation-editor-background">
          <span className="equation-dollar-sign">$</span>
          <input
            className="equation-inline-editor"
            value={equation}
            onChange={onChange}
            autoFocus={true}
            ref={forwardedRef as RefObject<HTMLInputElement>}
          />
          <span className="equation-dollar-sign">$</span>
        </span>
      );
    }

    return (
      <div className="equation-editor-background">
        <span className="equation-dollar-sign">{'$$'}</span>
        <textarea
          className="equation-block-editor"
          value={equation}
          onChange={onChange}
          autoFocus={true}
          ref={forwardedRef as RefObject<HTMLTextAreaElement>}
        />
        <span className="equation-dollar-sign">{'$$'}</span>
      </div>
    );
  }
);

// Main EquationComponent
interface EquationComponentProps {
  equation: string;
  inline: boolean;
  nodeKey: NodeKey;
}

export default function EquationComponent({
  equation,
  inline,
  nodeKey,
}: EquationComponentProps): JSX.Element {
  const [editor] = useLexicalComposerContext();
  const [isEditable, setIsEditable] = useState(() => editor.isEditable());
  const [equationValue, setEquationValue] = useState(equation);
  const [showEquationEditor, setShowEquationEditor] = useState<boolean>(false);
  const inputRef = useRef<HTMLTextAreaElement | HTMLInputElement>(null);

  // Listen for editable changes
  useEffect(() => {
    return editor.registerEditableListener((editable) => {
      setIsEditable(editable);
    });
  }, [editor]);

  const onHide = useCallback(
    (restoreSelection?: boolean) => {
      setShowEquationEditor(false);
      editor.update(() => {
        const node = $getNodeByKey(nodeKey);
        if ($isEquationNode(node)) {
          node.setEquation(equationValue);
          if (restoreSelection) {
            node.selectNext(0, 0);
          }
        }
      });
    },
    [editor, equationValue, nodeKey],
  );

  useEffect(() => {
    if (!showEquationEditor && equationValue !== equation) {
      setEquationValue(equation);
    }
  }, [showEquationEditor, equation, equationValue]);

  useEffect(() => {
    if (!isEditable) {
      return;
    }
    if (showEquationEditor) {
      return mergeRegister(
        editor.registerCommand(
          SELECTION_CHANGE_COMMAND,
          () => {
            const activeElement = document.activeElement;
            const inputElem = inputRef.current;
            if (inputElem !== activeElement) {
              onHide();
            }
            return false;
          },
          COMMAND_PRIORITY_HIGH,
        ),
        editor.registerCommand(
          KEY_ESCAPE_COMMAND,
          () => {
            const activeElement = document.activeElement;
            const inputElem = inputRef.current;
            if (inputElem === activeElement) {
              onHide(true);
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
          setShowEquationEditor(true);
        }
      });
    }
  }, [editor, nodeKey, onHide, showEquationEditor, isEditable]);

  if (showEquationEditor && isEditable) {
    return (
      <EquationEditor
        equation={equationValue}
        setEquation={setEquationValue}
        inline={inline}
        ref={inputRef}
      />
    );
  }

  return (
    <KatexRenderer
      equation={equationValue}
      inline={inline}
      onDoubleClick={() => {
        if (isEditable) {
          setShowEquationEditor(true);
        }
      }}
    />
  );
}
