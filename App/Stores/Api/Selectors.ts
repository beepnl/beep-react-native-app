import { AppState } from 'App/Stores'
import { FirmwareModel } from '../../Models/FirmwareModel'

export const getError = (state: AppState) => {
  return state.api.error
}

export const getFirmwaresStable = (state: AppState) => {
  return state.api.firmwares.filter((firmware: FirmwareModel) => firmware.stability == "stable")
}

export const getFirmwaresTest = (state: AppState) => {
  return state.api.firmwares.filter((firmware: FirmwareModel) => firmware.stability == "test")
}
