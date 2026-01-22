import React, { FunctionComponent } from 'react';

// Hooks

// Utils
import { I18nextProvider } from 'react-i18next';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { MenuProvider } from 'react-native-popup-menu';
import RootScreen from './Containers/Root/RootScreen';
import i18n from './Localization';
import createStore from './Stores';

// Redux
import { Provider } from 'react-redux';

// Components
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export const { store } = createStore()

interface Props {
}

const App: FunctionComponent<Props> = () => {

  return (
    /**
     * @see https://github.com/reduxjs/react-redux/blob/master/docs/api/Provider.md
     */
    <Provider store={store}>
      <I18nextProvider i18n={i18n}>
        <SafeAreaProvider>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <MenuProvider>
              <StatusBar style="dark" />
              <RootScreen />
            </MenuProvider>
          </GestureHandlerRootView>
        </SafeAreaProvider>
      </I18nextProvider>
    </Provider>
  )
}

export default App