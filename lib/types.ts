export type Tab = {
  id: number;
  content: string;
};

export type TableTab = {
  id: number;
  name: string;
  columns: string[];
  colWidths: number[];
  rows: string[][];
};

export type TablesState = {
  tables: TableTab[];
  activeId: number;
  counter: number;
};

export type AppState = {
  tabs: Tab[];
  activeId: number;
  counter: number;
  wrapWidth: number | null;
  accentColor: string;
  textColor: string;
  fontFamily: string;
  letterSpacing: number;
  contentPosition: "left" | "right";
};
