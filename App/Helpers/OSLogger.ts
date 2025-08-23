import { NativeEventEmitter, NativeModules } from 'react-native';

const { OSLogger } = NativeModules;

const osLoggerEmitter = new NativeEventEmitter(OSLogger);

export const OSLoggerEvents = {
  onBluetoothStateChange: 'onBluetoothStateChange',
};

export const log = (message: string) => {
  OSLogger.log(message);
};

export const getDeviceInfo = () => {
  return {
    brand: OSLogger.BRAND,
    model: OSLogger.MODEL,
    osVersion: OSLogger.OS_VERSION,
    apiLevel: OSLogger.API_LEVEL,
  };
};

export const onBluetoothStateChange = (callback: (state: string) => void) => {
  return osLoggerEmitter.addListener(OSLoggerEvents.onBluetoothStateChange, (event) => {
    callback(event.state);
  });
};

export default {
  log,
  getDeviceInfo,
  onBluetoothStateChange,
  Events: OSLoggerEvents,
};
