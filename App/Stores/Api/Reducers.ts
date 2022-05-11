import { API_INITIAL_STATE, ApiState } from './InitialState'
import { createReducer } from 'reduxsauce'
import { ApiTypes } from './Actions'

export const apiFailure = (state: ApiState, payload: any) => {
  const { response } = payload
  const api = response && response.data
  return {
    ...state,
    error: {
      response: response,
      status: response.status,
      problem: response.problem,
      message: response.originalError,
      api
    }
  }
}

export const reducer = createReducer(API_INITIAL_STATE, {
  [ApiTypes.API_FAILURE]: apiFailure,
})
