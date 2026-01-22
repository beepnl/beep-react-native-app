import { applyMiddleware, compose, createStore } from 'redux'
import createSagaMiddleware from 'redux-saga'

export default (rootReducer: any, rootSaga: any) => {
  const middleware = []
  const enhancers = []

  // Connect the sagas to the redux store
  const sagaMiddleware = createSagaMiddleware()
  middleware.push(sagaMiddleware)

  enhancers.push(applyMiddleware(...middleware/*, logger*/))

  // Redux persist
  const store = createStore(rootReducer, compose(...enhancers))

  // Kick off the root saga
  sagaMiddleware.run(rootSaga)

  return { store }
}
