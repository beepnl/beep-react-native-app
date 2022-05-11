import { ActionCreators, createActions } from 'reduxsauce';
import { LogFileFrameModel } from '../../Models/LogFileFrameModel';
import { LogFileSizeModel } from '../../Models/LogFileSizeModel';
import { PairedPeripheralModel } from '../../Models/PairedPeripheralModel';
import { TemperatureModel } from '../../Models/TemperatureModel';

export enum BeepBaseTypes {
  SET_PAIRED_PERIPHERAL = 'SET_PAIRED_PERIPHERAL',
  CLEAR_PAIRED_PERIPHERAL = 'CLEAR_PAIRED_PERIPHERAL',
  SET_TEMPERATURES = 'SET_TEMPERATURES',
  SET_LOG_FILE_SIZE = 'SET_LOG_FILE_SIZE',
  SET_LOG_FILE_PROGRESS = 'SET_LOG_FILE_PROGRESS',
  ADD_LOG_FILE_FRAME = 'ADD_LOG_FILE_FRAME',
  CLEAR_LOG_FILE_FRAMES = 'CLEAR_LOG_FILE_FRAMES',
}

interface C extends ActionCreators {
  setPairedPeripheral: (peripheral: PairedPeripheralModel) => { type: BeepBaseTypes.SET_PAIRED_PERIPHERAL };
  clearPairedPeripheral: () => { type: BeepBaseTypes.CLEAR_PAIRED_PERIPHERAL };
  setTemperatures: (temperatures: Array<TemperatureModel>) => { type: BeepBaseTypes.SET_TEMPERATURES };
  setLogFileSize: (size: LogFileSizeModel) => { type: BeepBaseTypes.SET_LOG_FILE_SIZE };
  setLogFileProgress: (progress: number) => { type: BeepBaseTypes.SET_LOG_FILE_PROGRESS };
  addLogFileFrame: (frame: LogFileFrameModel) => { type: BeepBaseTypes.ADD_LOG_FILE_FRAME };
  clearLogFileFrame: () => { type: BeepBaseTypes.CLEAR_LOG_FILE_FRAMES };
}

const CreatedActions = createActions( {
  setPairedPeripheral: ['peripheral'],
  clearPairedPeripheral: null,
  setTemperatures: ['temperatures'],
  setLogFileSize: ['size'],
  setLogFileProgress: ['progress'],
  addLogFileFrame: ['frame'],
  clearLogFileFrames: null,
} );

export default CreatedActions.Creators as C;