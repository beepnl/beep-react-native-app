import { ApplicationConfigModel } from "../../Models/ApplicationConfigModel"
import { AudioModel } from "../../Models/AudioModel"
import { ClockModel } from "../../Models/ClockModel"
import { DeviceModel } from "../../Models/DeviceModel"
import { FirmwareVersionModel } from "../../Models/FirmwareVersionModel"
import { HardwareVersionModel } from "../../Models/HardwareVersionModel"
import { LogFileFrameModel } from "../../Models/LogFileFrameModel"
import { LogFileSizeModel } from "../../Models/LogFileSizeModel"
import { LoRaWanAppEUIModel } from "../../Models/LoRaWanAppEUIModel"
import { LoRaWanAppKeyModel } from "../../Models/LoRaWanAppKeyModel"
import { LoRaWanDeviceEUIModel } from "../../Models/LoRaWanDeviceEUIModel"
import { LoRaWanStateModel } from "../../Models/LoraWanStateModel"
import { PairedPeripheralModel } from "../../Models/PairedPeripheralModel"
import { SensorDefinitionModel } from "../../Models/SensorDefinitionModel"
import { TemperatureModel } from "../../Models/TemperatureModel"
import { TiltModel } from "../../Models/TiltModel"
import { WeightModel } from "../../Models/WeightModel"

export interface BeepBaseState {
  error: any
  pairedPeripheral: PairedPeripheralModel | undefined
  device: DeviceModel | undefined
  firmwareVersion: FirmwareVersionModel | undefined
  hardwareVersion: HardwareVersionModel | undefined
  hardwareId: string | undefined
  applicationConfig: ApplicationConfigModel | undefined
  loRaWanState: LoRaWanStateModel | undefined
  loRaWanDeviceEUI: LoRaWanDeviceEUIModel | undefined
  loRaWanAppEUI: LoRaWanAppEUIModel | undefined
  loRaWanAppKey: LoRaWanAppKeyModel | undefined
  sensorDefinitions: Array<SensorDefinitionModel>
  temperatureSensorDefinitions: Array<SensorDefinitionModel>
  weightSensorDefinitions: Array<SensorDefinitionModel>
  temperatures: Array<TemperatureModel>
  weight: WeightModel | undefined
  audio: AudioModel | undefined
  logFileSize: LogFileSizeModel | undefined
  logFileProgress: number
  logFileFrames: Array<LogFileFrameModel>
  eraseLogFileProgress: number
  batteryPercentage: number | undefined
  clock: ClockModel | undefined
  tilt: TiltModel | undefined
  isDfuUpdating: boolean
}

export const INITIAL_STATE: BeepBaseState = {
  error: undefined,
  pairedPeripheral: undefined,
  device: undefined,
  firmwareVersion: undefined,
  hardwareVersion: undefined,
  hardwareId: undefined,
  applicationConfig: undefined,
  loRaWanState: undefined,
  loRaWanDeviceEUI: undefined,
  loRaWanAppEUI: undefined,
  loRaWanAppKey: undefined,
  sensorDefinitions: [],
  temperatureSensorDefinitions: [],
  weightSensorDefinitions: [],
  temperatures: [],
  weight: undefined,
  audio: undefined,
  logFileSize: undefined,
  logFileProgress: 0,
  logFileFrames: [],
  eraseLogFileProgress: 0,
  batteryPercentage: undefined,
  clock: undefined,
  tilt: undefined,
  isDfuUpdating: false,
}
