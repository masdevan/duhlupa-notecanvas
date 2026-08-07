"use client";

import { useRef } from "react";
import IconClose from "../icons/close";
import IconPlus from "../icons/plus";
import type { TableTab } from "../../lib/types";

type TableGridProps = {
  table: TableTab;
  onRenameColumn: (index: number, name: string) => void;
  onRemoveColumn: (index: number) => void;
  onAddColumn: () => void;
  onResizeColumn: (index: number, width: number) => void;
  onUpdateCell: (row: number, col: number, value: string) => void;
  onAddRow: () => void;
  onRemoveRow: (index: number) => void;
};

export default function TableGrid({
  table,
  onRenameColumn,
  onRemoveColumn,
  onAddColumn,
  onResizeColumn,
  onUpdateCell,
  onAddRow,
  onRemoveRow,
}: TableGridProps) {
  const resizeRef = useRef<{
    index: number;
    startX: number;
    startWidth: number;
  } | null>(null);

  function startResize(index: number) {
    return (event: React.PointerEvent) => {
      event.preventDefault();
      event.currentTarget.setPointerCapture(event.pointerId);
      resizeRef.current = {
        index,
        startX: event.clientX,
        startWidth: table.colWidths[index] ?? 200,
      };
    };
  }

  function moveResize(event: React.PointerEvent) {
    const resize = resizeRef.current;
    if (!resize) {
      return;
    }
    const width = Math.min(
      Math.max(resize.startWidth + (event.clientX - resize.startX), 80),
      600,
    );
    onResizeColumn(resize.index, width);
  }

  function endResize() {
    resizeRef.current = null;
  }

  return (
    <div className="editor-scroll min-h-0 flex-1 overflow-auto bg-card">
      <table className="w-full table-fixed border-collapse">
        <thead>
          <tr>
            {table.columns.map((column, i) => (
              <th
                key={i}
                className="relative border-b border-r border-edge p-2"
                style={{ width: table.colWidths[i] ?? 200 }}
              >
                <div className="flex items-center gap-2">
                  <input
                    value={column}
                    onChange={(event) =>
                      onRenameColumn(i, event.target.value)
                    }
                    className="w-full min-w-0 bg-transparent font-mono text-xs text-foreground outline-none"
                  />
                  <button
                    onClick={() => onRemoveColumn(i)}
                    aria-label="Remove column"
                    className="flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center rounded text-foreground/40 transition-colors hover:bg-tab-active hover:text-red-400"
                  >
                    <IconClose size={10} />
                  </button>
                </div>
                <div
                  onPointerDown={startResize(i)}
                  onPointerMove={moveResize}
                  onPointerUp={endResize}
                  onPointerCancel={endResize}
                  className="absolute inset-y-0 right-0 w-1 cursor-col-resize touch-none bg-accent/0 transition-colors hover:bg-accent/60"
                />
              </th>
            ))}
            <th className="border-b border-edge p-2">
              <button
                onClick={onAddColumn}
                aria-label="Add column"
                className="flex h-6 w-6 cursor-pointer items-center justify-center rounded text-foreground/40 transition-colors hover:bg-tab-active hover:text-foreground"
              >
                <IconPlus size={12} />
              </button>
            </th>
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row, r) => (
            <tr key={r}>
              {row.map((cell, c) => (
                <td key={c} className="border-b border-r border-edge p-1">
                  <input
                    value={cell}
                    onChange={(event) =>
                      onUpdateCell(r, c, event.target.value)
                    }
                    className="w-full min-w-0 bg-transparent px-1 py-1 font-mono text-xs text-foreground outline-none"
                  />
                </td>
              ))}
              <td className="border-b border-edge p-1">
                <button
                  onClick={() => onRemoveRow(r)}
                  aria-label="Remove row"
                  className="flex h-6 w-6 cursor-pointer items-center justify-center rounded text-foreground/40 transition-colors hover:bg-tab-active hover:text-red-400"
                >
                  <IconClose size={10} />
                </button>
              </td>
            </tr>
          ))}
          <tr>
            <td colSpan={table.columns.length + 1} className="p-1">
              <button
                onClick={onAddRow}
                aria-label="Add row"
                className="flex h-6 w-6 cursor-pointer items-center justify-center rounded text-foreground/40 transition-colors hover:bg-tab-active hover:text-foreground"
              >
                <IconPlus size={12} />
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
