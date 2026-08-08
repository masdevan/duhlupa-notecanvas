"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import IconTable from "./icons/table";
import IconWrite from "./icons/write";

export default function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const activeView = pathname === "/table" ? "table" : "write";

  const nav = (
    <>
      <Link
        href="/"
        aria-label="Duhlupa"
        className="cursor-pointer"
        onClick={() => setOpen(false)}
      >
        <img src="/core/logo.png" alt="Duhlupa" className="h-7 w-7 rounded" />
      </Link>
      <nav className="flex flex-col items-center gap-2">
        <Link
          href="/"
          aria-label="Write"
          onClick={() => setOpen(false)}
          className={`flex h-9 w-9 cursor-pointer items-center justify-center rounded transition-colors ${
            activeView === "write"
              ? "bg-tab-active text-foreground"
              : "text-foreground/50 hover:bg-tab-active/50 hover:text-foreground"
          }`}
        >
          <IconWrite />
        </Link>
        <Link
          href="/table"
          aria-label="Table"
          onClick={() => setOpen(false)}
          className={`flex h-9 w-9 cursor-pointer items-center justify-center rounded transition-colors ${
            activeView === "table"
              ? "bg-tab-active text-foreground"
              : "text-foreground/50 hover:bg-tab-active/50 hover:text-foreground"
          }`}
        >
          <IconTable />
        </Link>
      </nav>
    </>
  );

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        className="absolute left-1 top-0.5 z-30 flex h-7 w-7 cursor-pointer items-center justify-center rounded md:hidden"
      >
        <img src="/core/logo.png" alt="Duhlupa" className="h-5 w-5 rounded" />
      </button>
      <aside className="hidden w-12 shrink-0 flex-col items-center gap-4 border-r border-edge bg-tab-bar py-3 md:flex">
        {nav}
      </aside>
      {open && (
        <>
          <div
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-50 md:hidden"
          />
          <div className="fixed left-1 top-8 z-50 flex w-32 flex-col rounded-sm border border-edge bg-raised py-1 shadow-2xl md:hidden">
            <Link
              href="/"
              onClick={() => setOpen(false)}
              className={`flex cursor-pointer items-center gap-2 px-3 py-2 font-mono text-xs transition-colors ${
                activeView === "write"
                  ? "bg-tab-active text-foreground"
                  : "text-foreground/50 hover:bg-tab-active hover:text-foreground"
              }`}
            >
              <IconWrite size={14} />
              <span>Write</span>
            </Link>
            <Link
              href="/table"
              onClick={() => setOpen(false)}
              className={`flex cursor-pointer items-center gap-2 px-3 py-2 font-mono text-xs transition-colors ${
                activeView === "table"
                  ? "bg-tab-active text-foreground"
                  : "text-foreground/50 hover:bg-tab-active hover:text-foreground"
              }`}
            >
              <IconTable size={14} />
              <span>Table</span>
            </Link>
          </div>
        </>
      )}
    </>
  );
}
