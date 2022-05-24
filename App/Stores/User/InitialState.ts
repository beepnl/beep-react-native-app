import { UserModel } from "../../Models/UserModel";

export interface SettingsState {
  token: string | undefined
  user: UserModel | undefined,
}

export const INITIAL_STATE: SettingsState = {
  token: undefined,
  user: undefined,
}
