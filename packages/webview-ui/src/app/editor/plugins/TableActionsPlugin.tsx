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

function $setRowStyles(row: TableRowNode, state: TableCellHeaderStates): void {
  for (const cell of row.getChildren()) {
    if ($isTableCellNode(cell)) {
      cell.setHeaderStyles(state);
    }
  }
}

function $createFilledCell(headerState: TableCellHeaderStates, text: string): TableCellNode {
  const cell = $createTableCellNode(headerState);
  const paragraph = $createParagraphNode();
  paragraph.append($createTextNode(text));
  cell.append(paragraph);
  return cell;
}

function $createFilledRow(colCount: number, headerState: TableCellHeaderStates): TableRowNode {
  const row = $createTableRowNode();
  for (let i = 0; i < colCount; i++) {
    row.append($createFilledCell(headerState, ''));
  }
  return row;
}

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

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

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
      const rows = tableNode.getChildren();
      const targetRow = rows[rowIndex];
      const headerState = rowIndex === 0 ? TableCellHeaderStates.ROW : TableCellHeaderStates.NO_STATUS;
      const newRow = $createFilledRow(getColumnCount(), headerState);

      if (rowIndex === 0) {
        tableNode.getFirstChild()?.insertBefore(newRow);
        if ($isTableRowNode(targetRow)) {
          $setRowStyles(targetRow, TableCellHeaderStates.NO_STATUS);
        }
      } else {
        targetRow?.insertBefore(newRow);
      }
    });
    onClose();
  }, [editor, tableNode, rowIndex, getColumnCount, onClose]);

  const addRowBelow = useCallback(() => {
    editor.update(() => {
      const rows = tableNode.getChildren();
      const newRow = $createFilledRow(getColumnCount(), TableCellHeaderStates.NO_STATUS);
      rows[rowIndex]?.insertAfter(newRow);
    });
    onClose();
  }, [editor, tableNode, rowIndex, getColumnCount, onClose]);

  const addColumnLeft = useCallback(() => {
    editor.update(() => {
      const rows = tableNode.getChildren();
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        if (!$isTableRowNode(row)) continue;
        const isHeader = i === 0;
        const newCell = $createFilledCell(
          isHeader ? TableCellHeaderStates.ROW : TableCellHeaderStates.NO_STATUS,
          isHeader ? 'Header' : ''
        );
        const cells = row.getChildren();
        if (colIndex === 0) {
          row.getFirstChild()?.insertBefore(newCell);
        } else {
          cells[colIndex]?.insertBefore(newCell);
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
        if (!$isTableRowNode(row)) continue;
        const isHeader = i === 0;
        const newCell = $createFilledCell(
          isHeader ? TableCellHeaderStates.ROW : TableCellHeaderStates.NO_STATUS,
          isHeader ? 'Header' : ''
        );
        row.getChildren()[colIndex]?.insertAfter(newCell);
      }
    });
    onClose();
  }, [editor, tableNode, colIndex, onClose]);

  const deleteRow = useCallback(() => {
    editor.update(() => {
      const rows = tableNode.getChildren();
      if (rows.length <= 1) return;
      const targetRow = rows[rowIndex];
      if (!$isTableRowNode(targetRow)) return;
      if (rowIndex === 0 && rows.length > 1) {
        const nextRow = rows[1];
        if ($isTableRowNode(nextRow)) {
          $setRowStyles(nextRow, TableCellHeaderStates.ROW);
        }
      }
      targetRow.remove();
    });
    onClose();
  }, [editor, tableNode, rowIndex, onClose]);

  const deleteColumn = useCallback(() => {
    editor.update(() => {
      const rows = tableNode.getChildren();
      const firstRow = rows[0];
      if ($isTableRowNode(firstRow) && firstRow.getChildren().length <= 1) return;
      for (const row of rows) {
        if ($isTableRowNode(row)) {
          row.getChildren()[colIndex]?.remove();
        }
      }
    });
    onClose();
  }, [editor, tableNode, colIndex, onClose]);

  const toggleHeaderRow = useCallback(() => {
    editor.update(() => {
      const row = tableNode.getChildren()[rowIndex];
      if (!$isTableRowNode(row)) return;
      $setRowStyles(row, isHeaderRow() ? TableCellHeaderStates.NO_STATUS : TableCellHeaderStates.ROW);
    });
    onClose();
  }, [editor, tableNode, rowIndex, isHeaderRow, onClose]);

  const moveRowUp = useCallback(() => {
    editor.update(() => {
      if (rowIndex === 0) return;
      const rows = tableNode.getChildren();
      const currentRow = rows[rowIndex];
      const previousRow = rows[rowIndex - 1];
      if (!$isTableRowNode(currentRow) || !$isTableRowNode(previousRow)) return;
      previousRow.insertBefore(currentRow);
      if (rowIndex === 1) {
        $setRowStyles(currentRow, TableCellHeaderStates.ROW);
        $setRowStyles(previousRow, TableCellHeaderStates.NO_STATUS);
      }
    });
    onClose();
  }, [editor, tableNode, rowIndex, onClose]);

  const moveRowDown = useCallback(() => {
    editor.update(() => {
      const rows = tableNode.getChildren();
      if (rowIndex >= rows.length - 1) return;
      const currentRow = rows[rowIndex];
      const nextRow = rows[rowIndex + 1];
      if (!$isTableRowNode(currentRow) || !$isTableRowNode(nextRow)) return;
      nextRow.insertAfter(currentRow);
      if (rowIndex === 0) {
        $setRowStyles(currentRow, TableCellHeaderStates.NO_STATUS);
        $setRowStyles(nextRow, TableCellHeaderStates.ROW);
      }
    });
    onClose();
  }, [editor, tableNode, rowIndex, onClose]);

  const moveColumnLeft = useCallback(() => {
    editor.update(() => {
      if (colIndex === 0) return;
      for (const row of tableNode.getChildren()) {
        if (!$isTableRowNode(row)) continue;
        const cells = row.getChildren();
        const currentCell = cells[colIndex];
        const previousCell = cells[colIndex - 1];
        if (currentCell && previousCell) {
          previousCell.insertBefore(currentCell);
        }
      }
    });
    onClose();
  }, [editor, tableNode, colIndex, onClose]);

  const moveColumnRight = useCallback(() => {
    editor.update(() => {
      const rows = tableNode.getChildren();
      const firstRow = rows[0];
      if (!$isTableRowNode(firstRow)) return;
      if (colIndex >= firstRow.getChildren().length - 1) return;
      for (const row of rows) {
        if (!$isTableRowNode(row)) continue;
        const cells = row.getChildren();
        const currentCell = cells[colIndex];
        const nextCell = cells[colIndex + 1];
        if (currentCell && nextCell) {
          nextCell.insertAfter(currentCell);
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

      const tableElement = cellElement.closest('table') as HTMLElement | null;
      if (!tableElement) return;

      e.preventDefault();

      const rowElement = cellElement.closest('tr');
      if (!rowElement) return;

      const rows = Array.from(tableElement.querySelectorAll(':scope > tbody > tr, :scope > tr'));
      const rowIndex = rows.indexOf(rowElement);

      const cells = Array.from(rowElement.querySelectorAll(':scope > td, :scope > th'));
      const colIndex = cells.indexOf(cellElement);

      if (rowIndex === -1 || colIndex === -1) return;

      const editorElement = editor.getRootElement();
      if (!editorElement) return;

      const allTables = Array.from(editorElement.querySelectorAll('table'));
      const tableIndex = allTables.indexOf(tableElement);
      if (tableIndex === -1) return;

      editor.getEditorState().read(() => {
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
          position: { top: e.clientY, left: e.clientX },
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
