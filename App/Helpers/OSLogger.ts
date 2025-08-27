export default class OSLogger {
  static log(message: string) {
    try {
      // Route logs to console; adjust to native logging as needed
      // Avoid throwing if console is unavailable in some environments
      /* eslint-disable no-console */
      console.log(message)
      /* eslint-enable no-console */
    } catch {
      // no-op
    }
  }

  static getDeviceInfo() {
    // Minimal placeholder used by BleLogger for metadata
    return {
      brand: 'unknown',
      model: 'unknown',
      osVersion: String((global as any)?.navigator?.userAgent || 'android'),
      apiLevel: 0,
    }
  }
}
