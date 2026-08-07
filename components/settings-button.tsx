import IconSettings from "./icons/settings";

type SettingsButtonProps = {
  onOpen: () => void;
};

export default function SettingsButton({ onOpen }: SettingsButtonProps) {
  return (
    <button
      onClick={onOpen}
      aria-label="Settings"
      className="absolute bottom-2 left-0 flex h-8 w-8 cursor-pointer items-center justify-center rounded-r-md bg-accent text-base transition-colors hover:brightness-110"
    >
      <IconSettings />
    </button>
  );
}
