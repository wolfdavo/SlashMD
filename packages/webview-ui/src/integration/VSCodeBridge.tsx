/**
 * VS Code Integration Bridge for SlashMD WebView
 * Handles communication between React app and VS Code extension
 */

import React, { useEffect, useCallback, useRef } from 'react';
import type { Block } from '../types/shared';

// VS Code API interface
interface VSCodeAPI {
  postMessage(message: any): void;
  setState(state: any): void;
  getState(): any;
}

// WebView message types
interface VSCodeMessage {
  type: string;
  payload: any;
}

// Props for the VS Code bridge component
interface VSCodeBridgeProps {
  children: React.ReactNode;
  onBlocksReceived: (blocks: Block[]) => void;
  onBlocksChange: (blocks: Block[]) => void;
  onAssetRequest: (dataUri: string, suggestedName?: string, targetBlockId?: string) => void;
}

// VS Code bridge context
export const VSCodeBridgeContext = React.createContext<{
  sendMessage: (message: any) => void;
  requestAsset: (dataUri: string, suggestedName?: string, targetBlockId?: string) => void;
  isVSCodeEnvironment: boolean;
} | null>(null);

export const VSCodeBridge: React.FC<VSCodeBridgeProps> = ({
  children,
  onBlocksReceived,
  onBlocksChange,
  onAssetRequest
}) => {
  const vscodeApiRef = useRef<VSCodeAPI | null>(null);
  const isVSCodeEnvironment = typeof (globalThis as any).acquireVsCodeApi === 'function';

  // Initialize VS Code API
  useEffect(() => {
    if (isVSCodeEnvironment) {
      vscodeApiRef.current = (globalThis as any).acquireVsCodeApi();
      console.log('[VSCodeBridge] VS Code API acquired');
    } else {
      console.log('[VSCodeBridge] Running in standalone mode');
    }
  }, [isVSCodeEnvironment]);

  // Send message to VS Code extension
  const sendMessage = useCallback((message: any) => {
    if (vscodeApiRef.current) {
      vscodeApiRef.current.postMessage(message);
      console.log('[VSCodeBridge] Sent message to VS Code:', message.type);
    } else {
      console.log('[VSCodeBridge] Would send message (standalone mode):', message);
    }
  }, []);

  // Request asset write
  const requestAsset = useCallback((dataUri: string, suggestedName?: string, targetBlockId?: string) => {
    sendMessage({
      type: 'WRITE_ASSET',
      payload: {
        dataUri,
        suggestedName,
        targetBlockId
      }
    });
    onAssetRequest(dataUri, suggestedName, targetBlockId);
  }, [sendMessage, onAssetRequest]);

  // Handle messages from VS Code extension
  useEffect(() => {
    const handleMessage = (event: MessageEvent<VSCodeMessage>) => {
      const message = event.data;
      console.log('[VSCodeBridge] Received message from VS Code:', message.type);

      switch (message.type) {
        case 'DOC_INIT':
          onBlocksReceived(message.payload.blocks || []);
          break;

        case 'DOC_CHANGED':
          onBlocksReceived(message.payload.blocks || []);
          break;

        case 'ASSET_WRITTEN':
          // Handle asset written confirmation
          console.log('[VSCodeBridge] Asset written:', message.payload.relPath);
          // Could emit an event or update state here
          break;

        case 'SETTINGS_CHANGED':
          // Handle settings changes
          console.log('[VSCodeBridge] Settings changed:', message.payload.settings);
          break;

        case 'ERROR':
          console.error('[VSCodeBridge] VS Code error:', message.payload.message);
          break;

        default:
          console.warn('[VSCodeBridge] Unknown message type:', message.type);
      }
    };

    if (isVSCodeEnvironment) {
      window.addEventListener('message', handleMessage);
      
      // Request initial document data
      sendMessage({ type: 'REQUEST_INIT', payload: {} });
      
      return () => {
        window.removeEventListener('message', handleMessage);
      };
    }
  }, [isVSCodeEnvironment, sendMessage, onBlocksReceived]);

  // Send block changes to VS Code
  useEffect(() => {
    if (!isVSCodeEnvironment) return;

    const handleBlocksChange = (blocks: Block[]) => {
      // Send blocks changes to VS Code
      sendMessage({
        type: 'BLOCKS_CHANGED',
        payload: { blocks }
      });
    };

    // Set up a debounced version to avoid spam
    let timeout: NodeJS.Timeout;
    const debouncedSend = (blocks: Block[]) => {
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => handleBlocksChange(blocks), 300);
    };

    // Note: In a real implementation, we would listen to block changes here
    // For now, we rely on the parent component to call onBlocksChange
    
    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [isVSCodeEnvironment, sendMessage]);

  const contextValue = {
    sendMessage,
    requestAsset,
    isVSCodeEnvironment
  };

  return (
    <VSCodeBridgeContext.Provider value={contextValue}>
      {children}
    </VSCodeBridgeContext.Provider>
  );
};

// Hook to use VS Code bridge
export const useVSCodeBridge = () => {
  const context = React.useContext(VSCodeBridgeContext);
  if (!context) {
    throw new Error('useVSCodeBridge must be used within VSCodeBridge');
  }
  return context;
};