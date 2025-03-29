import { INITIAL_STATE, SettingsState } from './InitialState'
import { createReducer } from 'reduxsauce'
import { SettingsTypes } from './Actions'

export const setLanguageCode = (state: SettingsState, payload: any) => {
  const { languageCode } = payload  
  return {
    ...state,
    languageCode
  }
}

export const setUsername = (state: SettingsState, payload: any) => {
  const { username } = payload  
  return {
    ...state,
    username
  }
}

export const reducer = createReducer(INITIAL_STATE, {
  [SettingsTypes.SET_LANGUAGE_CODE]: setLanguageCode,
  [SettingsTypes.SET_USERNAME]: setUsername,
})
