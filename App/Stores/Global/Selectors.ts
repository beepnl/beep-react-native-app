import { AppState } from 'App/Stores'

export const getAppMode = (state: AppState) => {
  return state.global.appMode
}
