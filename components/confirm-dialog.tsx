"use client";

type ConfirmDialogProps = {
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmDialog({
  message,
  confirmLabel,
  cancelLabel,
  danger,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <div
      onClick={(event) => {
        event.stopPropagation();
        onCancel();
      }}
      className="modal-backdrop fixed inset-0 z-70 flex items-center justify-center bg-black/40 backdrop-blur-md"
    >
      <div
        onClick={(event) => event.stopPropagation()}
        className="modal-panel w-[calc(100%-2rem)] max-w-xs rounded-sm border border-edge bg-raised p-5 shadow-2xl"
      >
        <p className="font-mono text-xs text-foreground">{message}</p>
        <div className="mt-5 flex gap-2">
          <button
            onClick={onCancel}
            className="h-8 flex-1 cursor-pointer rounded-sm border border-edge font-mono text-xs text-muted transition-colors hover:border-accent hover:text-foreground"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`h-8 flex-1 cursor-pointer rounded-sm font-mono text-xs transition-colors ${
              danger
                ? "bg-red-500/80 text-white hover:bg-red-500"
                : "bg-accent text-base hover:brightness-110"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
