import { AppState } from 'App/Stores'

export const getLanguageCode = (state: AppState) => {
  return state.settings.languageCode
}

export const getUsername = (state: AppState) => {
  return state.settings.username
}
