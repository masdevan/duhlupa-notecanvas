"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import IconExclamationCircle from "./icons/exclamation-circle";
import IconImage from "./icons/image";
import IconTable from "./icons/table";
import IconWrite from "./icons/write";

const VIEWS = [
  { href: "/", label: "Write", icon: IconWrite },
  { href: "/table", label: "Table", icon: IconTable },
  { href: "/gallery", label: "Gallery", icon: IconImage },
  { href: "/landing", label: "Landing", icon: IconExclamationCircle },
] as const;

export default function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  function activeClass(href: string) {
    return pathname === href
      ? "bg-tab-active text-foreground"
      : "text-foreground/50 hover:bg-tab-active/50 hover:text-foreground";
  }

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
        {VIEWS.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            aria-label={label}
            onClick={() => setOpen(false)}
            className={`flex h-9 w-9 cursor-pointer items-center justify-center rounded transition-colors ${activeClass(href)}`}
          >
            <Icon />
          </Link>
        ))}
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
            {VIEWS.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={`flex cursor-pointer items-center gap-2 px-3 py-2 font-mono text-xs transition-colors ${activeClass(href)}`}
              >
                <Icon size={14} />
                <span>{label}</span>
              </Link>
            ))}
          </div>
        </>
      )}
    </>
  );
}
