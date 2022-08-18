import { INITIAL_STATE, BeepBaseState } from './InitialState'
import { createReducer } from 'reduxsauce'
import { BeepBaseTypes } from './Actions'
import { SensorDefinitionModel } from '../../Models/SensorDefinitionModel'

export const clear = (state: BeepBaseState, payload: any) => INITIAL_STATE

export const bleFailure = (state: BeepBaseState, payload: any) => {
  return {
    ...state,
    error: payload.error
  }
}

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

export const setApplicationConfig = (state: BeepBaseState, payload: any) => {
  return {
    ...state,
    applicationConfig: payload.applicationConfig
  }
}

export const setLoRaWanState = (state: BeepBaseState, payload: any) => {
  return {
    ...state,
    loRaWanState: payload.loRaWanState
  }
}

export const setLoRaWanDeviceEUI = (state: BeepBaseState, payload: any) => {
  return {
    ...state,
    loRaWanDeviceEUI: payload.loRaWanDeviceEUI
  }
}

export const setLoRaWanAppEUI = (state: BeepBaseState, payload: any) => {
  return {
    ...state,
    loRaWanAppEUI: payload.loRaWanAppEUI
  }
}

export const setLoRaWanAppKey = (state: BeepBaseState, payload: any) => {
  return {
    ...state,
    loRaWanAppKey: payload.loRaWanAppKey
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

export const setWeight = (state: BeepBaseState, payload: any) => {
  return {
    ...state,
    weight: payload.weight
  }
}

export const setAudio = (state: BeepBaseState, payload: any) => {
  return {
    ...state,
    audio: payload.audio
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
  const logFileFrames = [payload.frame] //only keep last frame
  return {
    ...state,
    logFileProgress: state.logFileProgress + logFileFrames[0]?.size,
    logFileFrames
  }
}

export const setEraseLogFileProgress = (state: BeepBaseState, payload: any) => {
  return {
    ...state,
    eraseLogFileProgress: payload.progress
  }
}

export const clearLogFileFrames = (state: BeepBaseState, payload: any) => {
  return {
    ...state,
    logFileProgress: 0,
    logFileFrames: []
  }
}

export const setBattery = (state: BeepBaseState, payload: any) => {
  return {
    ...state,
    batteryPercentage: payload.percentage
  }
}

export const setClock = (state: BeepBaseState, payload: any) => {
  return {
    ...state,
    clock: payload.clock
  }
}

export const setTilt = (state: BeepBaseState, payload: any) => {
  return {
    ...state,
    tilt: payload.tilt
  }
}

export const reducer = createReducer(INITIAL_STATE, {
  [BeepBaseTypes.CLEAR]: clear,
  [BeepBaseTypes.BLE_FAILURE]: bleFailure,
  [BeepBaseTypes.SET_PAIRED_PERIPHERAL]: setPairedPeripheral,
  [BeepBaseTypes.SET_DEVICE]: setDevice,
  [BeepBaseTypes.SET_FIRMWARE_VERSION]: setFirmwareVersion,
  [BeepBaseTypes.SET_HARDWARE_VERSION]: setHardwareVersion,
  [BeepBaseTypes.SET_HARDWARE_ID]: setHardwareId,
  [BeepBaseTypes.SET_APPLICATION_CONFIG]: setApplicationConfig,
  [BeepBaseTypes.SET_LO_RA_WAN_STATE]: setLoRaWanState,
  [BeepBaseTypes.SET_LO_RA_WAN_DEVICE_EUI]: setLoRaWanDeviceEUI,
  [BeepBaseTypes.SET_LO_RA_WAN_APP_EUI]: setLoRaWanAppEUI,
  [BeepBaseTypes.SET_LO_RA_WAN_APP_KEY]: setLoRaWanAppKey,
  [BeepBaseTypes.SET_SENSOR_DEFINITIONS]: setSensorDefinitions,
  [BeepBaseTypes.UPDATE_SENSOR_DEFINITION]: updateSensorDefinition,
  [BeepBaseTypes.SET_TEMPERATURES]: setTemperatures,
  [BeepBaseTypes.SET_WEIGHT]: setWeight,
  [BeepBaseTypes.SET_AUDIO]: setAudio,
  [BeepBaseTypes.SET_LOG_FILE_SIZE]: setLogFileSize,
  [BeepBaseTypes.SET_LOG_FILE_PROGRESS]: setLogFileProgress,
  [BeepBaseTypes.ADD_LOG_FILE_FRAME]: addLogFileFrame,
  [BeepBaseTypes.SET_ERASE_LOG_FILE_PROGRESS]: setEraseLogFileProgress,
  [BeepBaseTypes.CLEAR_LOG_FILE_FRAMES]: clearLogFileFrames,
  [BeepBaseTypes.SET_BATTERY]: setBattery,
  [BeepBaseTypes.SET_CLOCK]: setClock,
  [BeepBaseTypes.SET_TILT]: setTilt,
})
