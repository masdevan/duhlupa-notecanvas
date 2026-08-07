"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import IconTable from "./icons/table";
import IconWrite from "./icons/write";

export default function Sidebar() {
  const pathname = usePathname();
  const activeView = pathname === "/table" ? "table" : "write";

  return (
    <aside className="flex w-12 shrink-0 flex-col items-center gap-4 border-r border-edge bg-tab-bar py-3">
      <Link href="/" aria-label="Duhlupa" className="cursor-pointer">
        <img src="/core/logo.png" alt="Duhlupa" className="h-7 w-7 rounded" />
      </Link>
      <nav className="flex flex-col items-center gap-2">
        <Link
          href="/"
          aria-label="Write"
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
          className={`flex h-9 w-9 cursor-pointer items-center justify-center rounded transition-colors ${
            activeView === "table"
              ? "bg-tab-active text-foreground"
              : "text-foreground/50 hover:bg-tab-active/50 hover:text-foreground"
          }`}
        >
          <IconTable />
        </Link>
      </nav>
    </aside>
  );
}
