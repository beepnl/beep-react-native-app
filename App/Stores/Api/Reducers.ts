import { API_INITIAL_STATE, ApiState } from './InitialState'
import { createReducer } from 'reduxsauce'
import { ApiTypes } from './Actions'

export const setFirmwares = (state: ApiState, payload: any) => {
  const { firmwares } = payload  
  return {
    ...state,
    firmwares
  }
}

export const setRegisterState = (state: ApiState, payload: any) => {
  const { registerState } = payload  
  return {
    ...state,
    error: undefined,
    registerState
  }
}

export const setLoRaConfigState = (state: ApiState, payload: any) => {
  const { loRaConfigState } = payload  
  return {
    ...state,
    error: undefined,
    loRaConfigState
  }
}

export const apiFailure = (state: ApiState, payload: any) => {
  const { response } = payload
  const api = response && response.data
  const message = api.message || api.errors || api
  return {
    ...state,
    error: {
      response: response,
      status: response.status,
      problem: response.problem,
      // message: response.originalError,
      message,
      api
    }
  }
}

export const reducer = createReducer(API_INITIAL_STATE, {
  [ApiTypes.SET_FIRMWARES]: setFirmwares,
  [ApiTypes.SET_REGISTER_STATE]: setRegisterState,
  [ApiTypes.SET_LO_RA_CONFIG_STATE]: setLoRaConfigState,
  [ApiTypes.API_FAILURE]: apiFailure,
})
