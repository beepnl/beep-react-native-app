import { INITIAL_STATE, UserState } from './InitialState'
import { createReducer } from 'reduxsauce'
import { UserTypes } from './Actions'

export const setToken = (state: UserState, payload: any) => {
  const { token } = payload  
  return {
    ...state,
    token
  }
}

export const setUser = (state: UserState, payload: any) => {
  const { user } = payload  
  return {
    ...state,
    user
  }
}

export const setUseProduction = (state: UserState, payload: any) => {
  const { useProduction } = payload  
  return {
    ...state,
    useProduction
  }
}

export const setDevices = (state: UserState, payload: any) => {
  const { devices } = payload  
  return {
    ...state,
    devices
  }
}

export const reducer = createReducer(INITIAL_STATE, {
  [UserTypes.SET_TOKEN]: setToken,
  [UserTypes.SET_USER]: setUser,
  [UserTypes.SET_USE_PRODUCTION]: setUseProduction,
  [UserTypes.SET_DEVICES]: setDevices,
})
