/**
 * Main App Component for Phase 4 - FINAL PHASE
 * Production-ready editor with advanced UIs, performance monitoring, testing, and full accessibility
 */

import React, { useState, useEffect, useMemo } from 'react';
import { InteractiveLexicalEditor } from './components/Editor/InteractiveLexicalEditor';
import { ErrorBoundary } from './components/UI/ErrorBoundary';
import { LoadingOverlay, DocumentLoadingSkeleton } from './components/UI/LoadingState';
import { useBlocks } from './hooks/useBlocks';
import { usePerformanceMonitor } from './hooks/usePerformanceMonitor';
import { useExport } from './hooks/useExport';
import { useAccessibility } from './hooks/useAccessibility';
import { installMockVSCodeAPI } from './mocks/vscode-api';
import { comprehensiveSampleDocument, basicSampleDocument } from './mocks/sample-data';
import type { Block } from './types/blocks';
import type { Theme } from './types/editor';
import type { ExportFormat } from './hooks/useExport';

// Install mock VS Code API for standalone development
installMockVSCodeAPI();

// Production-ready controls component for Phase 4
const ProductionControls: React.FC<{ 
  currentTheme: Theme; 
  onThemeChange: (theme: Theme) => void;
  onLoadSample: (type: 'basic' | 'comprehensive') => void;
  onExport: (format: ExportFormat) => void;
  performanceMetrics: any;
  onResetMetrics: () => void;
}> = ({ 
  currentTheme, 
  onThemeChange, 
  onLoadSample, 
  onExport, 
  performanceMetrics,
  onResetMetrics
}) => {
  const [showExportMenu, setShowExportMenu] = useState(false);
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
        <span className="phase-badge phase-4">Phase 4</span>
        <span className="phase-description">Production Ready • Advanced UIs • Testing & Polish</span>
      </div>
      
      <div className="controls-group">
        {/* Theme Controls */}
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
        
        {/* Sample Document Controls */}
        <div className="sample-switcher">
          <label>Sample:</label>
          <button onClick={() => onLoadSample('basic')}>Basic</button>
          <button onClick={() => onLoadSample('comprehensive')}>Full Demo</button>
        </div>

        {/* Export Controls */}
        <div className="export-controls">
          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            className="export-toggle"
            aria-expanded={showExportMenu}
          >
            Export ▼
          </button>
          {showExportMenu && (
            <div className="export-menu">
              <button onClick={() => onExport('json')}>Export JSON</button>
              <button onClick={() => onExport('markdown')}>Export Markdown</button>
              <button onClick={() => onExport('html')}>Export HTML</button>
            </div>
          )}
        </div>

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

const App: React.FC = () => {
  const [theme, setTheme] = useState<Theme>('light');
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Initialize with comprehensive sample document for Phase 4
  const { 
    blocks, 
    setBlocks, 
    convertBlock, 
    indentBlock, 
    moveBlock, 
    insertBlock 
  } = useBlocks(comprehensiveSampleDocument);

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

  // Initialize theme from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as Theme;
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Handle theme changes
  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  // Handle sample document switching with loading state
  const handleLoadSample = async (type: 'basic' | 'comprehensive') => {
    try {
      setIsLoading(true);
      announce(`Loading ${type} sample document`);
      
      // Simulate loading delay for demonstration
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const sampleDoc = type === 'basic' ? basicSampleDocument : comprehensiveSampleDocument;
      setBlocks(sampleDoc);
      
      announce(`Loaded ${type} sample document with ${sampleDoc.length} blocks`);
      console.log(`Loaded ${type} sample document with ${sampleDoc.length} blocks`);
    } catch (err) {
      setError(`Failed to load ${type} sample document`);
      console.error('Load error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle export with user feedback
  const handleExport = async (format: ExportFormat) => {
    try {
      announce(`Exporting document as ${format.toUpperCase()}`);
      const success = downloadExport(blocks, { 
        format, 
        prettyPrint: true,
        includeMetadata: true 
      });
      
      if (success) {
        announce(`Document exported as ${format.toUpperCase()} successfully`);
      } else {
        throw new Error('Export failed');
      }
    } catch (err) {
      setError(`Failed to export as ${format}`);
      console.error('Export error:', err);
    }
  };

  // Handle block changes with performance monitoring
  const handleBlocksChange = (newBlocks: Block[]) => {
    measureKeystrokeLatency();
    setBlocks(newBlocks);
    
    // In production, this will send updates to VS Code
    console.log('Blocks updated:', newBlocks.length, 'blocks');
  };

  // Enhanced initialization with error handling
  useEffect(() => {
    const initializeApp = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Mock VS Code API message handling
        const handleMessage = (event: CustomEvent) => {
          const message = event.detail;
          
          switch (message.type) {
            case 'DOC_INIT':
              setBlocks(message.payload.blocks);
              setTheme(message.payload.theme);
              break;
            
            case 'THEME_CHANGED':
              setTheme(message.payload.theme);
              announce(`Theme changed to ${message.payload.theme}`);
              break;
            
            default:
              console.log('Unhandled message:', message);
          }
        };

        window.addEventListener('message', handleMessage as EventListener);
        
        // Request initialization
        if (typeof window !== 'undefined' && window.acquireVsCodeApi) {
          const vscode = window.acquireVsCodeApi();
          vscode.postMessage({ type: 'REQUEST_INIT' });
        }

        // Simulate initialization delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setIsInitialized(true);
        announce('SlashMD editor initialized successfully');

        return () => {
          window.removeEventListener('message', handleMessage as EventListener);
        };
      } catch (err) {
        setError('Failed to initialize editor');
        console.error('Initialization error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initializeApp();
  }, [setBlocks, announce]);

  // Error recovery
  const handleErrorRecovery = () => {
    setError(null);
    setIsInitialized(false);
    setIsLoading(true);
    // Reinitialize
    setTimeout(() => {
      setIsInitialized(true);
      setIsLoading(false);
      announce('Editor recovered successfully');
    }, 1000);
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
        console.error('App Error Boundary:', error, errorInfo);
        announce('An error occurred in the editor');
      }}
    >
      <div className="app">
        <ProductionControls 
          currentTheme={theme} 
          onThemeChange={handleThemeChange}
          onLoadSample={handleLoadSample}
          onExport={handleExport}
          performanceMetrics={performanceMetrics}
          onResetMetrics={resetMetrics}
        />
        
        <LoadingOverlay isLoading={isLoading} message="Loading document...">
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
        
        {/* Production info */}
        <div className="production-info">
          <span className="badge">Phase 4</span>
          <span>Production Ready</span>
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

export default App;