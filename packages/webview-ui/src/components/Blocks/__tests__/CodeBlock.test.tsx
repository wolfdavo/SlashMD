/**
 * Tests for enhanced CodeBlock component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CodeNode } from '../CodeBlock';
import type { CodeContent } from '../../../types/blocks';

describe('Enhanced CodeBlock', () => {
  let mockContent: CodeContent;
  let mockNode: CodeNode;

  beforeEach(() => {
    mockContent = {
      language: 'javascript',
      code: 'console.log("Hello World");',
      showLineNumbers: false
    };
    
    mockNode = new CodeNode(mockContent, 'test-block-1');
    vi.spyOn(mockNode, 'setContent');
  });

  it('renders code block with content', () => {
    render(mockNode.decorate());
    
    expect(screen.getByDisplayValue('console.log("Hello World");')).toBeInTheDocument();
    expect(screen.getByText('JavaScript')).toBeInTheDocument();
  });

  it('shows/hides language dropdown on button click', async () => {
    const user = userEvent.setup();
    render(mockNode.decorate());
    
    const languageButton = screen.getByTitle('Select language');
    await user.click(languageButton);
    
    expect(screen.getByText('Python')).toBeInTheDocument();
    expect(screen.getByText('TypeScript')).toBeInTheDocument();
    
    await user.click(languageButton);
    await waitFor(() => {
      expect(screen.queryByText('Python')).not.toBeInTheDocument();
    });
  });

  it('changes language when option is selected', async () => {
    const user = userEvent.setup();
    render(mockNode.decorate());
    
    const languageButton = screen.getByTitle('Select language');
    await user.click(languageButton);
    
    const pythonOption = screen.getByText('Python');
    await user.click(pythonOption);
    
    expect(mockNode.setContent).toHaveBeenCalledWith({
      ...mockContent,
      language: 'python'
    });
  });

  it('toggles line numbers when toggle button is clicked', async () => {
    const user = userEvent.setup();
    render(mockNode.decorate());
    
    const lineNumbersToggle = screen.getByTitle('Show line numbers');
    await user.click(lineNumbersToggle);
    
    expect(mockNode.setContent).toHaveBeenCalledWith({
      ...mockContent,
      showLineNumbers: true
    });
  });

  it('shows line numbers when enabled', () => {
    mockContent.showLineNumbers = true;
    mockContent.code = 'line 1\nline 2\nline 3';
    mockNode = new CodeNode(mockContent, 'test-block-1');
    
    render(mockNode.decorate());
    
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('copies code to clipboard', async () => {
    const user = userEvent.setup();
    const mockWriteText = vi.spyOn(navigator.clipboard, 'writeText');
    
    render(mockNode.decorate());
    
    const copyButton = screen.getByTitle('Copy code');
    await user.click(copyButton);
    
    expect(mockWriteText).toHaveBeenCalledWith('console.log("Hello World");');
  });

  it('shows success indicator after copying', async () => {
    const user = userEvent.setup();
    render(mockNode.decorate());
    
    const copyButton = screen.getByTitle('Copy code');
    await user.click(copyButton);
    
    expect(copyButton).toHaveTextContent('✅');
    
    // Should reset after timeout
    await waitFor(() => {
      expect(copyButton).toHaveTextContent('📋');
    }, { timeout: 2500 });
  });

  it('updates code content when text area changes', async () => {
    const user = userEvent.setup();
    render(mockNode.decorate());
    
    const textarea = screen.getByDisplayValue('console.log("Hello World");');
    await user.clear(textarea);
    await user.type(textarea, 'const x = 42;');
    
    expect(mockNode.setContent).toHaveBeenCalledWith({
      ...mockContent,
      code: 'const x = 42;'
    });
  });

  it('has proper accessibility attributes', () => {
    render(mockNode.decorate());
    
    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveAttribute('data-language', 'javascript');
    expect(textarea).toHaveAttribute('spellCheck', 'false');
  });
});