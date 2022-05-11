import { ActionCreators, createActions } from 'reduxsauce';

export enum ApiTypes {
  API_FAILURE = 'API_FAILURE',
}

interface C extends ActionCreators {
  apiFailure: (response: any) => { type: ApiTypes.API_FAILURE };
}

const CreatedActions = createActions({
  apiFailure: ['response'],
});

export default CreatedActions.Creators as C;