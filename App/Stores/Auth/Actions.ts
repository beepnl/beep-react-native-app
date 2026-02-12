import { UserModel } from '@/App/Models/UserModel';
import { ActionCreators, createActions } from 'reduxsauce';

export enum AuthTypes {
  LOGIN = 'LOGIN',
  HANDLE_LOGIN = 'HANDLE_LOGIN',
  LOGIN_SUCCESS = 'LOGIN_SUCCESS',
  LOGIN_FAILURE = 'LOGIN_FAILURE',

  LOGOUT = 'LOGOUT',
}

interface C extends ActionCreators {
  login: (username: string, password: string) => { type: AuthTypes.LOGIN };
  handleLogin: (apiToken: string, user: UserModel) => { type: AuthTypes.HANDLE_LOGIN };
  loginSuccess: (user: object) => { type: AuthTypes.LOGIN_SUCCESS };
  loginFailure: (response: string) => { type: AuthTypes.LOGIN_FAILURE };

  logout: () => { type: AuthTypes.LOGOUT };
}

const CreatedActions = createActions( {
   login: ['username', 'password'],
   handleLogin: ['apiToken', 'user'],
   loginSuccess: ['user'],
   loginFailure: ['response'],

   logout: null,
} );

export default CreatedActions.Creators as C;