import { useCallback, useEffect, useState, useRef } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getRoot, $getNodeByKey } from 'lexical';
import { $isCodeNode, CodeNode } from '@lexical/code';

// Popular languages for the dropdown
const LANGUAGES = [
  { value: '', label: 'Plain Text' },
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
  const [selectedIndex, setSelectedIndex] = useState(0);
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

  // Reset selection when search changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [searchQuery]);

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
      editor.update(() => {
        const node = $getNodeByKey(nodeKey);
        if (node && $isCodeNode(node)) {
          node.setLanguage(language || null);
        }
      });
      onClose();
    },
    [editor, nodeKey, onClose]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev < filteredLanguages.length - 1 ? prev + 1 : prev
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredLanguages[selectedIndex]) {
            selectLanguage(filteredLanguages[selectedIndex].value);
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    },
    [filteredLanguages, selectedIndex, selectLanguage, onClose]
  );

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
          filteredLanguages.map((lang, index) => (
            <button
              key={lang.value}
              className={`code-language-item ${
                index === selectedIndex ? 'selected' : ''
              } ${lang.value === currentLanguage ? 'current' : ''}`}
              onClick={() => selectLanguage(lang.value)}
            >
              {lang.label}
              {lang.value === currentLanguage && (
                <span className="code-language-check">✓</span>
              )}
            </button>
          ))
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

      const codeElements = Array.from(editorElement.querySelectorAll('.editor-code')) as HTMLElement[];

      editor.getEditorState().read(() => {
        const root = $getRoot();
        const blocks: CodeBlockInfo[] = [];

        const codeNodes: CodeNode[] = [];
        for (const child of root.getChildren()) {
          if ($isCodeNode(child)) {
            codeNodes.push(child);
          }
        }

        codeNodes.forEach((node, index) => {
          const element = codeElements[index];
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
    };

    const timeoutId = setTimeout(updateCodeBlocks, 200);

    const unsubscribe = editor.registerUpdateListener(() => {
      requestAnimationFrame(updateCodeBlocks);
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
        const langLabel = LANGUAGES.find((l) => l.value === block.language)?.label || block.language || 'Plain Text';
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
