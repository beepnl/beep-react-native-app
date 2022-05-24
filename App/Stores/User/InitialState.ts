import { DeviceModel } from "../../Models/DeviceModel";
import { UserModel } from "../../Models/UserModel";

export interface SettingsState {
  token: string | undefined
  user: UserModel | undefined
  devices: Array<DeviceModel>
}

export const INITIAL_STATE: SettingsState = {
  token: undefined,
  user: undefined,
  devices: []
}
