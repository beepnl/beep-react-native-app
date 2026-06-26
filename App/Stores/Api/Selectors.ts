import { AppState } from '@/App/Stores'
import { createSelector } from '@reduxjs/toolkit'
import { FirmwareModel } from '../../Models/FirmwareModel'

export const getError = (state: AppState) => {
  return state.api.error
}

const getFirmwares = (state: AppState) => state.api.firmwares

export const getFirmwaresStable = createSelector(
  [getFirmwares],
  (firmwares: Array<FirmwareModel>) => firmwares.filter((firmware: FirmwareModel) => firmware.stability == "stable")
)

export const getFirmwaresTest = createSelector(
  [getFirmwares],
  (firmwares: Array<FirmwareModel>) => firmwares.filter((firmware: FirmwareModel) => firmware.stability == "test")
)

export const getRegisterState = (state: AppState) => {
  return state.api.registerState
}

export const getLoRaConfigState = (state: AppState) => {
  return state.api.loRaConfigState
}
