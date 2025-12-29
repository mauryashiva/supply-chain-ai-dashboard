import React from "react";
import { AlertTriangle } from "lucide-react";
// --- CHANGE 1: Import the reusable ModalLayout component ---
// This component handles the backdrop, panel, and title structure.
import { ModalLayout } from "@/layouts/ModalLayout";

// Define the props for the ConfirmationModal
interface ConfirmationModalProps {
  isOpen: boolean; // Controls whether the modal is shown or hidden
  onClose: () => void; // Function to call when the "Cancel" button or backdrop is clicked
  onConfirm: () => void; // Function to call when the "Delete" (confirm) button is clicked
  title: string; // The text to display in the modal's header
  message: string; // The main confirmation message or question
  loading: boolean; // When true, disables buttons and shows a loading state
}

/**
 * A reusable modal component designed to get user confirmation for a
 * destructive action, like deletion. It's built on top of ModalLayout.
 */
export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  loading,
}) => {
  // This check is now also handled by ModalLayout, but keeping it is safe.
  if (!isOpen) return null;

  // --- CHANGE 2: The entire return statement is now wrapped in ModalLayout ---
  // The old manual layout (backdrop, panel, title) has been removed.
  return (
    <ModalLayout
      isOpen={isOpen}
      onClose={onClose}
      title={title} // The title is passed as a prop to the layout
      size="max-w-sm" // This modal is set to be small
    >
      {/* The unique content of the confirmation modal remains inside */}
      <div className="text-center">
        {/* Warning icon (e.g., for a delete action) */}
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 mb-4">
          <AlertTriangle className="h-6 w-6 text-red-500" aria-hidden="true" />
        </div>

        {/* The main title is now handled by ModalLayout, so we only need the message. */}
        <p className="text-zinc-400 mb-8">{message}</p>

        {/* Action buttons (Cancel and Confirm) */}
        <div className="flex justify-center gap-4">
          <button
            type="button"
            onClick={onClose}
            disabled={loading} // Disable button when loading
            className="w-full bg-zinc-700 hover:bg-zinc-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading} // Disable button when loading
            className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg disabled:opacity-50 transition-colors"
          >
            {/* Show dynamic text based on the loading state */}
            {loading ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </ModalLayout>
  );
};
