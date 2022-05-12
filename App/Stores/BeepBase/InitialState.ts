import { FirmwareVersionModel } from "../../Models/FirmwareVersionModel"
import { LogFileFrameModel } from "../../Models/LogFileFrameModel"
import { LogFileSizeModel } from "../../Models/LogFileSizeModel"
import { PairedPeripheralModel } from "../../Models/PairedPeripheralModel"
import { TemperatureModel } from "../../Models/TemperatureModel"

export interface BeepBaseState {
  pairedPeripheral: PairedPeripheralModel | undefined
  firmwareVersion: FirmwareVersionModel | undefined
  temperatures: Array<TemperatureModel>
  logFileSize: LogFileSizeModel | undefined
  logFileProgress: number
  logFileFrames: Array<LogFileFrameModel>
}

export const INITIAL_STATE: BeepBaseState = {
  pairedPeripheral: undefined,
  firmwareVersion: undefined,
  temperatures: [],
  logFileSize: undefined,
  logFileProgress: 0,
  logFileFrames: [],
}
