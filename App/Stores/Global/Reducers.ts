import { createReducer } from 'reduxsauce'
import { GlobalTypes } from './Actions'

export type AppMode = {
  mode: "web" | "app",
  params?: {
    screen: string,
    params?: any,
  },
}

export interface GlobalState {
  appMode: AppMode,
}

export const INITIAL_STATE: GlobalState = {
  appMode: { mode: "web" }      //after auth start with web app
}

export const setAppMode = (state: any, payload: any) => {
  const { appMode } = payload  
  return {
    ...state,
    appMode
  }
}

export const reducer = createReducer(INITIAL_STATE, {
  [GlobalTypes.SET_APP_MODE]: setAppMode,
})