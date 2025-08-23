import { NativeEventEmitter, NativeModules } from 'react-native';

const { OSLogger } = NativeModules;

const osLoggerEmitter = OSLogger ? new NativeEventEmitter(OSLogger) : null;

export const OSLoggerEvents = {
  onBluetoothStateChange: 'onBluetoothStateChange',
};

export const log = (message: string) => {
  if (OSLogger && OSLogger.log) {
    OSLogger.log(message);
  } else {
    console.log(`[OSLogger] ${message}`);
  }
};

export const getDeviceInfo = () => {
  if (OSLogger) {
    return {
      brand: OSLogger.BRAND || 'Unknown',
      model: OSLogger.MODEL || 'Unknown',
      osVersion: OSLogger.OS_VERSION || 'Unknown',
      apiLevel: OSLogger.API_LEVEL || 'Unknown',
    };
  } else {
    return {
      brand: 'Unknown',
      model: 'Unknown',
      osVersion: 'Unknown',
      apiLevel: 'Unknown',
    };
  }
};

export const onBluetoothStateChange = (callback: (state: string) => void) => {
  if (OSLogger && osLoggerEmitter) {
    return osLoggerEmitter.addListener(OSLoggerEvents.onBluetoothStateChange, (event) => {
      callback(event.state);
    });
  } else {
    console.warn('[OSLogger] Native module not available, cannot listen to Bluetooth state changes');
    return null;
  }
};

export default {
  log,
  getDeviceInfo,
  onBluetoothStateChange,
  Events: OSLoggerEvents,
};
