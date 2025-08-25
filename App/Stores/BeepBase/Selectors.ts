import { AppState } from 'App/Stores'
import { LogFileFrameModel } from '../../Models/LogFileFrameModel'

export const getError = (state: AppState) => {
  return state.beepBase.error
}

export const getPairedPeripheral = (state: AppState) => {
  return state.beepBase.pairedPeripheral
}

export const getDevice = (state: AppState) => {
  return state.beepBase.device
}

export const getFirmwareVersion = (state: AppState) => {
  return state.beepBase.firmwareVersion
}

export const getHardwareVersion = (state: AppState) => {
  return state.beepBase.hardwareVersion
}

export const getHardwareId = (state: AppState) => {
  return state.beepBase.hardwareId
}

export const getApplicationConfig = (state: AppState) => {
  return state.beepBase.applicationConfig
}

export const getLoRaWanState = (state: AppState) => {
  return state.beepBase.loRaWanState
}

export const getLoRaWanDeviceEUI = (state: AppState) => {
  return state.beepBase.loRaWanDeviceEUI
}

export const getLoRaWanAppEUI = (state: AppState) => {
  return state.beepBase.loRaWanAppEUI
}

export const getLoRaWanAppKey = (state: AppState) => {
  return state.beepBase.loRaWanAppKey
}

export const getSensorDefinitions = (state: AppState) => {
  return state.beepBase.sensorDefinitions
}

export const getTemperatureSensorDefinitions = (state: AppState, count?: number) => {
  const sensorDefinitions = state.beepBase.temperatureSensorDefinitions
  if (count != undefined) {
    return sensorDefinitions.slice(0, count)
  }
  return sensorDefinitions
}

export const getWeightSensorDefinitions = (state: AppState) => {
  const sensorDefinitions = state.beepBase.weightSensorDefinitions
  return sensorDefinitions.slice(0, 1)  //always return one weight sensor
}

export const getTemperatures = (state: AppState) => {
  return state.beepBase.temperatures
}

export const getWeight = (state: AppState) => {
  return state.beepBase.weight
}

export const getAudio = (state: AppState) => {
  return state.beepBase.audio
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

export const getEraseLogFileProgress = (state: AppState) => {
  return state.beepBase.eraseLogFileProgress
}

export const getBatteryPercentage = (state: AppState) => {
  return state.beepBase.batteryPercentage
}

export const getClock = (state: AppState) => {
  return state.beepBase.clock
}

export const getTilt = (state: AppState) => {
  return state.beepBase.tilt
}

export const getDfuUpdating = (state: AppState) => {
  return state.beepBase.isDfuUpdating
}
