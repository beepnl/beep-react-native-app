import { TypedUseSelectorHook, useSelector } from 'react-redux'
import { combineReducers } from 'redux'
import rootSaga from '../Sagas'
import { reducer as ApiReducer } from './Api/Reducers'
import { reducer as AuthReducer } from './Auth/Reducers'
import { reducer as BeepBaseReducer } from './BeepBase/Reducers'
import configureStore from './CreateStore'
import { reducer as SettingsReducer } from './Settings/Reducers'
import { reducer as UserReducer } from './User/Reducers'

const rootReducer = combineReducers({
  /**
   * Register your reducers here.
   * @see https://redux.js.org/api-reference/combinereducers
   */
  auth: AuthReducer,
  api: ApiReducer,
  settings: SettingsReducer,
  user: UserReducer,
  beepBase: BeepBaseReducer,
})

export type AppState = ReturnType<typeof rootReducer>
export const useTypedSelector: TypedUseSelectorHook<AppState> = useSelector;

export default () => {
  return configureStore(rootReducer, rootSaga)
}
