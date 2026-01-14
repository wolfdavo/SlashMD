import { useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { openLink } from '../../messaging';

/**
 * LinkClickPlugin - Controls link click behavior
 *
 * - Regular click: Edit the link (prevents default navigation)
 * - Cmd+click (Mac) / Ctrl+click (Windows/Linux): Open the link
 *   - Wiki-links (.md files): Opens the linked document in VS Code
 *   - External URLs (http/https): Opens in default browser
 *
 * Also provides visual feedback: cursor changes to pointer when Cmd/Ctrl is held
 * while hovering over a link.
 */
export function LinkClickPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    const rootElement = editor.getRootElement();
    if (!rootElement) return;

    const handleClick = (event: MouseEvent) => {
      // Find if we clicked on a link
      const target = event.target as HTMLElement;
      const linkElement = target.closest('a');
      if (!linkElement) return;

      // Check for modifier key (Cmd on Mac, Ctrl on Windows/Linux)
      const isModifierClick = event.metaKey || event.ctrlKey;

      if (isModifierClick) {
        // Modifier+click: Open the link
        event.preventDefault();
        event.stopPropagation();

        // URL is stored in data-href (not href) to prevent webview interception
        const url = linkElement.getAttribute('data-href');
        if (url) {
          openLink(url);
        }
      }
      // Regular click: No action needed - since there's no href, the browser
      // won't navigate, and the editor handles placing the cursor normally
    };

    // Handle modifier key state for cursor feedback
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey) {
        rootElement.classList.add('modifier-held');
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      // Remove class when Cmd/Ctrl is released
      if (event.key === 'Meta' || event.key === 'Control') {
        rootElement.classList.remove('modifier-held');
      }
    };

    // Also handle when window loses focus (user switches apps while holding Cmd)
    const handleBlur = () => {
      rootElement.classList.remove('modifier-held');
    };

    // Use capture phase to intercept before the link's default behavior
    rootElement.addEventListener('click', handleClick, { capture: true });
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);

    return () => {
      rootElement.removeEventListener('click', handleClick, { capture: true });
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
      rootElement.classList.remove('modifier-held');
    };
  }, [editor]);

  return null;
}
