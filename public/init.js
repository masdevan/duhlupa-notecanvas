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
  }
} catch (e) {}
