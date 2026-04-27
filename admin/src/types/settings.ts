/**
 * Represents a single key-value application setting.
 */
export interface AppSetting {
  setting_key: string;
  setting_value: string;
}

/**
 * Payload for updating the list of application settings.
 */
export interface AppSettingsUpdate {
  settings: AppSetting[];
}
