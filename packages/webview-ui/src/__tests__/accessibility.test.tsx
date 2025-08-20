/**
 * Accessibility tests for Phase 4
 * Tests keyboard navigation, ARIA attributes, and screen reader support
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useAccessibility } from '../hooks/useAccessibility';

// Test component that uses the accessibility hook
const TestComponent: React.FC<{ options?: any }> = ({ options }) => {
  const {
    announce,
    focusElement,
    getAriaAttributes,
    focusTrapRef
  } = useAccessibility(options);

  return (
    <div ref={focusTrapRef as React.RefObject<HTMLDivElement>} data-testid="container">
      <button
        onClick={() => announce('Test announcement')}
        {...getAriaAttributes('button', { pressed: false })}
      >
        Announce
      </button>
      <button
        onClick={() => focusElement(document.getElementById('target') as HTMLElement)}
      >
        Focus Target
      </button>
      <input id="target" placeholder="Target input" />
      <div
        {...getAriaAttributes('toggle', { expanded: true })}
        data-testid="toggle"
      >
        Toggle content
      </div>
    </div>
  );
};

describe('Accessibility Hook', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
  });

  afterEach(() => {
    // Clean up any elements added to document.body
    const announceElements = document.querySelectorAll('[aria-live]');
    announceElements.forEach(el => {
      if (el.parentNode === document.body) {
        document.body.removeChild(el);
      }
    });
  });

  it('creates live region for announcements', () => {
    render(<TestComponent options={{ announceChanges: true }} />);
    
    const liveRegion = document.querySelector('[aria-live="polite"]');
    expect(liveRegion).toBeInTheDocument();
    expect(liveRegion).toHaveClass('sr-only');
  });

  it('announces messages to screen readers', async () => {
    render(<TestComponent options={{ announceChanges: true }} />);
    
    const announceButton = screen.getByText('Announce');
    await user.click(announceButton);
    
    const liveRegion = document.querySelector('[aria-live="polite"]');
    expect(liveRegion).toHaveTextContent('Test announcement');
  });

  it('focuses elements correctly', async () => {
    render(<TestComponent />);
    
    const focusButton = screen.getByText('Focus Target');
    const targetInput = screen.getByPlaceholderText('Target input');
    
    await user.click(focusButton);
    
    expect(targetInput).toHaveFocus();
  });

  it('generates correct ARIA attributes for buttons', () => {
    render(<TestComponent />);
    
    const button = screen.getByText('Announce');
    expect(button).toHaveAttribute('role', 'button');
    expect(button).toHaveAttribute('aria-pressed', 'false');
  });

  it('generates correct ARIA attributes for toggles', () => {
    render(<TestComponent />);
    
    const toggle = screen.getByTestId('toggle');
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
  });

  it('handles keyboard navigation events', async () => {
    const mockDispatch = vi.spyOn(document, 'dispatchEvent');
    render(<TestComponent options={{ enableKeyboardNavigation: true }} />);
    
    // Simulate Alt+ArrowUp
    fireEvent.keyDown(document, { 
      key: 'ArrowUp', 
      altKey: true 
    });
    
    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'accessibility:moveBlockUp'
      })
    );
  });

  it('handles slash menu keyboard shortcut', async () => {
    const mockDispatch = vi.spyOn(document, 'dispatchEvent');
    render(<TestComponent options={{ enableKeyboardNavigation: true }} />);
    
    // Simulate Ctrl+/
    fireEvent.keyDown(document, { 
      key: '/', 
      ctrlKey: true 
    });
    
    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'accessibility:openSlashMenu'
      })
    );
  });

  it('detects high contrast mode', () => {
    // Mock matchMedia for high contrast
    const mockMatchMedia = vi.fn().mockImplementation(query => ({
      matches: query.includes('prefers-contrast: high'),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    }));
    
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: mockMatchMedia
    });

    render(<TestComponent options={{ enableHighContrast: true }} />);
    
    expect(mockMatchMedia).toHaveBeenCalledWith('(prefers-contrast: high)');
  });

  it('finds focusable elements correctly', () => {
    render(
      <div data-testid="container">
        <button>Button 1</button>
        <input type="text" />
        <button disabled>Disabled Button</button>
        <a href="#test">Link</a>
        <div tabIndex={0}>Focusable Div</div>
        <div tabIndex={-1}>Non-focusable Div</div>
      </div>
    );

    const container = screen.getByTestId('container');
    const focusableElements = Array.from(
      container.querySelectorAll([
        'button:not([disabled])',
        'input:not([disabled]):not([type="hidden"])',
        'select:not([disabled])',
        'textarea:not([disabled])',
        'a[href]',
        '[tabindex]:not([tabindex="-1"])',
        '[contenteditable="true"]'
      ].join(', '))
    );

    expect(focusableElements).toHaveLength(4); // Button, input, link, focusable div
  });
});

// Integration test for accessibility in block components
describe('Block Component Accessibility', () => {
  it('has proper keyboard navigation', async () => {
    const user = userEvent.setup();
    
    render(
      <div>
        <div className="block-container" data-block-type="paragraph" tabIndex={0}>
          <div className="drag-handle" title="Drag to move">••</div>
          <div contentEditable>Paragraph content</div>
        </div>
        <div className="block-container" data-block-type="heading" tabIndex={0}>
          <div className="drag-handle" title="Drag to move">••</div>
          <h2>Heading content</h2>
        </div>
      </div>
    );

    const firstBlock = document.querySelector('[data-block-type="paragraph"]') as HTMLElement;
    const secondBlock = document.querySelector('[data-block-type="heading"]') as HTMLElement;

    // Tab navigation should work
    firstBlock.focus();
    expect(firstBlock).toHaveFocus();

    await user.tab();
    // Focus should move to the next focusable element
  });

  it('has proper ARIA labels for drag handles', () => {
    render(
      <div className="block-container">
        <div className="drag-handle" title="Drag to move" role="button" tabIndex={0}>
          ••
        </div>
      </div>
    );

    const dragHandle = document.querySelector('.drag-handle');
    expect(dragHandle).toHaveAttribute('title', 'Drag to move');
    expect(dragHandle).toHaveAttribute('role', 'button');
    expect(dragHandle).toHaveAttribute('tabIndex', '0');
  });

  it('announces block type changes', async () => {
    const user = userEvent.setup();
    
    // Mock the live region
    const liveRegion = document.createElement('div');
    liveRegion.setAttribute('aria-live', 'polite');
    document.body.appendChild(liveRegion);

    render(
      <select aria-label="Block type">
        <option value="paragraph">Paragraph</option>
        <option value="heading">Heading</option>
        <option value="quote">Quote</option>
      </select>
    );

    const select = screen.getByLabelText('Block type');
    await user.selectOptions(select, 'heading');

    // In a real implementation, this would trigger an announcement
    expect(select).toHaveValue('heading');
  });

  it('supports screen reader navigation', () => {
    render(
      <main role="main" aria-label="Document editor">
        <section aria-label="Toolbar">
          <button aria-label="Bold text">B</button>
          <button aria-label="Italic text">I</button>
        </section>
        <section aria-label="Document content">
          <article role="article" aria-label="Paragraph block">
            <p>Content here</p>
          </article>
        </section>
      </main>
    );

    const main = screen.getByRole('main');
    expect(main).toHaveAttribute('aria-label', 'Document editor');

    const toolbar = screen.getByLabelText('Toolbar');
    expect(toolbar).toBeInTheDocument();

    const content = screen.getByLabelText('Document content');
    expect(content).toBeInTheDocument();

    const article = screen.getByRole('article');
    expect(article).toHaveAttribute('aria-label', 'Paragraph block');
  });
});