import { VsCodeApi, UIToHostMessage, HostToUIMessage, TextEdit } from './types';

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

// Listen for messages from extension host
export type MessageHandler = (message: HostToUIMessage) => void;

const messageHandlers: Set<MessageHandler> = new Set();

export function addMessageHandler(handler: MessageHandler): () => void {
  messageHandlers.add(handler);
  return () => {
    messageHandlers.delete(handler);
  };
}

// Initialize message listener
function initMessageListener(): void {
  console.log('SlashMD: Setting up message listener');
  window.addEventListener('message', (event) => {
    console.log('SlashMD: Received message from host:', event.data);
    const message = event.data as HostToUIMessage;
    messageHandlers.forEach((handler) => handler(message));
  });
}

initMessageListener();
