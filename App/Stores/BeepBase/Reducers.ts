import { INITIAL_STATE, BeepBaseState } from './InitialState'
import { createReducer } from 'reduxsauce'
import { BeepBaseTypes } from './Actions'
import { SensorDefinitionModel } from '../../Models/SensorDefinitionModel'

export const clear = (state: BeepBaseState, payload: any) => INITIAL_STATE

export const setPairedPeripheral = (state: BeepBaseState, payload: any) => {
  return {
    ...state,
    pairedPeripheral: payload.peripheral
  }
}

export const setDevice = (state: BeepBaseState, payload: any) => {
  return {
    ...state,
    device: payload.device
  }
}

export const setFirmwareVersion = (state: BeepBaseState, payload: any) => {
  return {
    ...state,
    firmwareVersion: payload.firmwareVersion
  }
}

export const setHardwareVersion = (state: BeepBaseState, payload: any) => {
  return {
    ...state,
    hardwareVersion: payload.hardwareVersion
  }
}

export const setHardwareId = (state: BeepBaseState, payload: any) => {
  return {
    ...state,
    hardwareId: payload.atecc
  }
}

export const setSensorDefinitions = (state: BeepBaseState, payload: any) => {
  return {
    ...state,
    sensorDefinitions: payload.sensorDefinitions
  }
}

export const updateSensorDefinition = (state: BeepBaseState, payload: any) => {
  const { sensorDefinition } = payload
  const sensorDefinitions = state.sensorDefinitions.map((sd: SensorDefinitionModel) => sd.id === sensorDefinition.id ? sensorDefinition : sd)
  return {
    ...state,
    sensorDefinitions
  }
}

export const setTemperatures = (state: BeepBaseState, payload: any) => {
  return {
    ...state,
    temperatures: payload.temperatures
  }
}

export const setLogFileSize = (state: BeepBaseState, payload: any) => {
  return {
    ...state,
    logFileSize: payload.size
  }
}

export const setLogFileProgress = (state: BeepBaseState, payload: any) => {
  return {
    ...state,
    logFileProgress: payload.progress
  }
}

export const addLogFileFrame = (state: BeepBaseState, payload: any) => {
  // const logFileFrames = [...state.logFileFrames, payload.frame]
  const logFileFrames = [payload.frame] //only keep last frame for UI
  return {
    ...state,
    logFileProgress: state.logFileProgress + logFileFrames[0]?.size,
    logFileFrames
  }
}

export const clearLogFileFrames = (state: BeepBaseState, payload: any) => {
  return {
    ...state,
    logFileProgress: 0,
    logFileFrames: []
  }
}

export const reducer = createReducer(INITIAL_STATE, {
  [BeepBaseTypes.CLEAR]: clear,
  [BeepBaseTypes.SET_PAIRED_PERIPHERAL]: setPairedPeripheral,
  [BeepBaseTypes.SET_DEVICE]: setDevice,
  [BeepBaseTypes.SET_FIRMWARE_VERSION]: setFirmwareVersion,
  [BeepBaseTypes.SET_HARDWARE_VERSION]: setHardwareVersion,
  [BeepBaseTypes.SET_HARDWARE_ID]: setHardwareId,
  [BeepBaseTypes.SET_SENSOR_DEFINITIONS]: setSensorDefinitions,
  [BeepBaseTypes.UPDATE_SENSOR_DEFINITION]: updateSensorDefinition,
  [BeepBaseTypes.SET_TEMPERATURES]: setTemperatures,
  [BeepBaseTypes.SET_LOG_FILE_SIZE]: setLogFileSize,
  [BeepBaseTypes.SET_LOG_FILE_PROGRESS]: setLogFileProgress,
  [BeepBaseTypes.ADD_LOG_FILE_FRAME]: addLogFileFrame,
  [BeepBaseTypes.CLEAR_LOG_FILE_FRAMES]: clearLogFileFrames,
})
