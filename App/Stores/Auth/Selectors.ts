import { AppState } from 'App/Stores'

export const getError = (state: AppState) => {
  return state.auth.error
}
