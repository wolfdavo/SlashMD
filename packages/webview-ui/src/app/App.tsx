import { useCallback, useEffect, useState, useRef } from 'react';
import { Editor } from './editor';
import {
  addMessageHandler,
  requestInit,
  applyTextEdits,
  writeAsset,
} from '../messaging';
import type { HostToUIMessage, SlashMDSettings, TextEdit, ThemeOverrides } from '../types';

// Simple diff algorithm to find the changed region between two strings
function computeMinimalEdits(oldText: string, newText: string): TextEdit[] {
  if (oldText === newText) return [];

  // Find common prefix
  let prefixLen = 0;
  const minLen = Math.min(oldText.length, newText.length);
  while (prefixLen < minLen && oldText[prefixLen] === newText[prefixLen]) {
    prefixLen++;
  }

  // Find common suffix (but don't overlap with prefix)
  let suffixLen = 0;
  while (
    suffixLen < minLen - prefixLen &&
    oldText[oldText.length - 1 - suffixLen] === newText[newText.length - 1 - suffixLen]
  ) {
    suffixLen++;
  }

  // Calculate the changed region
  const start = prefixLen;
  const end = oldText.length - suffixLen;
  const newTextContent = newText.slice(prefixLen, newText.length - suffixLen);

  return [{
    start,
    end,
    newText: newTextContent,
  }];
}

export function App() {
  const [content, setContent] = useState<string | null>(null);
  const [settings, setSettings] = useState<SlashMDSettings | null>(null);
  const [assetBaseUri, setAssetBaseUri] = useState<string | undefined>(undefined);
  const [documentDirUri, setDocumentDirUri] = useState<string | undefined>(undefined);
  const [themeOverrides, setThemeOverrides] = useState<ThemeOverrides | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const pendingAssetCallback = useRef<((relPath: string) => void) | null>(null);
  // Track the last known document content for diff computation
  const lastDocumentContent = useRef<string>('');

  useEffect(() => {
    console.log('SlashMD App: Setting up message handler');
    const removeHandler = addMessageHandler((message: HostToUIMessage) => {
      console.log('SlashMD App: Handling message:', message.type);
      switch (message.type) {
        case 'DOC_INIT':
          console.log('SlashMD App: Received DOC_INIT with', message.text?.length, 'chars');
          lastDocumentContent.current = message.text;
          setContent(message.text);
          setSettings(message.settings);
          setAssetBaseUri(message.assetBaseUri);
          setDocumentDirUri(message.documentDirUri);
          setThemeOverrides(message.themeOverrides);
          break;

        case 'DOC_CHANGED':
          lastDocumentContent.current = message.text;
          setContent(message.text);
          break;

        case 'SETTINGS_CHANGED':
          setSettings(message.settings);
          setThemeOverrides(message.themeOverrides);
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

  // Apply theme overrides as CSS variables
  useEffect(() => {
    if (!themeOverrides) return;

    const root = document.documentElement;
    for (const [property, value] of Object.entries(themeOverrides)) {
      root.style.setProperty(property, value);
    }
  }, [themeOverrides]);

  const handleChange = useCallback((markdown: string) => {
    // Calculate diff and send minimal edits
    const edits = computeMinimalEdits(lastDocumentContent.current, markdown);
    if (edits.length > 0) {
      lastDocumentContent.current = markdown;
      applyTextEdits(edits, 'typing');
    }
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
      <Editor
        initialContent={content}
        onChange={handleChange}
        assetBaseUri={assetBaseUri}
        documentDirUri={documentDirUri}
        imagePathResolution={settings?.imagePathResolution ?? 'document'}
      />
    </div>
  );
}
