"use client";

import { useEffect, useState } from "react";
import ConfirmDialog from "../confirm-dialog";
import TabStrip from "../tab-strip";
import TableEmptyState from "./table-empty-state";
import TableGrid from "./table-grid";
import TableNameModal from "./table-name-modal";
import {
  defaultTablesState,
  initialTablesState,
  saveTablesState,
} from "../../lib/storage";
import type { TableTab, TablesState } from "../../lib/types";

export default function TableView() {
  const [state, setState] = useState<TablesState>(defaultTablesState);
  const [ready, setReady] = useState(false);
  const [nameModalOpen, setNameModalOpen] = useState(false);
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

  function updateActive(fn: (table: TableTab) => TableTab) {
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

  function addTable(name = "Untitled") {
    const id = state.counter + 1;
    commit({
      ...state,
      tables: [
        ...state.tables,
        { id, name, columns: ["Column 1"], colWidths: [200], rows: [[""]] },
      ],
      activeId: id,
      counter: id,
    });
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

  function addColumn() {
    updateActive((table) => ({
      ...table,
      columns: [...table.columns, `Column ${table.columns.length + 1}`],
      colWidths: [...table.colWidths, 200],
      rows: table.rows.map((row) => [...row, ""]),
    }));
  }

  function renameColumn(index: number, name: string) {
    updateActive((table) => ({
      ...table,
      columns: table.columns.map((col, i) => (i === index ? name : col)),
    }));
  }

  function resizeColumn(index: number, width: number) {
    updateActive((table) => ({
      ...table,
      colWidths: table.colWidths.map((w, i) => (i === index ? width : w)),
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
          onAdd={() => setNameModalOpen(true)}
          onClose={setPendingCloseId}
          showAdd={state.tables.length > 0}
          editingId={renamingId}
          editValue={renameDraft}
          onEditChange={setRenameDraft}
          onEditCommit={commitRename}
          onRename={startRename}
        />
      )}
      {active ? (
        <TableGrid
          table={active}
          onRenameColumn={renameColumn}
          onAddColumn={addColumn}
          onResizeColumn={resizeColumn}
          onUpdateCell={updateCell}
        />
      ) : (
        <TableEmptyState onCreate={addTable} />
      )}
      {nameModalOpen && (
        <TableNameModal
          onSubmit={(name) => {
            addTable(name);
            setNameModalOpen(false);
          }}
          onCancel={() => setNameModalOpen(false)}
        />
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
