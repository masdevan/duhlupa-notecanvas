import IconSettings from "./icons/settings";

export default function SettingsButton() {
  return (
    <button
      aria-label="Settings"
      className="group absolute bottom-2 left-0 flex h-8 cursor-pointer items-center overflow-hidden rounded-r-md bg-accent text-base transition-colors hover:brightness-110"
    >
      <span className="flex h-full w-8 shrink-0 items-center justify-center">
        <IconSettings />
      </span>
      <span className="max-w-0 self-center whitespace-nowrap pt-0.5 font-mono text-xs text-base opacity-0 transition-all duration-200 group-hover:max-w-40 group-hover:opacity-100 group-hover:pr-3">
        Settings
      </span>
    </button>
  );
}
