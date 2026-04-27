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
  return (
    <ModalLayout
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="max-w-sm"
    >
      <div className="text-center">
        {/* ICON */}
        <div
          className="
            mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full
            bg-red-100 dark:bg-red-900/40
          "
        >
          <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
        </div>

        {/* MESSAGE */}
        <p className="mb-6 font-medium text-gray-600 dark:text-zinc-400">
          {message}
        </p>

        {/* ACTIONS */}
        <div className="flex justify-center gap-4">
          {/* CANCEL */}
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="
              w-full py-2 px-4 rounded-lg font-semibold transition
              bg-gray-100 hover:bg-gray-200 text-gray-900
              dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-white
              disabled:opacity-50
            "
          >
            Cancel
          </button>

          {/* DELETE */}
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="
              w-full py-2 px-4 rounded-lg font-semibold transition
              bg-red-600 hover:bg-red-700 text-white
              dark:bg-red-500 dark:hover:bg-red-600
              disabled:opacity-50
            "
          >
            {loading ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </ModalLayout>
  );
};
