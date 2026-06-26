import { AppState } from '@/App/Stores'
import { LogFileFrameModel } from '../../Models/LogFileFrameModel'
import { createSelector } from '@reduxjs/toolkit'

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

const getTemperatureSensorDefinitionState = (state: AppState) => state.beepBase.temperatureSensorDefinitions
const getTemperatureSensorDefinitionCount = (_state: AppState, count?: number) => count

export const getTemperatureSensorDefinitions = createSelector(
  [getTemperatureSensorDefinitionState, getTemperatureSensorDefinitionCount],
  (sensorDefinitions, count) => {
    if (count != undefined) {
      return sensorDefinitions.slice(0, count)
    }
    return sensorDefinitions
  }
)

export const getWeightSensorDefinitions = (state: AppState) => state.beepBase.weightSensorDefinitions

export const getFirstWeightSensorDefinition = createSelector(
  [getWeightSensorDefinitions],
  (sensorDefinitions) => sensorDefinitions[0] ?? null
)

export const getTemperatures = (state: AppState) => {
  return state.beepBase.temperatures
}

export const getWeight = (state: AppState) => {
  return state.beepBase.weight
}

export const getAudio = (state: AppState) => {
  return state.beepBase.audio
}

const getActiveLogDownloadState = (state: AppState, peripheralId?: string) => {
  const id = peripheralId ?? state.beepBase.pairedPeripheral?.id
  return id ? state.beepBase.logDownloadsByPeripheralId?.[id] : undefined
}

export const getLogFileSize = (state: AppState, peripheralId?: string) => {
  return getActiveLogDownloadState(state, peripheralId)?.logFileSize ?? state.beepBase.logFileSize
}

export const getLogFileProgress = (state: AppState, peripheralId?: string) => {
  return getActiveLogDownloadState(state, peripheralId)?.logFileProgress ?? state.beepBase.logFileProgress
}

export const getCombinedLogFileFrames = (state: AppState, peripheralId?: string) => {
  const frames = getActiveLogDownloadState(state, peripheralId)?.logFileFrames ?? state.beepBase.logFileFrames
  const sorted = [...frames].sort((a: LogFileFrameModel, b: LogFileFrameModel) => a.frame - b.frame)
  const buffers = sorted.map((model: LogFileFrameModel) => model.data)    //extract data frames
  return Buffer.concat(buffers)
}

export const getEraseLogFileProgress = (state: AppState, peripheralId?: string) => {
  return getActiveLogDownloadState(state, peripheralId)?.eraseLogFileProgress ?? state.beepBase.eraseLogFileProgress
}

export const getLogDownloadError = (state: AppState, peripheralId?: string) => {
  return getActiveLogDownloadState(state, peripheralId)?.error
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
