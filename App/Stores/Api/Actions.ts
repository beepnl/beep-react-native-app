import { ActionCreators, createActions } from 'reduxsauce';
import { FirmwareModel } from '../../Models/FirmwareModel';

export enum ApiTypes {
  GET_DEVICES = 'GET_DEVICES',
  GET_FIRMWARES = 'GET_FIRMWARES',
  SET_FIRMWARES = 'SET_FIRMWARES',
  API_FAILURE = 'API_FAILURE',
}

interface C extends ActionCreators {
  getFirmwares: () => { type: ApiTypes.GET_FIRMWARES };
  setFirmwares: (firmwares: Array<FirmwareModel>) => { type: ApiTypes.SET_FIRMWARES };
  apiFailure: (response: any) => { type: ApiTypes.API_FAILURE };
}

const CreatedActions = createActions({
  getDevices: null,
  getFirmwares: null,
  setFirmwares: ['firmwares'],

  apiFailure: ['response'],
});

export default CreatedActions.Creators as C;