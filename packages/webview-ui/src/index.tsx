// Import Prism before anything else - required by @lexical/code
import Prism from 'prismjs';

// Make Prism available globally for @lexical/code BEFORE importing language components
(window as unknown as { Prism: typeof Prism }).Prism = Prism;

// Import Prism languages for syntax highlighting
// Core languages (included by default): markup, css, clike, javascript
// Note: Order matters - some languages depend on others (e.g., tsx requires jsx, typescript)
//
// Performance note: These are eagerly loaded. For documents that don't use all
// languages, this adds ~30KB to the bundle. Future optimization could implement
// lazy loading based on languages detected in the document.
//
// Most commonly used languages (prioritized):
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-yaml';
import 'prismjs/components/prism-markdown';
// Additional languages:
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-cpp';
import 'prismjs/components/prism-csharp';
import 'prismjs/components/prism-go';
import 'prismjs/components/prism-rust';
import 'prismjs/components/prism-ruby';
import 'prismjs/components/prism-php';
import 'prismjs/components/prism-swift';
import 'prismjs/components/prism-kotlin';
import 'prismjs/components/prism-scss';
import 'prismjs/components/prism-powershell';
import 'prismjs/components/prism-docker';
import 'prismjs/components/prism-graphql';

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
