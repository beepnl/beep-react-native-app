export class BleLogger {
  static async init() {
    // no-op stub for testing builds
  }

  static log(message: string) {
    try {
      /* eslint-disable no-console */
      console.log('[BLE]', message)
      /* eslint-enable no-console */
    } catch {
      // no-op
    }
  }

  static logPeripheral(_peripheral: any) {
    // no-op
  }

  static setDownloadMode(_isDownloading: boolean) {
    // no-op
  }

  static async exportToDownloads(): Promise<string | null> {
    // Minimal stub – return null to indicate no external export performed
    return null
  }

  static getLogFilePath(): string {
    return ''
  }

  static async clearLogFile() {
    // no-op
  }
}
