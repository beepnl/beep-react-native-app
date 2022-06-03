import { ActionCreators, createActions } from 'reduxsauce';
import { DeviceModel } from '../../Models/DeviceModel';
import { PairedPeripheralModel } from '../../Models/PairedPeripheralModel';
import { UserModel } from '../../Models/UserModel';

export enum SettingsTypes {
  SET_LANGUAGE_CODE = 'SET_LANGUAGE_CODE',
}

interface C extends ActionCreators {
  setLanguageCode: (languageCode: string) => { type: SettingsTypes.SET_LANGUAGE_CODE };
}

const CreatedActions = createActions( {
  setLanguageCode: ['languageCode'],
} );

export default CreatedActions.Creators as C;