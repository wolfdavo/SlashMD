import { useCallback, useEffect, useState, useRef } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getRoot, $getNodeByKey, $isElementNode, LexicalNode } from 'lexical';
import { $isCodeNode, CodeNode } from '@lexical/code';

// Popular languages for the dropdown
// Note: 'plain' is a valid Prism language that provides no syntax highlighting
const LANGUAGES = [
  { value: 'plain', label: 'Plain Text' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'jsx', label: 'JSX' },
  { value: 'tsx', label: 'TSX' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'c', label: 'C' },
  { value: 'cpp', label: 'C++' },
  { value: 'csharp', label: 'C#' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
  { value: 'ruby', label: 'Ruby' },
  { value: 'php', label: 'PHP' },
  { value: 'swift', label: 'Swift' },
  { value: 'kotlin', label: 'Kotlin' },
  { value: 'markup', label: 'HTML' },
  { value: 'css', label: 'CSS' },
  { value: 'scss', label: 'SCSS' },
  { value: 'json', label: 'JSON' },
  { value: 'yaml', label: 'YAML' },
  { value: 'markdown', label: 'Markdown' },
  { value: 'sql', label: 'SQL' },
  { value: 'bash', label: 'Bash' },
  { value: 'powershell', label: 'PowerShell' },
  { value: 'docker', label: 'Dockerfile' },
  { value: 'graphql', label: 'GraphQL' },
];

interface CodeBlockInfo {
  nodeKey: string;
  language: string;
  rect: DOMRect;
}

interface LanguageSelectorProps {
  nodeKey: string;
  currentLanguage: string;
  position: { top: number; right: number };
  onClose: () => void;
}

function LanguageSelector({ nodeKey, currentLanguage, position, onClose }: LanguageSelectorProps) {
  const [editor] = useLexicalComposerContext();
  const [searchQuery, setSearchQuery] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredLanguages = LANGUAGES.filter(
    (lang) =>
      lang.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lang.value.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const selectLanguage = useCallback(
    (language: string) => {
      // Set the language and wait for the update to complete before closing
      editor.update(
        () => {
          const node = $getNodeByKey(nodeKey);
          if (node && $isCodeNode(node)) {
            // Use 'plain' for Plain Text - it's a valid Prism language with no highlighting
            // This avoids Lexical's transform that resets undefined/null languages to 'javascript'
            node.setLanguage(language);
          }
        },
        {
          onUpdate: () => {
            // Close the selector after the update is committed
            onClose();
          },
        }
      );
    },
    [editor, nodeKey, onClose]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    },
    [onClose]
  );

  const handleItemClick = useCallback(
    (e: React.MouseEvent, language: string) => {
      e.preventDefault();
      e.stopPropagation();
      selectLanguage(language);
    },
    [selectLanguage]
  );

  // Normalize for comparison
  const normalizedCurrent = currentLanguage || 'plain';

  return (
    <div
      ref={menuRef}
      className="code-language-menu"
      style={{
        position: 'fixed',
        top: position.top,
        right: position.right,
      }}
    >
      <input
        ref={inputRef}
        type="text"
        className="code-language-search"
        placeholder="Search languages..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        onKeyDown={handleKeyDown}
      />
      <div className="code-language-list">
        {filteredLanguages.length === 0 ? (
          <div className="code-language-empty">No languages found</div>
        ) : (
          filteredLanguages.map((lang) => {
            const isCurrentLang = lang.value === normalizedCurrent;
            return (
              <div
                key={lang.value || 'plain-text'}
                className={`code-language-item ${isCurrentLang ? 'current' : ''}`}
                onMouseDown={(e) => handleItemClick(e, lang.value)}
              >
                {lang.label}
                {isCurrentLang && (
                  <span className="code-language-check">✓</span>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export function CodeBlockPlugin() {
  const [editor] = useLexicalComposerContext();
  const [codeBlocks, setCodeBlocks] = useState<CodeBlockInfo[]>([]);
  const [selectorState, setSelectorState] = useState<{
    nodeKey: string;
    language: string;
    position: { top: number; right: number };
  } | null>(null);

  // Track code blocks and their positions
  useEffect(() => {
    const updateCodeBlocks = () => {
      const editorElement = editor.getRootElement();
      if (!editorElement) return;

      editor.getEditorState().read(() => {
        const root = $getRoot();
        const blocks: CodeBlockInfo[] = [];

        // Recursively find all code nodes at any nesting level
        const findCodeNodes = (node: LexicalNode): CodeNode[] => {
          const codeNodes: CodeNode[] = [];
          if ($isCodeNode(node)) {
            codeNodes.push(node);
          }
          if ($isElementNode(node)) {
            for (const child of node.getChildren()) {
              codeNodes.push(...findCodeNodes(child));
            }
          }
          return codeNodes;
        };

        const codeNodes = findCodeNodes(root);

        codeNodes.forEach((node) => {
          // Use editor.getElementByKey to get the correct DOM element for this node
          const element = editor.getElementByKey(node.getKey());
          if (element) {
            const lang = node.getLanguage();
            blocks.push({
              nodeKey: node.getKey(),
              language: lang || '',
              rect: element.getBoundingClientRect(),
            });
          }
        });

        setCodeBlocks(blocks);
      });
    };

    const timeoutId = setTimeout(updateCodeBlocks, 200);

    const unsubscribe = editor.registerUpdateListener(({ editorState }) => {
      // Use the editorState from the update, not editor.getEditorState()
      requestAnimationFrame(() => {
        const editorElement = editor.getRootElement();
        if (!editorElement) return;

        editorState.read(() => {
          const root = $getRoot();
          const blocks: CodeBlockInfo[] = [];

          const findCodeNodes = (node: LexicalNode): CodeNode[] => {
            const codeNodes: CodeNode[] = [];
            if ($isCodeNode(node)) {
              codeNodes.push(node);
            }
            if ($isElementNode(node)) {
              for (const child of node.getChildren()) {
                codeNodes.push(...findCodeNodes(child));
              }
            }
            return codeNodes;
          };

          const codeNodes = findCodeNodes(root);

          codeNodes.forEach((node) => {
            const element = editor.getElementByKey(node.getKey());
            if (element) {
              blocks.push({
                nodeKey: node.getKey(),
                language: node.getLanguage() || '',
                rect: element.getBoundingClientRect(),
              });
            }
          });

          setCodeBlocks(blocks);
        });
      });
    });

    // Also update on scroll/resize
    const handleScrollResize = () => {
      requestAnimationFrame(updateCodeBlocks);
    };
    window.addEventListener('scroll', handleScrollResize, true);
    window.addEventListener('resize', handleScrollResize);

    return () => {
      clearTimeout(timeoutId);
      unsubscribe();
      window.removeEventListener('scroll', handleScrollResize, true);
      window.removeEventListener('resize', handleScrollResize);
    };
  }, [editor]);

  const handleOpenSelector = useCallback((nodeKey: string, language: string, buttonRect: DOMRect) => {
    setSelectorState({
      nodeKey,
      language,
      position: {
        top: buttonRect.bottom + 4,
        right: window.innerWidth - buttonRect.right,
      },
    });
  }, []);

  const handleCloseSelector = useCallback(() => {
    setSelectorState(null);
  }, []);

  return (
    <>
      {codeBlocks.map((block) => {
        // Normalize empty/null/undefined to 'plain' for comparison
        const normalizedLang = block.language || 'plain';
        const langLabel = LANGUAGES.find((l) => l.value === normalizedLang)?.label || normalizedLang;
        return (
          <button
            key={block.nodeKey}
            className="code-language-button"
            style={{
              position: 'fixed',
              top: block.rect.top + 6,
              right: window.innerWidth - block.rect.right + 8,
            }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const rect = (e.target as HTMLElement).getBoundingClientRect();
              handleOpenSelector(block.nodeKey, block.language, rect);
            }}
          >
            {langLabel}
          </button>
        );
      })}
      {selectorState && (
        <LanguageSelector
          nodeKey={selectorState.nodeKey}
          currentLanguage={selectorState.language}
          position={selectorState.position}
          onClose={handleCloseSelector}
        />
      )}
    </>
  );
}
