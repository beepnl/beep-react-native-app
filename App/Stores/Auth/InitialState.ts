export interface AuthState {
  user: any,
  error: string | undefined,
}

export const AUTH_INITIAL_STATE: AuthState = {
  user: null,
  error: undefined,
}
