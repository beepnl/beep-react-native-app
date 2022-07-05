import { AppState } from 'App/Stores'

export const getToken = (state: AppState) => {
  return state.user.token
}

export const getUser = (state: AppState) => {
  return state.user.user
}

export const getUseProduction = (state: AppState) => {
  return state.user.useProduction
}

export const getDevices = (state: AppState) => {
  return state.user.devices
}
