import { ActionCreators, createActions } from 'reduxsauce';
import { AteccModel } from '../../Models/AteccModel';
import { FirmwareVersionModel } from '../../Models/FirmwareVersionModel';
import { LogFileFrameModel } from '../../Models/LogFileFrameModel';
import { LogFileSizeModel } from '../../Models/LogFileSizeModel';
import { PairedPeripheralModel } from '../../Models/PairedPeripheralModel';
import { TemperatureModel } from '../../Models/TemperatureModel';

export enum BeepBaseTypes {
  SET_PAIRED_PERIPHERAL = 'SET_PAIRED_PERIPHERAL',
  CLEAR_PAIRED_PERIPHERAL = 'CLEAR_PAIRED_PERIPHERAL',
  SET_FIRMWARE_VERSION = 'SET_FIRMWARE_VERSION',
  SET_HARDWARE_ID = 'SET_HARDWARE_ID',
  SET_TEMPERATURES = 'SET_TEMPERATURES',
  SET_LOG_FILE_SIZE = 'SET_LOG_FILE_SIZE',
  SET_LOG_FILE_PROGRESS = 'SET_LOG_FILE_PROGRESS',
  ADD_LOG_FILE_FRAME = 'ADD_LOG_FILE_FRAME',
  CLEAR_LOG_FILE_FRAMES = 'CLEAR_LOG_FILE_FRAMES',
}

interface C extends ActionCreators {
  setPairedPeripheral: (peripheral: PairedPeripheralModel) => { type: BeepBaseTypes.SET_PAIRED_PERIPHERAL };
  clearPairedPeripheral: () => { type: BeepBaseTypes.CLEAR_PAIRED_PERIPHERAL };
  setFirmwareVersion: (firmwareVersion: FirmwareVersionModel) => { type: BeepBaseTypes.SET_FIRMWARE_VERSION };
  setHardwareId: (atecc: AteccModel) => { type: BeepBaseTypes.SET_HARDWARE_ID };
  setTemperatures: (temperatures: Array<TemperatureModel>) => { type: BeepBaseTypes.SET_TEMPERATURES };
  setLogFileSize: (size: LogFileSizeModel) => { type: BeepBaseTypes.SET_LOG_FILE_SIZE };
  setLogFileProgress: (progress: number) => { type: BeepBaseTypes.SET_LOG_FILE_PROGRESS };
  addLogFileFrame: (frame: LogFileFrameModel) => { type: BeepBaseTypes.ADD_LOG_FILE_FRAME };
  clearLogFileFrame: () => { type: BeepBaseTypes.CLEAR_LOG_FILE_FRAMES };
}

const CreatedActions = createActions( {
  setPairedPeripheral: ['peripheral'],
  clearPairedPeripheral: null,
  setFirmwareVersion: ['firmwareVersion'],
  setHardwareId: ['atecc'],
  setTemperatures: ['temperatures'],
  setLogFileSize: ['size'],
  setLogFileProgress: ['progress'],
  addLogFileFrame: ['frame'],
  clearLogFileFrames: null,
} );

export default CreatedActions.Creators as C;