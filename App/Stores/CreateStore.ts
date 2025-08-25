import { applyMiddleware, compose, createStore } from 'redux'
import createSagaMiddleware from 'redux-saga'
import { persistReducer, persistStore, createMigrate } from 'redux-persist'
import logger from 'redux-logger'

import AsyncStorage from '@react-native-async-storage/async-storage'

const rootPersistConfig = {
  key: 'root',
  storage: AsyncStorage,
  blacklist: ['settings'],
  whitelist: [],
  version: 0,
}

export default (rootReducer: any, rootSaga: any) => {
  const middleware = []
  const enhancers = []

  // Connect the sagas to the redux store
  const sagaMiddleware = createSagaMiddleware()
  middleware.push(sagaMiddleware)

  enhancers.push(applyMiddleware(...middleware/*, logger*/))

  // Redux persist
  const persistedReducer = persistReducer(rootPersistConfig, rootReducer)

  const store = createStore(persistedReducer, compose(...enhancers))
  const persistor = persistStore(store)

  // Kick off the root saga
  sagaMiddleware.run(rootSaga)

  return { store, persistor }
}
