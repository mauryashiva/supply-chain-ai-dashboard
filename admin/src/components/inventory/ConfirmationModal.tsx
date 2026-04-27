import React from "react";
import { AlertTriangle } from "lucide-react";
import { ModalLayout } from "@/layouts/ModalLayout";

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  loading: boolean;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  loading,
}) => {
  if (!isOpen) return null;

  return (
    <ModalLayout
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="max-w-sm"
    >
      <div className="text-center">
        {/* Warning Icon */}
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 dark:bg-red-500/20 mb-4">
          <AlertTriangle className="h-6 w-6 text-red-500" />
        </div>

        {/* Message */}
        <p className="text-gray-600 dark:text-zinc-400 font-semibold mb-8">
          {message}
        </p>

        {/* Buttons */}
        <div className="flex justify-center gap-4">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="w-full bg-gray-200 dark:bg-zinc-700 hover:bg-gray-300 dark:hover:bg-zinc-600 text-gray-900 dark:text-white font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg disabled:opacity-50 transition-colors"
          >
            {loading ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </ModalLayout>
  );
};
