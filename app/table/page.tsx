import Settings from "../../components/settings";
import Sidebar from "../../components/sidebar";
import TableView from "../../components/table/table-view";

export default function TablePage() {
  return (
    <main className="flex h-dvh overflow-hidden">
      <Sidebar />
      <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
        <h1 className="sr-only text-right">Duhlupa</h1>
        <TableView />
        <Settings />
      </div>
    </main>
  );
}
