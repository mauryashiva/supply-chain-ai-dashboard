import React from "react";
import { AlertTriangle } from "lucide-react";
// Import the reusable ModalLayout component, which handles the modal's outer shell
import { ModalLayout } from "@/layouts/ModalLayout";

// Define the props that the ConfirmationModal component accepts
interface ConfirmationModalProps {
  isOpen: boolean; // Controls if the modal is visible
  onClose: () => void; // Function to call when closing the modal (e.g., clicking "Cancel")
  onConfirm: () => void; // Function to call when confirming the action (e.g., clicking "Delete")
  title: string; // The text for the modal's title/header
  message: string; // The descriptive message/question for the user
  loading: boolean; // Boolean to show a loading state on the confirm button
}

/**
 * A reusable modal for confirming destructive actions (like deletion).
 * It uses the ModalLayout component to handle the structure, backdrop, and title.
 */
export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  loading,
}) => {
  // The entire component is wrapped in ModalLayout
  return (
    <ModalLayout
      isOpen={isOpen}
      onClose={onClose}
      title={title} // Pass the title prop directly to the layout
      size="max-w-sm" // Pass a specific size prop to the layout
    >
      {/* All content below is passed as 'children' to ModalLayout */}
      <div className="text-center">
        {/* Warning Icon */}
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 mb-4">
          <AlertTriangle className="h-6 w-6 text-red-500" />
        </div>

        {/* The main confirmation message */}
        {/* The h2 title is no longer needed here as ModalLayout handles it */}
        <p className="text-zinc-400 mb-6">{message}</p>

        {/* Action Buttons */}
        <div className="flex justify-center gap-4">
          <button
            type="button"
            onClick={onClose}
            disabled={loading} // Disable if an action is in progress
            className="w-full bg-zinc-700 hover:bg-zinc-600 font-semibold py-2 px-4 rounded-lg"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading} // Disable if an action is in progress
            className="w-full bg-red-600 hover:bg-red-700 font-semibold py-2 px-4 rounded-lg disabled:opacity-50"
          >
            {/* Show dynamic text based on loading state */}
            {loading ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </ModalLayout>
  );
};
