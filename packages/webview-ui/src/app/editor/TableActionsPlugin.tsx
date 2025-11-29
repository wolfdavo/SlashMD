import { useCallback, useEffect, useState, useRef } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
} from 'lexical';
import {
  $createTableCellNode,
  $createTableRowNode,
  $isTableCellNode,
  $isTableNode,
  $isTableRowNode,
  TableCellNode,
  TableNode,
  TableRowNode,
  TableCellHeaderStates,
} from '@lexical/table';

interface TableActionsMenuProps {
  tableNode: TableNode;
  rowIndex: number;
  colIndex: number;
  position: { top: number; left: number };
  onClose: () => void;
}

function TableActionsMenu({ tableNode, rowIndex, colIndex, position, onClose }: TableActionsMenuProps) {
  const [editor] = useLexicalComposerContext();
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // Close on escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const getColumnCount = useCallback(() => {
    return editor.getEditorState().read(() => {
      const rows = tableNode.getChildren();
      if (rows.length > 0 && $isTableRowNode(rows[0])) {
        return rows[0].getChildren().length;
      }
      return 0;
    });
  }, [editor, tableNode]);

  const isHeaderRow = useCallback(() => {
    return editor.getEditorState().read(() => {
      const rows = tableNode.getChildren();
      const row = rows[rowIndex];
      if ($isTableRowNode(row)) {
        const cells = row.getChildren();
        if (cells.length > 0 && $isTableCellNode(cells[0])) {
          return cells[0].hasHeaderState(TableCellHeaderStates.ROW);
        }
      }
      return false;
    });
  }, [editor, tableNode, rowIndex]);

  const addRowAbove = useCallback(() => {
    editor.update(() => {
      const columnCount = getColumnCount();
      const rows = tableNode.getChildren();

      // Check if we're adding above the header row
      const targetRow = rows[rowIndex];
      const isInsertingAboveHeader = rowIndex === 0 && $isTableRowNode(targetRow);

      const newRow = $createTableRowNode();
      for (let i = 0; i < columnCount; i++) {
        // If inserting above header, new row becomes the header
        const headerState = isInsertingAboveHeader ? TableCellHeaderStates.ROW : TableCellHeaderStates.NO_STATUS;
        const cell = $createTableCellNode(headerState);
        const paragraph = $createParagraphNode();
        paragraph.append($createTextNode(''));
        cell.append(paragraph);
        newRow.append(cell);
      }

      if (rowIndex === 0) {
        tableNode.getFirstChild()?.insertBefore(newRow);
        // Convert old header row to regular row
        if ($isTableRowNode(targetRow)) {
          for (const cell of targetRow.getChildren()) {
            if ($isTableCellNode(cell)) {
              cell.setHeaderStyles(TableCellHeaderStates.NO_STATUS);
            }
          }
        }
      } else {
        const targetRow = rows[rowIndex];
        if (targetRow) {
          targetRow.insertBefore(newRow);
        }
      }
    });
    onClose();
  }, [editor, tableNode, rowIndex, getColumnCount, onClose]);

  const addRowBelow = useCallback(() => {
    editor.update(() => {
      const columnCount = getColumnCount();
      const rows = tableNode.getChildren();

      const newRow = $createTableRowNode();
      for (let i = 0; i < columnCount; i++) {
        const cell = $createTableCellNode(TableCellHeaderStates.NO_STATUS);
        const paragraph = $createParagraphNode();
        paragraph.append($createTextNode(''));
        cell.append(paragraph);
        newRow.append(cell);
      }

      const targetRow = rows[rowIndex];
      if (targetRow) {
        targetRow.insertAfter(newRow);
      }
    });
    onClose();
  }, [editor, tableNode, rowIndex, getColumnCount, onClose]);

  const addColumnLeft = useCallback(() => {
    editor.update(() => {
      const rows = tableNode.getChildren();

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        if ($isTableRowNode(row)) {
          const cells = row.getChildren();
          const isHeader = i === 0;
          const headerState = isHeader ? TableCellHeaderStates.ROW : TableCellHeaderStates.NO_STATUS;

          const newCell = $createTableCellNode(headerState);
          const paragraph = $createParagraphNode();
          paragraph.append($createTextNode(isHeader ? 'Header' : ''));
          newCell.append(paragraph);

          if (colIndex === 0) {
            row.getFirstChild()?.insertBefore(newCell);
          } else {
            const targetCell = cells[colIndex];
            if (targetCell) {
              targetCell.insertBefore(newCell);
            }
          }
        }
      }
    });
    onClose();
  }, [editor, tableNode, colIndex, onClose]);

  const addColumnRight = useCallback(() => {
    editor.update(() => {
      const rows = tableNode.getChildren();

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        if ($isTableRowNode(row)) {
          const cells = row.getChildren();
          const isHeader = i === 0;
          const headerState = isHeader ? TableCellHeaderStates.ROW : TableCellHeaderStates.NO_STATUS;

          const newCell = $createTableCellNode(headerState);
          const paragraph = $createParagraphNode();
          paragraph.append($createTextNode(isHeader ? 'Header' : ''));
          newCell.append(paragraph);

          const targetCell = cells[colIndex];
          if (targetCell) {
            targetCell.insertAfter(newCell);
          }
        }
      }
    });
    onClose();
  }, [editor, tableNode, colIndex, onClose]);

  const deleteRow = useCallback(() => {
    editor.update(() => {
      const rows = tableNode.getChildren();

      // Don't delete if it's the only row
      if (rows.length <= 1) {
        return;
      }

      const targetRow = rows[rowIndex];
      if (targetRow && $isTableRowNode(targetRow)) {
        // If deleting header row, make next row the header
        if (rowIndex === 0 && rows.length > 1) {
          const nextRow = rows[1];
          if ($isTableRowNode(nextRow)) {
            for (const cell of nextRow.getChildren()) {
              if ($isTableCellNode(cell)) {
                cell.setHeaderStyles(TableCellHeaderStates.ROW);
              }
            }
          }
        }
        targetRow.remove();
      }
    });
    onClose();
  }, [editor, tableNode, rowIndex, onClose]);

  const deleteColumn = useCallback(() => {
    editor.update(() => {
      const rows = tableNode.getChildren();

      // Don't delete if it's the only column
      if (rows.length > 0 && $isTableRowNode(rows[0])) {
        const columnCount = rows[0].getChildren().length;
        if (columnCount <= 1) {
          return;
        }
      }

      for (const row of rows) {
        if ($isTableRowNode(row)) {
          const cells = row.getChildren();
          const targetCell = cells[colIndex];
          if (targetCell) {
            targetCell.remove();
          }
        }
      }
    });
    onClose();
  }, [editor, tableNode, colIndex, onClose]);

  const toggleHeaderRow = useCallback(() => {
    editor.update(() => {
      const rows = tableNode.getChildren();
      const currentRow = rows[rowIndex];

      if ($isTableRowNode(currentRow)) {
        const currentIsHeader = isHeaderRow();
        const newHeaderState = currentIsHeader
          ? TableCellHeaderStates.NO_STATUS
          : TableCellHeaderStates.ROW;

        for (const cell of currentRow.getChildren()) {
          if ($isTableCellNode(cell)) {
            cell.setHeaderStyles(newHeaderState);
          }
        }
      }
    });
    onClose();
  }, [editor, tableNode, rowIndex, isHeaderRow, onClose]);

  const moveRowUp = useCallback(() => {
    editor.update(() => {
      if (rowIndex === 0) return; // Can't move first row up

      const rows = tableNode.getChildren();
      const currentRow = rows[rowIndex];
      const previousRow = rows[rowIndex - 1];

      if ($isTableRowNode(currentRow) && $isTableRowNode(previousRow)) {
        previousRow.insertBefore(currentRow);

        // Handle header state changes
        if (rowIndex === 1) {
          // Moving to first position, make it header
          for (const cell of currentRow.getChildren()) {
            if ($isTableCellNode(cell)) {
              cell.setHeaderStyles(TableCellHeaderStates.ROW);
            }
          }
          // Remove header from old first row
          for (const cell of previousRow.getChildren()) {
            if ($isTableCellNode(cell)) {
              cell.setHeaderStyles(TableCellHeaderStates.NO_STATUS);
            }
          }
        }
      }
    });
    onClose();
  }, [editor, tableNode, rowIndex, onClose]);

  const moveRowDown = useCallback(() => {
    editor.update(() => {
      const rows = tableNode.getChildren();
      if (rowIndex >= rows.length - 1) return; // Can't move last row down

      const currentRow = rows[rowIndex];
      const nextRow = rows[rowIndex + 1];

      if ($isTableRowNode(currentRow) && $isTableRowNode(nextRow)) {
        nextRow.insertAfter(currentRow);

        // Handle header state changes
        if (rowIndex === 0) {
          // Moving away from first position, remove header
          for (const cell of currentRow.getChildren()) {
            if ($isTableCellNode(cell)) {
              cell.setHeaderStyles(TableCellHeaderStates.NO_STATUS);
            }
          }
          // Make new first row the header
          for (const cell of nextRow.getChildren()) {
            if ($isTableCellNode(cell)) {
              cell.setHeaderStyles(TableCellHeaderStates.ROW);
            }
          }
        }
      }
    });
    onClose();
  }, [editor, tableNode, rowIndex, onClose]);

  const moveColumnLeft = useCallback(() => {
    editor.update(() => {
      if (colIndex === 0) return; // Can't move first column left

      const rows = tableNode.getChildren();
      for (const row of rows) {
        if ($isTableRowNode(row)) {
          const cells = row.getChildren();
          const currentCell = cells[colIndex];
          const previousCell = cells[colIndex - 1];

          if (currentCell && previousCell) {
            previousCell.insertBefore(currentCell);
          }
        }
      }
    });
    onClose();
  }, [editor, tableNode, colIndex, onClose]);

  const moveColumnRight = useCallback(() => {
    editor.update(() => {
      const rows = tableNode.getChildren();

      if (rows.length === 0) return;
      const firstRow = rows[0];
      if (!$isTableRowNode(firstRow)) return;
      if (colIndex >= firstRow.getChildren().length - 1) return; // Can't move last column right

      for (const row of rows) {
        if ($isTableRowNode(row)) {
          const cells = row.getChildren();
          const currentCell = cells[colIndex];
          const nextCell = cells[colIndex + 1];

          if (currentCell && nextCell) {
            nextCell.insertAfter(currentCell);
          }
        }
      }
    });
    onClose();
  }, [editor, tableNode, colIndex, onClose]);

  const deleteTable = useCallback(() => {
    editor.update(() => {
      tableNode.remove();
    });
    onClose();
  }, [editor, tableNode, onClose]);

  return (
    <div
      ref={menuRef}
      className="table-actions-menu"
      style={{
        position: 'fixed',
        top: position.top,
        left: position.left,
      }}
    >
      <div className="table-actions-section">
        <div className="table-actions-header">Row</div>
        <button className="table-actions-button" onClick={addRowAbove}>
          <span className="table-actions-icon">↑</span>
          Add row above
        </button>
        <button className="table-actions-button" onClick={addRowBelow}>
          <span className="table-actions-icon">↓</span>
          Add row below
        </button>
        <button className="table-actions-button" onClick={moveRowUp}>
          <span className="table-actions-icon">⬆</span>
          Move row up
        </button>
        <button className="table-actions-button" onClick={moveRowDown}>
          <span className="table-actions-icon">⬇</span>
          Move row down
        </button>
        <button className="table-actions-button" onClick={toggleHeaderRow}>
          <span className="table-actions-icon">{isHeaderRow() ? '☐' : '☑'}</span>
          {isHeaderRow() ? 'Remove header' : 'Make header'}
        </button>
        <button className="table-actions-button table-actions-danger" onClick={deleteRow}>
          <span className="table-actions-icon">✕</span>
          Delete row
        </button>
      </div>
      <div className="table-actions-divider" />
      <div className="table-actions-section">
        <div className="table-actions-header">Column</div>
        <button className="table-actions-button" onClick={addColumnLeft}>
          <span className="table-actions-icon">←</span>
          Add column left
        </button>
        <button className="table-actions-button" onClick={addColumnRight}>
          <span className="table-actions-icon">→</span>
          Add column right
        </button>
        <button className="table-actions-button" onClick={moveColumnLeft}>
          <span className="table-actions-icon">⬅</span>
          Move column left
        </button>
        <button className="table-actions-button" onClick={moveColumnRight}>
          <span className="table-actions-icon">➡</span>
          Move column right
        </button>
        <button className="table-actions-button table-actions-danger" onClick={deleteColumn}>
          <span className="table-actions-icon">✕</span>
          Delete column
        </button>
      </div>
      <div className="table-actions-divider" />
      <div className="table-actions-section">
        <button className="table-actions-button table-actions-danger" onClick={deleteTable}>
          <span className="table-actions-icon">🗑</span>
          Delete table
        </button>
      </div>
    </div>
  );
}

export function TableActionsPlugin() {
  const [editor] = useLexicalComposerContext();
  const [menuState, setMenuState] = useState<{
    tableNode: TableNode;
    rowIndex: number;
    colIndex: number;
    position: { top: number; left: number };
  } | null>(null);

  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const cellElement = target.closest('td, th') as HTMLElement | null;

      if (!cellElement) return;

      // Find the table element
      const tableElement = cellElement.closest('table') as HTMLElement | null;
      if (!tableElement) return;

      e.preventDefault();

      // Find the row and column indices from the DOM
      const rowElement = cellElement.closest('tr');
      if (!rowElement) return;

      const rows = Array.from(tableElement.querySelectorAll(':scope > tbody > tr, :scope > tr'));
      const rowIndex = rows.indexOf(rowElement);

      const cells = Array.from(rowElement.querySelectorAll(':scope > td, :scope > th'));
      const colIndex = cells.indexOf(cellElement);

      if (rowIndex === -1 || colIndex === -1) return;

      // Find which table this is by checking all tables in the editor
      const editorElement = editor.getRootElement();
      if (!editorElement) return;

      const allTables = Array.from(editorElement.querySelectorAll('table'));
      const tableIndex = allTables.indexOf(tableElement);

      if (tableIndex === -1) return;

      editor.getEditorState().read(() => {
        // Find all table nodes in the editor
        const root = $getRoot();
        const tableNodes: TableNode[] = [];

        for (const child of root.getChildren()) {
          if ($isTableNode(child)) {
            tableNodes.push(child);
          }
        }

        const tableNode = tableNodes[tableIndex];
        if (!tableNode) return;

        setMenuState({
          tableNode,
          rowIndex,
          colIndex,
          position: {
            top: e.clientY,
            left: e.clientX,
          },
        });
      });
    };

    const editorElement = editor.getRootElement();
    if (editorElement) {
      editorElement.addEventListener('contextmenu', handleContextMenu);
      return () => editorElement.removeEventListener('contextmenu', handleContextMenu);
    }
  }, [editor]);

  const handleClose = useCallback(() => {
    setMenuState(null);
  }, []);

  if (!menuState) return null;

  return (
    <TableActionsMenu
      tableNode={menuState.tableNode}
      rowIndex={menuState.rowIndex}
      colIndex={menuState.colIndex}
      position={menuState.position}
      onClose={handleClose}
    />
  );
}
