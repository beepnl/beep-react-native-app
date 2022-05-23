import { ActionCreators, createActions } from 'reduxsauce';

export enum AuthTypes {
  LOGIN = 'LOGIN',
  LOGIN_SUCCESS = 'LOGIN_SUCCESS',
  LOGIN_FAILURE = 'LOGIN_FAILURE',

  LOGOUT = 'LOGOUT',
}

interface C extends ActionCreators {
  login: (username: string, password: string) => { type: AuthTypes.LOGIN };
  loginSuccess: (user: object) => { type: AuthTypes.LOGIN_SUCCESS };
  loginFailure: (response: string) => { type: AuthTypes.LOGIN_FAILURE };

  logout: () => { type: AuthTypes.LOGOUT };
}

const CreatedActions = createActions( {
   login: ['username', 'password'],
   loginSuccess: ['user'],
   loginFailure: ['response'],

   logout: null,
} );

export default CreatedActions.Creators as C;