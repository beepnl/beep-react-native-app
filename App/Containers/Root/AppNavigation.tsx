import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from 'App/Containers/LoginScreen/LoginScreen';
import HomeScreen from 'App/Containers/HomeScreen/HomeScreen';
import SettingsScreen from 'App/Containers/SettingsScreen/SettingsScreen';
import PeripheralDetailScreen from 'App/Containers/PeripheralDetailScreen/PeripheralDetailScreen';
import TemperatureScreen from 'App/Containers/Sensor/TemperatureScreen';
import LogFileScreen from 'App/Containers/LogFileScreen/LogFileScreen';
import FirmwareScreen from 'App/Containers/FirmwareScreen/FirmwareScreen';
import WizardWelcomeScreen from 'App/Containers/Wizard/WizardWelcomeScreen';
import WizardBluetoothScreen from 'App/Containers/Wizard/WizardBluetoothScreen';
import WizardPairPeripheralScreen from 'App/Containers/Wizard/WizardPairPeripheralScreen';
import WizardPairedScreen from 'App/Containers/Wizard/WizardPairedScreen';

export const AuthStack = () => {
  const Stack = createNativeStackNavigator();
  return (
    <Stack.Navigator initialRouteName="LoginScreen" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="LoginScreen" component={LoginScreen} />
    </Stack.Navigator>
  );
};

const WizardStack = () => {
  const Stack = createNativeStackNavigator();
  return (
    <Stack.Navigator initialRouteName="WizardPairPeripheralScreen" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="WizardWelcomeScreen" component={WizardWelcomeScreen} />
      <Stack.Screen name="WizardBluetoothScreen" component={WizardBluetoothScreen} />
      <Stack.Screen name="WizardPairPeripheralScreen" component={WizardPairPeripheralScreen} />
      <Stack.Screen name="WizardPairedScreen" component={WizardPairedScreen} />
    </Stack.Navigator>
  );
};

export const AppStack = () => {
  const Stack = createNativeStackNavigator();
  return (
    <Stack.Navigator initialRouteName="HomeScreen" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeScreen" component={HomeScreen} />
      <Stack.Screen name="SettingsScreen" component={SettingsScreen} />
      <Stack.Screen name="PeripheralDetailScreen" component={PeripheralDetailScreen} />
      <Stack.Screen name="TemperatureScreen" component={TemperatureScreen} />
      <Stack.Screen name="LogFileScreen" component={LogFileScreen} />
      <Stack.Screen name="FirmwareScreen" component={FirmwareScreen} />
      <Stack.Screen name="Wizard" component={WizardStack} />
    </Stack.Navigator>
  );
};
