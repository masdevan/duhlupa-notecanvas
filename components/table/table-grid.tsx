"use client";

import { useRef } from "react";
import IconPlus from "../icons/plus";
import type { TableTab } from "../../lib/types";
type TableGridProps = {
  table: TableTab;
  onRenameColumn: (index: number, name: string) => void;
  onAddColumn: () => void;
  onResizeColumn: (index: number, width: number) => void;
  onUpdateCell: (row: number, col: number, value: string) => void;
};

export default function TableGrid({
  table,
  onRenameColumn,
  onAddColumn,
  onResizeColumn,
  onUpdateCell,
}: TableGridProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const resizeRef = useRef<{
    index: number;
    startX: number;
    startWidth: number;
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

  return (
    <div ref={scrollRef} className="editor-scroll min-h-0 flex-1 overflow-auto bg-card">
      <table className="w-full table-fixed border-collapse">
        <thead>
          <tr>
            <th
              className="border-b border-r border-edge bg-[#0c0c0c] p-1 text-center font-mono text-xs text-foreground/30"
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
                  className="w-full min-w-0 bg-transparent font-mono text-xs text-foreground outline-none"
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
            <th className="min-w-11 border-b border-r border-edge p-2">
              <button
                onClick={handleAddColumn}
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
              <td
                className="border-b border-r border-edge bg-[#0c0c0c] p-1 text-center font-mono text-xs text-foreground/30"
                style={{
                  width: `${Math.max(32, String(table.rows.length).length * 9 + 18)}px`,
                }}
              >
                {r + 1}
              </td>
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
              <td className="min-w-11 border-b border-r border-edge" />
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
