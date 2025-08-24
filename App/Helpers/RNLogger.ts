export class RNLogger {
  static init() {
    // no-op for testing builds
  }

  static log(message: string) {
    try {
      // Minimal passthrough logger
      /* eslint-disable no-console */
      console.log('[RN]', message)
      /* eslint-enable no-console */
    } catch {
      // no-op
    }
  }

  static async exportToDownloads(): Promise<string | null> {
    // Minimal stub – return null to indicate no external export performed
    return null
  }
}
