import type { Tab } from "./types";

export function getTabTitle(tab: Tab): string {
  const firstLine = tab.content.split("\n")[0].trim();
  return firstLine || (tab.id === 1 ? "Untitled" : `Untitled ${tab.id}`);
}
