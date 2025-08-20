/**
 * Tests for enhanced ToggleBlock component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ToggleNode } from '../ToggleBlock';
import type { ToggleContent } from '../../../types/blocks';

describe('Enhanced ToggleBlock', () => {
  let mockContent: ToggleContent;
  let mockNode: ToggleNode;

  beforeEach(() => {
    mockContent = {
      summary: 'Click to expand',
      collapsed: false
    };
    
    mockNode = new ToggleNode(mockContent, 'test-toggle-1');
    vi.spyOn(mockNode, 'setContent');
  });

  it('renders toggle with summary', () => {
    render(mockNode.decorate());
    
    expect(screen.getByDisplayValue('Click to expand')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /collapse/i })).toBeInTheDocument();
  });

  it('shows expanded state by default when not collapsed', () => {
    render(mockNode.decorate());
    
    const container = document.querySelector('.toggle-block');
    expect(container).toHaveClass('expanded');
    expect(screen.getByText('Click here to add content')).toBeInTheDocument();
  });

  it('shows collapsed state when collapsed prop is true', () => {
    mockContent.collapsed = true;
    mockNode = new ToggleNode(mockContent, 'test-toggle-1');
    
    render(mockNode.decorate());
    
    const container = document.querySelector('.toggle-block');
    expect(container).toHaveClass('collapsed');
  });

  it('toggles expansion when arrow button is clicked', async () => {
    const user = userEvent.setup();
    render(mockNode.decorate());
    
    const toggleButton = screen.getByRole('button', { name: /collapse/i });
    await user.click(toggleButton);
    
    expect(mockNode.setContent).toHaveBeenCalledWith({
      ...mockContent,
      collapsed: true
    });
  });

  it('toggles expansion when summary is clicked', async () => {
    const user = userEvent.setup();
    render(mockNode.decorate());
    
    const summary = screen.getByDisplayValue('Click to expand');
    await user.click(summary);
    
    expect(mockNode.setContent).toHaveBeenCalledWith({
      ...mockContent,
      collapsed: true
    });
  });

  it('updates summary when edited', async () => {
    const user = userEvent.setup();
    render(mockNode.decorate());
    
    const summary = screen.getByDisplayValue('Click to expand');
    await user.clear(summary);
    await user.type(summary, 'New summary text');
    
    expect(mockNode.setContent).toHaveBeenCalledWith({
      ...mockContent,
      summary: 'New summary text'
    });
  });

  it('handles keyboard navigation - Enter key expands collapsed toggle', async () => {
    const user = userEvent.setup();
    mockContent.collapsed = true;
    mockNode = new ToggleNode(mockContent, 'test-toggle-1');
    vi.spyOn(mockNode, 'setContent');
    
    render(mockNode.decorate());
    
    const summary = screen.getByDisplayValue('Click to expand');
    summary.focus();
    await user.keyboard('{Enter}');
    
    expect(mockNode.setContent).toHaveBeenCalledWith({
      ...mockContent,
      collapsed: false
    });
  });

  it('handles keyboard navigation - ArrowRight expands when collapsed', async () => {
    const user = userEvent.setup();
    mockContent.collapsed = true;
    mockNode = new ToggleNode(mockContent, 'test-toggle-1');
    vi.spyOn(mockNode, 'setContent');
    
    render(mockNode.decorate());
    
    const summary = screen.getByDisplayValue('Click to expand');
    summary.focus();
    await user.keyboard('{ArrowRight}');
    
    expect(mockNode.setContent).toHaveBeenCalledWith({
      ...mockContent,
      collapsed: false
    });
  });

  it('handles keyboard navigation - ArrowLeft collapses when expanded', async () => {
    const user = userEvent.setup();
    render(mockNode.decorate());
    
    const summary = screen.getByDisplayValue('Click to expand');
    summary.focus();
    await user.keyboard('{ArrowLeft}');
    
    expect(mockNode.setContent).toHaveBeenCalledWith({
      ...mockContent,
      collapsed: true
    });
  });

  it('applies animation class during transition', async () => {
    const user = userEvent.setup();
    render(mockNode.decorate());
    
    const toggleButton = screen.getByRole('button', { name: /collapse/i });
    await user.click(toggleButton);
    
    const container = document.querySelector('.toggle-block');
    expect(container).toHaveClass('animating');
    
    // Should remove animation class after timeout
    await waitFor(() => {
      expect(container).not.toHaveClass('animating');
    }, { timeout: 350 });
  });

  it('disables toggle button during animation', async () => {
    const user = userEvent.setup();
    render(mockNode.decorate());
    
    const toggleButton = screen.getByRole('button', { name: /collapse/i });
    await user.click(toggleButton);
    
    expect(toggleButton).toBeDisabled();
    
    await waitFor(() => {
      expect(toggleButton).not.toBeDisabled();
    }, { timeout: 350 });
  });

  it('applies smooth height transition', () => {
    render(mockNode.decorate());
    
    const contentWrapper = document.querySelector('.toggle-content-wrapper') as HTMLElement;
    const computedStyle = window.getComputedStyle(contentWrapper);
    
    expect(contentWrapper.style.transition).toContain('height');
    expect(contentWrapper.style.transition).toContain('cubic-bezier');
  });

  it('has proper accessibility attributes', () => {
    render(mockNode.decorate());
    
    const toggleButton = screen.getByRole('button', { name: /collapse/i });
    expect(toggleButton).toHaveAttribute('aria-expanded', 'true');
    
    const summary = screen.getByDisplayValue('Click to expand');
    expect(summary).toHaveAttribute('role', 'button');
    expect(summary).toHaveAttribute('tabIndex', '0');
  });

  it('shows enhanced content placeholder', () => {
    render(mockNode.decorate());
    
    expect(screen.getByText('📝')).toBeInTheDocument();
    expect(screen.getByText('Click here to add content to this toggle section')).toBeInTheDocument();
    expect(screen.getByText('You can add paragraphs, lists, images, and more')).toBeInTheDocument();
  });
});