import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from 'App/Containers/LoginScreen/LoginScreen';
import HomeScreen from 'App/Containers/HomeScreen/HomeScreen';
import SettingsScreen from 'App/Containers/SettingsScreen/SettingsScreen';
import PeripheralDetailScreen from 'App/Containers/PeripheralDetailScreen/PeripheralDetailScreen';
import TemperatureScreen from 'App/Containers/Sensor/TemperatureScreen';
import WeightScreen from 'App/Containers/Sensor/WeightScreen';
import AudioScreen from 'App/Containers/Sensor/AudioScreen';
import LoRaScreen from 'App/Containers/Sensor/LoRaScreen';
import EnergyScreen from 'App/Containers/Sensor/EnergyScreen';
import ClockScreen from 'App/Containers/Sensor/ClockScreen';
import LogFileScreen from 'App/Containers/Sensor/LogFileScreen';
import FirmwareScreen from 'App/Containers/FirmwareScreen/FirmwareScreen';
import FirmwareDetailScreen from 'App/Containers//FirmwareScreen/FirmwareDetailScreen';
import WizardAssembleScreen from 'App/Containers/Wizard/WizardAssembleScreen';
import WizardWakeUpScreen from 'App/Containers/Wizard/WizardWakeUpScreen';
import WizardPairPeripheralScreen from 'App/Containers/Wizard/WizardPairPeripheralScreen';
import WizardRegisterScreen from 'App/Containers/Wizard/WizardRegisterScreen';
import WizardCalibrateScreen from 'App/Containers/Wizard/WizardCalibrateScreen';
import WizardLoRaScreen from 'App/Containers/Wizard/WizardLoRaScreen';
import WizardLoRaAutomaticScreen from 'App/Containers/Wizard/WizardLoRaAutomaticScreen';
import WizardLoRaManualScreen from 'App/Containers/Wizard/WizardLoRaManualScreen';
import WizardLoRaOverviewScreen from 'App/Containers/Wizard/WizardLoRaOverviewScreen';
import WizardEnergyScreen from 'App/Containers/Wizard/WizardEnergyScreen';
import WizardCongratulationsScreen from 'App/Containers/Wizard/WizardCongratulationsScreen';
import CalibrateTemperatureScreen from 'App/Containers/Wizard/CalibrateTemperatureScreen';
import CalibrateWeightScreen from 'App/Containers/Wizard/CalibrateWeightScreen';
import CalibrateAudioScreen from 'App/Containers/Wizard/CalibrateAudioScreen';

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
    <Stack.Navigator initialRouteName="WizardAssembleScreen" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="WizardAssembleScreen" component={WizardAssembleScreen} />
      <Stack.Screen name="WizardWakeUpScreen" component={WizardWakeUpScreen} />
      <Stack.Screen name="WizardPairPeripheralScreen" component={WizardPairPeripheralScreen} />
      <Stack.Screen name="WizardRegisterScreen" component={WizardRegisterScreen} />
      <Stack.Screen name="WizardCalibrateScreen" component={WizardCalibrateScreen} />
      <Stack.Screen name="WizardLoRaScreen" component={WizardLoRaScreen} />
      <Stack.Screen name="WizardLoRaAutomaticScreen" component={WizardLoRaAutomaticScreen} />
      <Stack.Screen name="WizardLoRaManualScreen" component={WizardLoRaManualScreen} />
      <Stack.Screen name="WizardLoRaOverviewScreen" component={WizardLoRaOverviewScreen} />
      <Stack.Screen name="WizardEnergyScreen" component={WizardEnergyScreen} />
      <Stack.Screen name="WizardCongratulationsScreen" component={WizardCongratulationsScreen} />
      <Stack.Screen name="CalibrateTemperatureScreen" component={CalibrateTemperatureScreen} />
      <Stack.Screen name="CalibrateWeightScreen" component={CalibrateWeightScreen} />
      <Stack.Screen name="CalibrateAudioScreen" component={CalibrateAudioScreen} />
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
      <Stack.Screen name="CalibrateTemperatureScreen" component={CalibrateTemperatureScreen} />
      <Stack.Screen name="WeightScreen" component={WeightScreen} />
      <Stack.Screen name="CalibrateWeightScreen" component={CalibrateWeightScreen} />
      <Stack.Screen name="AudioScreen" component={AudioScreen} />
      <Stack.Screen name="EnergyScreen" component={EnergyScreen} />
      <Stack.Screen name="ClockScreen" component={ClockScreen} />
      <Stack.Screen name="LoRaScreen" component={LoRaScreen} />
      <Stack.Screen name="WizardLoRaScreen" component={WizardLoRaScreen} />
      <Stack.Screen name="WizardLoRaAutomaticScreen" component={WizardLoRaAutomaticScreen} />
      <Stack.Screen name="WizardLoRaManualScreen" component={WizardLoRaManualScreen} />
      <Stack.Screen name="WizardLoRaOverviewScreen" component={WizardLoRaOverviewScreen} />
      <Stack.Screen name="CalibrateAudioScreen" component={CalibrateAudioScreen} />
      <Stack.Screen name="LogFileScreen" component={LogFileScreen} />
      <Stack.Screen name="FirmwareScreen" component={FirmwareScreen} />
      <Stack.Screen name="FirmwareDetailScreen" component={FirmwareDetailScreen} />
      <Stack.Screen name="Wizard" component={WizardStack} />
    </Stack.Navigator>
  );
};
