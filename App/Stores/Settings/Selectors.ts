import { AppState } from 'App/Stores'

export const getLanguageCode = (state: AppState) => {
  return state.settings.languageCode
}
