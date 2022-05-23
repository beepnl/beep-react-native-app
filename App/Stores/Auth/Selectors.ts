import { AppState } from 'App/Stores'

export const getError = (state: AppState) => {
  return state.auth.error
}

export const currentUser = (state: AppState) => {
  return state.auth.user
}
