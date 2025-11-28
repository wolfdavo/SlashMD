import { useCallback, useEffect, useState, useRef } from 'react';
import { Editor } from './editor';
import {
  addMessageHandler,
  requestInit,
  applyTextEdits,
  writeAsset,
} from '../messaging';
import type { HostToUIMessage, SlashMDSettings, TextEdit } from '../types';

export function App() {
  const [content, setContent] = useState<string | null>(null);
  const [settings, setSettings] = useState<SlashMDSettings | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pendingAssetCallback = useRef<((relPath: string) => void) | null>(null);

  useEffect(() => {
    console.log('SlashMD App: Setting up message handler');
    const removeHandler = addMessageHandler((message: HostToUIMessage) => {
      console.log('SlashMD App: Handling message:', message.type);
      switch (message.type) {
        case 'DOC_INIT':
          console.log('SlashMD App: Received DOC_INIT with', message.text?.length, 'chars');
          setContent(message.text);
          setSettings(message.settings);
          break;

        case 'DOC_CHANGED':
          setContent(message.text);
          break;

        case 'SETTINGS_CHANGED':
          setSettings(message.settings);
          break;

        case 'ASSET_WRITTEN':
          if (pendingAssetCallback.current) {
            pendingAssetCallback.current(message.relPath);
            pendingAssetCallback.current = null;
          }
          break;

        case 'ERROR':
          setError(message.message);
          setTimeout(() => setError(null), 5000);
          break;
      }
    });

    // Request initial content
    requestInit();

    return removeHandler;
  }, []);

  const handleChange = useCallback((markdown: string) => {
    // Calculate diff and send minimal edits
    // For now, we'll send the full text replacement
    const edit: TextEdit = {
      start: 0,
      end: Number.MAX_SAFE_INTEGER, // Will be clamped by the host
      newText: markdown,
    };
    applyTextEdits([edit], 'typing');
  }, []);

  const handleImagePaste = useCallback(
    (dataUri: string, callback: (relPath: string) => void) => {
      pendingAssetCallback.current = callback;
      writeAsset(dataUri);
    },
    []
  );

  if (content === null) {
    return (
      <div className="loading">
        <div className="loading-spinner" />
        <span>Loading document...</span>
      </div>
    );
  }

  return (
    <div className="app">
      {error && (
        <div className="error-banner" role="alert">
          {error}
        </div>
      )}
      <Editor initialContent={content} onChange={handleChange} />
    </div>
  );
}
