import { ActionCreators, createActions } from 'reduxsauce';
import { ApplicationConfigModel } from '../../Models/ApplicationConfigModel';
import { AteccModel } from '../../Models/AteccModel';
import { AudioModel } from '../../Models/AudioModel';
import { BatteryModel } from '../../Models/BatteryModel';
import { ClockModel } from '../../Models/ClockModel';
import { DeviceModel } from '../../Models/DeviceModel';
import { FirmwareVersionModel } from '../../Models/FirmwareVersionModel';
import { HardwareVersionModel } from '../../Models/HardwareVersionModel';
import { LogFileFrameModel } from '../../Models/LogFileFrameModel';
import { LogFileSizeModel } from '../../Models/LogFileSizeModel';
import { LoRaWanAppEUIModel } from '../../Models/LoRaWanAppEUIModel';
import { LoRaWanAppKeyModel } from '../../Models/LoRaWanAppKeyModel';
import { LoRaWanDeviceEUIModel } from '../../Models/LoRaWanDeviceEUIModel';
import { LoRaWanStateModel } from '../../Models/LoraWanStateModel';
import { PairedPeripheralModel } from '../../Models/PairedPeripheralModel';
import { SensorDefinitionModel } from '../../Models/SensorDefinitionModel';
import { TemperatureModel } from '../../Models/TemperatureModel';
import { TiltModel } from '../../Models/TiltModel';
import { WeightModel } from '../../Models/WeightModel';
import { RNLogger } from '../../Helpers/RNLogger';
import BleHelpers from '../../Helpers/BleHelpers';

export enum BeepBaseTypes {
  CLEAR = 'CLEAR',
  BLE_FAILURE = 'BLE_FAILURE',
  SET_PAIRED_PERIPHERAL = 'SET_PAIRED_PERIPHERAL',
  SET_DEVICE = 'SET_DEVICE',
  SET_FIRMWARE_VERSION = 'SET_FIRMWARE_VERSION',
  SET_HARDWARE_VERSION = 'SET_HARDWARE_VERSION',
  SET_HARDWARE_ID = 'SET_HARDWARE_ID',
  SET_APPLICATION_CONFIG = 'SET_APPLICATION_CONFIG',
  SET_LO_RA_WAN_STATE = 'SET_LO_RA_WAN_STATE',
  SET_LO_RA_WAN_DEVICE_EUI = 'SET_LO_RA_WAN_DEVICE_EUI',
  SET_LO_RA_WAN_APP_EUI = 'SET_LO_RA_WAN_APP_EUI',
  SET_LO_RA_WAN_APP_KEY = 'SET_LO_RA_WAN_APP_KEY',
  SET_SENSOR_DEFINITIONS = 'SET_SENSOR_DEFINITIONS',
  UPDATE_SENSOR_DEFINITION = 'UPDATE_SENSOR_DEFINITION',
  SET_TEMPERATURES = 'SET_TEMPERATURES',
  SET_WEIGHT = 'SET_WEIGHT',
  SET_AUDIO = 'SET_AUDIO',
  SET_LOG_FILE_SIZE = 'SET_LOG_FILE_SIZE',
  SET_LOG_FILE_PROGRESS = 'SET_LOG_FILE_PROGRESS',
  ADD_LOG_FILE_FRAME = 'ADD_LOG_FILE_FRAME',
  SET_ERASE_LOG_FILE_PROGRESS = 'SET_ERASE_LOG_FILE_PROGRESS',
  CLEAR_LOG_FILE_FRAMES = 'CLEAR_LOG_FILE_FRAMES',
  SET_BATTERY = 'SET_BATTERY',
  SET_CLOCK = 'SET_CLOCK',
  SET_TILT = 'SET_TILT',
  SET_DFU_UPDATING = 'SET_DFU_UPDATING',
}

interface C extends ActionCreators {
  clear: () => { type: BeepBaseTypes.CLEAR };
  bleFailure: ((error: any) => { type: BeepBaseTypes.BLE_FAILURE })
  setPairedPeripheral: (peripheral: PairedPeripheralModel) => { type: BeepBaseTypes.SET_PAIRED_PERIPHERAL };
  setDevice: (device: DeviceModel) => { type: BeepBaseTypes.SET_DEVICE };
  setFirmwareVersion: (firmwareVersion: FirmwareVersionModel) => { type: BeepBaseTypes.SET_FIRMWARE_VERSION };
  setHardwareVersion: (hardwareVersion: HardwareVersionModel) => { type: BeepBaseTypes.SET_HARDWARE_VERSION };
  setHardwareId: (atecc: AteccModel) => { type: BeepBaseTypes.SET_HARDWARE_ID };
  setApplicationConfig: (applicationConfig: ApplicationConfigModel) => { type: BeepBaseTypes.SET_APPLICATION_CONFIG };
  setLoRaWanState: (loRaWanState: LoRaWanStateModel) => { type: BeepBaseTypes.SET_LO_RA_WAN_STATE };
  setLoRaWanDeviceEUI: (loRaWanDeviceEUI: LoRaWanDeviceEUIModel) => { type: BeepBaseTypes.SET_LO_RA_WAN_DEVICE_EUI };
  setLoRaWanAppEUI: (loRaWanAppEUI: LoRaWanAppEUIModel) => { type: BeepBaseTypes.SET_LO_RA_WAN_APP_EUI };
  setLoRaWanAppKey: (loRaWanAppKey: LoRaWanAppKeyModel) => { type: BeepBaseTypes.SET_LO_RA_WAN_APP_KEY };
  setSensorDefinitions: (sensorDefinitions: Array<SensorDefinitionModel>) => { type: BeepBaseTypes.SET_SENSOR_DEFINITIONS };
  updateSensorDefinition: (sensorDefinition: SensorDefinitionModel) => { type: BeepBaseTypes.UPDATE_SENSOR_DEFINITION };
  setTemperatures: (temperatures: Array<TemperatureModel>) => { type: BeepBaseTypes.SET_TEMPERATURES };
  setWeight: (weight: WeightModel) => { type: BeepBaseTypes.SET_WEIGHT };
  setAudio: (audio: AudioModel) => { type: BeepBaseTypes.SET_AUDIO };
  setBattery: (battery: BatteryModel) => { type: BeepBaseTypes.SET_BATTERY };
  setClock: (clock: ClockModel) => { type: BeepBaseTypes.SET_CLOCK };
  setTilt: (tilt: TiltModel) => { type: BeepBaseTypes.SET_TILT };
  setLogFileSize: (size: LogFileSizeModel) => { type: BeepBaseTypes.SET_LOG_FILE_SIZE };
  setLogFileProgress: (progress: number) => { type: BeepBaseTypes.SET_LOG_FILE_PROGRESS };
  addLogFileFrame: (frame: LogFileFrameModel) => { type: BeepBaseTypes.ADD_LOG_FILE_FRAME };
  setEraseLogFileProgress: (progress: number) => { type: BeepBaseTypes.SET_ERASE_LOG_FILE_PROGRESS };
  clearLogFileFrame: () => { type: BeepBaseTypes.CLEAR_LOG_FILE_FRAMES };
  setDfuUpdating: (isDfuUpdating: boolean) => { type: BeepBaseTypes.SET_DFU_UPDATING };
}

const CreatedActions = createActions( {
  clear: null,
  bleFailure: ['error'],
  setPairedPeripheral: ['peripheral'],
  setDevice: ['device'],
  setFirmwareVersion: ['firmwareVersion'],
  setHardwareVersion: ['hardwareVersion'],
  setHardwareId: ['atecc'],
  setApplicationConfig: ['applicationConfig'],
  setLoRaWanState: ['loRaWanState'],
  setLoRaWanDeviceEUI: ['loRaWanDeviceEUI'],
  setLoRaWanAppEUI: ['loRaWanAppEUI'],
  setLoRaWanAppKey: ['loRaWanAppKey'],
  setSensorDefinitions: ['sensorDefinitions'],
  updateSensorDefinition: ['sensorDefinition'],
  setTemperatures: ['temperatures'],
  setWeight: ['weight'],
  setAudio: ['audio'],
  setBattery: ['percentage'],
  setClock: ['clock'],
  setTilt: ['tilt'],
  setLogFileSize: ['size'],
  setLogFileProgress: ['progress'],
  addLogFileFrame: ['frame'],
  setEraseLogFileProgress: ['progress'],
  clearLogFileFrames: null,
  setDfuUpdating: ['isDfuUpdating'],
} );

export default CreatedActions.Creators as C;