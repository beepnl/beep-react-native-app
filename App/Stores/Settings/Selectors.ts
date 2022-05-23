import { AppState } from 'App/Stores'

export const getToken = (state: AppState) => {
  return state.settings.token
}

export const getLanguageCode = (state: AppState) => {
  return state.settings.languageCode
}

export const getPairedPeripherals = (state: AppState) => {
  return state.settings.pairedPeripherals
}
