import { INITIAL_STATE, SettingsState } from './InitialState'
import { createReducer } from 'reduxsauce'
import { SettingsTypes } from './Actions'

export const setToken = (state: SettingsState, payload: any) => {
  const { token } = payload  
  return {
    ...state,
    token
  }
}

export const setUser = (state: SettingsState, payload: any) => {
  const { user } = payload  
  return {
    ...state,
    user
  }
}

export const setLanguageCode = (state: SettingsState, payload: any) => {
  const { languageCode } = payload  
  return {
    ...state,
    languageCode
  }
}

export const addPairedPeripheral = (state: SettingsState, payload: any) => {
  const { peripheral } = payload
  let { pairedPeripherals } = state
  if (pairedPeripherals.find(p => p.id == peripheral.id)) {
    //already in list, update
    pairedPeripherals = pairedPeripherals.map(p => p.id == peripheral.id ? peripheral : p)
  } else {
    //not in list, append
    pairedPeripherals = [
      ...pairedPeripherals,
      peripheral
    ]
  }
  return {
    ...state,
    pairedPeripherals
  }
}

export const updatePairedPeripheral = (state: SettingsState, payload: any) => {
  const { peripheral } = payload

  //merge pairedPeripherals with new peripheral from payload
  const pairedPeripherals = state.pairedPeripherals.map(p => p.id === peripheral.id ? peripheral : p)

  return {
    ...state,
    pairedPeripherals
  }
}

export const removePairedPeripheral = (state: SettingsState, payload: any) => {
  const { peripheral } = payload
  let { pairedPeripherals } = state
  pairedPeripherals = pairedPeripherals.filter(p => p.id != peripheral.id)

  return {
    ...state,
    pairedPeripherals
  }
}

export const reducer = createReducer(INITIAL_STATE, {
  [SettingsTypes.SET_TOKEN]: setToken,
  [SettingsTypes.SET_USER]: setUser,
  [SettingsTypes.SET_LANGUAGE_CODE]: setLanguageCode,
  [SettingsTypes.ADD_PAIRED_PERIPHERAL]: addPairedPeripheral,
  [SettingsTypes.UPDATE_PAIRED_PERIPHERAL]: updatePairedPeripheral,
  [SettingsTypes.REMOVE_PAIRED_PERIPHERAL]: removePairedPeripheral,
})
