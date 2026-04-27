import React from "react";
import { X } from "lucide-react";

interface ModalLayoutProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?:
    | "max-w-sm"
    | "max-w-md"
    | "max-w-lg"
    | "max-w-xl"
    | "max-w-2xl"
    | "max-w-3xl"
    | "max-w-4xl";
}

export const ModalLayout: React.FC<ModalLayoutProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = "max-w-md",
}) => {
  if (!isOpen) return null;

  return (
    /* BACKDROP */
    <div
      onClick={onClose}
      className="
        fixed inset-0 z-50
        flex justify-center items-start
        overflow-y-auto
        p-4 pt-8 md:pt-12
        bg-black/40 dark:bg-black/60
        backdrop-blur-[2px]
      "
    >
      {/* MODAL PANEL */}
      <div
        onClick={(e) => e.stopPropagation()}
        className={`
          w-full ${size} mb-8 relative p-8 rounded-xl shadow-xl
          bg-white dark:bg-zinc-900
          border border-gray-200 dark:border-zinc-800
          text-gray-900 dark:text-white
          transition-colors
        `}
      >
        {/* CLOSE BUTTON */}
        <button
          onClick={onClose}
          className="
            absolute top-4 right-4
            text-gray-400 hover:text-gray-700
            dark:text-zinc-500 dark:hover:text-white
            transition
          "
        >
          <X size={20} />
        </button>

        {/* TITLE */}
        <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
          {title}
        </h2>

        {/* CONTENT */}
        <div>{children}</div>
      </div>
    </div>
  );
};
