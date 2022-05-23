import { ActionCreators, createActions } from 'reduxsauce';
import { PairedPeripheralModel } from '../../Models/PairedPeripheralModel';

export enum SettingsTypes {
  SET_TOKEN = 'SET_TOKEN',
  SET_LANGUAGE_CODE = 'SET_LANGUAGE_CODE',
  ADD_PAIRED_PERIPHERAL = 'ADD_PAIRED_PERIPHERAL',
  UPDATE_PAIRED_PERIPHERAL = 'UPDATE_PAIRED_PERIPHERAL',
  REMOVE_PAIRED_PERIPHERAL = 'REMOVE_PAIRED_PERIPHERAL',
}

interface C extends ActionCreators {
  setToken: (token: string) => { type: SettingsTypes.SET_TOKEN };
  setLanguageCode: (languageCode: string) => { type: SettingsTypes.SET_LANGUAGE_CODE };
  addPairedPeripheral: (peripheral: PairedPeripheralModel) => { type: SettingsTypes.ADD_PAIRED_PERIPHERAL };
  updatePairedPeripheral: (peripheral: PairedPeripheralModel) => { type: SettingsTypes.UPDATE_PAIRED_PERIPHERAL };
  removePairedPeripheral: (peripheral: PairedPeripheralModel) => { type: SettingsTypes.REMOVE_PAIRED_PERIPHERAL };
}

const CreatedActions = createActions( {
  setToken: ['token'],
  setLanguageCode: ['languageCode'],
  addPairedPeripheral: ['peripheral'],
  updatePairedPeripheral: ['peripheral'],
  removePairedPeripheral: ['peripheral'],
} );

export default CreatedActions.Creators as C;