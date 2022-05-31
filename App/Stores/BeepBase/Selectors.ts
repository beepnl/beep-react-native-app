import { AppState } from 'App/Stores'
import { LogFileFrameModel } from '../../Models/LogFileFrameModel'

export const getPairedPeripheral = (state: AppState) => {
  return state.beepBase.pairedPeripheral
}

export const getFirmwareVersion = (state: AppState) => {
  return state.beepBase.firmwareVersion
}

export const getHardwareId = (state: AppState) => {
  return state.beepBase.hardwareId
}

export const getTemperatures = (state: AppState) => {
  return state.beepBase.temperatures
}

export const getLogFileSize = (state: AppState) => {
  return state.beepBase.logFileSize
}

export const getLogFileProgress = (state: AppState) => {
  return state.beepBase.logFileProgress
}

export const getCombinedLogFileFrames = (state: AppState) => {
  const sorted = state.beepBase.logFileFrames.sort((a: LogFileFrameModel, b: LogFileFrameModel) => a.frame - b.frame)   //sort in place
  const buffers = sorted.map((model: LogFileFrameModel) => model.data)    //extract data frames
  return Buffer.concat(buffers)
}

export const getDevices = (state: AppState) => {
  return state.beepBase.devices
}
