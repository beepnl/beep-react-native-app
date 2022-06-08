import { ActionCreators, createActions } from 'reduxsauce';
import { AteccModel } from '../../Models/AteccModel';
import { DeviceModel } from '../../Models/DeviceModel';
import { FirmwareVersionModel } from '../../Models/FirmwareVersionModel';
import { HardwareVersionModel } from '../../Models/HardwareVersionModel';
import { LogFileFrameModel } from '../../Models/LogFileFrameModel';
import { LogFileSizeModel } from '../../Models/LogFileSizeModel';
import { PairedPeripheralModel } from '../../Models/PairedPeripheralModel';
import { SensorDefinitionModel } from '../../Models/SensorDefinitionModel';
import { TemperatureModel } from '../../Models/TemperatureModel';

export enum BeepBaseTypes {
  CLEAR = 'CLEAR',
  SET_PAIRED_PERIPHERAL = 'SET_PAIRED_PERIPHERAL',
  SET_DEVICE = 'SET_DEVICE',
  SET_FIRMWARE_VERSION = 'SET_FIRMWARE_VERSION',
  SET_HARDWARE_VERSION = 'SET_HARDWARE_VERSION',
  SET_HARDWARE_ID = 'SET_HARDWARE_ID',
  SET_SENSOR_DEFINITIONS = 'SET_SENSOR_DEFINITIONS',
  SET_TEMPERATURES = 'SET_TEMPERATURES',
  SET_LOG_FILE_SIZE = 'SET_LOG_FILE_SIZE',
  SET_LOG_FILE_PROGRESS = 'SET_LOG_FILE_PROGRESS',
  ADD_LOG_FILE_FRAME = 'ADD_LOG_FILE_FRAME',
  CLEAR_LOG_FILE_FRAMES = 'CLEAR_LOG_FILE_FRAMES',
}

interface C extends ActionCreators {
  clear: () => { type: BeepBaseTypes.CLEAR };
  setPairedPeripheral: (peripheral: PairedPeripheralModel) => { type: BeepBaseTypes.SET_PAIRED_PERIPHERAL };
  setDevice: (device: DeviceModel) => { type: BeepBaseTypes.SET_DEVICE };
  setFirmwareVersion: (firmwareVersion: FirmwareVersionModel) => { type: BeepBaseTypes.SET_FIRMWARE_VERSION };
  setHardwareVersion: (hardwareVersion: HardwareVersionModel) => { type: BeepBaseTypes.SET_HARDWARE_VERSION };
  setHardwareId: (atecc: AteccModel) => { type: BeepBaseTypes.SET_HARDWARE_ID };
  setSensorDefinitions: (sensorDefinitions: Array<SensorDefinitionModel>) => { type: BeepBaseTypes.SET_SENSOR_DEFINITIONS };
  setTemperatures: (temperatures: Array<TemperatureModel>) => { type: BeepBaseTypes.SET_TEMPERATURES };
  setLogFileSize: (size: LogFileSizeModel) => { type: BeepBaseTypes.SET_LOG_FILE_SIZE };
  setLogFileProgress: (progress: number) => { type: BeepBaseTypes.SET_LOG_FILE_PROGRESS };
  addLogFileFrame: (frame: LogFileFrameModel) => { type: BeepBaseTypes.ADD_LOG_FILE_FRAME };
  clearLogFileFrame: () => { type: BeepBaseTypes.CLEAR_LOG_FILE_FRAMES };
}

const CreatedActions = createActions( {
  clear: null,
  setPairedPeripheral: ['peripheral'],
  setDevice: ['device'],
  setFirmwareVersion: ['firmwareVersion'],
  setHardwareVersion: ['hardwareVersion'],
  setHardwareId: ['atecc'],
  setSensorDefinitions: ['sensorDefinitions'],
  setTemperatures: ['temperatures'],
  setLogFileSize: ['size'],
  setLogFileProgress: ['progress'],
  addLogFileFrame: ['frame'],
  clearLogFileFrames: null,
} );

export default CreatedActions.Creators as C;