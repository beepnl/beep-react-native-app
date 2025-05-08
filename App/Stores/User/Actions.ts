import { ActionCreators, createActions } from 'reduxsauce';
import { DeviceModel } from '../../Models/DeviceModel';
import { UserModel } from '../../Models/UserModel';
import { AppMode } from './InitialState';

export enum UserTypes {
  SET_TOKEN = 'SET_TOKEN',
  SET_USER = 'SET_USER',
  SET_USE_PRODUCTION = 'SET_USE_PRODUCTION',
  SET_DEVICES = 'SET_DEVICES',
  SET_APP_MODE = 'SET_APP_MODE',
}

interface C extends ActionCreators {
  setToken: (token: string) => { type: UserTypes.SET_TOKEN };
  setUser: (user: UserModel) => { type: UserTypes.SET_USER };
  setUseProduction: (useProduction: boolean) => { type: UserTypes.SET_USE_PRODUCTION };
  setDevices: (devices: Array<DeviceModel>) => { type: UserTypes.SET_DEVICES };
  setAppMode: (appMode: AppMode) => { type: UserTypes.SET_APP_MODE };
}

const CreatedActions = createActions( {
  setToken: ['token'],
  setUser: ['user'],
  setUseProduction: ['useProduction'],
  setDevices: ['devices'],
  setAppMode: ['appMode'],
} );

export default CreatedActions.Creators as C;