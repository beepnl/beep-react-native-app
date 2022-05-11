import { ActionCreators, createActions } from 'reduxsauce';

export enum AuthTypes {
  LOGIN = 'LOGIN',
  LOGIN_LOADING = 'LOGIN_LOADING',
  LOGIN_SUCCESS = 'LOGIN_SUCCESS',
  LOGIN_FAILURE = 'LOGIN_FAILURE',

  LOGOUT = 'LOGOUT',
}

interface C extends ActionCreators {
  login: (memberId: string, password: string) => { type: AuthTypes.LOGIN };
  loginLoading: () => { type: AuthTypes.LOGIN_LOADING };
  loginSuccess: (user: object) => { type: AuthTypes.LOGIN_SUCCESS };
  loginFailure: (errorMessage: string) => { type: AuthTypes.LOGIN_FAILURE };

  logout: () => { type: AuthTypes.LOGOUT };
}

const CreatedActions = createActions( {
   login: ['memberId', 'password'],
   loginLoading: null,
   loginSuccess: ['user'],
   loginFailure: ['errorMessage'],

   logout: null,
} );

export default CreatedActions.Creators as C;