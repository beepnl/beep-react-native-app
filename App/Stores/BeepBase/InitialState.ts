import { LogFileFrameModel } from "../../Models/LogFileFrameModel"
import { PairedPeripheralModel } from "../../Models/PairedPeripheralModel"
import { TemperatureModel } from "../../Models/TemperatureModel"

export interface BeepBaseState {
  pairedPeripheral: PairedPeripheralModel | undefined
  temperatures: Array<TemperatureModel>
  logFileSize: number
  logFileProgress: number
  logFileFrames: Array<LogFileFrameModel>
}

export const INITIAL_STATE: BeepBaseState = {
  pairedPeripheral: undefined,
  temperatures: [],
  logFileSize: 0,
  logFileProgress: 0,
  logFileFrames: [],
}
