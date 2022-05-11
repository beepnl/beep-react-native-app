import { combineReducers } from 'redux'
import configureStore from './CreateStore'
import rootSaga from 'App/Sagas'
import { reducer as ApiReducer } from './Api/Reducers'
import { reducer as AuthReducer } from './Auth/Reducers'
import { reducer as SettingsReducer } from './Settings/Reducers'
import { reducer as BeepBaseReducer } from './BeepBase/Reducers'
import { TypedUseSelectorHook, useSelector } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage'
import { persistReducer, createMigrate } from 'redux-persist'

const settingsPersistConfig = {
  key: 'settings',
  storage: AsyncStorage,
  blacklist: ['isConnected'],
  version: 0,
  migrate: createMigrate({
    1: (state) => {
      console.log("==============> MIGRATION state", state)
      const migratedState = {  //Immutable({
        settings: {
          // ...state.settings,
          // settingTimerEnabled: true,
        },
      }   //)
      console.log("==============> MIGRATION migratedState", migratedState)
      return migratedState
    },
  }, { debug: true }),
}

const rootReducer = combineReducers({
  /**
   * Register your reducers here.
   * @see https://redux.js.org/api-reference/combinereducers
   */
  auth: AuthReducer,
  api: ApiReducer,
  settings: persistReducer(settingsPersistConfig, SettingsReducer),
  beepBase: BeepBaseReducer,
})

export type AppState = ReturnType<typeof rootReducer>
export const useTypedSelector: TypedUseSelectorHook<AppState> = useSelector;

export default () => {
  return configureStore(rootReducer, rootSaga)
}
