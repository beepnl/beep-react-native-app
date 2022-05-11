import { AppState } from 'App/Stores'

export const getLanguageCode = (state: AppState) => {
  return state.settings.languageCode
}

export const getPairedPeripherals = (state: AppState) => {
  return state.settings.pairedPeripherals
}
