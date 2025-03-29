import { DeviceModel } from "../../Models/DeviceModel";
import { UserModel } from "../../Models/UserModel";

export interface UserState {
  token: string | undefined
  user: UserModel | undefined
  useProduction: boolean
  devices: Array<DeviceModel>
}

export const INITIAL_STATE: UserState = {
  token: undefined,
  user: undefined,
  useProduction: true,
  devices: []
}
