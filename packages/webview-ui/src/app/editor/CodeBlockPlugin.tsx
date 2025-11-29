import { useCallback, useEffect, useState, useRef, useMemo } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getRoot, $getNodeByKey, $isElementNode, LexicalNode } from 'lexical';
import { $isCodeNode, CodeNode } from '@lexical/code';

// Shared helper to recursively find all code nodes in a tree
function findCodeNodesInTree(node: LexicalNode): CodeNode[] {
  const codeNodes: CodeNode[] = [];
  if ($isCodeNode(node)) {
    codeNodes.push(node);
  }
  if ($isElementNode(node)) {
    for (const child of node.getChildren()) {
      codeNodes.push(...findCodeNodesInTree(child));
    }
  }
  return codeNodes;
}

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
  textContent: string;
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

  // Cache for code node keys to avoid unnecessary DOM reads
  const cachedNodeKeysRef = useRef<Set<string>>(new Set());
  const updateScheduledRef = useRef(false);

  // Track code blocks and their positions
  useEffect(() => {
    // Batched update function that reads all DOM positions in a single frame
    const updateCodeBlocks = () => {
      updateScheduledRef.current = false;
      const editorElement = editor.getRootElement();
      if (!editorElement) return;

      editor.getEditorState().read(() => {
        const root = $getRoot();
        const codeNodes = findCodeNodesInTree(root);

        // Collect node keys, languages, and text content first (no DOM reads)
        const nodeData: Array<{ nodeKey: string; language: string; textContent: string }> = [];
        for (const node of codeNodes) {
          nodeData.push({
            nodeKey: node.getKey(),
            language: node.getLanguage() || '',
            textContent: node.getTextContent(),
          });
        }

        // Batch DOM reads in a single pass after the read()
        requestAnimationFrame(() => {
          const blocks: CodeBlockInfo[] = [];
          for (const { nodeKey, language, textContent } of nodeData) {
            const element = editor.getElementByKey(nodeKey);
            if (element) {
              blocks.push({
                nodeKey,
                language,
                textContent,
                rect: element.getBoundingClientRect(),
              });
            }
          }
          setCodeBlocks(blocks);
        });
      });
    };

    // Debounced update scheduler
    const scheduleUpdate = () => {
      if (!updateScheduledRef.current) {
        updateScheduledRef.current = true;
        requestAnimationFrame(updateCodeBlocks);
      }
    };

    const timeoutId = setTimeout(updateCodeBlocks, 200);

    const unsubscribe = editor.registerUpdateListener(() => {
      scheduleUpdate();
    });

    // Also update on scroll/resize with debouncing
    const handleScrollResize = () => {
      scheduleUpdate();
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

  // Track which code blocks show "Copied" feedback
  const [copiedNodeKey, setCopiedNodeKey] = useState<string | null>(null);

  const handleCopyCode = useCallback((nodeKey: string, textContent: string) => {
    navigator.clipboard.writeText(textContent).then(() => {
      setCopiedNodeKey(nodeKey);
      setTimeout(() => setCopiedNodeKey(null), 1500);
    });
  }, []);

  return (
    <>
      {codeBlocks.map((block) => {
        // Normalize empty/null/undefined to 'plain' for comparison
        const normalizedLang = block.language || 'plain';
        const langLabel = LANGUAGES.find((l) => l.value === normalizedLang)?.label || normalizedLang;
        const isCopied = copiedNodeKey === block.nodeKey;
        return (
          <div
            key={block.nodeKey}
            className="code-block-toolbar"
            style={{
              position: 'fixed',
              top: block.rect.top + 6,
              right: window.innerWidth - block.rect.right + 8,
            }}
          >
            <button
              className="code-language-button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const rect = (e.target as HTMLElement).getBoundingClientRect();
                handleOpenSelector(block.nodeKey, block.language, rect);
              }}
            >
              {langLabel}
            </button>
            <button
              className={`code-copy-button ${isCopied ? 'copied' : ''}`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleCopyCode(block.nodeKey, block.textContent);
              }}
              title="Copy code"
            >
              {isCopied ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
              )}
            </button>
          </div>
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
