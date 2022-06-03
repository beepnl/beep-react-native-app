import RNLanguageDetector from '@os-team/i18next-react-native-language-detector';

export interface SettingsState {
  languageCode: string | undefined
}

export const INITIAL_STATE: SettingsState = {
  languageCode: RNLanguageDetector.detect(),
}
