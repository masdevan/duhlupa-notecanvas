import Settings from "../../components/settings";
import Sidebar from "../../components/sidebar";
import Gallery from "../../components/gallery/gallery";

export default function GalleryPage() {
  return (
    <main className="flex h-dvh overflow-hidden">
      <Sidebar />
      <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
        <h1 className="sr-only text-right">Duhlupa</h1>
        <Gallery />
        <Settings />
      </div>
    </main>
  );
}
