import { PairedPeripheralModel } from "../../Models/PairedPeripheralModel";
import RNLanguageDetector from '@os-team/i18next-react-native-language-detector';

export interface SettingsState {
  languageCode: string | undefined
  pairedPeripherals: Array<PairedPeripheralModel>
}

export const INITIAL_STATE: SettingsState = {
  languageCode: RNLanguageDetector.detect(),
  pairedPeripherals: [],
}
