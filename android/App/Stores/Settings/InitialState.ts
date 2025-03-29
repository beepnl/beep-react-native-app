export interface SettingsState {
  languageCode: string | undefined
  username: string
}

export const INITIAL_STATE: SettingsState = {
  languageCode: "en",
  username: "",
}
