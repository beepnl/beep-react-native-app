import { AUTH_INITIAL_STATE, AuthState } from './InitialState'
import { createReducer } from 'reduxsauce'
import { AuthTypes } from './Actions'

export const loginLoading = (state: AuthState) => ({
  ...state,
  userIsLoading: true,
  userErrorMessage: undefined,
})

export const loginSuccess = (state: AuthState, payload: any) => ({
  ...state,
  user: payload.user,
  userIsLoading: false,
  userErrorMessage: undefined,
})

export const loginFailure = (state: AuthState, payload: any) => ({
  ...state,
  user: {
    address: {
      city: '',
    },
  },
  userIsLoading: false,
  userErrorMessage: payload.errorMessage,
})

export const reducer = createReducer(AUTH_INITIAL_STATE, {
  [AuthTypes.LOGIN_LOADING]: loginLoading,
  [AuthTypes.LOGIN_SUCCESS]: loginSuccess,
  [AuthTypes.LOGIN_FAILURE]: loginFailure,
})
