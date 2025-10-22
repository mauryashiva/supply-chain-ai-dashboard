import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import {
  Upload,
  Loader,
  CheckCircle,
  AlertCircle,
  FileDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

// --- CHANGE 1: Naye 'export' functions aur 'saveAs' ko import karein ---
import {
  uploadInventoryCSV,
  uploadOrdersCSV,
  exportInventoryCSV, // Naya import
  exportOrdersCSV, // Naya import
} from "@/services/api";
import { saveAs } from "file-saver"; // Naya import

// --- Dropzone Component (No Change) ---
interface DropzoneProps {
  onDrop: (files: File[]) => void;
  loading: boolean;
  title: string;
}

const FileDropzone: React.FC<DropzoneProps> = ({ onDrop, loading, title }) => {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "text/csv": [".csv"] },
    multiple: false,
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        "border-2 border-dashed border-zinc-700 rounded-lg p-12 text-center transition-colors cursor-pointer",
        isDragActive
          ? "border-cyan-500 bg-zinc-800/50"
          : "hover:border-zinc-500"
      )}
    >
      <input {...getInputProps()} />
      {loading ? (
        <div className="flex flex-col items-center">
          <Loader className="mx-auto h-12 w-12 text-cyan-400 animate-spin" />
          <p className="mt-4 text-sm text-zinc-400">
            Uploading, please wait...
          </p>
        </div>
      ) : (
        <div className="flex flex-col items-center">
          <Upload className="mx-auto h-12 w-12 text-zinc-500" />
          <p className="mt-4 text-sm text-zinc-400">{title}</p>
          <p className="mt-1 text-xs text-zinc-500">.csv files only</p>
        </div>
      )}
    </div>
  );
};

// --- Main Import Page Component ---
const ImportPage: React.FC = () => {
  // Import states
  const [invLoading, setInvLoading] = useState(false);
  const [invError, setInvError] = useState<string | null>(null);
  const [invSuccess, setInvSuccess] = useState<string | null>(null);

  const [orderLoading, setOrderLoading] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [orderSuccess, setOrderSuccess] = useState<string | null>(null);

  // Export states
  const [invExportLoading, setInvExportLoading] = useState(false);
  const [orderExportLoading, setOrderExportLoading] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  // Import Handlers (No Change)
  const onInventoryDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    const file = acceptedFiles[0];
    setInvLoading(true);
    setInvError(null);
    setInvSuccess(null);

    try {
      const response = await uploadInventoryCSV(file);
      const added = response.data.products_added || 0;
      const errors = response.data.errors || [];

      let successMessage = `${added} products were successfully added.`;
      if (errors.length > 0) {
        successMessage += ` ${errors.length} rows had errors.`;
        setInvError(`First error: ${errors[0]}`);
      }
      setInvSuccess(successMessage);
    } catch (err: any) {
      let errorMessage = "File upload failed. Please try again.";
      const detail = err.response?.data?.detail;

      if (typeof detail === "string") {
        errorMessage = detail;
      } else if (typeof detail === "object" && detail !== null) {
        errorMessage =
          detail.message || "An unknown error occurred during upload.";
        if (detail.errors && detail.errors.length > 0) {
          errorMessage += ` (Details: ${detail.errors[0]})`;
        }
      }
      setInvError(errorMessage);
    } finally {
      setInvLoading(false);
    }
  }, []);

  const onOrdersDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    const file = acceptedFiles[0];
    setOrderLoading(true);
    setOrderError(null);
    setOrderSuccess(null);

    try {
      const response = await uploadOrdersCSV(file);
      const added = response.data.orders_created || 0;
      const errors = response.data.errors || [];

      let successMessage = `${added} orders were successfully created.`;
      if (errors.length > 0) {
        successMessage += ` ${errors.length} orders had errors.`;
        setOrderError(`First error: ${errors[0]}`);
      }
      setOrderSuccess(successMessage);
    } catch (err: any) {
      let errorMessage = "File upload failed. Please try again.";
      const detail = err.response?.data?.detail;
      if (typeof detail === "string") errorMessage = detail;
      else if (typeof detail === "object" && detail !== null) {
        errorMessage = detail.message || "An unknown error occurred.";
        if (detail.errors && detail.errors.length > 0)
          errorMessage += ` (Details: ${detail.errors[0]})`;
      }
      setOrderError(errorMessage);
    } finally {
      setOrderLoading(false);
    }
  }, []);

  // --- CHANGE 3: Export handlers ko update karein ---

  // Inventory Export Handler
  const handleInventoryExport = useCallback(async () => {
    setInvExportLoading(true);
    setExportError(null);
    try {
      // Asli API call karein
      const response = await exportInventoryCSV();
      // File ko 'saveAs' se download karein
      saveAs(response.data, "inventory_export.csv");
    } catch (err) {
      console.error(err);
      setExportError("Failed to export inventory.");
    } finally {
      setInvExportLoading(false);
    }
  }, []);

  // Orders Export Handler
  const handleOrdersExport = useCallback(async () => {
    setOrderExportLoading(true);
    setExportError(null);
    try {
      // Asli API call karein
      const response = await exportOrdersCSV();
      // File ko 'saveAs' se download karein
      saveAs(response.data, "orders_export.csv");
    } catch (err) {
      console.error(err);
      setExportError("Failed to export orders.");
    } finally {
      setOrderExportLoading(false);
    }
  }, []);

  return (
    <div className="bg-zinc-900 rounded-lg shadow-lg p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Import & Export Data</h1>
        <p className="text-sm text-zinc-400">
          Bulk upload or download your products and orders.
        </p>
      </div>

      {/* Common Error message for Export */}
      {exportError && (
        <div className="mb-4 p-3 rounded-md bg-red-500/10 border border-red-500/30 text-red-300 flex items-center gap-3">
          <AlertCircle size={16} /> <p className="text-sm">{exportError}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* === Section 1: Inventory === */}
        <div className="border-t border-zinc-800 pt-6 flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-white">Inventory</h2>
            {/* Inventory Export Button (No change) */}
            <button
              onClick={handleInventoryExport}
              disabled={invExportLoading}
              className="flex items-center gap-2 px-3 py-1.5 text-xs bg-zinc-700 text-zinc-300 rounded-md hover:bg-zinc-600 disabled:opacity-50"
            >
              {invExportLoading ? (
                <Loader className="h-4 w-4 animate-spin" />
              ) : (
                <FileDown className="h-4 w-4" />
              )}
              Export All
            </button>
          </div>

          <FileDropzone
            onDrop={onInventoryDrop}
            loading={invLoading}
            title="Drag & drop Inventory CSV to Import"
          />
          {invSuccess && (
            <div className="mt-4 p-3 rounded-md bg-green-500/10 border border-green-500/30 text-green-300 flex items-center gap-3">
              <CheckCircle size={16} /> <p className="text-sm">{invSuccess}</p>
            </div>
          )}
          {invError && (
            <div className="mt-4 p-3 rounded-md bg-red-500/10 border border-red-500/30 text-red-300 flex items-center gap-3">
              <AlertCircle size={16} /> <p className="text-sm">{invError}</p>
            </div>
          )}
        </div>

        {/* === Section 2: Orders === */}
        <div className="border-t border-zinc-800 pt-6 flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-white">Orders</h2>
            {/* Orders Export Button (No change) */}
            <button
              onClick={handleOrdersExport}
              disabled={orderExportLoading}
              className="flex items-center gap-2 px-3 py-1.5 text-xs bg-zinc-700 text-zinc-300 rounded-md hover:bg-zinc-600 disabled:opacity-50"
            >
              {orderExportLoading ? (
                <Loader className="h-4 w-4 animate-spin" />
              ) : (
                <FileDown className="h-4 w-4" />
              )}
              Export All
            </button>
          </div>

          <FileDropzone
            onDrop={onOrdersDrop}
            loading={orderLoading}
            title="Drag & drop Orders CSV to Import"
          />
          {orderSuccess && (
            <div className="mt-4 p-3 rounded-md bg-green-500/10 border border-green-500/30 text-green-300 flex items-center gap-3">
              <CheckCircle size={16} />{" "}
              <p className="text-sm">{orderSuccess}</p>
            </div>
          )}
          {orderError && (
            <div className="mt-4 p-3 rounded-md bg-red-500/10 border border-red-500/30 text-red-300 flex items-center gap-3">
              <AlertCircle size={16} /> <p className="text-sm">{orderError}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImportPage;
