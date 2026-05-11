'use client';

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

      const targetRow = rows[rowIndex];
      const isInsertingAboveHeader = rowIndex === 0 && $isTableRowNode(targetRow);

      const newRow = $createTableRowNode();
      for (let i = 0; i < columnCount; i++) {
        const headerState = isInsertingAboveHeader ? TableCellHeaderStates.ROW : TableCellHeaderStates.NO_STATUS;
        const cell = $createTableCellNode(headerState);
        const paragraph = $createParagraphNode();
        paragraph.append($createTextNode(''));
        cell.append(paragraph);
        newRow.append(cell);
      }

      if (rowIndex === 0) {
        tableNode.getFirstChild()?.insertBefore(newRow);
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

      if (rows.length <= 1) {
        return;
      }

      const targetRow = rows[rowIndex];
      if (targetRow && $isTableRowNode(targetRow)) {
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
          Add row above
        </button>
        <button className="table-actions-button" onClick={addRowBelow}>
          Add row below
        </button>
        <button className="table-actions-button table-actions-danger" onClick={deleteRow}>
          Delete row
        </button>
      </div>
      <div className="table-actions-divider" />
      <div className="table-actions-section">
        <div className="table-actions-header">Column</div>
        <button className="table-actions-button" onClick={addColumnLeft}>
          Add column left
        </button>
        <button className="table-actions-button" onClick={addColumnRight}>
          Add column right
        </button>
        <button className="table-actions-button table-actions-danger" onClick={deleteColumn}>
          Delete column
        </button>
      </div>
      <div className="table-actions-divider" />
      <div className="table-actions-section">
        <button className="table-actions-button table-actions-danger" onClick={deleteTable}>
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

      const tableElement = cellElement.closest('table') as HTMLTableElement | null;
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
