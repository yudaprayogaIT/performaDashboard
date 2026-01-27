// src/components/ui/confirm-modal.tsx

"use client";

import Modal from "./modal";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info";
  isLoading?: boolean;
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Konfirmasi",
  message,
  confirmText = "Ya, Lanjutkan",
  cancelText = "Batal",
  variant = "danger",
  isLoading = false,
}: ConfirmModalProps) {
  const variantStyles = {
    danger: {
      icon: "warning",
      iconBg: "bg-red-500/10",
      iconColor: "text-red-400",
      buttonBg: "bg-red-500 hover:bg-red-600",
    },
    warning: {
      icon: "error",
      iconBg: "bg-yellow-500/10",
      iconColor: "text-yellow-400",
      buttonBg: "bg-yellow-500 hover:bg-yellow-600",
    },
    info: {
      icon: "info",
      iconBg: "bg-blue-500/10",
      iconColor: "text-blue-400",
      buttonBg: "bg-blue-500 hover:bg-blue-600",
    },
  };

  const styles = variantStyles[variant];

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <div className="flex flex-col items-center text-center">
        {/* Icon */}
        <div
          className={`w-16 h-16 rounded-full ${styles.iconBg} flex items-center justify-center mb-4`}
        >
          <span
            className={`material-symbols-outlined text-4xl ${styles.iconColor}`}
          >
            {styles.icon}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-xl font-bold text-white mb-2">{title}</h3>

        {/* Message */}
        <p className="text-white/60 mb-6">{message}</p>

        {/* Actions */}
        <div className="flex gap-3 w-full">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium transition-colors disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 px-4 py-3 rounded-xl ${styles.buttonBg} text-white font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2`}
          >
            {isLoading ? (
              <>
                <svg
                  className="animate-spin h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                <span>Processing...</span>
              </>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}
