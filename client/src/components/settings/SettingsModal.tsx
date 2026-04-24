import React, { useState, useEffect } from "react";
import { X, Save, Loader } from "lucide-react";
// 🛠️ Fixed: Updated to use centralized settingsService
import { settingsService } from "@/services/api";
// 🛠️ Fixed: Updated to type-only import for standard compliance
import type { AppSetting } from "@/types";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSettingsSave: () => void;
}

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
    if (isOpen) {
      const fetchSettings = async () => {
        setLoading(true);
        setError(null);
        try {
          // 🛠️ Fixed: Using centralized settingsService.getSettings()
          const response = await settingsService.getSettings();
          setSettings(response.data);
        } catch (err) {
          console.error("Failed to fetch settings:", err);
          setError("Failed to load application settings.");
        } finally {
          setLoading(false);
        }
      };
      fetchSettings();
    }
  }, [isOpen]);

  const handleChange = (key: string, value: string) => {
    setSettings((current) =>
      current.map((s) =>
        s.setting_key === key ? { ...s, setting_value: value } : s,
      ),
    );
  };

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    try {
      // 🛠️ Fixed: Using centralized settingsService.updateSettings()
      await settingsService.updateSettings({ settings });
      onSettingsSave();
      onClose(); // Optional: close on success
    } catch (err) {
      console.error("Failed to save settings:", err);
      setError("Failed to save changes. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4">
      <div className="relative w-full max-w-md rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl p-6 transition-all">
        {/* CLOSE BUTTON */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-900 dark:text-zinc-500 dark:hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        {/* TITLE */}
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 tracking-tight">
          System Configuration
        </h2>

        {/* CONTENT AREA */}
        {loading && !settings.length ? (
          <div className="py-12 flex justify-center items-center gap-3 text-gray-500 dark:text-zinc-400 font-medium">
            <Loader className="animate-spin" size={20} />
            <span>Retrieving settings...</span>
          </div>
        ) : (
          <div className="space-y-5">
            {settings.map(({ setting_key, setting_value }) => (
              <div key={setting_key} className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-400 ml-1">
                  {formatSettingKey(setting_key)}
                </label>

                <input
                  type="number"
                  value={setting_value}
                  onChange={(e) => handleChange(setting_key, e.target.value)}
                  min="0"
                  className="w-full h-11 rounded-xl px-4 border border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-950 text-gray-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                />
              </div>
            ))}
          </div>
        )}

        {/* ERROR MESSAGE */}
        {error && (
          <div className="mt-4 p-3 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20">
            <p className="text-red-600 dark:text-red-400 text-xs font-bold text-center">
              {error}
            </p>
          </div>
        )}

        {/* ACTION BUTTONS */}
        <div className="mt-8 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-300 font-bold transition-all"
          >
            Cancel
          </button>

          <button
            onClick={handleSave}
            disabled={loading}
            className="flex-[2] px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 disabled:opacity-50 transition-all active:scale-95"
          >
            {loading ? (
              <Loader size={18} className="animate-spin" />
            ) : (
              <Save size={18} />
            )}
            {loading ? "Saving..." : "Apply Settings"}
          </button>
        </div>
      </div>
    </div>
  );
};
