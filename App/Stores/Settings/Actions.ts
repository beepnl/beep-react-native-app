import { ActionCreators, createActions } from 'reduxsauce';

export enum SettingsTypes {
  SET_LANGUAGE_CODE = 'SET_LANGUAGE_CODE',
  SET_USERNAME = 'SET_USERNAME'
}

interface C extends ActionCreators {
  setLanguageCode: (languageCode: string) => { type: SettingsTypes.SET_LANGUAGE_CODE };
  setUsername: (username: string) => { type: SettingsTypes.SET_USERNAME }
}

const CreatedActions = createActions( {
  setLanguageCode: ['languageCode'],
  setUsername: ['username'],
} );

export default CreatedActions.Creators as C;