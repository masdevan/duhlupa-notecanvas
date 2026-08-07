import IconSettings from "./icons/settings";

type SettingsButtonProps = {
  onOpen: () => void;
};

export default function SettingsButton({ onOpen }: SettingsButtonProps) {
  return (
    <button
      onClick={onOpen}
      aria-label="Settings"
      className="settings-btn absolute bottom-6 flex h-8 w-8 cursor-pointer items-center justify-center bg-accent text-base transition-colors hover:brightness-110"
    >
      <IconSettings />
    </button>
  );
}
