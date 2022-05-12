import { INITIAL_STATE, BeepBaseState } from './InitialState'
import { createReducer } from 'reduxsauce'
import { BeepBaseTypes } from './Actions'

export const setPairedPeripheral = (state: BeepBaseState, payload: any) => {
  return {
    ...state,
    pairedPeripheral: payload.peripheral
  }
}

export const clearPairedPeripheral = (state: BeepBaseState, payload: any) => {
  return {
    ...state,
    pairedPeripheral: undefined
  }
}

export const setFirmwareVersion = (state: BeepBaseState, payload: any) => {
  return {
    ...state,
    firmwareVersion: payload.firmwareVersion
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
  const logFileSize = state.logFileSize?.value() || 1
  const frameCount = state.logFileFrames.length
  let frameSize = 0
  if (frameCount) {
    frameSize = state.logFileFrames[0].size
  }
  return {
    ...state,
    logFileProgress: (frameCount * frameSize) / logFileSize,
    logFileFrames: [...state.logFileFrames, payload.frame]
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
  [BeepBaseTypes.SET_PAIRED_PERIPHERAL]: setPairedPeripheral,
  [BeepBaseTypes.CLEAR_PAIRED_PERIPHERAL]: clearPairedPeripheral,
  [BeepBaseTypes.SET_FIRMWARE_VERSION]: setFirmwareVersion,
  [BeepBaseTypes.SET_TEMPERATURES]: setTemperatures,
  [BeepBaseTypes.SET_LOG_FILE_SIZE]: setLogFileSize,
  [BeepBaseTypes.SET_LOG_FILE_PROGRESS]: setLogFileProgress,
  [BeepBaseTypes.ADD_LOG_FILE_FRAME]: addLogFileFrame,
  [BeepBaseTypes.CLEAR_LOG_FILE_FRAMES]: clearLogFileFrames,
})
