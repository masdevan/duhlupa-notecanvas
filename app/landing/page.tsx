import Link from "next/link";

const SEAMLESS = 'url("/core/seamless.png")';

const features = [
  {
    title: "Tabbed writing",
    text: "Open as many tabs as you want, titles come from the first line of each note",
  },
  {
    title: "Spreadsheet-like tables",
    text: "Drag columns wider, delete rows and columns, double click a long cell to see everything",
  },
  {
    title: "Deep customization",
    text: "Pick accent and text colors with a circular picker, choose Mono or Sans, tweak letter spacing",
  },
  {
    title: "Export & import",
    text: "Back up everything as JSON, plus XLSX export/import from the table toolbar",
  },
];

const stack = ["Next.js 16", "React 19", "Tailwind CSS 4", "TypeScript", "IndexedDB", "XLSX"];

function Wave({
  fill,
  flip,
  vertical,
  duration,
}: {
  fill: string;
  flip?: boolean;
  vertical?: boolean;
  duration: number;
}) {
  const path =
    "M0,40 C60,40 120,10 180,10 C240,10 300,40 360,40 C420,40 480,70 540,70 C600,70 660,40 720,40 C780,40 840,10 900,10 C960,10 1020,40 1080,40 C1140,40 1200,70 1260,70 C1320,70 1380,40 1440,40 L1440,90 L0,90 Z";
  return (
    <div
      className={`pointer-events-none -mb-px overflow-hidden ${vertical ? "-scale-y-100" : ""} ${flip ? "-scale-x-100" : ""}`}
      aria-hidden
    >
      <svg
        viewBox="0 0 1440 90"
        preserveAspectRatio="none"
        className="wave-animate block h-24 w-[200%] sm:h-32"
        style={{ fill, animationDuration: `${duration}s` }}
      >
        <path d={path} />
      </svg>
    </div>
  );
}

export default function LandingPage() {
  return (
    <main
      className="min-h-dvh bg-base"
      style={{ color: "#f5f5f5" }}
    >
      <Wave fill="var(--color-surface)" vertical duration={11} />

      <section className="relative overflow-hidden bg-base">
        <div className="relative mx-auto flex max-w-3xl flex-col items-center gap-6 px-6 pb-24 pt-24 text-center">
          <img
            src="/core/logo.png"
            alt="Duhlupa"
            className="h-16 w-16"
          />
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Write. Table. <span className="font-script text-[1.6em] text-accent">Repeat.</span>
          </h1>
          <p
            className="max-w-xl text-sm leading-relaxed sm:text-base"
            style={{ color: "#e8e8e8" }}
          >
            Duhlupa is a tiny tabbed notepad and table tool that lives right in
            your browser, no account, no server needed, your notes and tables
            stay in your own storage and pop right back in before you even notice
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/"
              className="rounded-full border border-accent bg-accent px-6 py-2.5 font-mono text-sm text-base transition-colors hover:brightness-110"
            >
              Start writing
            </Link>
            <Link
              href="/table"
              className="rounded-full border border-edge bg-raised/60 px-6 py-2.5 font-mono text-sm text-[#f5f5f5]/70 backdrop-blur transition-colors hover:border-accent hover:text-[#f5f5f5]"
            >
              Open a table
            </Link>
          </div>
        </div>
        <Wave fill="var(--color-surface)" duration={13} />
      </section>

      <section className="bg-surface">
        <div className="mx-auto max-w-3xl px-6 pb-24">
          <div className="grid gap-5 pt-16 sm:grid-cols-2">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="relative overflow-hidden rounded-2xl border border-edge bg-raised p-5"
              >
                <div
                  className="pointer-events-none absolute inset-0 opacity-[0.08]"
                  style={{ backgroundImage: SEAMLESS }}
                />
                <div className="relative">
                  <h3 className="font-mono text-sm text-[#f5f5f5]">
                    {feature.title}
                  </h3>
                  <p className="mt-1.5 text-xs leading-snug text-muted">
                    {feature.text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Wave fill="#111111" vertical duration={15} />

      <section className="bg-base">        <div className="mx-auto max-w-5xl px-6 py-28">
          <div className="flex flex-col items-center gap-8 sm:flex-row sm:justify-between">
            <div className="text-center sm:text-left">
              <h2 className="font-mono text-lg">Built with the boring stack</h2>
              <p className="mt-1 text-xs text-muted">
                Fast, small, fully typed, no magic under the hood
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2 sm:flex-nowrap">
              {stack.map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-edge bg-raised px-3 py-1.5 font-mono text-xs text-[#f5f5f5]/60 transition-colors hover:border-accent/50 hover:text-[#f5f5f5]"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Wave fill="var(--color-surface)" duration={12} />

      <section className="bg-surface">
        <div className="relative mx-auto max-w-3xl px-6 pb-24 pt-20 text-center">
          <h2 className="text-2xl font-bold sm:text-3xl">
            Your data, <span className="font-script text-[1.6em] text-accent">your browser.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-muted">
            No sign up, no sync to third parties, just close the tab and come
            back later, everything will still be there
          </p>
          <Link
            href="/"
            className="mt-10 inline-block rounded-full border border-accent bg-accent px-8 py-3 font-mono text-sm text-base transition-colors hover:brightness-110"
          >
            Launch Duhlupa
          </Link>
        </div>
      </section>

      <footer className="bg-[#111111] py-6 text-center">
        <p className="font-mono text-[10px] text-[#f5f5f5]/30">
          &copy; {new Date().getFullYear()} Duhlupa
        </p>
      </footer>
    </main>
  );
}
