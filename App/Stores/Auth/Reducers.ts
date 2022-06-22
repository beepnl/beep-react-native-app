import { AUTH_INITIAL_STATE, AuthState } from './InitialState'
import { createReducer } from 'reduxsauce'
import { AuthTypes } from './Actions'

export const login = (state: AuthState, payload: any) => ({
  ...state,
  error: undefined,
})

export const loginSuccess = (state: AuthState, payload: any) => ({
  ...state,
  error: undefined,
})

export const loginFailure = (state: AuthState, payload: any) => {
  const { response } = payload
  const { message } = response?.data
  return {
    ...state,
    error: message,
  }
}

export const logout = (state: AuthState, payload: any) => ({
  ...state,
  error: undefined,
})

export const reducer = createReducer(AUTH_INITIAL_STATE, {
  [AuthTypes.LOGIN]: login,
  [AuthTypes.LOGIN_SUCCESS]: loginSuccess,
  [AuthTypes.LOGIN_FAILURE]: loginFailure,
  [AuthTypes.LOGOUT]: logout,
})
