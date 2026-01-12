import { VsCodeApi, UIToHostMessage, HostToUIMessage, TextEdit, validateHostToUIMessage } from './types';

// Singleton VS Code API instance
let vscodeApi: VsCodeApi | null = null;

function getVsCodeApi(): VsCodeApi {
  if (!vscodeApi) {
    vscodeApi = window.acquireVsCodeApi();
  }
  return vscodeApi;
}

// Send messages to extension host
export function postMessage(message: UIToHostMessage): void {
  getVsCodeApi().postMessage(message);
}

export function requestInit(): void {
  console.log('SlashMD: Requesting init from host');
  postMessage({ type: 'REQUEST_INIT' });
}

export function requestSettings(): void {
  postMessage({ type: 'REQUEST_SETTINGS' });
}

export function applyTextEdits(
  edits: TextEdit[],
  reason: 'typing' | 'drag' | 'paste' | 'format'
): void {
  postMessage({ type: 'APPLY_TEXT_EDITS', edits, reason });
}

export function writeAsset(dataUri: string, suggestedName?: string): void {
  postMessage({ type: 'WRITE_ASSET', dataUri, suggestedName });
}

export function openLink(url: string): void {
  postMessage({ type: 'OPEN_LINK', url });
}

// Listen for messages from extension host
export type MessageHandler = (message: HostToUIMessage) => void;

const messageHandlers: Set<MessageHandler> = new Set();
const MAX_HANDLERS = 10; // Reasonable limit for a single webview

export function addMessageHandler(handler: MessageHandler): () => void {
  // SECURITY: Guard against unbounded growth - throw error instead of silently clearing
  // This indicates a bug (likely missing cleanup) that should be fixed
  if (messageHandlers.size >= MAX_HANDLERS) {
    console.error('SlashMD: Max message handlers reached. This indicates a memory leak - handlers are not being cleaned up properly.');
    throw new Error('Max message handlers reached. Ensure handlers are properly cleaned up when components unmount.');
  }
  messageHandlers.add(handler);
  return () => {
    messageHandlers.delete(handler);
  };
}

// Initialize message listener with runtime validation
function initMessageListener(): void {
  console.log('SlashMD: Setting up message listener');
  window.addEventListener('message', (event) => {
    console.log('SlashMD: Received message from host:', event.data);

    // SECURITY: Runtime validation of incoming messages
    const message = validateHostToUIMessage(event.data);
    if (!message) {
      console.warn('SlashMD: Ignoring invalid message from host');
      return;
    }

    messageHandlers.forEach((handler) => {
      try {
        handler(message);
      } catch (error) {
        console.error('SlashMD: Error in message handler:', error);
      }
    });
  });
}

initMessageListener();
