import { DeviceModel } from "../../Models/DeviceModel";
import { FirmwareModel } from "../../Models/FirmwareModel";

export type RegisterState = 
  "none" |
  "hardwareId" |
  "checking" |
  "notYetRegistered" |
  "registering" |
  "alreadyRegistered" |
  "registered" |
  "factoryReset" |
  "failed" |
  "deviceAlreadyLinkedToAnotherAccount"

export interface ApiState {
  firmwares: Array<FirmwareModel>
  registerState: RegisterState
  error?: any
}

export const API_INITIAL_STATE: ApiState = {
  firmwares: [],
  registerState: "none",
  error: undefined,
}
