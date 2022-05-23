import { PairedPeripheralModel } from "../../Models/PairedPeripheralModel";
import RNLanguageDetector from '@os-team/i18next-react-native-language-detector';

export interface SettingsState {
  token: string | undefined
  languageCode: string | undefined
  pairedPeripherals: Array<PairedPeripheralModel>
}

export const INITIAL_STATE: SettingsState = {
  token: undefined,
  languageCode: RNLanguageDetector.detect(),
  pairedPeripherals: [],
}
