import { PairedPeripheralModel } from "../../Models/PairedPeripheralModel";
import RNLanguageDetector from '@os-team/i18next-react-native-language-detector';
import { UserModel } from "../../Models/UserModel";

export interface SettingsState {
  token: string | undefined
  user: UserModel | undefined,
  languageCode: string | undefined
  pairedPeripherals: Array<PairedPeripheralModel>
}

export const INITIAL_STATE: SettingsState = {
  token: undefined,
  user: undefined,
  languageCode: RNLanguageDetector.detect(),
  pairedPeripherals: [],
}
