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
import { $isEquationNode } from './EquationNode';

// KaTeX Renderer component
function KatexRenderer({
  equation,
  inline,
  onDoubleClick,
}: {
  equation: string;
  inline: boolean;
  onDoubleClick: () => void;
}): JSX.Element {
  const katexElementRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const katexElement = katexElementRef.current;
    if (katexElement !== null) {
      try {
        katex.render(equation, katexElement, {
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
    }
  }, [equation, inline]);

  return (
    <span
      role="button"
      tabIndex={-1}
      onDoubleClick={onDoubleClick}
      ref={katexElementRef}
      className={`equation-renderer ${inline ? 'inline' : 'block'}`}
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
