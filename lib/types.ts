export type Tab = {
  id: number;
  content: string;
};

export type AppState = {
  tabs: Tab[];
  activeId: number;
  counter: number;
  wrapWidth: number | null;
  accentColor: string;
  textColor: string;
  fontFamily: string;
};
