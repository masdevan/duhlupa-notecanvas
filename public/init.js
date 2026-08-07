try {
  var s = localStorage.getItem("duhlupa-tabs");
  if (s) {
    var d = JSON.parse(s);
    if (typeof d.accentColor === "string") {
      document.documentElement.style.setProperty("--color-accent", d.accentColor);
    }
    if (typeof d.textColor === "string") {
      document.documentElement.style.setProperty("--color-foreground", d.textColor);
    }
    if (typeof d.fontFamily === "string") {
      var stacks = {
        mono: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
        sans: "var(--font-roboto), Arial, Helvetica, sans-serif"
      };
      var stack = stacks[d.fontFamily] || stacks.mono;
      document.documentElement.style.setProperty("--font-sans", stack);
      document.documentElement.style.setProperty("--font-mono", stack);
      document.documentElement.style.setProperty("--font-editor", stack);
    }
  }
} catch (e) {}
