import { DeviceModel } from "../../Models/DeviceModel"
import { FirmwareVersionModel } from "../../Models/FirmwareVersionModel"
import { LogFileFrameModel } from "../../Models/LogFileFrameModel"
import { LogFileSizeModel } from "../../Models/LogFileSizeModel"
import { PairedPeripheralModel } from "../../Models/PairedPeripheralModel"
import { TemperatureModel } from "../../Models/TemperatureModel"

export interface BeepBaseState {
  pairedPeripheral: PairedPeripheralModel | undefined
  firmwareVersion: FirmwareVersionModel | undefined
  hardwareId: string | undefined
  temperatures: Array<TemperatureModel>
  logFileSize: LogFileSizeModel | undefined
  logFileProgress: number
  logFileFrames: Array<LogFileFrameModel>
  devices: Array<DeviceModel>
}

export const INITIAL_STATE: BeepBaseState = {
  pairedPeripheral: undefined,
  firmwareVersion: undefined,
  hardwareId: undefined,
  temperatures: [],
  logFileSize: undefined,
  logFileProgress: 0,
  logFileFrames: [],
  devices: [],                  //search result during registration
}
