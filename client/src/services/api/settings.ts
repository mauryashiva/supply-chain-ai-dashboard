// settings.ts
import { apiClient } from "./client";
import type { AppSetting, AppSettingsUpdate } from "@/types";

export const settingsService = {
  getSettings: () => apiClient.get<AppSetting[]>("/settings/"),
  updateSettings: (data: AppSettingsUpdate) =>
    apiClient.put<AppSetting[]>("/settings/", data),
};
