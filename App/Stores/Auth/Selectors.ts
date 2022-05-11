import { AppState } from 'App/Stores'

export const currentUser = (state: AppState) => {
  return state.auth.user
}
