import { AUTH_INITIAL_STATE, AuthState } from './InitialState'
import { createReducer } from 'reduxsauce'
import { AuthTypes } from './Actions'

export const loginSuccess = (state: AuthState, payload: any) => ({
  ...state,
  user: payload.user,
  error: undefined,
})

export const loginFailure = (state: AuthState, payload: any) => {
  const { response } = payload
  const { message } = response?.data
  return {
    ...state,
    user: null,
    error: message,
  }
}

export const reducer = createReducer(AUTH_INITIAL_STATE, {
  [AuthTypes.LOGIN_SUCCESS]: loginSuccess,
  [AuthTypes.LOGIN_FAILURE]: loginFailure,
})
