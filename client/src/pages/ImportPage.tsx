import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import {
  Upload,
  Loader,
  CheckCircle,
  AlertCircle,
  FileDown,
  Download,
  FileWarning,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  uploadInventoryCSV,
  uploadOrdersCSV,
  exportInventoryCSV,
  exportOrdersCSV,
  downloadInventoryTemplate,
  downloadOrderTemplate,
  downloadInventoryErrorFile,
  // --- CHANGE 1: Import order error download function ---
  downloadOrderErrorFile,
} from "@/services/api";
import { saveAs } from "file-saver";

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
  // Inventory states
  const [invLoading, setInvLoading] = useState(false);
  const [invError, setInvError] = useState<string | null>(null);
  const [invSuccess, setInvSuccess] = useState<string | null>(null);
  const [invErrorReportId, setInvErrorReportId] = useState<string | null>(null);
  const [invExportLoading, setInvExportLoading] = useState(false);
  const [invTemplateLoading, setInvTemplateLoading] = useState(false);
  const [invErrorFileLoading, setInvErrorFileLoading] = useState(false);

  // Order states
  const [orderLoading, setOrderLoading] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [orderSuccess, setOrderSuccess] = useState<string | null>(null);
  // --- CHANGE 2: Add state for order error report ID ---
  const [orderErrorReportId, setOrderErrorReportId] = useState<string | null>(
    null
  );
  const [orderExportLoading, setOrderExportLoading] = useState(false);
  const [orderTemplateLoading, setOrderTemplateLoading] = useState(false);
  // --- CHANGE 3: Add state for order error file loading ---
  const [orderErrorFileLoading, setOrderErrorFileLoading] = useState(false);

  // Shared export/download error state
  const [exportError, setExportError] = useState<string | null>(null);

  // Inventory Import Handler (No Change)
  const onInventoryDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    const file = acceptedFiles[0];
    setInvLoading(true);
    setInvError(null);
    setInvSuccess(null);
    setExportError(null);
    setInvErrorReportId(null);

    try {
      const response = await uploadInventoryCSV(file);
      const data = response.data;
      const added = data.products_added || 0;
      const updated = data.products_updated || 0;
      const errors = data.errors || [];
      let successMessage =
        data.message || `${added} products added, ${updated} products updated.`;

      if (errors.length > 0) {
        setInvError(`${errors.length} row(s) had errors. See details below.`);
        if (data.error_report_id) {
          setInvErrorReportId(data.error_report_id);
        }
      }
      setInvSuccess(
        successMessage.replace(` ${errors.length} row(s) had errors.`, "")
      );
    } catch (err: any) {
      let errorMessage = "File upload failed. Please try again.";
      const errorData = err.response?.data;
      const detail = errorData?.detail;
      if (errorData && errorData.message && Array.isArray(errorData.errors)) {
        errorMessage = errorData.message || "An unknown error occurred.";
        if (errorData.errors.length > 0) {
          errorMessage += ` ${errorData.errors.length} error(s) recorded.`;
          if (errorData.error_report_id) {
            setInvErrorReportId(errorData.error_report_id);
          }
        }
      } else if (typeof detail === "string") {
        errorMessage = detail;
      } else if (
        typeof detail === "object" &&
        detail !== null &&
        detail.message
      ) {
        errorMessage = detail.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      setInvError(errorMessage);
      setInvSuccess(null);
    } finally {
      setInvLoading(false);
    }
  }, []);

  // Order Import Handler (Updated)
  const onOrdersDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    const file = acceptedFiles[0];
    setOrderLoading(true);
    setOrderError(null);
    setOrderSuccess(null);
    setExportError(null);
    // --- CHANGE 4: Reset order error report ID ---
    setOrderErrorReportId(null);

    try {
      const response = await uploadOrdersCSV(file);
      const data = response.data; // Expect OrderUploadResponse
      const added = data.orders_created || 0;
      const errors = data.errors || [];

      let successMessage = data.message || `${added} orders created.`;

      if (errors.length > 0) {
        setOrderError(
          `${errors.length} row(s) / order(s) had errors. See details below.`
        );
        // --- CHANGE 5: Store order error report ID ---
        if (data.error_report_id) {
          setOrderErrorReportId(data.error_report_id);
        }
      }
      // Clean up success message and set it
      setOrderSuccess(
        successMessage
          .replace(
            ` ${errors.length} row(s) corresponding to failed orders had errors.`,
            ""
          )
          .replace(
            ` ${errors.length} row(s) had errors. No orders were created.`,
            ""
          )
      );
    } catch (err: any) {
      let errorMessage = "Order file upload failed. Please try again.";
      const errorData = err.response?.data;
      const detail = errorData?.detail;

      // Check for structured error response from backend on HTTP error
      if (errorData && errorData.message && Array.isArray(errorData.errors)) {
        errorMessage =
          errorData.message || "An unknown error occurred during order upload.";
        if (errorData.errors.length > 0) {
          errorMessage += ` ${errorData.errors.length} error(s) recorded.`;
          // --- CHANGE 6: Try to get order report ID from error response ---
          if (errorData.error_report_id) {
            setOrderErrorReportId(errorData.error_report_id);
          }
        }
      } else if (typeof detail === "string") {
        errorMessage = detail;
      } else if (
        typeof detail === "object" &&
        detail !== null &&
        detail.message
      ) {
        errorMessage = detail.message;
      } else if (err.message) {
        errorMessage = err.message;
      }

      setOrderError(errorMessage);
      setOrderSuccess(null); // Clear success on error
    } finally {
      setOrderLoading(false);
    }
  }, []);

  // Export Handlers (No Change)
  const handleInventoryExport = useCallback(async () => {
    setInvExportLoading(true);
    setExportError(null);
    try {
      const response = await exportInventoryCSV();
      saveAs(response.data, "inventory_export.csv");
    } catch (err) {
      console.error(err);
      setExportError("Failed to export inventory.");
    } finally {
      setInvExportLoading(false);
    }
  }, []);

  const handleOrdersExport = useCallback(async () => {
    setOrderExportLoading(true);
    setExportError(null);
    try {
      const response = await exportOrdersCSV();
      saveAs(response.data, "orders_export.csv");
    } catch (err) {
      console.error(err);
      setExportError("Failed to export orders.");
    } finally {
      setOrderExportLoading(false);
    }
  }, []);

  // Template Handlers (No Change)
  const handleInventoryTemplateDownload = useCallback(async () => {
    setInvTemplateLoading(true);
    setExportError(null); // Clear previous errors
    try {
      const response = await downloadInventoryTemplate();
      saveAs(response.data, "inventory_import_template.csv");
    } catch (err) {
      console.error(err);
      setExportError("Failed to download inventory template.");
    } finally {
      setInvTemplateLoading(false);
    }
  }, []);

  const handleOrderTemplateDownload = useCallback(async () => {
    setOrderTemplateLoading(true);
    setExportError(null); // Clear previous errors
    try {
      const response = await downloadOrderTemplate();
      saveAs(response.data, "orders_import_template.csv");
    } catch (err) {
      console.error(err);
      setExportError("Failed to download orders template.");
    } finally {
      setOrderTemplateLoading(false);
    }
  }, []);

  // Inventory Error File Handler (No Change)
  const handleDownloadInventoryErrorFile = useCallback(async () => {
    if (!invErrorReportId) return;
    setInvErrorFileLoading(true);
    setExportError(null);
    try {
      const response = await downloadInventoryErrorFile(invErrorReportId);
      saveAs(response.data, `inventory_errors_${invErrorReportId}.csv`);
    } catch (err: any) {
      console.error("Error downloading inventory error file:", err);
      let errorMsg = "Failed to download inventory error file.";
      if (err.response?.status === 404) {
        errorMsg = "Inventory error report not found or expired.";
        setInvErrorReportId(null);
      }
      setExportError(errorMsg);
    } finally {
      setInvErrorFileLoading(false);
    }
  }, [invErrorReportId]);

  // --- CHANGE 7: Handler to download the order error file ---
  const handleDownloadOrderErrorFile = useCallback(async () => {
    if (!orderErrorReportId) return;

    setOrderErrorFileLoading(true);
    setExportError(null);
    try {
      const response = await downloadOrderErrorFile(orderErrorReportId);
      saveAs(response.data, `order_errors_${orderErrorReportId}.csv`);
    } catch (err: any) {
      console.error("Error downloading order error file:", err);
      let errorMsg = "Failed to download order error file.";
      if (err.response?.status === 404) {
        errorMsg = "Order error report not found or expired.";
        setOrderErrorReportId(null); // Clear invalid ID
      }
      setExportError(errorMsg);
    } finally {
      setOrderErrorFileLoading(false);
    }
  }, [orderErrorReportId]);

  return (
    <div className="bg-zinc-900 rounded-lg shadow-lg p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Import & Export Data</h1>
        <p className="text-sm text-zinc-400">
          Bulk upload or download your products and orders.
        </p>
      </div>

      {/* Common Error message for Export/Template/ErrorFile Download */}
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

          <button
            onClick={handleInventoryTemplateDownload}
            disabled={invTemplateLoading}
            className="flex items-center justify-center gap-2 py-1.5 text-xs text-zinc-400 rounded-md hover:text-white hover:bg-zinc-800 disabled:opacity-50 transition-colors"
          >
            {invTemplateLoading ? (
              <Loader className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            Download Template
          </button>

          {/* Success Message */}
          {invSuccess && (
            <div className="mt-4 p-3 rounded-md bg-green-500/10 border border-green-500/30 text-green-300 flex items-center gap-3">
              <CheckCircle size={16} /> <p className="text-sm">{invSuccess}</p>
            </div>
          )}

          {/* Error Message */}
          {invError && (
            <div className="mt-4 p-3 rounded-md bg-red-500/10 border border-red-500/30 text-red-300 flex flex-col gap-2">
              {" "}
              {/* Changed to flex-col */}
              <div className="flex items-center gap-3">
                <AlertCircle size={16} /> <p className="text-sm">{invError}</p>
              </div>
              {/* Conditional Download Error Button */}
              {invErrorReportId && (
                <button
                  onClick={handleDownloadInventoryErrorFile}
                  disabled={invErrorFileLoading}
                  className="flex items-center justify-center gap-2 mt-2 px-3 py-1.5 text-xs bg-red-900/50 text-red-200 rounded-md hover:bg-red-800/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {invErrorFileLoading ? (
                    <Loader className="h-4 w-4 animate-spin" />
                  ) : (
                    <FileWarning className="h-4 w-4" /> // Use FileWarning icon
                  )}
                  Download Error File
                </button>
              )}
            </div>
          )}
        </div>

        {/* === Section 2: Orders === */}
        <div className="border-t border-zinc-800 pt-6 flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-white">Orders</h2>
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

          <button
            onClick={handleOrderTemplateDownload}
            disabled={orderTemplateLoading}
            className="flex items-center justify-center gap-2 py-1.5 text-xs text-zinc-400 rounded-md hover:text-white hover:bg-zinc-800 disabled:opacity-50 transition-colors"
          >
            {orderTemplateLoading ? (
              <Loader className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            Download Template
          </button>

          {orderSuccess && (
            <div className="mt-4 p-3 rounded-md bg-green-500/10 border border-green-500/30 text-green-300 flex items-center gap-3">
              <CheckCircle size={16} />{" "}
              <p className="text-sm">{orderSuccess}</p>
            </div>
          )}

          {/* --- CHANGE 8: Add conditional download button for orders --- */}
          {orderError && (
            <div className="mt-4 p-3 rounded-md bg-red-500/10 border border-red-500/30 text-red-300 flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <AlertCircle size={16} />{" "}
                <p className="text-sm">{orderError}</p>
              </div>
              {/* Show button if orderErrorReportId exists */}
              {orderErrorReportId && (
                <button
                  onClick={handleDownloadOrderErrorFile}
                  disabled={orderErrorFileLoading}
                  className="flex items-center justify-center gap-2 mt-2 px-3 py-1.5 text-xs bg-red-900/50 text-red-200 rounded-md hover:bg-red-800/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {orderErrorFileLoading ? (
                    <Loader className="h-4 w-4 animate-spin" />
                  ) : (
                    <FileWarning className="h-4 w-4" />
                  )}
                  Download Error File
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImportPage;
