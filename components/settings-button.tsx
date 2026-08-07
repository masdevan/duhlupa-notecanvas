import IconSettings from "./icons/settings";

type SettingsButtonProps = {
  position: "left" | "right";
  onOpen: () => void;
};

export default function SettingsButton({ position, onOpen }: SettingsButtonProps) {
  return (
    <button
      onClick={onOpen}
      aria-label="Settings"
      className={`absolute bottom-6 flex h-8 w-8 cursor-pointer items-center justify-center bg-accent text-base transition-colors hover:brightness-110 ${
        position === "left"
          ? "left-0 rounded-r-md"
          : "right-0 rounded-l-md"
      }`}
    >
      <IconSettings />
    </button>
  );
}
