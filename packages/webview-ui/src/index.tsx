// Import Prism before anything else - required by @lexical/code
import Prism from 'prismjs';
// Make Prism available globally for @lexical/code
(window as unknown as { Prism: typeof Prism }).Prism = Prism;

import { createRoot } from 'react-dom/client';
import { App } from './app/App';

console.log('SlashMD webview initializing...');

const container = document.getElementById('root');
if (container) {
  console.log('Root container found, mounting React app');
  try {
    const root = createRoot(container);
    root.render(<App />);
    console.log('React app mounted successfully');
  } catch (error) {
    console.error('Failed to mount React app:', error);
    container.innerHTML = `<div style="color: red; padding: 20px;">Error mounting app: ${error}</div>`;
  }
} else {
  console.error('Root container not found!');
  document.body.innerHTML = '<div style="color: red; padding: 20px;">Error: Root container not found</div>';
}
