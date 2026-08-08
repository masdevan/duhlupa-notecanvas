"use client";

import { useRef, useState } from "react";
import IconPlus from "../icons/plus";
import IconTrash from "../icons/trash";
import type { TableTab } from "../../lib/types";
type TableGridProps = {
  table: TableTab;
  onRenameColumn: (index: number, name: string) => void;
  onAddColumn: () => void;
  onAddRow: () => void;
  onRemoveRow: (index: number) => void;
  onResizeColumn: (index: number, width: number) => void;
  onUpdateCell: (row: number, col: number, value: string) => void;
};

export default function TableGrid({
  table,
  onRenameColumn,
  onAddColumn,
  onAddRow,
  onRemoveRow,
  onResizeColumn,
  onUpdateCell,
}: TableGridProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const resizeRef = useRef<{
    index: number;
    startX: number;
    startWidth: number;
  } | null>(null);
  const [expandedCell, setExpandedCell] = useState<{
    row: number;
    col: number;
  } | null>(null);

  function handleAddColumn() {
    onAddColumn();
    requestAnimationFrame(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
      }
    });
  }

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
      Math.max(resize.startWidth + (event.clientX - resize.startX), 200),
      600,
    );
    onResizeColumn(resize.index, width);
  }

  function endResize() {
    resizeRef.current = null;
  }

  function handleCellDoubleClick(row: number, col: number) {
    const cell = table.rows[row]?.[col] ?? "";
    const width = table.colWidths[col] ?? 200;
    if (cell.length * 7.2 + 16 > width) {
      setExpandedCell({ row, col });
    }
  }

  return (
    <>
      <div className="flex h-8.5 shrink-0 items-center border-b border-t border-edge bg-[#0c0c0c]">
        <button
          onClick={handleAddColumn}
          className="flex h-full cursor-pointer items-center gap-2 border-r border-edge px-3 text-foreground/40 transition-colors hover:bg-tab-active hover:text-foreground"
        >
          <IconPlus size={12} />
          <span className="font-mono text-xs">Add column</span>
        </button>
        <button
          onClick={onAddRow}
          className="flex h-full cursor-pointer items-center gap-2 px-3 text-foreground/40 transition-colors hover:bg-tab-active hover:text-foreground"
        >
          <IconPlus size={12} />
          <span className="font-mono text-xs">Add row</span>
        </button>
      </div>
      <div ref={scrollRef} className="editor-scroll min-h-0 flex-1 overflow-auto bg-card">
      <table className="w-full table-fixed border-separate border-spacing-0">
        <thead>
          <tr>
            <th
              className="sticky left-0 z-10 border-b border-r border-edge bg-[#0c0c0c] p-1 text-center font-mono text-xs text-foreground/30"
              style={{
                width: `${Math.max(32, String(table.rows.length).length * 9 + 18)}px`,
              }}
            >
              #
            </th>
            {table.columns.map((column, i) => (
              <th
                key={i}
                className="relative border-b border-r border-edge p-2"
                style={{ width: table.colWidths[i] ?? 200, minWidth: 200 }}
              >
                <input
                  value={column}
                  onChange={(event) => onRenameColumn(i, event.target.value)}
                  className="w-full min-w-0 bg-transparent font-mono text-xs font-semibold text-foreground outline-none"
                />
                <div
                  onPointerDown={startResize(i)}
                  onPointerMove={moveResize}
                  onPointerUp={endResize}
                  onPointerCancel={endResize}
                  className="absolute inset-y-0 right-0 w-1 cursor-col-resize touch-none bg-accent/0 transition-colors hover:bg-accent/60"
                />
              </th>
            ))}
            <th className="border-b border-r border-edge" />
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row, r) => (
            <tr key={r}>
              <td
                className="group sticky left-0 z-10 border-b border-r border-edge bg-[#0c0c0c] p-1 text-center font-mono text-xs text-foreground/30"
                style={{
                  width: `${Math.max(32, String(table.rows.length).length * 9 + 18)}px`,
                }}
              >
                <span className="group-hover:hidden">{r + 1}</span>
                <button
                  onClick={() => onRemoveRow(r)}
                  aria-label="Delete row"
                  className="absolute inset-0 hidden cursor-pointer items-center justify-center text-red-400 transition-colors group-hover:flex hover:text-red-500"
                >
                  <IconTrash size={12} />
                </button>
              </td>
              {row.map((cell, c) => (
                <td
                  key={c}
                  onDoubleClick={() => handleCellDoubleClick(r, c)}
                  className="border-b border-r border-edge p-1"
                >
                  {expandedCell?.row === r && expandedCell.col === c ? (
                    <textarea
                      value={cell}
                      onChange={(event) => onUpdateCell(r, c, event.target.value)}
                      onBlur={() => setExpandedCell(null)}
                      autoFocus
                      spellCheck={false}
                      rows={5}
                      className="w-full resize-y bg-transparent px-1 py-1 font-mono text-xs leading-relaxed text-foreground/55 outline-none"
                    />
                  ) : (
                    <input
                      value={cell}
                      onChange={(event) =>
                        onUpdateCell(r, c, event.target.value)
                      }
                      className="w-full min-w-0 bg-transparent px-1 py-1 font-mono text-xs text-foreground/55 outline-none"
                    />
                  )}
                  </td>
                ))}
              <td className="border-b border-r border-edge" />
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    </>
  );
}
