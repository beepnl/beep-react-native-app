import { ActionCreators, createActions } from 'reduxsauce';
import { DeviceModel } from '../../Models/DeviceModel';
import { PairedPeripheralModel } from '../../Models/PairedPeripheralModel';
import { UserModel } from '../../Models/UserModel';

export enum SettingsTypes {
  SET_TOKEN = 'SET_TOKEN',
  SET_USER = 'SET_USER',
  SET_DEVICES = 'SET_DEVICES',
}

interface C extends ActionCreators {
  setToken: (token: string) => { type: SettingsTypes.SET_TOKEN };
  setUser: (user: UserModel) => { type: SettingsTypes.SET_USER };
  setDevices: (devices: Array<DeviceModel>) => { type: SettingsTypes.SET_DEVICES };
}

const CreatedActions = createActions( {
  setToken: ['token'],
  setUser: ['user'],
  setDevices: ['devices'],
} );

export default CreatedActions.Creators as C;