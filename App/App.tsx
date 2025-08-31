import React, { FunctionComponent, useEffect, useState } from 'react'

// Hooks

// Utils
import createStore from 'App/Stores'
import { PersistGate } from 'redux-persist/lib/integration/react'
import i18n from './Localization';
import { I18nextProvider } from 'react-i18next';
import { MenuProvider } from 'react-native-popup-menu';
import RootScreen from './Containers/Root/RootScreen'
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Redux
import { Provider } from 'react-redux'

// Components
import { SafeAreaProvider } from 'react-native-safe-area-context';

export const { store, persistor } = createStore()

interface Props {
}

const App: FunctionComponent<Props> = () => {

  return (
    /**
     * @see https://github.com/reduxjs/react-redux/blob/master/docs/api/Provider.md
     */
    <Provider store={store}>
      {/**
       * PersistGate delays the rendering of the app's UI until the persisted state has been retrieved
       * and saved to redux.
       * The `loading` prop can be `null` or any react instance to show during loading (e.g. a splash screen),
       * for example `loading={<SplashScreen />}`.
       * @see https://github.com/rt2zz/redux-persist/blob/master/docs/PersistGate.md
       */}
      <PersistGate loading={null} persistor={persistor}>
        <I18nextProvider i18n={i18n}>
          <SafeAreaProvider>
            <GestureHandlerRootView style={{ flex: 1 }}>
              <MenuProvider>
                <RootScreen />
              </MenuProvider>
            </GestureHandlerRootView>
          </SafeAreaProvider>
        </I18nextProvider>
      </PersistGate>
    </Provider>
  )
}

export default App