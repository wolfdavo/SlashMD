/**
 * Loading State Components for Phase 4
 * Various loading indicators for different contexts
 */

import React from 'react';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  color?: string;
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'medium',
  color = 'var(--vscode-progressBar-background)',
  className = ''
}) => {
  const sizeMap = {
    small: '16px',
    medium: '24px',
    large: '32px'
  };

  return (
    <div 
      className={`loading-spinner ${size} ${className}`}
      style={{
        width: sizeMap[size],
        height: sizeMap[size],
        border: `2px solid transparent`,
        borderTop: `2px solid ${color}`,
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
      }}
      aria-label="Loading..."
      role="status"
    />
  );
};

interface LoadingSkeletonProps {
  width?: string | number;
  height?: string | number;
  lines?: number;
  className?: string;
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  width = '100%',
  height = '1rem',
  lines = 1,
  className = ''
}) => {
  return (
    <div className={`loading-skeleton ${className}`}>
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          className="skeleton-line"
          style={{
            width: typeof width === 'number' ? `${width}px` : width,
            height: typeof height === 'number' ? `${height}px` : height,
            backgroundColor: 'var(--vscode-editorWidget-background)',
            borderRadius: '4px',
            animation: 'pulse 1.5s ease-in-out infinite',
            marginBottom: index < lines - 1 ? '0.5rem' : 0,
            opacity: 0.7
          }}
        />
      ))}
    </div>
  );
};

interface LoadingOverlayProps {
  isLoading: boolean;
  message?: string;
  children: React.ReactNode;
  transparent?: boolean;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isLoading,
  message = 'Loading...',
  children,
  transparent = false
}) => {
  return (
    <div className="loading-overlay-container" style={{ position: 'relative' }}>
      {children}
      {isLoading && (
        <div
          className="loading-overlay"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            backgroundColor: transparent 
              ? 'rgba(var(--vscode-editor-background-rgb), 0.8)' 
              : 'var(--vscode-editor-background)',
            zIndex: 1000,
            gap: '1rem'
          }}
        >
          <LoadingSpinner size="large" />
          <div className="loading-message" style={{
            color: 'var(--vscode-editor-foreground)',
            fontSize: '14px'
          }}>
            {message}
          </div>
        </div>
      )}
    </div>
  );
};

interface ProgressBarProps {
  progress: number; // 0-100
  showText?: boolean;
  size?: 'small' | 'medium' | 'large';
  color?: string;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  showText = true,
  size = 'medium',
  color = 'var(--vscode-progressBar-background)',
  className = ''
}) => {
  const heights = {
    small: '4px',
    medium: '8px',
    large: '12px'
  };

  return (
    <div className={`progress-bar-container ${className}`}>
      {showText && (
        <div className="progress-text" style={{
          color: 'var(--vscode-editor-foreground)',
          fontSize: '12px',
          marginBottom: '4px'
        }}>
          {Math.round(progress)}%
        </div>
      )}
      <div
        className="progress-bar-track"
        style={{
          width: '100%',
          height: heights[size],
          backgroundColor: 'var(--vscode-editorWidget-background)',
          borderRadius: '4px',
          overflow: 'hidden'
        }}
      >
        <div
          className="progress-bar-fill"
          style={{
            width: `${Math.max(0, Math.min(100, progress))}%`,
            height: '100%',
            backgroundColor: color,
            borderRadius: '4px',
            transition: 'width 0.3s ease-in-out',
            animation: progress < 100 ? 'pulse 2s ease-in-out infinite' : 'none'
          }}
        />
      </div>
    </div>
  );
};

// Block-specific loading skeleton
export const BlockLoadingSkeleton: React.FC<{ blockType?: string }> = ({ 
  blockType = 'paragraph' 
}) => {
  switch (blockType) {
    case 'heading':
      return <LoadingSkeleton height="2rem" width="60%" />;
    
    case 'paragraph':
      return <LoadingSkeleton lines={3} height="1rem" />;
    
    case 'code':
      return (
        <div className="code-skeleton">
          <LoadingSkeleton width="80px" height="20px" />
          <LoadingSkeleton lines={5} height="14px" />
        </div>
      );
    
    case 'image':
      return <LoadingSkeleton height="200px" width="100%" />;
    
    case 'table':
      return (
        <div className="table-skeleton">
          <LoadingSkeleton lines={1} height="24px" />
          <LoadingSkeleton lines={3} height="20px" />
        </div>
      );
    
    default:
      return <LoadingSkeleton lines={2} />;
  }
};

// Document loading skeleton
export const DocumentLoadingSkeleton: React.FC = () => {
  return (
    <div className="document-skeleton" style={{ padding: '1rem', gap: '1rem', display: 'flex', flexDirection: 'column' }}>
      <BlockLoadingSkeleton blockType="heading" />
      <BlockLoadingSkeleton blockType="paragraph" />
      <BlockLoadingSkeleton blockType="code" />
      <BlockLoadingSkeleton blockType="paragraph" />
      <BlockLoadingSkeleton blockType="image" />
      <BlockLoadingSkeleton blockType="paragraph" />
    </div>
  );
};