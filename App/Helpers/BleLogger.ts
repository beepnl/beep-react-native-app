import RNFS from 'react-native-fs'
import { Platform, PermissionsAndroid, Share } from 'react-native'

export interface BleLogEntry {
  timestamp: string
  message: string
}

export class BleLogger {
  private static logQueue: BleLogEntry[] = []
  private static isWriting: boolean = false
  private static logToFileEnabled: boolean = false
  private static hasPermission: boolean = false
  
  static BLE_LOG_FILE_NAME = "BLE_Debug_Log.txt"
  static BLE_LOG_FILE_PATH = RNFS.DocumentDirectoryPath + "/" + BleLogger.BLE_LOG_FILE_NAME
  
  // Initialize the logger
  static async init() {
    try {
      // Check if we need permissions (Android only)
      if (Platform.OS === 'android') {
        // For Android, we'll use the app's document directory which doesn't need permissions
        BleLogger.hasPermission = true
      } else {
        BleLogger.hasPermission = true
      }
      
      // Create or clear the log file
      const logHeader = `BLE Debug Log - Started at ${new Date().toISOString()}\n` +
                       `Device: ${Platform.OS} ${Platform.Version}\n` +
                       `App Document Directory: ${RNFS.DocumentDirectoryPath}\n` +
                       `===========================================\n\n`
      
      await RNFS.writeFile(BleLogger.BLE_LOG_FILE_PATH, logHeader, 'utf8')
      BleLogger.logToFileEnabled = true
      
      console.log('[BLE] Logger initialized successfully')
      console.log('[BLE] Log file path: ' + BleLogger.BLE_LOG_FILE_PATH)
    } catch (error) {
      console.log('[BLE] Failed to initialize logger:', error)
      BleLogger.logToFileEnabled = false
    }
  }
  
  // Log a message (always logs to console, optionally to file)
  static log(message: string) {
    // Always log to console
    console.log(message)
    
    // Add to queue for file logging if enabled
    if (BleLogger.logToFileEnabled && BleLogger.hasPermission) {
      const timestamp = new Date().toISOString()
      BleLogger.logQueue.push({ timestamp, message })
      
      // Process queue if not already processing
      if (!BleLogger.isWriting) {
        BleLogger.processQueue()
      }
    }
  }
  
  // Process the log queue (writes in batches)
  private static async processQueue() {
    if (BleLogger.isWriting || BleLogger.logQueue.length === 0) {
      return
    }
    
    BleLogger.isWriting = true
    
    try {
      // Take up to 50 entries at a time
      const entriesToWrite = BleLogger.logQueue.splice(0, 50)
      
      // Format entries
      const logContent = entriesToWrite
        .map(entry => `[${entry.timestamp}] ${entry.message}`)
        .join('\n') + '\n'
      
      // Append to file
      await RNFS.appendFile(BleLogger.BLE_LOG_FILE_PATH, logContent, 'utf8')
      
      // If there are more entries, schedule another write
      if (BleLogger.logQueue.length > 0) {
        setTimeout(() => BleLogger.processQueue(), 100)
      }
    } catch (error) {
      console.log('[BLE] Error writing to log file:', error)
      // Re-enable file logging might have failed
      if (error.message?.includes('Permission') || error.message?.includes('EACCES')) {
        BleLogger.logToFileEnabled = false
        BleLogger.hasPermission = false
      }
    } finally {
      BleLogger.isWriting = false
    }
  }
  
  // Export log file to Downloads folder (Android only)
  static async exportToDownloads(): Promise<string | null> {
    try {
      const exists = await RNFS.exists(BleLogger.BLE_LOG_FILE_PATH)
      if (!exists) {
        console.log('[BLE] No log file to export')
        return null
      }
      
      if (Platform.OS === 'android') {
        // Request permission for external storage
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          {
            title: 'Storage Permission',
            message: 'App needs permission to export BLE log to Downloads folder',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel', 
            buttonPositive: 'OK',
          }
        )
        
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
          const exportPath = `${RNFS.DownloadDirectoryPath}/BLE_Debug_Log_${timestamp}.txt`
          
          await RNFS.copyFile(BleLogger.BLE_LOG_FILE_PATH, exportPath)
          console.log(`[BLE] Log file exported to: ${exportPath}`)
          return exportPath
        } else {
          console.log('[BLE] Storage permission denied')
        }
      }
      
      // Return internal path if export fails
      return BleLogger.BLE_LOG_FILE_PATH
    } catch (error) {
      console.log('[BLE] Error exporting log file:', error)
      return null
    }
  }
  
  // Enable or disable file logging
  static setFileLoggingEnabled(enabled: boolean) {
    BleLogger.logToFileEnabled = enabled && BleLogger.hasPermission
    if (enabled && !BleLogger.hasPermission) {
      console.log('[BLE] File logging requested but no permission')
    }
  }
  
  // Get current log file path
  static getLogFilePath(): string {
    return BleLogger.BLE_LOG_FILE_PATH
  }
  
  // Clear the log file
  static async clearLogFile() {
    try {
      BleLogger.logQueue = []
      await BleLogger.init()
      console.log('[BLE] Log file cleared')
    } catch (error) {
      console.log('[BLE] Error clearing log file:', error)
    }
  }
}