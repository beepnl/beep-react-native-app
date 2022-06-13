import { ActionCreators, createActions } from 'reduxsauce';
import { FirmwareModel } from '../../Models/FirmwareModel';
import { RegisterState } from './InitialState';

export enum ApiTypes {
  GET_DEVICES = 'GET_DEVICES',
  CHECK_DEVICE_REGISTRATION = 'CHECK_DEVICE_REGISTRATION',
  REGISTER_DEVICE = 'REGISTER_DEVICE',
  SET_REGISTER_STATE = 'SET_REGISTER_STATE',
  SET_DEVICES = 'SET_DEVICES',
  INITIALIZE_SENSORS = 'INITIALIZE_SENSORS',
  CREATE_SENSOR_DEFINITION = 'CREATE_SENSOR_DEFINITION',
  GET_SENSOR_DEFINITIONS = 'GET_SENSOR_DEFINITIONS',
  UPDATE_API_SENSOR_DEFINITION = 'UPDATE_API_SENSOR_DEFINITION',
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
  checkDeviceRegistration: ['hardwareId'],
  registerDevice: ['peripheralId', 'hardwareId', 'requestParams'],
  setRegisterState: ['registerState'],
  setDevices: ['devices'],

  initializeSensors: ['device', 'temperatures'],
  createSensorDefinition: ['requestParams'],
  getSensorDefinitions: ['device'],
  updateApiSensorDefinition: ['sensorDefinition'],

  getFirmwares: null,
  setFirmwares: ['firmwares'],

  apiFailure: ['response'],
});

export default CreatedActions.Creators as C;