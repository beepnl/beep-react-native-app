import { AudioModel } from "../../Models/AudioModel"
import { DeviceModel } from "../../Models/DeviceModel"
import { FirmwareVersionModel } from "../../Models/FirmwareVersionModel"
import { HardwareVersionModel } from "../../Models/HardwareVersionModel"
import { LogFileFrameModel } from "../../Models/LogFileFrameModel"
import { LogFileSizeModel } from "../../Models/LogFileSizeModel"
import { LoRaWanStateModel } from "../../Models/LoraWanStateModel"
import { PairedPeripheralModel } from "../../Models/PairedPeripheralModel"
import { SensorDefinitionModel } from "../../Models/SensorDefinitionModel"
import { TemperatureModel } from "../../Models/TemperatureModel"
import { WeightModel } from "../../Models/WeightModel"

export interface BeepBaseState {
  pairedPeripheral: PairedPeripheralModel | undefined
  device: DeviceModel | undefined
  firmwareVersion: FirmwareVersionModel | undefined
  hardwareVersion: HardwareVersionModel | undefined
  hardwareId: string | undefined
  loRaWanState: LoRaWanStateModel | undefined
  sensorDefinitions: Array<SensorDefinitionModel>
  temperatures: Array<TemperatureModel>
  weight: WeightModel | undefined
  audio: AudioModel | undefined
  logFileSize: LogFileSizeModel | undefined
  logFileProgress: number
  logFileFrames: Array<LogFileFrameModel>
}

export const INITIAL_STATE: BeepBaseState = {
  pairedPeripheral: undefined,
  device: undefined,
  firmwareVersion: undefined,
  hardwareVersion: undefined,
  hardwareId: undefined,
  loRaWanState: undefined,
  sensorDefinitions: [],
  temperatures: [],
  weight: undefined,
  audio: undefined,
  logFileSize: undefined,
  logFileProgress: 0,
  logFileFrames: [],
}
