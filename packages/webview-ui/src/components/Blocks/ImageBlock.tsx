/**
 * Image Block Component for Phase 2
 * Renders images with placeholder functionality for drag/drop
 */

import { 
  DecoratorNode, 
  NodeKey, 
  SerializedLexicalNode,
  Spread
} from 'lexical';

import React, { useState, useRef } from 'react';
import type { ImageContent } from '../../types/blocks';

export interface SerializedImageNode extends Spread<{
  content: ImageContent;
  blockId: string;
}, SerializedLexicalNode> {}

export class ImageNode extends DecoratorNode<React.ReactElement> {
  __content: ImageContent;
  __blockId: string;

  static getType(): string {
    return 'image-block';
  }

  static clone(node: ImageNode): ImageNode {
    return new ImageNode(node.__content, node.__blockId, node.__key);
  }

  constructor(content: ImageContent, blockId: string, key?: NodeKey) {
    super(key);
    this.__content = content;
    this.__blockId = blockId;
  }

  createDOM(): HTMLElement {
    const element = document.createElement('div');
    element.className = 'image-block block-container';
    return element;
  }

  updateDOM(): false {
    return false;
  }

  static importJSON(serializedNode: SerializedImageNode): ImageNode {
    return new ImageNode(serializedNode.content, serializedNode.blockId);
  }

  exportJSON(): SerializedImageNode {
    return {
      type: 'image-block',
      content: this.__content,
      blockId: this.__blockId,
      version: 1,
    };
  }

  getContent(): ImageContent {
    return this.__content;
  }

  getBlockId(): string {
    return this.__blockId;
  }

  setContent(content: ImageContent): void {
    const writable = this.getWritable();
    writable.__content = content;
  }

  decorate(): React.ReactElement {
    return <ImageBlockComponent node={this} />;
  }

  isInline(): false {
    return false;
  }
}

interface ImageBlockComponentProps {
  node: ImageNode;
}

const ImageBlockComponent: React.FC<ImageBlockComponentProps> = ({ node }) => {
  const content = node.getContent();
  const blockId = node.getBlockId();
  const [isDragOver, setIsDragOver] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [isResizing, setIsResizing] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [alignment, setAlignment] = useState<'left' | 'center' | 'right'>('center');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);
    
    const files = event.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        // In a real implementation, this would upload to the assets folder
        // For Phase 2, we'll create a placeholder URL
        const mockUrl = `./assets/${file.name}`;
        node.setContent({
          ...content,
          src: mockUrl,
          alt: file.name.replace(/\.[^/.]+$/, ""), // Remove extension
        });
      }
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        const mockUrl = `./assets/${file.name}`;
        node.setContent({
          ...content,
          src: mockUrl,
          alt: file.name.replace(/\.[^/.]+$/, ""),
        });
      }
    }
  };

  const handleUrlSubmit = () => {
    if (urlInput.trim()) {
      node.setContent({
        ...content,
        src: urlInput.trim(),
        alt: content.alt || 'Image'
      });
      setUrlInput('');
      setShowUrlInput(false);
    }
  };

  const handleAltChange = (event: React.FormEvent<HTMLDivElement>) => {
    const alt = event.currentTarget.textContent || '';
    node.setContent({ ...content, alt });
  };

  const handleImageLoad = (event: React.SyntheticEvent<HTMLImageElement>) => {
    const img = event.currentTarget;
    // Update dimensions if not set
    if (!content.dimensions) {
      node.setContent({
        ...content,
        dimensions: {
          width: img.naturalWidth,
          height: img.naturalHeight
        }
      });
    }
  };

  const handleImageError = () => {
    console.error('Failed to load image:', content.src);
  };

  const handleResize = (newWidth: number) => {
    const maxWidth = 800;
    const minWidth = 100;
    const constrainedWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));
    
    node.setContent({
      ...content,
      dimensions: {
        ...content.dimensions,
        width: constrainedWidth
      }
    });
  };

  const handleAlignmentChange = (newAlignment: 'left' | 'center' | 'right') => {
    setAlignment(newAlignment);
    // In a full implementation, this would be stored in the block content
  };

  const toggleCaption = () => {
    const currentTitle = content.title;
    node.setContent({
      ...content,
      title: currentTitle ? undefined : ''
    });
  };

  // Render placeholder if no image
  if (!content.src) {
    return (
      <div className="block-container image-block" data-block-id={blockId}>
        <div className="drag-handle" title="Drag to move">••</div>
        <div 
          className={`image-placeholder ${isDragOver ? 'drag-over' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="placeholder-content">
            <div className="placeholder-icon">🖼️</div>
            <div className="placeholder-text">
              <p>Drop an image here, or</p>
              <div className="placeholder-actions">
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="upload-btn"
                >
                  Choose File
                </button>
                <button 
                  onClick={() => setShowUrlInput(!showUrlInput)}
                  className="url-btn"
                >
                  Add URL
                </button>
              </div>
              {showUrlInput && (
                <div className="url-input-group">
                  <input
                    type="url"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    className="url-input"
                    onKeyDown={(e) => e.key === 'Enter' && handleUrlSubmit()}
                  />
                  <button onClick={handleUrlSubmit} className="url-submit-btn">
                    Add
                  </button>
                </div>
              )}
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
        </div>
      </div>
    );
  }

  // Render actual image
  return (
    <div 
      className="block-container image-block" 
      data-block-id={blockId}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      <div className="drag-handle" title="Drag to move">••</div>
      
      <div className="image-content" style={{ textAlign: alignment }}>
        <div className="image-wrapper">
          <img
            src={content.src}
            alt={content.alt}
            title={content.title}
            onLoad={handleImageLoad}
            onError={handleImageError}
            style={{
              width: content.dimensions?.width ? `${Math.min(content.dimensions.width, 800)}px` : 'auto',
              maxWidth: '100%',
              height: 'auto'
            }}
          />
          
          {/* Resize handles */}
          {showControls && (
            <>
              <div 
                className="resize-handle resize-handle-right"
                onMouseDown={(e) => {
                  setIsResizing(true);
                  const startX = e.clientX;
                  const startWidth = content.dimensions?.width || 400;
                  
                  const handleMouseMove = (e: MouseEvent) => {
                    const newWidth = startWidth + (e.clientX - startX);
                    handleResize(newWidth);
                  };
                  
                  const handleMouseUp = () => {
                    setIsResizing(false);
                    document.removeEventListener('mousemove', handleMouseMove);
                    document.removeEventListener('mouseup', handleMouseUp);
                  };
                  
                  document.addEventListener('mousemove', handleMouseMove);
                  document.addEventListener('mouseup', handleMouseUp);
                }}
              />
              <div 
                className="resize-handle resize-handle-left"
                onMouseDown={(e) => {
                  setIsResizing(true);
                  const startX = e.clientX;
                  const startWidth = content.dimensions?.width || 400;
                  
                  const handleMouseMove = (e: MouseEvent) => {
                    const newWidth = startWidth - (e.clientX - startX);
                    handleResize(newWidth);
                  };
                  
                  const handleMouseUp = () => {
                    setIsResizing(false);
                    document.removeEventListener('mousemove', handleMouseMove);
                    document.removeEventListener('mouseup', handleMouseUp);
                  };
                  
                  document.addEventListener('mousemove', handleMouseMove);
                  document.addEventListener('mouseup', handleMouseUp);
                }}
              />
            </>
          )}
        </div>
        
        {/* Caption */}
        {content.title !== undefined && (
          <div
            className="image-caption"
            contentEditable
            suppressContentEditableWarning={true}
            onInput={(e) => node.setContent({ 
              ...content, 
              title: e.currentTarget.textContent || '' 
            })}
            dangerouslySetInnerHTML={{ __html: content.title }}
            data-placeholder="Image caption..."
          />
        )}
        
        {/* Advanced controls */}
        {showControls && (
          <div className="image-advanced-controls">
            <div className="alignment-controls">
              <button
                className={alignment === 'left' ? 'active' : ''}
                onClick={() => handleAlignmentChange('left')}
                title="Align left"
              >
                ←
              </button>
              <button
                className={alignment === 'center' ? 'active' : ''}
                onClick={() => handleAlignmentChange('center')}
                title="Center"
              >
                ↔
              </button>
              <button
                className={alignment === 'right' ? 'active' : ''}
                onClick={() => handleAlignmentChange('right')}
                title="Align right"
              >
                →
              </button>
            </div>
            
            <div className="image-controls">
              <div
                className="image-alt-input"
                contentEditable
                suppressContentEditableWarning={true}
                onInput={handleAltChange}
                dangerouslySetInnerHTML={{ __html: content.alt }}
                data-placeholder="Alt text..."
              />
              
              <button
                onClick={toggleCaption}
                className="caption-toggle"
                title={content.title !== undefined ? "Remove caption" : "Add caption"}
              >
                {content.title !== undefined ? '💬' : '💭'}
              </button>
              
              <button
                onClick={() => node.setContent({ ...content, src: '', alt: '' })}
                className="remove-image-btn"
                title="Remove image"
              >
                🗑️
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageBlockComponent;