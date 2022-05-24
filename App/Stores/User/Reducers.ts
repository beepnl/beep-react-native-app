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

export const reducer = createReducer(INITIAL_STATE, {
  [SettingsTypes.SET_TOKEN]: setToken,
  [SettingsTypes.SET_USER]: setUser,
})
