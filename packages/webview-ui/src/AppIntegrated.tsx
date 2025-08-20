/**
 * Integrated App Component for SlashMD VS Code Extension
 * Integration Phase: Connects React app with VS Code extension via messaging
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { InteractiveLexicalEditor } from './components/Editor/InteractiveLexicalEditor';
import { ErrorBoundary } from './components/UI/ErrorBoundary';
import { LoadingOverlay, DocumentLoadingSkeleton } from './components/UI/LoadingState';
import { useBlocks } from './hooks/useBlocks';
import { usePerformanceMonitor } from './hooks/usePerformanceMonitor';
import { useExport } from './hooks/useExport';
import { useAccessibility } from './hooks/useAccessibility';
import { VSCodeBridge, useVSCodeBridge } from './integration/VSCodeBridge';
import { sharedToUIBlocks, uiToSharedBlocks } from './integration/BlockConverter';
import { installMockVSCodeAPI } from './mocks/vscode-api';
import { comprehensiveSampleDocument } from './mocks/sample-data';
import type { Block } from './types/blocks';
import type { Theme } from './types/editor';
// import type { ExportFormat } from './hooks/useExport';
import type { Block as SharedBlock } from './types/shared';

// Install mock VS Code API for standalone development (if not in VS Code)
if (typeof (globalThis as any).acquireVsCodeApi !== 'function') {
  installMockVSCodeAPI();
}

// Production-ready controls component (simplified for integration)
const IntegratedControls: React.FC<{ 
  currentTheme: Theme; 
  onThemeChange: (theme: Theme) => void;
  performanceMetrics: any;
  onResetMetrics: () => void;
  isVSCodeEnvironment: boolean;
}> = ({ 
  currentTheme, 
  onThemeChange, 
  performanceMetrics,
  onResetMetrics,
  isVSCodeEnvironment
}) => {
  const [showPerformancePanel, setShowPerformancePanel] = useState(false);
  const themes: Theme[] = ['light', 'dark', 'high-contrast'];

  const getPerformanceColor = (status: string) => {
    switch (status) {
      case 'good': return '#107c10';
      case 'warning': return '#ff8c00';
      case 'critical': return '#d13438';
      default: return '#666';
    }
  };

  return (
    <div className="production-controls">
      <div className="phase-info">
        <span className="phase-badge integration">Integration Phase</span>
        <span className="phase-description">
          {isVSCodeEnvironment ? 'Connected to VS Code' : 'Standalone Mode'} • React + Lexical + Sync Engine
        </span>
      </div>
      
      <div className="controls-group">
        {/* Theme Controls - only show in standalone mode */}
        {!isVSCodeEnvironment && (
          <div className="theme-switcher">
            <label>Theme:</label>
            {themes.map(theme => (
              <button
                key={theme}
                className={`theme-button ${currentTheme === theme ? 'active' : ''}`}
                onClick={() => onThemeChange(theme)}
                aria-pressed={currentTheme === theme}
              >
                {theme}
              </button>
            ))}
          </div>
        )}

        {/* Performance Monitor */}
        <div className="performance-monitor">
          <button
            onClick={() => setShowPerformancePanel(!showPerformancePanel)}
            className="performance-toggle"
            style={{ color: getPerformanceColor(performanceMetrics.status) }}
            aria-expanded={showPerformancePanel}
          >
            ⚡ {performanceMetrics.averageLatency.toFixed(1)}ms
          </button>
          {showPerformancePanel && (
            <div className="performance-panel">
              <div className="performance-stats">
                <div>Avg Latency: {performanceMetrics.averageLatency.toFixed(1)}ms</div>
                <div>Blocks: {performanceMetrics.blockCount}</div>
                <div>Status: <span style={{ color: getPerformanceColor(performanceMetrics.status) }}>
                  {performanceMetrics.status}
                </span></div>
                {performanceMetrics.memoryUsage && (
                  <div>Memory: {performanceMetrics.memoryUsage.toFixed(1)}MB</div>
                )}
              </div>
              <button onClick={onResetMetrics} className="reset-metrics">
                Reset Metrics
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Main Editor component wrapped with VS Code integration
const EditorWithIntegration: React.FC = () => {
  const [theme, setTheme] = useState<Theme>('light');
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { sendMessage, requestAsset, isVSCodeEnvironment } = useVSCodeBridge();
  
  // Initialize with empty blocks, will be populated from VS Code or sample data
  const { 
    blocks, 
    setBlocks, 
    convertBlock, 
    indentBlock, 
    moveBlock, 
    insertBlock 
  } = useBlocks([]);

  // Performance monitoring
  const {
    metrics,
    measureKeystrokeLatency,
    getPerformanceStatus,
    resetMetrics
  } = usePerformanceMonitor(blocks.length, {
    enabled: true,
    onLatencyThreshold: (latency) => {
      console.warn(`High latency detected: ${latency}ms`);
    }
  });

  // Export functionality
  const { downloadExport } = useExport();

  // Accessibility features
  const { announce } = useAccessibility({
    enableKeyboardNavigation: true,
    announceChanges: true,
    enableHighContrast: true
  });

  // Enhanced performance metrics with status
  const performanceMetrics = useMemo(() => ({
    ...metrics,
    status: getPerformanceStatus()
  }), [metrics, getPerformanceStatus]);

  // Handle blocks received from VS Code
  const handleBlocksReceived = useCallback((sharedBlocks: SharedBlock[]) => {
    console.log('[AppIntegrated] Received blocks from VS Code:', sharedBlocks.length);
    const uiBlocks = sharedToUIBlocks(sharedBlocks);
    setBlocks(uiBlocks);
    setIsInitialized(true);
    setIsLoading(false);
    announce(`Loaded document with ${uiBlocks.length} blocks`);
  }, [setBlocks, announce]);

  // Handle block changes and send to VS Code
  const handleBlocksChange = useCallback((newBlocks: Block[]) => {
    measureKeystrokeLatency();
    setBlocks(newBlocks);
    
    // Send changes to VS Code
    const sharedBlocks = uiToSharedBlocks(newBlocks);
    sendMessage({
      type: 'BLOCKS_CHANGED',
      payload: { blocks: sharedBlocks }
    });
    
    console.log('[AppIntegrated] Blocks updated:', newBlocks.length, 'blocks');
  }, [setBlocks, measureKeystrokeLatency, sendMessage]);

  // Handle asset requests (image paste, etc.)
  const handleAssetRequest = useCallback((dataUri: string, suggestedName?: string, targetBlockId?: string) => {
    console.log('[AppIntegrated] Asset requested:', { suggestedName, targetBlockId });
    // The actual request is handled by the VSCodeBridge
  }, []);

  // Initialize theme from VS Code or localStorage
  useEffect(() => {
    if (!isVSCodeEnvironment) {
      const savedTheme = localStorage.getItem('theme') as Theme;
      if (savedTheme) {
        setTheme(savedTheme);
      }
    }
  }, [isVSCodeEnvironment]);

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Handle theme changes
  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
    if (!isVSCodeEnvironment) {
      localStorage.setItem('theme', newTheme);
    }
  };

  // Initialize with sample data if not in VS Code
  useEffect(() => {
    if (!isVSCodeEnvironment && !isInitialized) {
      setTimeout(() => {
        console.log('[AppIntegrated] Initializing with sample data (standalone mode)');
        setBlocks(comprehensiveSampleDocument);
        setIsInitialized(true);
        setIsLoading(false);
        announce('Initialized with sample document');
      }, 1000);
    }
  }, [isVSCodeEnvironment, isInitialized, setBlocks, announce]);

  // Error recovery
  const handleErrorRecovery = () => {
    setError(null);
    setIsInitialized(false);
    setIsLoading(true);
    
    if (isVSCodeEnvironment) {
      sendMessage({ type: 'REQUEST_INIT', payload: {} });
    } else {
      setTimeout(() => {
        setBlocks(comprehensiveSampleDocument);
        setIsInitialized(true);
        setIsLoading(false);
        announce('Editor recovered successfully');
      }, 1000);
    }
  };

  // Loading state
  if (isLoading && !isInitialized) {
    return (
      <div className="app">
        <DocumentLoadingSkeleton />
      </div>
    );
  }

  // Error state
  if (error && !isInitialized) {
    return (
      <div className="app">
        <div className="error-container">
          <h2>Initialization Error</h2>
          <p>{error}</p>
          <button onClick={handleErrorRecovery}>Try Again</button>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        console.error('[AppIntegrated] Error Boundary:', error, errorInfo);
        announce('An error occurred in the editor');
        setError(error.message);
      }}
    >
      <div className="app">
        <IntegratedControls 
          currentTheme={theme} 
          onThemeChange={handleThemeChange}
          performanceMetrics={performanceMetrics}
          onResetMetrics={resetMetrics}
          isVSCodeEnvironment={isVSCodeEnvironment}
        />
        
        <LoadingOverlay isLoading={isLoading} message="Syncing with VS Code...">
          <main role="main" aria-label="Document editor">
            <InteractiveLexicalEditor
              blocks={blocks}
              onChange={handleBlocksChange}
              onConvertBlock={convertBlock}
              onIndentBlock={indentBlock}
              onMoveBlock={moveBlock}
              onInsertBlock={insertBlock}
              placeholder="Start typing or use / for commands..."
            />
          </main>
        </LoadingOverlay>
        
        {/* Error notification */}
        {error && (
          <div className="error-notification" role="alert">
            <span>{error}</span>
            <button onClick={() => setError(null)}>×</button>
          </div>
        )}
        
        {/* Integration info */}
        <div className="production-info">
          <span className="badge">Integration</span>
          <span>{isVSCodeEnvironment ? 'VS Code' : 'Standalone'}</span>
          <span>{blocks.length} blocks</span>
          <span>{theme} theme</span>
          <span className="performance-indicator" style={{ 
            color: performanceMetrics.status === 'good' ? '#107c10' : 
                   performanceMetrics.status === 'warning' ? '#ff8c00' : '#d13438' 
          }}>
            {performanceMetrics.averageLatency.toFixed(1)}ms
          </span>
        </div>
      </div>
    </ErrorBoundary>
  );
};

// Main App component with VS Code bridge
const AppIntegrated: React.FC = () => {
  const [blocks, setBlocks] = useState<Block[]>([]);
  
  return (
    <VSCodeBridge
      onBlocksReceived={(sharedBlocks) => {
        const uiBlocks = sharedToUIBlocks(sharedBlocks);
        setBlocks(uiBlocks);
      }}
      onBlocksChange={(uiBlocks) => {
        setBlocks(uiBlocks);
      }}
      onAssetRequest={(dataUri, suggestedName, targetBlockId) => {
        console.log('Asset requested:', { suggestedName, targetBlockId });
      }}
    >
      <EditorWithIntegration />
    </VSCodeBridge>
  );
};

export default AppIntegrated;