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

export type LoRaConfigState = 
  "none" | 
  "registeringApi" | 
  "writingCredentials" | 
  "checkingConnectivity" | 
  "connected" | 
  "failedToRegister" |
  "failedToConnect"

export interface ApiState {
  firmwares: Array<FirmwareModel>
  registerState: RegisterState
  loRaConfigState: LoRaConfigState
  error?: any
}

export const API_INITIAL_STATE: ApiState = {
  firmwares: [],
  registerState: "none",
  loRaConfigState: "none",
  error: undefined,
}
