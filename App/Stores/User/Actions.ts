import { ActionCreators, createActions } from 'reduxsauce';
import { DeviceModel } from '../../Models/DeviceModel';
import { UserModel } from '../../Models/UserModel';

export enum UserTypes {
  SET_TOKEN = 'SET_TOKEN',
  SET_USER = 'SET_USER',
  SET_DEVICES = 'SET_DEVICES',
}

interface C extends ActionCreators {
  setToken: (token: string) => { type: UserTypes.SET_TOKEN };
  setUser: (user: UserModel) => { type: UserTypes.SET_USER };
  setDevices: (devices: Array<DeviceModel>) => { type: UserTypes.SET_DEVICES };
}

const CreatedActions = createActions( {
  setToken: ['token'],
  setUser: ['user'],
  setDevices: ['devices'],
} );

export default CreatedActions.Creators as C;