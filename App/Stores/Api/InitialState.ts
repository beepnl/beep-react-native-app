import { FirmwareModel } from "../../Models/FirmwareModel";

export interface ApiState {
  firmwares: Array<FirmwareModel>
  error?: any
}

export const API_INITIAL_STATE: ApiState = {
  firmwares: [],
  error: undefined,
}
