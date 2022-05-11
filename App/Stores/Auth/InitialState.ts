export interface AuthState {
  user: any,
  userIsLoading: boolean;
  userErrorMessage?: string;
}

export const AUTH_INITIAL_STATE: AuthState = {
  user: null,
  userIsLoading: false,
  userErrorMessage: undefined,
}
