import { ActionCreators, createActions } from 'reduxsauce';
import { FirmwareModel } from '../../Models/FirmwareModel';
import { RegisterState } from './InitialState';

export enum ApiTypes {
  GET_DEVICES = 'GET_DEVICES',
  CHECK_DEVICE_REGISTRATION = 'CHECK_DEVICE_REGISTRATION',
  REGISTER_DEVICE = 'REGISTER_DEVICE',
  SET_REGISTER_STATE = 'SET_REGISTER_STATE',
  SET_LO_RA_CONFIG_STATE = 'SET_LO_RA_CONFIG_STATE',
  SET_DISABLE_LORA = 'SET_DISABLE_LORA',
  CONFIGURE_LO_RA_AUTOMATIC = 'CONFIGURE_LO_RA_AUTOMATIC',
  CONFIGURE_LO_RA_MANUAL = 'CONFIGURE_LO_RA_MANUAL',
  SET_DEVICES = 'SET_DEVICES',
  INITIALIZE_TEMPERATURE_SENSORS = 'INITIALIZE_TEMPERATURE_SENSORS',
  INITIALIZE_WEIGHT_SENSOR = 'INITIALIZE_WEIGHT_SENSOR',
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
  setLoRaConfigState: (loRaConfigState: RegisterState) => { type: ApiTypes.SET_LO_RA_CONFIG_STATE }
  setDisableLoRa: () => { type: ApiTypes.SET_DISABLE_LORA }
  apiFailure: (response: any) => { type: ApiTypes.API_FAILURE };
}

const CreatedActions = createActions({
  getDevices: null,
  checkDeviceRegistration: ['peripheralId', 'hardwareId'],
  registerDevice: ['peripheralId', 'requestParams'],
  configureLoRaAutomatic: ['appKey', 'devEUI'],
  configureLoRaManual: ['devEUI', 'appEui', 'appKey'],
  setRegisterState: ['registerState'],
  setDisableLoRa: null,
  setLoRaConfigState: ['loRaConfigState'],
  setDevices: ['devices'],

  initializeTemperatureSensors: ['device', 'temperatureSensors', 'navigateToScreen'],
  initializeWeightSensor: ['device', 'weight'],
  createSensorDefinition: ['requestParams'],
  getSensorDefinitions: ['device'],
  updateApiSensorDefinition: ['sensorDefinition'],

  getFirmwares: null,
  setFirmwares: ['firmwares'],

  apiFailure: ['response'],
});

export default CreatedActions.Creators as C;