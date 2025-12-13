import { useCallback, useEffect, useRef, useState } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getRoot, $isTextNode, TextNode, LexicalNode } from 'lexical';

interface SearchMatch {
  node: TextNode;
  startOffset: number;
  endOffset: number;
  index: number;
}

// Debounce delay in ms
const SEARCH_DEBOUNCE_MS = 150;

export function SearchPlugin() {
  const [editor] = useLexicalComposerContext();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [matches, setMatches] = useState<SearchMatch[]>([]);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const highlightLayerRef = useRef<HTMLDivElement | null>(null);
  const debounceTimerRef = useRef<number | null>(null);

  // Debounce the query
  useEffect(() => {
    if (debounceTimerRef.current !== null) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = window.setTimeout(() => {
      setDebouncedQuery(query);
      debounceTimerRef.current = null;
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      if (debounceTimerRef.current !== null) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [query]);

  // Get all text nodes recursively
  const getAllTextNodes = useCallback((node: LexicalNode): TextNode[] => {
    const textNodes: TextNode[] = [];

    if ($isTextNode(node)) {
      textNodes.push(node);
    }

    if ('getChildren' in node && typeof node.getChildren === 'function') {
      const children = (node as { getChildren: () => LexicalNode[] }).getChildren();
      children.forEach((child: LexicalNode) => {
        textNodes.push(...getAllTextNodes(child));
      });
    }

    return textNodes;
  }, []);

  // Find all text matches in the editor
  const findMatches = useCallback((searchQuery: string): SearchMatch[] => {
    if (!searchQuery.trim()) return [];

    const foundMatches: SearchMatch[] = [];
    const lowerQuery = searchQuery.toLowerCase();

    editor.getEditorState().read(() => {
      const root = $getRoot();
      const textNodes = getAllTextNodes(root);

      textNodes.forEach((node) => {
        const text = node.getTextContent().toLowerCase();
        let startIndex = 0;

        while (true) {
          const matchIndex = text.indexOf(lowerQuery, startIndex);
          if (matchIndex === -1) break;

          foundMatches.push({
            node,
            startOffset: matchIndex,
            endOffset: matchIndex + searchQuery.length,
            index: foundMatches.length,
          });

          startIndex = matchIndex + 1;
        }
      });
    });

    return foundMatches;
  }, [editor, getAllTextNodes]);

  // Run search when debounced query changes
  useEffect(() => {
    const found = findMatches(debouncedQuery);
    setMatches(found);
    setCurrentMatchIndex(found.length > 0 ? 0 : -1);
  }, [debouncedQuery, findMatches]);

  // Find the actual text node in the DOM
  const findTextNodeWithContent = useCallback((element: Element, content: string): Node | null => {
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    let node: Node | null;

    while ((node = walker.nextNode())) {
      if (node.textContent && node.textContent.includes(content.substring(0, Math.min(content.length, 10)))) {
        return node;
      }
    }

    // Fallback: just return the first text node
    const textWalker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    return textWalker.nextNode();
  }, []);

  // Create highlight overlay for matches
  const updateHighlights = useCallback(() => {
    // Remove existing highlights
    if (highlightLayerRef.current) {
      highlightLayerRef.current.remove();
      highlightLayerRef.current = null;
    }

    if (matches.length === 0 || !debouncedQuery.trim()) return;

    // Create highlight layer
    const editorElement = editor.getRootElement();
    if (!editorElement) return;

    const editorContainer = editorElement.closest('.editor-container');
    if (!editorContainer) return;

    // Create highlight container
    const highlightLayer = document.createElement('div');
    highlightLayer.className = 'search-highlight-layer';
    editorContainer.appendChild(highlightLayer);
    highlightLayerRef.current = highlightLayer;

    // Get container bounds for positioning (use container, not editor element)
    const containerRect = editorContainer.getBoundingClientRect();

    matches.forEach((match, idx) => {
      editor.getEditorState().read(() => {
        const key = match.node.getKey();
        const domElement = editor.getElementByKey(key);

        if (!domElement) return;

        // Find the text node within the DOM element
        const textNode = findTextNodeWithContent(domElement, match.node.getTextContent());
        if (!textNode) return;

        // Create a range for the match
        const range = document.createRange();
        try {
          range.setStart(textNode, match.startOffset);
          range.setEnd(textNode, match.endOffset);
        } catch {
          return;
        }

        // Get the bounding rectangles for the range
        const rects = Array.from(range.getClientRects());

        for (const rect of rects) {
          const highlight = document.createElement('div');
          highlight.className = `search-highlight ${idx === currentMatchIndex ? 'current' : ''}`;
          // Position relative to the container, accounting for scroll
          highlight.style.left = `${rect.left - containerRect.left + editorContainer.scrollLeft}px`;
          highlight.style.top = `${rect.top - containerRect.top + editorContainer.scrollTop}px`;
          highlight.style.width = `${rect.width}px`;
          highlight.style.height = `${rect.height}px`;
          highlightLayer.appendChild(highlight);
        }
      });
    });
  }, [editor, matches, currentMatchIndex, debouncedQuery, findTextNodeWithContent]);

  // Scroll to current match
  const scrollToMatch = useCallback((matchIndex: number) => {
    if (matches.length === 0 || matchIndex < 0 || matchIndex >= matches.length) return;

    const match = matches[matchIndex];

    editor.getEditorState().read(() => {
      const key = match.node.getKey();
      const domElement = editor.getElementByKey(key);

      if (domElement) {
        domElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
  }, [editor, matches]);

  // Navigate to next match
  const goToNextMatch = useCallback(() => {
    if (matches.length === 0) return;
    const nextIndex = (currentMatchIndex + 1) % matches.length;
    setCurrentMatchIndex(nextIndex);
    scrollToMatch(nextIndex);
  }, [matches, currentMatchIndex, scrollToMatch]);

  // Navigate to previous match
  const goToPrevMatch = useCallback(() => {
    if (matches.length === 0) return;
    const prevIndex = currentMatchIndex <= 0 ? matches.length - 1 : currentMatchIndex - 1;
    setCurrentMatchIndex(prevIndex);
    scrollToMatch(prevIndex);
  }, [matches, currentMatchIndex, scrollToMatch]);

  // Close search
  const closeSearch = useCallback(() => {
    // Save scroll position before any DOM changes
    const scrollY = window.scrollY;
    const scrollX = window.scrollX;

    setIsOpen(false);
    setQuery('');
    setDebouncedQuery('');
    setMatches([]);
    setCurrentMatchIndex(-1);

    // Remove highlights
    if (highlightLayerRef.current) {
      highlightLayerRef.current.remove();
      highlightLayerRef.current = null;
    }

    // Return focus to editor without scrolling
    const editorElement = editor.getRootElement();
    if (editorElement) {
      // Use preventScroll to avoid jumping
      editorElement.focus({ preventScroll: true });
    }

    // Restore scroll position in case it shifted
    requestAnimationFrame(() => {
      window.scrollTo(scrollX, scrollY);
    });
  }, [editor]);

  // Update highlights when matches or current index changes
  useEffect(() => {
    if (isOpen) {
      updateHighlights();
    }
  }, [isOpen, matches, currentMatchIndex, updateHighlights]);

  // Update highlights on scroll
  useEffect(() => {
    if (!isOpen || matches.length === 0) return;

    const editorElement = editor.getRootElement();
    if (!editorElement) return;

    const handleScroll = () => {
      requestAnimationFrame(updateHighlights);
    };

    // Listen on window and editor container for scroll events
    window.addEventListener('scroll', handleScroll, true);

    return () => {
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [isOpen, matches.length, editor, updateHighlights]);

  // Cleanup highlights on unmount or when closing
  useEffect(() => {
    return () => {
      if (highlightLayerRef.current) {
        highlightLayerRef.current.remove();
        highlightLayerRef.current = null;
      }
    };
  }, []);

  // Re-update highlights when editor content changes
  useEffect(() => {
    if (!isOpen) return;

    const unregister = editor.registerUpdateListener(() => {
      if (debouncedQuery) {
        const found = findMatches(debouncedQuery);
        setMatches(found);
        // Keep current index in bounds
        setCurrentMatchIndex(prev =>
          found.length === 0 ? -1 : Math.min(prev, found.length - 1)
        );
      }
    });

    return unregister;
  }, [editor, isOpen, debouncedQuery, findMatches]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+F or Ctrl+F to open search
      if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
        e.preventDefault();
        e.stopPropagation();
        setIsOpen(true);
        // Focus input after render
        setTimeout(() => {
          inputRef.current?.focus();
          inputRef.current?.select();
        }, 0);
        return;
      }

      // Only handle these if search is open
      if (!isOpen) return;

      // Escape to close
      if (e.key === 'Escape') {
        e.preventDefault();
        closeSearch();
        return;
      }

      // Enter to go to next, Shift+Enter to go to previous
      if (e.key === 'Enter' && document.activeElement === inputRef.current) {
        e.preventDefault();
        if (e.shiftKey) {
          goToPrevMatch();
        } else {
          goToNextMatch();
        }
        return;
      }

      // Cmd+G or Ctrl+G for next match (even when not focused on input)
      if ((e.metaKey || e.ctrlKey) && e.key === 'g') {
        e.preventDefault();
        if (e.shiftKey) {
          goToPrevMatch();
        } else {
          goToNextMatch();
        }
        return;
      }
    };

    // Use capture phase to intercept before browser default
    document.addEventListener('keydown', handleKeyDown, true);

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [isOpen, closeSearch, goToNextMatch, goToPrevMatch]);

  // Scroll to first match when search results appear
  useEffect(() => {
    if (matches.length > 0 && currentMatchIndex === 0) {
      scrollToMatch(0);
    }
  }, [matches, currentMatchIndex, scrollToMatch]);

  if (!isOpen) return null;

  return (
    <div className="search-bar">
      <div className="search-input-wrapper">
        <svg className="search-icon" viewBox="0 0 24 24" width="16" height="16">
          <path
            fill="currentColor"
            d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"
          />
        </svg>
        <input
          ref={inputRef}
          type="text"
          className="search-input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search..."
          autoFocus
        />
        {query && (
          <span className="search-count">
            {matches.length > 0
              ? `${currentMatchIndex + 1} of ${matches.length}`
              : debouncedQuery !== query ? '...' : 'No results'}
          </span>
        )}
      </div>
      <div className="search-buttons">
        <button
          type="button"
          className="search-nav-button"
          onClick={goToPrevMatch}
          disabled={matches.length === 0}
          title="Previous match (Shift+Enter)"
          aria-label="Previous match"
        >
          <svg viewBox="0 0 24 24" width="16" height="16">
            <path fill="currentColor" d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z" />
          </svg>
        </button>
        <button
          type="button"
          className="search-nav-button"
          onClick={goToNextMatch}
          disabled={matches.length === 0}
          title="Next match (Enter)"
          aria-label="Next match"
        >
          <svg viewBox="0 0 24 24" width="16" height="16">
            <path fill="currentColor" d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6z" />
          </svg>
        </button>
        <button
          type="button"
          className="search-close-button"
          onClick={closeSearch}
          title="Close (Escape)"
          aria-label="Close search"
        >
          <svg viewBox="0 0 24 24" width="16" height="16">
            <path
              fill="currentColor"
              d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
