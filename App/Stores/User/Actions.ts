import { ActionCreators, createActions } from 'reduxsauce';
import { DeviceModel } from '../../Models/DeviceModel';
import { PairedPeripheralModel } from '../../Models/PairedPeripheralModel';
import { UserModel } from '../../Models/UserModel';

export enum SettingsTypes {
  SET_TOKEN = 'SET_TOKEN',
  SET_USER = 'SET_USER',
  SET_USER_DEVICES = 'SET_USER_DEVICES',
}

interface C extends ActionCreators {
  setToken: (token: string) => { type: SettingsTypes.SET_TOKEN };
  setUser: (user: UserModel) => { type: SettingsTypes.SET_USER };
  setUserDevices: (devices: Array<DeviceModel>) => { type: SettingsTypes.SET_USER_DEVICES };
}

const CreatedActions = createActions( {
  setToken: ['token'],
  setUser: ['user'],
  setUserDevices: ['devices'],
} );

export default CreatedActions.Creators as C;