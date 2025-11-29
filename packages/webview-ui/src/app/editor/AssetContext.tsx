import { createContext, useContext } from 'react';

interface AssetContextValue {
  assetBaseUri: string | undefined;
  resolveAssetPath: (path: string) => string;
}

export const AssetContext = createContext<AssetContextValue>({
  assetBaseUri: undefined,
  resolveAssetPath: (path) => path,
});

export function useAssetContext() {
  return useContext(AssetContext);
}

export function createAssetContextValue(assetBaseUri: string | undefined): AssetContextValue {
  return {
    assetBaseUri,
    resolveAssetPath: (path: string) => {
      // If it's already an absolute URL (http, https, vscode-webview-resource, data), return as-is
      if (
        path.startsWith('http://') ||
        path.startsWith('https://') ||
        path.startsWith('vscode-webview-resource:') ||
        path.startsWith('data:')
      ) {
        return path;
      }

      // If we have a base URI, resolve relative paths
      if (assetBaseUri) {
        return assetBaseUri + path;
      }

      // Fallback to original path
      return path;
    },
  };
}
