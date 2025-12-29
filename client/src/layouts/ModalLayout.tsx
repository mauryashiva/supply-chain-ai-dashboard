import React from "react";
import { X } from "lucide-react"; // Import the 'X' icon for the close button

// Define the props accepted by the ModalLayout component
interface ModalLayoutProps {
  isOpen: boolean; // Controls whether the modal is visible or hidden
  onClose: () => void; // Function to call when the modal should be closed (e.g., clicking backdrop or close button)
  title: string; // The title displayed at the top of the modal
  children: React.ReactNode; // The content to be rendered inside the modal body
  size?: // Optional prop to control the maximum width of the modal
  | "max-w-sm"
    | "max-w-md"
    | "max-w-lg"
    | "max-w-xl"
    | "max-w-2xl"
    | "max-w-3xl"
    | "max-w-4xl"; // Added more size options
}

/**
 * A reusable layout component for creating modals.
 * It provides the backdrop, the modal panel structure, the title,
 * and the close button. The specific content of the modal is passed
 * via the `children` prop.
 */
export const ModalLayout: React.FC<ModalLayoutProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = "max-w-md", // Default size is 'md' if none is provided
}) => {
  // If the modal is not open, render nothing.
  if (!isOpen) return null;

  return (
    // Backdrop overlay: Covers the entire screen with a semi-transparent background.
    // Clicking the backdrop calls the `onClose` function.
    // It's scrollable (`overflow-y-auto`) and aligns content to the top (`items-start`).
    <div
      onClick={onClose}
      className="fixed inset-0 bg-black/60 z-50 flex justify-center items-start overflow-y-auto p-4 pt-8 md:pt-12"
    >
      {/* Modal Panel: The main container for the modal content. */}
      {/* `onClick={(e) => e.stopPropagation()}` prevents clicks inside the panel from closing the modal. */}
      {/* Applies the specified `size` class for width control and adds bottom margin (`mb-8`). */}
      <div
        onClick={(e) => e.stopPropagation()}
        className={`bg-zinc-900 rounded-lg shadow-xl p-8 w-full relative border border-zinc-700 mb-8 ${size}`}
      >
        {/* Close Button: Positioned at the top-right corner. */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-500 hover:text-white"
        >
          <X size={20} />
        </button>

        {/* Modal Title: Displayed prominently at the top. */}
        <h2 className="text-2xl font-bold text-white mb-6">{title}</h2>

        {/* Modal Content Area: Renders whatever content was passed as `children`. */}
        <div>{children}</div>
      </div>
    </div>
  );
};
