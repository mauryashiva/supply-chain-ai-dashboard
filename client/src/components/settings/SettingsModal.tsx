import React, { useState, useEffect } from "react";
import { X, Save, Loader } from "lucide-react";
import type { AppSetting } from "@/types";
import { getSettings, updateSettings } from "@/services/api";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSettingsSave: () => void; // A new prop to call when settings are saved
}

// Helper function to format a setting key (e.g., "LOW_STOCK_THRESHOLD" -> "Low Stock Threshold")
const formatSettingKey = (key: string) => {
  return key
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onSettingsSave,
}) => {
  const [settings, setSettings] = useState<AppSetting[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // When the modal opens, fetch the current settings
    if (isOpen) {
      const fetchSettings = async () => {
        setLoading(true);
        setError(null);
        try {
          const response = await getSettings();
          setSettings(response.data);
        } catch (err) {
          setError("Failed to load settings.");
        } finally {
          setLoading(false);
        }
      };
      fetchSettings();
    }
  }, [isOpen]);

  // Handle changes to any setting input field
  const handleChange = (key: string, value: string) => {
    setSettings((currentSettings) =>
      currentSettings.map((setting) =>
        setting.setting_key === key
          ? { ...setting, setting_value: value }
          : setting
      )
    );
  };

  // Save the updated settings to the database
  const handleSave = async () => {
    setLoading(true);
    setError(null);
    try {
      await updateSettings({ settings });
      onSettingsSave(); // Signal to the parent component that settings were saved
    } catch (err) {
      setError("Failed to save settings.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // This modal uses a manual layout instead of the ModalLayout component
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4">
      <div className="bg-zinc-900 rounded-lg shadow-xl p-6 w-full max-w-md relative border border-zinc-700">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-500 hover:text-white"
        >
          <X size={20} />
        </button>
        <h2 className="text-xl font-bold text-white mb-6">
          Application Settings
        </h2>

        {/* Show a loader while settings are being fetched */}
        {loading && !settings.length ? (
          <div className="text-center text-zinc-400">
            <Loader className="animate-spin inline-block" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Map over the fetched settings and create an input for each */}
            {settings.map(({ setting_key, setting_value }) => (
              <div key={setting_key}>
                <label className="block text-sm font-medium text-zinc-300 mb-1">
                  {formatSettingKey(setting_key)}
                </label>
                <input
                  type="number"
                  value={setting_value}
                  onChange={(e) => handleChange(setting_key, e.target.value)}
                  className="w-full bg-zinc-800 rounded px-3 py-2 border border-zinc-700"
                  min="0"
                />
              </div>
            ))}
          </div>
        )}

        {/* Display any save/load errors */}
        {error && (
          <p className="text-red-500 text-sm mt-4 text-center">{error}</p>
        )}

        {/* Modal action buttons */}
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="bg-zinc-700 hover:bg-zinc-600 text-white font-semibold py-2 px-4 rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="bg-cyan-600 hover:bg-cyan-700 text-white font-semibold py-2 px-4 rounded-lg flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <Loader size={16} className="animate-spin" />
            ) : (
              <Save size={16} />
            )}
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
};
