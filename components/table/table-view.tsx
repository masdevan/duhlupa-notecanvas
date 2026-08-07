"use client";

import { useEffect, useState } from "react";
import ConfirmDialog from "../confirm-dialog";
import IconClose from "../icons/close";
import IconPlus from "../icons/plus";
import TabStrip from "../tab-strip";
import {
  defaultTablesState,
  initialTablesState,
  saveTablesState,
} from "../../lib/storage";
import type { TablesState } from "../../lib/types";

export default function TableView() {
  const [state, setState] = useState<TablesState>(defaultTablesState);
  const [ready, setReady] = useState(false);
  const [newTableName, setNewTableName] = useState("");
  const [nameModalOpen, setNameModalOpen] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [renamingId, setRenamingId] = useState<number | null>(null);
  const [renameDraft, setRenameDraft] = useState("");
  const [pendingCloseId, setPendingCloseId] = useState<number | null>(null);
  const active = state.tables.find((table) => table.id === state.activeId) ?? null;

  useEffect(() => {
    setState(initialTablesState());
    setReady(true);
  }, []);

  useEffect(() => {
    function reload() {
      setState(initialTablesState());
    }
    window.addEventListener("duhlupa-data-changed", reload);
    return () => window.removeEventListener("duhlupa-data-changed", reload);
  }, []);

  function commit(next: TablesState) {
    setState(next);
    saveTablesState(next);
  }

  function addTable(name = "Untitled") {
    const id = state.counter + 1;
    commit({
      ...state,
      tables: [
        ...state.tables,
        { id, name, columns: ["Column 1"], rows: [[""]] },
      ],
      activeId: id,
      counter: id,
    });
    setNewTableName("");
  }

  function createFirstTable() {
    addTable(newTableName.trim() || "Untitled");
  }

  function openNameModal() {
    setNameDraft("");
    setNameModalOpen(true);
  }

  function startRename(id: number) {
    const table = state.tables.find((t) => t.id === id);
    if (!table) {
      return;
    }
    setRenamingId(id);
    setRenameDraft(table.name);
  }

  function commitRename() {
    if (renamingId === null) {
      return;
    }
    const name = renameDraft.trim();
    commit({
      ...state,
      tables: state.tables.map((table) =>
        table.id === renamingId
          ? { ...table, name: name || table.name }
          : table,
      ),
    });
    setRenamingId(null);
  }

  function confirmCloseTable() {
    if (pendingCloseId !== null) {
      closeTable(pendingCloseId);
      setPendingCloseId(null);
    }
  }

  function submitName() {
    addTable(nameDraft.trim() || "Untitled");
    setNameModalOpen(false);
  }

  function closeTable(id: number) {
    const index = state.tables.findIndex((table) => table.id === id);
    const remaining = state.tables.filter((table) => table.id !== id);
    if (remaining.length === 0) {
      commit({ ...state, tables: [], activeId: 0 });
      return;
    }
    commit({
      ...state,
      tables: remaining,
      activeId:
        state.activeId === id
          ? remaining[Math.min(index, remaining.length - 1)].id
          : state.activeId,
    });
  }

  function selectTable(id: number) {
    commit({ ...state, activeId: id });
  }

  function updateActive(fn: (table: NonNullable<typeof active>) => typeof table) {
    if (!active) {
      return;
    }
    commit({
      ...state,
      tables: state.tables.map((table) =>
        table.id === active.id ? fn(table) : table,
      ),
    });
  }

  function addColumn() {
    updateActive((table) => ({
      ...table,
      columns: [...table.columns, `Column ${table.columns.length + 1}`],
      rows: table.rows.map((row) => [...row, ""]),
    }));
  }

  function removeColumn(index: number) {
    updateActive((table) => ({
      ...table,
      columns: table.columns.filter((_, i) => i !== index),
      rows: table.rows.map((row) => row.filter((_, i) => i !== index)),
    }));
  }

  function renameColumn(index: number, name: string) {
    updateActive((table) => ({
      ...table,
      columns: table.columns.map((col, i) => (i === index ? name : col)),
    }));
  }

  function addRow() {
    updateActive((table) => ({
      ...table,
      rows: [...table.rows, table.columns.map(() => "")],
    }));
  }

  function removeRow(index: number) {
    updateActive((table) => ({
      ...table,
      rows: table.rows.filter((_, i) => i !== index),
    }));
  }

  function updateCell(rowIndex: number, colIndex: number, value: string) {
    updateActive((table) => ({
      ...table,
      rows: table.rows.map((row, r) =>
        r === rowIndex
          ? row.map((cell, c) => (c === colIndex ? value : cell))
          : row,
      ),
    }));
  }

  if (!ready) {
    return <main className="h-dvh bg-surface" />;
  }

  return (
    <>
      {state.tables.length > 0 && (
        <TabStrip
          tabs={state.tables.map((table) => ({
            id: table.id,
            content: table.name,
          }))}
          activeId={state.activeId}
          onSelect={selectTable}
          onAdd={openNameModal}
          onClose={setPendingCloseId}
          showAdd={state.tables.length > 0}
          editingId={renamingId}
          editValue={renameDraft}
          onEditChange={setRenameDraft}
          onEditCommit={commitRename}
          onRename={startRename}
        />
      )}
      {active && (
        <div className="editor-scroll min-h-0 flex-1 overflow-auto bg-card">          <table className="w-full border-collapse">
            <thead>
              <tr>
                {active.columns.map((column, i) => (
                  <th
                    key={i}
                    className="min-w-40 border-b border-r border-edge p-2"
                  >
                    <div className="flex items-center gap-2">
                      <input
                        value={column}
                        onChange={(event) => renameColumn(i, event.target.value)}
                        className="w-full bg-transparent font-mono text-xs text-foreground outline-none"
                      />
                      <button
                        onClick={() => removeColumn(i)}
                        aria-label="Remove column"
                        className="flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center rounded text-foreground/40 transition-colors hover:bg-tab-active hover:text-red-400"
                      >
                        <IconClose size={10} />
                      </button>
                    </div>
                  </th>
                ))}
                <th className="border-b border-edge p-2">
                  <button
                    onClick={addColumn}
                    aria-label="Add column"
                    className="flex h-6 w-6 cursor-pointer items-center justify-center rounded text-foreground/40 transition-colors hover:bg-tab-active hover:text-foreground"
                  >
                    <IconPlus size={12} />
                  </button>
                </th>
              </tr>
            </thead>
            <tbody>
              {active.rows.map((row, r) => (
                <tr key={r}>
                  {row.map((cell, c) => (
                    <td
                      key={c}
                      className="border-b border-r border-edge p-1"
                    >
                      <input
                        value={cell}
                        onChange={(event) =>
                          updateCell(r, c, event.target.value)
                        }
                        className="w-full bg-transparent px-1 py-1 font-mono text-xs text-foreground outline-none"
                      />
                    </td>
                  ))}
                  <td className="border-b border-edge p-1">
                    <button
                      onClick={() => removeRow(r)}
                      aria-label="Remove row"
                      className="flex h-6 w-6 cursor-pointer items-center justify-center rounded text-foreground/40 transition-colors hover:bg-tab-active hover:text-red-400"
                    >
                      <IconClose size={10} />
                    </button>
                  </td>
                </tr>
              ))}
              <tr>
                <td colSpan={active.columns.length + 1} className="p-1">
                  <button
                    onClick={addRow}
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
      )}
      {!active && (
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 bg-card">
          <input
            value={newTableName}
            onChange={(event) => setNewTableName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                createFirstTable();
              }
            }}
            placeholder="Table name..."
            className="h-8 w-56 rounded-sm border border-edge bg-base px-3 font-mono text-xs text-foreground caret-accent outline-none placeholder:text-foreground/30 focus:border-accent"
          />
          <button
            onClick={createFirstTable}
            className="h-7 w-55 cursor-pointer rounded-sm border border-accent bg-accent font-mono text-xs text-base transition-colors hover:brightness-110"
          >
            Create
          </button>
        </div>
      )}
      {nameModalOpen && (
        <div
          onClick={() => setNameModalOpen(false)}
          className="modal-backdrop fixed inset-0 z-70 flex items-center justify-center bg-black/40 backdrop-blur-md"
        >
          <div
            onClick={(event) => event.stopPropagation()}
            className="modal-panel w-[calc(100%-2rem)] max-w-xs rounded-sm border border-edge bg-raised p-5 shadow-2xl"
          >
            <input
              value={nameDraft}
              onChange={(event) => setNameDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  submitName();
                }
              }}
              placeholder="Table name..."
              autoFocus
              className="h-8 w-full rounded-sm border border-edge bg-base px-3 font-mono text-xs text-foreground caret-accent outline-none placeholder:text-foreground/30 focus:border-accent"
            />
            <div className="mt-5 flex gap-2">
              <button
                onClick={() => setNameModalOpen(false)}
                className="h-8 flex-1 cursor-pointer rounded-sm border border-edge font-mono text-xs text-foreground/50 transition-colors hover:border-accent hover:text-foreground"
              >
                Cancel
              </button>
              <button
                onClick={submitName}
                className="h-8 flex-1 cursor-pointer rounded-sm bg-accent font-mono text-xs text-base transition-colors hover:brightness-110"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
      {pendingCloseId !== null && (
        <ConfirmDialog
          message="Delete this table?"
          confirmLabel="Delete"
          cancelLabel="Cancel"
          danger
          onConfirm={confirmCloseTable}
          onCancel={() => setPendingCloseId(null)}
        />
      )}
    </>
  );
}
