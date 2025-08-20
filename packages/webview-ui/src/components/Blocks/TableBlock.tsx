/**
 * Table Block Component for Phase 2
 * Renders editable tables with row/column management
 */

import { 
  DecoratorNode, 
  NodeKey, 
  SerializedLexicalNode,
  Spread
} from 'lexical';

import React, { useState } from 'react';
import type { TableContent, TableCell } from '../../types/blocks';

export interface SerializedTableNode extends Spread<{
  content: TableContent;
  blockId: string;
}, SerializedLexicalNode> {}

export class TableNode extends DecoratorNode<React.ReactElement> {
  __content: TableContent;
  __blockId: string;

  static getType(): string {
    return 'table-block';
  }

  static clone(node: TableNode): TableNode {
    return new TableNode(node.__content, node.__blockId, node.__key);
  }

  constructor(content: TableContent, blockId: string, key?: NodeKey) {
    super(key);
    this.__content = content;
    this.__blockId = blockId;
  }

  createDOM(): HTMLElement {
    const element = document.createElement('div');
    element.className = 'table-block block-container';
    return element;
  }

  updateDOM(): false {
    return false;
  }

  static importJSON(serializedNode: SerializedTableNode): TableNode {
    return new TableNode(serializedNode.content, serializedNode.blockId);
  }

  exportJSON(): SerializedTableNode {
    return {
      type: 'table-block',
      content: this.__content,
      blockId: this.__blockId,
      version: 1,
    };
  }

  getContent(): TableContent {
    return this.__content;
  }

  getBlockId(): string {
    return this.__blockId;
  }

  setContent(content: TableContent): void {
    const writable = this.getWritable();
    writable.__content = content;
  }

  decorate(): React.ReactElement {
    return <TableBlockComponent node={this} />;
  }

  isInline(): false {
    return false;
  }
}

interface TableBlockComponentProps {
  node: TableNode;
}

const TableBlockComponent: React.FC<TableBlockComponentProps> = ({ node }) => {
  const content = node.getContent();
  const blockId = node.getBlockId();
  const [selectedCell, setSelectedCell] = useState<{row: number; col: number} | null>(null);

  const handleCellChange = (rowIndex: number, colIndex: number, newText: string, isHeader = false) => {
    const newContent = { ...content };
    
    if (isHeader) {
      newContent.headers = [...newContent.headers];
      newContent.headers[colIndex] = { ...newContent.headers[colIndex], text: newText };
    } else {
      newContent.rows = [...newContent.rows];
      newContent.rows[rowIndex] = [...newContent.rows[rowIndex]];
      newContent.rows[rowIndex][colIndex] = { ...newContent.rows[rowIndex][colIndex], text: newText };
    }
    
    node.setContent(newContent);
  };

  const addRow = () => {
    const newContent = { ...content };
    const newRow: TableCell[] = Array(content.headers.length).fill(null).map(() => ({ text: '' }));
    newContent.rows = [...newContent.rows, newRow];
    node.setContent(newContent);
  };

  const removeRow = (rowIndex: number) => {
    if (content.rows.length <= 1) return; // Keep at least one row
    
    const newContent = { ...content };
    newContent.rows = newContent.rows.filter((_, index) => index !== rowIndex);
    node.setContent(newContent);
  };

  const addColumn = () => {
    const newContent = { ...content };
    
    // Add header
    newContent.headers = [...newContent.headers, { text: '' }];
    
    // Add cell to each row
    newContent.rows = newContent.rows.map(row => [...row, { text: '' }]);
    
    // Add alignment if exists
    if (newContent.alignments) {
      newContent.alignments = [...newContent.alignments, null];
    }
    
    node.setContent(newContent);
  };

  const removeColumn = (colIndex: number) => {
    if (content.headers.length <= 1) return; // Keep at least one column
    
    const newContent = { ...content };
    
    // Remove header
    newContent.headers = newContent.headers.filter((_, index) => index !== colIndex);
    
    // Remove cell from each row
    newContent.rows = newContent.rows.map(row => row.filter((_, index) => index !== colIndex));
    
    // Remove alignment if exists
    if (newContent.alignments) {
      newContent.alignments = newContent.alignments.filter((_, index) => index !== colIndex);
    }
    
    node.setContent(newContent);
  };

  const setColumnAlignment = (colIndex: number, alignment: 'left' | 'center' | 'right' | null) => {
    const newContent = { ...content };
    
    if (!newContent.alignments) {
      newContent.alignments = Array(content.headers.length).fill(null);
    }
    
    newContent.alignments = [...newContent.alignments];
    newContent.alignments[colIndex] = alignment;
    
    node.setContent(newContent);
  };

  // Initialize table if empty
  if (content.headers.length === 0 || content.rows.length === 0) {
    const initialContent: TableContent = {
      headers: [{ text: 'Column 1' }, { text: 'Column 2' }],
      rows: [[{ text: '' }, { text: '' }]],
      alignments: [null, null]
    };
    node.setContent(initialContent);
    return null; // Re-render with new content
  }

  return (
    <div className="block-container table-block" data-block-id={blockId}>
      <div className="drag-handle" title="Drag to move">••</div>
      
      <div className="table-controls">
        <button onClick={addRow} className="table-control-btn" title="Add row">
          + Row
        </button>
        <button onClick={addColumn} className="table-control-btn" title="Add column">
          + Column
        </button>
      </div>

      <div className="table-wrapper">
        <table className="table-content">
          <thead>
            <tr>
              {content.headers.map((header, colIndex) => {
                const alignment = content.alignments?.[colIndex];
                return (
                  <th 
                    key={colIndex} 
                    style={{ textAlign: alignment || 'left' }}
                    className={selectedCell?.row === -1 && selectedCell?.col === colIndex ? 'selected' : ''}
                  >
                    <div className="cell-wrapper">
                      <div
                        className="cell-content"
                        contentEditable
                        suppressContentEditableWarning={true}
                        onInput={(e) => handleCellChange(-1, colIndex, e.currentTarget.textContent || '', true)}
                        onFocus={() => setSelectedCell({ row: -1, col: colIndex })}
                        dangerouslySetInnerHTML={{ __html: header.text }}
                        data-placeholder="Header..."
                      />
                      <div className="cell-controls">
                        <button
                          onClick={() => setColumnAlignment(colIndex, alignment === 'left' ? 'center' : alignment === 'center' ? 'right' : 'left')}
                          className="alignment-btn"
                          title="Change alignment"
                        >
                          {alignment === 'center' ? '⟷' : alignment === 'right' ? '→' : '←'}
                        </button>
                        <button
                          onClick={() => removeColumn(colIndex)}
                          className="remove-btn"
                          title="Remove column"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {content.rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((cell, colIndex) => {
                  const alignment = content.alignments?.[colIndex];
                  return (
                    <td 
                      key={colIndex} 
                      style={{ textAlign: alignment || 'left' }}
                      className={selectedCell?.row === rowIndex && selectedCell?.col === colIndex ? 'selected' : ''}
                    >
                      <div className="cell-wrapper">
                        <div
                          className="cell-content"
                          contentEditable
                          suppressContentEditableWarning={true}
                          onInput={(e) => handleCellChange(rowIndex, colIndex, e.currentTarget.textContent || '')}
                          onFocus={() => setSelectedCell({ row: rowIndex, col: colIndex })}
                          dangerouslySetInnerHTML={{ __html: cell.text }}
                          data-placeholder="Cell..."
                        />
                        {colIndex === row.length - 1 && (
                          <button
                            onClick={() => removeRow(rowIndex)}
                            className="remove-row-btn"
                            title="Remove row"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TableBlockComponent;