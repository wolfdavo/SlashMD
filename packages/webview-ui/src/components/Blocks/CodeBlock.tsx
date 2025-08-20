/**
 * Code Block Component for Phase 2
 * Renders code content with language selection and basic syntax highlighting
 */

import { 
  DecoratorNode, 
  NodeKey, 
  SerializedLexicalNode,
  Spread
} from 'lexical';

import React, { useState } from 'react';
import type { CodeContent } from '../../types/blocks';

export interface SerializedCodeNode extends Spread<{
  content: CodeContent;
  blockId: string;
}, SerializedLexicalNode> {}

export class CodeNode extends DecoratorNode<React.ReactElement> {
  __content: CodeContent;
  __blockId: string;

  static getType(): string {
    return 'code-block';
  }

  static clone(node: CodeNode): CodeNode {
    return new CodeNode(node.__content, node.__blockId, node.__key);
  }

  constructor(content: CodeContent, blockId: string, key?: NodeKey) {
    super(key);
    this.__content = content;
    this.__blockId = blockId;
  }

  createDOM(): HTMLElement {
    const element = document.createElement('div');
    element.className = 'code-block block-container';
    return element;
  }

  updateDOM(): false {
    return false;
  }

  static importJSON(serializedNode: SerializedCodeNode): CodeNode {
    return new CodeNode(serializedNode.content, serializedNode.blockId);
  }

  exportJSON(): SerializedCodeNode {
    return {
      type: 'code-block',
      content: this.__content,
      blockId: this.__blockId,
      version: 1,
    };
  }

  getContent(): CodeContent {
    return this.__content;
  }

  getBlockId(): string {
    return this.__blockId;
  }

  setContent(content: CodeContent): void {
    const writable = this.getWritable();
    writable.__content = content;
  }

  decorate(): React.ReactElement {
    return <CodeBlockComponent node={this} />;
  }

  isInline(): false {
    return false;
  }
}

interface CodeBlockComponentProps {
  node: CodeNode;
}

// Common programming languages for the dropdown
const LANGUAGES = [
  { value: 'text', label: 'Plain Text' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'cpp', label: 'C++' },
  { value: 'c', label: 'C' },
  { value: 'csharp', label: 'C#' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
  { value: 'php', label: 'PHP' },
  { value: 'ruby', label: 'Ruby' },
  { value: 'swift', label: 'Swift' },
  { value: 'html', label: 'HTML' },
  { value: 'css', label: 'CSS' },
  { value: 'scss', label: 'SCSS' },
  { value: 'json', label: 'JSON' },
  { value: 'xml', label: 'XML' },
  { value: 'yaml', label: 'YAML' },
  { value: 'markdown', label: 'Markdown' },
  { value: 'bash', label: 'Bash' },
  { value: 'sql', label: 'SQL' }
];

const CodeBlockComponent: React.FC<CodeBlockComponentProps> = ({ node }) => {
  const content = node.getContent();
  const blockId = node.getBlockId();
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const handleCodeInput = (event: React.FormEvent<HTMLTextAreaElement>) => {
    const code = event.currentTarget.value;
    node.setContent({ ...content, code });
  };

  const handleLanguageChange = (newLanguage: string) => {
    node.setContent({ ...content, language: newLanguage });
    setShowLanguageSelector(false);
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(content.code);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
      console.log('Code copied to clipboard');
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  const toggleLineNumbers = () => {
    node.setContent({ 
      ...content, 
      showLineNumbers: !content.showLineNumbers 
    });
  };

  const currentLanguage = LANGUAGES.find(lang => lang.value === content.language) || LANGUAGES[0];

  return (
    <div className="block-container code-block" data-block-id={blockId}>
      <div className="drag-handle" title="Drag to move">••</div>
      <div className="code-block-header">
        <div className="code-controls">
          <div className="language-selector">
            <button
              className="language-button"
              onClick={() => setShowLanguageSelector(!showLanguageSelector)}
              title="Select language"
            >
              {currentLanguage.label}
              <span className="dropdown-arrow">▼</span>
            </button>
            {showLanguageSelector && (
              <div className="language-dropdown">
                {LANGUAGES.map(lang => (
                  <button
                    key={lang.value}
                    className={`language-option ${lang.value === content.language ? 'selected' : ''}`}
                    onClick={() => handleLanguageChange(lang.value)}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            className="line-numbers-toggle"
            onClick={toggleLineNumbers}
            title={content.showLineNumbers ? "Hide line numbers" : "Show line numbers"}
          >
            {content.showLineNumbers ? '🔢' : '📝'}
          </button>
          <button
            className="copy-button"
            onClick={handleCopyCode}
            title="Copy code"
          >
            {copySuccess ? '✅' : '📋'}
          </button>
        </div>
      </div>
      <div className="code-block-content">
        <textarea
          className="code-textarea"
          value={content.code}
          onChange={handleCodeInput}
          placeholder="Enter your code here..."
          spellCheck={false}
          data-language={content.language}
        />
        {content.showLineNumbers && (
          <div className="line-numbers">
            {content.code.split('\n').map((_, index) => (
              <div key={index} className="line-number">
                {index + 1}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CodeBlockComponent;