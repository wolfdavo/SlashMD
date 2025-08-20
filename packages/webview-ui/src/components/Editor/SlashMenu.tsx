/**
 * Slash Menu Component for Phase 3
 * Provides fuzzy search block insertion/conversion triggered by '/' character
 */

import React, { useState, useEffect, useRef } from 'react';
import type { BlockType } from '../../types/blocks';

// Block type definitions for the slash menu
interface SlashCommand {
  id: BlockType;
  label: string;
  description: string;
  category: 'Basic' | 'Lists' | 'Media' | 'Advanced';
  icon: string;
  keywords: string[];
}

const SLASH_COMMANDS: SlashCommand[] = [
  // Basic blocks
  {
    id: 'paragraph',
    label: 'Text',
    description: 'Start writing with plain text',
    category: 'Basic',
    icon: '📝',
    keywords: ['text', 'paragraph', 'p']
  },
  {
    id: 'heading',
    label: 'Heading',
    description: 'Section heading (H1-H3)',
    category: 'Basic',
    icon: 'H',
    keywords: ['heading', 'header', 'title', 'h1', 'h2', 'h3']
  },
  {
    id: 'quote',
    label: 'Quote',
    description: 'Capture a quote or citation',
    category: 'Basic',
    icon: '"',
    keywords: ['quote', 'blockquote', 'citation']
  },
  {
    id: 'divider',
    label: 'Divider',
    description: 'Visually separate content',
    category: 'Basic',
    icon: '—',
    keywords: ['divider', 'separator', 'line', 'hr']
  },
  
  // Lists
  {
    id: 'list',
    label: 'Bulleted List',
    description: 'Create a simple bulleted list',
    category: 'Lists',
    icon: '•',
    keywords: ['list', 'bullet', 'ul', 'unordered']
  },
  {
    id: 'taskList',
    label: 'To-do List',
    description: 'Track tasks with checkboxes',
    category: 'Lists',
    icon: '☐',
    keywords: ['todo', 'task', 'checkbox', 'check']
  },
  
  // Media
  {
    id: 'code',
    label: 'Code',
    description: 'Capture a code snippet',
    category: 'Media',
    icon: '</>',
    keywords: ['code', 'snippet', 'programming']
  },
  {
    id: 'image',
    label: 'Image',
    description: 'Upload or embed an image',
    category: 'Media',
    icon: '🖼️',
    keywords: ['image', 'picture', 'photo', 'img']
  },
  {
    id: 'table',
    label: 'Table',
    description: 'Create a structured table',
    category: 'Media',
    icon: '⊞',
    keywords: ['table', 'grid', 'data']
  },
  
  // Advanced
  {
    id: 'callout',
    label: 'Callout',
    description: 'Draw attention with a callout',
    category: 'Advanced',
    icon: '💡',
    keywords: ['callout', 'note', 'tip', 'warning', 'info']
  },
  {
    id: 'toggle',
    label: 'Toggle',
    description: 'Create a collapsible section',
    category: 'Advanced',
    icon: '▶',
    keywords: ['toggle', 'collapsible', 'details', 'expand']
  }
];

interface SlashMenuProps {
  isVisible: boolean;
  position: { x: number; y: number };
  searchTerm: string;
  onSelect: (blockType: BlockType) => void;
  onClose: () => void;
}

export const SlashMenu: React.FC<SlashMenuProps> = ({
  isVisible,
  position,
  searchTerm,
  onSelect,
  onClose
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Filter commands based on search term
  const filteredCommands = React.useMemo(() => {
    if (!searchTerm) return SLASH_COMMANDS;
    
    const term = searchTerm.toLowerCase();
    return SLASH_COMMANDS.filter(command => 
      command.label.toLowerCase().includes(term) ||
      command.description.toLowerCase().includes(term) ||
      command.keywords.some(keyword => keyword.toLowerCase().includes(term))
    ).sort((a, b) => {
      // Prioritize exact matches and label starts
      const aLabelMatch = a.label.toLowerCase().startsWith(term);
      const bLabelMatch = b.label.toLowerCase().startsWith(term);
      
      if (aLabelMatch && !bLabelMatch) return -1;
      if (!aLabelMatch && bLabelMatch) return 1;
      
      return 0;
    });
  }, [searchTerm]);

  // Reset selected index when filtered commands change
  useEffect(() => {
    setSelectedIndex(0);
    itemRefs.current = itemRefs.current.slice(0, filteredCommands.length);
  }, [filteredCommands.length]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isVisible) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          setSelectedIndex(prev => 
            prev < filteredCommands.length - 1 ? prev + 1 : 0
          );
          break;
        
        case 'ArrowUp':
          event.preventDefault();
          setSelectedIndex(prev => 
            prev > 0 ? prev - 1 : filteredCommands.length - 1
          );
          break;
        
        case 'Enter':
          event.preventDefault();
          if (filteredCommands[selectedIndex]) {
            onSelect(filteredCommands[selectedIndex].id);
          }
          break;
        
        case 'Escape':
          event.preventDefault();
          onClose();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isVisible, selectedIndex, filteredCommands, onSelect, onClose]);

  // Scroll selected item into view
  useEffect(() => {
    if (itemRefs.current[selectedIndex]) {
      itemRefs.current[selectedIndex]?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest'
      });
    }
  }, [selectedIndex]);

  // Handle clicks outside menu
  useEffect(() => {
    if (!isVisible) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isVisible, onClose]);

  if (!isVisible || filteredCommands.length === 0) {
    return null;
  }

  // Group commands by category
  const groupedCommands = filteredCommands.reduce((acc, command) => {
    if (!acc[command.category]) {
      acc[command.category] = [];
    }
    acc[command.category].push(command);
    return acc;
  }, {} as Record<string, SlashCommand[]>);

  const categories = Object.keys(groupedCommands) as Array<keyof typeof groupedCommands>;

  return (
    <div
      ref={menuRef}
      className="slash-menu"
      style={{
        position: 'absolute',
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
    >
      <div className="slash-menu-content">
        {categories.map((category, categoryIndex) => (
          <div key={category} className="slash-menu-category">
            {categories.length > 1 && (
              <div className="slash-menu-category-label">{category}</div>
            )}
            {groupedCommands[category].map((command, commandIndex) => {
              const globalIndex = categories
                .slice(0, categoryIndex)
                .reduce((sum, cat) => sum + groupedCommands[cat].length, 0) + commandIndex;
              
              return (
                <div
                  key={command.id}
                  ref={(el) => {itemRefs.current[globalIndex] = el;}}
                  className={`slash-menu-item ${selectedIndex === globalIndex ? 'selected' : ''}`}
                  onClick={() => onSelect(command.id)}
                >
                  <div className="slash-menu-item-icon">{command.icon}</div>
                  <div className="slash-menu-item-content">
                    <div className="slash-menu-item-label">{command.label}</div>
                    <div className="slash-menu-item-description">{command.description}</div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
      
      {searchTerm && (
        <div className="slash-menu-footer">
          <span className="slash-menu-search-term">"{searchTerm}"</span>
          <span className="slash-menu-count">
            {filteredCommands.length} result{filteredCommands.length !== 1 ? 's' : ''}
          </span>
        </div>
      )}
    </div>
  );
};