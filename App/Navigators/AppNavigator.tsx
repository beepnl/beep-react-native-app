import React from 'react'
import { createAppContainer, createSwitchNavigator } from 'react-navigation';
import { createStackNavigator } from 'react-navigation-stack'

// Screens
import HomeScreen from 'App/Containers/HomeScreen/HomeScreen';
import PeripheralDetailScreen from 'App/Containers/PeripheralDetailScreen/PeripheralDetailScreen';
import BleScreen from 'App/Containers/BleScreen/BleScreen';
import AboutScreen from 'App/Containers/AboutScreen/AboutScreen';
import WizardWelcomeScreen from 'App/Containers/Wizard/WizardWelcomeScreen';
import WizardBluetoothScreen from 'App/Containers/Wizard/WizardBluetoothScreen';
import WizardPairPeripheralScreen from 'App/Containers/Wizard/WizardPairPeripheralScreen';
import WizardPairedScreen from 'App/Containers/Wizard/WizardPairedScreen';

const WizardStack = createStackNavigator(
  {
    WizardWelcomeScreen,
    WizardBluetoothScreen,
    WizardPairPeripheralScreen,
    WizardPairedScreen,
  },
  {
    // initialRouteName: 'WizardWelcomeScreen',
    initialRouteName: 'WizardPairPeripheralScreen',
    navigationOptions: ({ navigation, navigationOptions }) => ({
    }),
    headerMode: 'none',
  }
)

const AppStack = createStackNavigator(
  {
    HomeScreen,
    Wizard: WizardStack,
    PeripheralDetailScreen,
    // BleScreen,
    // AboutScreen,
  },
  {
    initialRouteName: 'HomeScreen',
    navigationOptions: ({ navigation, navigationOptions }) => ({
    }),
    headerMode: 'none',
  }
)

const appContainer = createAppContainer(
  createSwitchNavigator(
    {
      // Wizard: WizardStack,
      App: AppStack,
    },
    {
      // initialRouteName: 'Wizard',
      initialRouteName: 'App',
    }
  )
);

function getCurrentRouteName(state: any): any {
  if (!state) return
  if (Array.isArray(state.routes) && state.routes.length > 0) {
    return getCurrentRouteName(state.routes[state.index])
  } else {
    return state.routeName
  }
}

const defaultGetStateForAction = appContainer.router.getStateForAction;
appContainer.router.getStateForAction = (action, state) => {
  const newState = defaultGetStateForAction(action, state)
  if (
    action.type === 'Navigation/NAVIGATE' ||    //sorted in order of call frequency
    action.type === 'Navigation/JUMP_TO' ||
    action.type === 'Navigation/BACK' ||
    action.type === 'Navigation/INIT'
  ) {
    const routeName = getCurrentRouteName(newState)
    console.log("====> NAVIGATE TO " + routeName)
    //if needed the current route can be stored here
    // store.dispatch(GlobalActions.setCurrentRoute(routeName))
  }
  return newState
}

export default appContainer