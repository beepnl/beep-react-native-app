import { AppState } from 'App/Stores'
import { LogFileFrameModel } from '../../Models/LogFileFrameModel'
import { SensorDefinitionModel } from '../../Models/SensorDefinitionModel'

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

export const getSensorDefinitions = (state: AppState) => {
  return state.beepBase.sensorDefinitions
}

export const getTemperatureSensorDefinitions = (state: AppState) => {
  return state.beepBase.sensorDefinitions.filter((sensorDefinition: SensorDefinitionModel) => sensorDefinition.isTemperatureSensor())
}

export const getWeightSensorDefinitions = (state: AppState) => {
  return state.beepBase.sensorDefinitions.filter((sensorDefinition: SensorDefinitionModel) => sensorDefinition.isWeightSensor())
}

export const getTemperatures = (state: AppState) => {
  return state.beepBase.temperatures
}

export const getWeight = (state: AppState) => {
  return state.beepBase.weight
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
