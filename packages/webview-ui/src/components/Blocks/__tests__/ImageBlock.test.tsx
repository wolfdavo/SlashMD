/**
 * Tests for enhanced ImageBlock component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ImageNode } from '../ImageBlock';
import type { ImageContent } from '../../../types/blocks';

describe('Enhanced ImageBlock', () => {
  let mockContent: ImageContent;
  let mockNode: ImageNode;

  beforeEach(() => {
    mockContent = {
      src: 'https://example.com/image.jpg',
      alt: 'Test image',
      title: 'Test caption'
    };
    
    mockNode = new ImageNode(mockContent, 'test-image-1');
    vi.spyOn(mockNode, 'setContent');
  });

  it('renders image with src and alt', () => {
    render(mockNode.decorate());
    
    const image = screen.getByRole('img');
    expect(image).toHaveAttribute('src', 'https://example.com/image.jpg');
    expect(image).toHaveAttribute('alt', 'Test image');
  });

  it('shows advanced controls on mouse enter', async () => {
    const user = userEvent.setup();
    render(mockNode.decorate());
    
    const container = screen.getByTestId ? screen.getByTestId('image-block') : 
                     document.querySelector('.image-block') as HTMLElement;
    
    if (container) {
      await user.hover(container);
      await waitFor(() => {
        expect(screen.getByTitle('Align left')).toBeInTheDocument();
      });
    }
  });

  it('handles image resizing', async () => {
    render(mockNode.decorate());
    
    // Simulate hover to show controls
    const imageBlock = document.querySelector('.image-block') as HTMLElement;
    fireEvent.mouseEnter(imageBlock);
    
    await waitFor(() => {
      const resizeHandle = document.querySelector('.resize-handle-right') as HTMLElement;
      if (resizeHandle) {
        // Simulate resize drag
        fireEvent.mouseDown(resizeHandle, { clientX: 100 });
        fireEvent.mouseMove(document, { clientX: 150 });
        fireEvent.mouseUp(document);
        
        expect(mockNode.setContent).toHaveBeenCalled();
      }
    });
  });

  it('toggles caption visibility', async () => {
    const user = userEvent.setup();
    mockContent.title = undefined; // Start without caption
    mockNode = new ImageNode(mockContent, 'test-image-1');
    vi.spyOn(mockNode, 'setContent');
    
    render(mockNode.decorate());
    
    // Show controls
    const imageBlock = document.querySelector('.image-block') as HTMLElement;
    fireEvent.mouseEnter(imageBlock);
    
    await waitFor(async () => {
      const captionToggle = screen.getByTitle('Add caption');
      if (captionToggle) {
        await user.click(captionToggle);
        expect(mockNode.setContent).toHaveBeenCalledWith({
          ...mockContent,
          title: ''
        });
      }
    });
  });

  it('updates alt text when edited', async () => {
    const user = userEvent.setup();
    render(mockNode.decorate());
    
    // Show controls
    const imageBlock = document.querySelector('.image-block') as HTMLElement;
    fireEvent.mouseEnter(imageBlock);
    
    await waitFor(async () => {
      const altInput = screen.getByDisplayValue('Test image');
      if (altInput) {
        await user.clear(altInput);
        await user.type(altInput, 'Updated alt text');
        
        expect(mockNode.setContent).toHaveBeenCalledWith({
          ...mockContent,
          alt: 'Updated alt text'
        });
      }
    });
  });

  it('handles alignment changes', async () => {
    const user = userEvent.setup();
    render(mockNode.decorate());
    
    // Show controls
    const imageBlock = document.querySelector('.image-block') as HTMLElement;
    fireEvent.mouseEnter(imageBlock);
    
    await waitFor(async () => {
      const leftAlignButton = screen.getByTitle('Align left');
      await user.click(leftAlignButton);
      
      // Alignment is handled by local state in this implementation
      expect(leftAlignButton).toHaveClass('active');
    });
  });

  it('renders placeholder when no src', () => {
    mockContent.src = '';
    mockNode = new ImageNode(mockContent, 'test-image-1');
    
    render(mockNode.decorate());
    
    expect(screen.getByText('Drop an image here, or')).toBeInTheDocument();
    expect(screen.getByText('Choose File')).toBeInTheDocument();
    expect(screen.getByText('Add URL')).toBeInTheDocument();
  });

  it('handles drag and drop', async () => {
    mockContent.src = '';
    mockNode = new ImageNode(mockContent, 'test-image-1');
    vi.spyOn(mockNode, 'setContent');
    
    render(mockNode.decorate());
    
    const dropZone = document.querySelector('.image-placeholder') as HTMLElement;
    
    // Create mock file
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const dataTransfer = {
      files: [file]
    };
    
    fireEvent.dragOver(dropZone);
    fireEvent.drop(dropZone, { dataTransfer });
    
    expect(mockNode.setContent).toHaveBeenCalledWith(expect.objectContaining({
      src: './assets/test.jpg',
      alt: 'test'
    }));
  });

  it('handles URL input', async () => {
    const user = userEvent.setup();
    mockContent.src = '';
    mockNode = new ImageNode(mockContent, 'test-image-1');
    vi.spyOn(mockNode, 'setContent');
    
    render(mockNode.decorate());
    
    const urlButton = screen.getByText('Add URL');
    await user.click(urlButton);
    
    const urlInput = screen.getByPlaceholderText('https://example.com/image.jpg');
    await user.type(urlInput, 'https://example.com/test.png');
    
    const addButton = screen.getByText('Add');
    await user.click(addButton);
    
    expect(mockNode.setContent).toHaveBeenCalledWith(expect.objectContaining({
      src: 'https://example.com/test.png'
    }));
  });

  it('removes image when remove button is clicked', async () => {
    const user = userEvent.setup();
    render(mockNode.decorate());
    
    // Show controls
    const imageBlock = document.querySelector('.image-block') as HTMLElement;
    fireEvent.mouseEnter(imageBlock);
    
    await waitFor(async () => {
      const removeButton = screen.getByTitle('Remove image');
      await user.click(removeButton);
      
      expect(mockNode.setContent).toHaveBeenCalledWith({
        ...mockContent,
        src: '',
        alt: ''
      });
    });
  });
});