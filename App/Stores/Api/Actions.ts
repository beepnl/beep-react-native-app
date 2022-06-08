import { ActionCreators, createActions } from 'reduxsauce';
import { FirmwareModel } from '../../Models/FirmwareModel';
import { RegisterState } from './InitialState';

export enum ApiTypes {
  GET_DEVICES = 'GET_DEVICES',
  REGISTER_DEVICE = 'REGISTER_DEVICE',
  SET_REGISTER_STATE = 'SET_REGISTER_STATE',
  SET_DEVICES = 'SET_DEVICES',
  CREATE_SENSOR_DEFINITION = 'CREATE_SENSOR_DEFINITION',
  GET_SENSOR_DEFINITIONS = 'GET_SENSOR_DEFINITIONS',
  UPDATE_SENSOR_DEFINITION = 'UPDATE_SENSOR_DEFINITION',
  GET_FIRMWARES = 'GET_FIRMWARES',
  SET_FIRMWARES = 'SET_FIRMWARES',
  API_FAILURE = 'API_FAILURE',
}

interface C extends ActionCreators {
  getFirmwares: () => { type: ApiTypes.GET_FIRMWARES };
  setFirmwares: (firmwares: Array<FirmwareModel>) => { type: ApiTypes.SET_FIRMWARES };
  setRegisterState: (registerState: RegisterState) => { type: ApiTypes.SET_REGISTER_STATE }
  apiFailure: (response: any) => { type: ApiTypes.API_FAILURE };
}

const CreatedActions = createActions({
  getDevices: null,
  registerDevice: ['hardwareId', 'requestParams'],
  setRegisterState: ['registerState'],
  setDevices: ['devices'],

  createSensorDefinition: ['requestParams'],
  getSensorDefinitions: ['device'],
  updateSensorDefinition: ['requestParams'],

  getFirmwares: null,
  setFirmwares: ['firmwares'],

  apiFailure: ['response'],
});

export default CreatedActions.Creators as C;