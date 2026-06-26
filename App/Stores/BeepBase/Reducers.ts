import { createReducer } from 'reduxsauce'
import { SensorDefinitionModel } from '../../Models/SensorDefinitionModel'
import { BeepBaseTypes } from './Actions'
import { BeepBaseState, INITIAL_STATE, LogDownloadState } from './InitialState'

export const clear = (state: BeepBaseState, payload: any) => INITIAL_STATE

export const bleFailure = (state: BeepBaseState, payload: any) => {
  if (payload.error) {
    console.log("BLE Failure", payload.error)
  }
  
  return {
    ...state,
    error: payload.error
  }
}

export const setPairedPeripheral = (state: BeepBaseState, payload: any) => {
  if (!payload.peripheral) {
    return { ...state, pairedPeripheral: undefined}
  }

  // Merge with existing pairedPeripheral to preserve fields like deviceId/name
  const prev = state.pairedPeripheral || {}
  const next = { ...prev, ...payload.peripheral }
  return {
    ...state,
    pairedPeripheral: next
  }
}

export const setDevice = (state: BeepBaseState, payload: any) => {
  const oldDevice = state.device
  const newDevice = {
    ...payload.device,
    previousDevEUI: oldDevice?.devEUI ?? payload.device.devEUI,
  }
  return {
    ...state,
    device: newDevice
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

function getSensorDefinitionsByType(sensorDefinitions: SensorDefinitionModel[], filterFunction: (sensorDefinition: SensorDefinitionModel) => boolean): Array<SensorDefinitionModel> {
  //filter all sensor definitions on temperature sensor type
  const filtered = sensorDefinitions.filter(filterFunction)
  //group by input abbreviation
  const tsdByInputAbbr = new Map<string, SensorDefinitionModel>()
  filtered.forEach((tsd: SensorDefinitionModel) => {
    if (!tsdByInputAbbr.has(tsd.inputAbbreviation)) {
      tsdByInputAbbr.set(tsd.inputAbbreviation, tsd)
    }
  })
  //flatten
  const flattened = Array.from(tsdByInputAbbr.values())
  //sort on input abbreviation
  flattened.sort((a: SensorDefinitionModel, b: SensorDefinitionModel) => a.inputAbbreviation < b.inputAbbreviation ? -1 : 1)
  return flattened
}

export const setSensorDefinitions = (state: BeepBaseState, payload: any) => {
  const sensorDefinitions = payload.sensorDefinitions
  const temperatureSensorDefinitions = getSensorDefinitionsByType(sensorDefinitions, (sensorDefinition: SensorDefinitionModel) => sensorDefinition.isTemperatureSensor())
  const weightSensorDefinitions = getSensorDefinitionsByType(sensorDefinitions, (sensorDefinition: SensorDefinitionModel) => sensorDefinition.isWeightSensor())
  
  return {
    ...state,
    sensorDefinitions,
    temperatureSensorDefinitions,
    weightSensorDefinitions,
  }
}

export const updateSensorDefinition = (state: BeepBaseState, payload: any) => {
  const { sensorDefinition } = payload
  const sensorDefinitions = state.sensorDefinitions.map((sd: SensorDefinitionModel) => sd.id === sensorDefinition.id ? sensorDefinition : sd)
  return setSensorDefinitions(state, { sensorDefinitions })
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

const emptyLogDownloadState = (): LogDownloadState => ({
  logFileSize: undefined,
  logFileProgress: 0,
  logFileFrames: [],
  eraseLogFileProgress: 0,
  error: undefined,
})

const shouldUpdateLegacyLogState = (state: BeepBaseState, peripheralId?: string) => {
  return !peripheralId || state.pairedPeripheral?.id === peripheralId
}

export const setLogFileSize = (state: BeepBaseState, payload: any) => {
  const peripheralId = payload.peripheralId
  if (peripheralId) {
    const sessionsByPeripheralId = state.logDownloadsByPeripheralId ?? {}
    const session = sessionsByPeripheralId[peripheralId] ?? emptyLogDownloadState()
    const nextState = {
      ...state,
      logDownloadsByPeripheralId: {
        ...sessionsByPeripheralId,
        [peripheralId]: {
          ...session,
          logFileSize: payload.size,
          error: undefined,
        },
      },
    }

    if (!shouldUpdateLegacyLogState(state, peripheralId)) {
      return nextState
    }

    return {
      ...nextState,
      logFileSize: payload.size,
    }
  }

  return {
    ...state,
    logFileSize: payload.size
  }
}

export const setLogFileProgress = (state: BeepBaseState, payload: any) => {
  const peripheralId = payload.peripheralId
  if (peripheralId) {
    const sessionsByPeripheralId = state.logDownloadsByPeripheralId ?? {}
    const session = sessionsByPeripheralId[peripheralId] ?? emptyLogDownloadState()
    const nextState = {
      ...state,
      logDownloadsByPeripheralId: {
        ...sessionsByPeripheralId,
        [peripheralId]: {
          ...session,
          logFileProgress: payload.progress,
        },
      },
    }

    if (!shouldUpdateLegacyLogState(state, peripheralId)) {
      return nextState
    }

    return {
      ...nextState,
      logFileProgress: payload.progress,
    }
  }

  return {
    ...state,
    logFileProgress: payload.progress
  }
}

export const addLogFileFrame = (state: BeepBaseState, payload: any) => {
  const logFileFrames = [payload.frame] //only keep last frame
  const peripheralId = payload.peripheralId

  if (peripheralId) {
    const sessionsByPeripheralId = state.logDownloadsByPeripheralId ?? {}
    const session = sessionsByPeripheralId[peripheralId] ?? emptyLogDownloadState()
    const nextProgress = session.logFileProgress + (logFileFrames[0]?.size ?? 0)
    const nextState = {
      ...state,
      logDownloadsByPeripheralId: {
        ...sessionsByPeripheralId,
        [peripheralId]: {
          ...session,
          logFileProgress: nextProgress,
          logFileFrames,
        },
      },
    }

    if (!shouldUpdateLegacyLogState(state, peripheralId)) {
      return nextState
    }

    return {
      ...nextState,
      logFileProgress: nextProgress,
      logFileFrames,
    }
  }

  return {
    ...state,
    logFileProgress: state.logFileProgress + logFileFrames[0]?.size,
    logFileFrames
  }
}

export const setEraseLogFileProgress = (state: BeepBaseState, payload: any) => {
  const peripheralId = payload.peripheralId
  if (peripheralId) {
    const sessionsByPeripheralId = state.logDownloadsByPeripheralId ?? {}
    const session = sessionsByPeripheralId[peripheralId] ?? emptyLogDownloadState()
    const nextState = {
      ...state,
      logDownloadsByPeripheralId: {
        ...sessionsByPeripheralId,
        [peripheralId]: {
          ...session,
          eraseLogFileProgress: payload.progress,
        },
      },
    }

    if (!shouldUpdateLegacyLogState(state, peripheralId)) {
      return nextState
    }

    return {
      ...nextState,
      eraseLogFileProgress: payload.progress,
    }
  }

  return {
    ...state,
    eraseLogFileProgress: payload.progress
  }
}

export const clearLogFileFrames = (state: BeepBaseState, payload: any) => {
  const peripheralId = payload.peripheralId
  if (peripheralId) {
    const sessionsByPeripheralId = state.logDownloadsByPeripheralId ?? {}
    const session = sessionsByPeripheralId[peripheralId] ?? emptyLogDownloadState()
    const nextState = {
      ...state,
      logDownloadsByPeripheralId: {
        ...sessionsByPeripheralId,
        [peripheralId]: {
          ...session,
          logFileProgress: 0,
          logFileFrames: [],
          error: undefined,
        },
      },
    }

    if (!shouldUpdateLegacyLogState(state, peripheralId)) {
      return nextState
    }

    return {
      ...nextState,
      logFileProgress: 0,
      logFileFrames: [],
    }
  }

  return {
    ...state,
    logFileProgress: 0,
    logFileFrames: []
  }
}

export const setLogDownloadError = (state: BeepBaseState, payload: any) => {
  const peripheralId = payload.peripheralId
  if (peripheralId) {
    const sessionsByPeripheralId = state.logDownloadsByPeripheralId ?? {}
    const session = sessionsByPeripheralId[peripheralId] ?? emptyLogDownloadState()
    return {
      ...state,
      logDownloadsByPeripheralId: {
        ...sessionsByPeripheralId,
        [peripheralId]: {
          ...session,
          error: payload.error,
        },
      },
    }
  }

  return state
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

export const setDfuUpdating = (state: BeepBaseState, payload: any) => {
  return {
    ...state,
    isDfuUpdating: payload.isDfuUpdating
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
  [BeepBaseTypes.SET_LOG_DOWNLOAD_ERROR]: setLogDownloadError,
  [BeepBaseTypes.SET_BATTERY]: setBattery,
  [BeepBaseTypes.SET_CLOCK]: setClock,
  [BeepBaseTypes.SET_TILT]: setTilt,
  [BeepBaseTypes.SET_DFU_UPDATING]: setDfuUpdating,
})
