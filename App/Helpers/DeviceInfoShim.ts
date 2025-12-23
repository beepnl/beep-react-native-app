import { Platform } from 'react-native'

// Lightweight fallback for react-native-device-info when the native module
// isn't installed. Replace with the real package when available.
const DeviceInfo = {
  getBrand: () => Platform.OS,
  getModel: () => 'unknown',
  getSystemName: async () => Platform.OS,
  getSystemVersion: async () => String(Platform.Version ?? ''),
  getApiLevel: async () =>
    Platform.OS === 'android' && typeof Platform.Version === 'number'
      ? Platform.Version
      : 0,
  getBuildId: async () => 'unknown',
  getFingerprint: async () => 'unknown',
}

export default DeviceInfo
