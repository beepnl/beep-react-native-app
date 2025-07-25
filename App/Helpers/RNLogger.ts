import RNFS from 'react-native-fs'
import { Platform, PermissionsAndroid, Share } from 'react-native'
import DeviceInfo from 'react-native-device-info'

export interface RNLogEntry {
  timestamp: string
  message: string
}

export class RNLogger {
  private static logQueue: RNLogEntry[] = []
  private static isWriting: boolean = false
  private static logToFileEnabled: boolean = false
  private static hasPermission: boolean = false
  
  static RN_LOG_FILE_NAME = "RN_Debug_Log.txt"
  static RN_LOG_FILE_PATH = RNFS.DocumentDirectoryPath + "/" + RNLogger.RN_LOG_FILE_NAME
  
  // Initialize the logger
  static async init() {
    try {
      // Check if we need permissions (Android only)
      if (Platform.OS === 'android') {
        // For Android, we'll use the app's document directory which doesn't need permissions
        RNLogger.hasPermission = true
      } else {
        RNLogger.hasPermission = true
      }
      
      const brand = DeviceInfo.getBrand()
      const model = DeviceInfo.getModel()
      const systemName = await DeviceInfo.getSystemName()
      const systemVersion = await DeviceInfo.getSystemVersion()
      const apiLevel = await DeviceInfo.getApiLevel()
      const buildId = await DeviceInfo.getBuildId()
      const fingerprint = await DeviceInfo.getFingerprint()

      // Create or clear the log file
      const logHeader = `React Native Debug Log - Started at ${new Date().toISOString()}\n` +
                       `Device: ${Platform.OS} ${Platform.Version}\n` +
                       `Brand: ${brand}\n` +
                       `Model: ${model}\n` +
                       `System: ${systemName} ${systemVersion}\n` +
                       `API Level: ${apiLevel}\n` +
                       `Build ID: ${buildId}\n` +
                       `Fingerprint: ${fingerprint}\n` +
                       `App Document Directory: ${RNFS.DocumentDirectoryPath}\n` +
                       `===========================================\n\n`
      
      await RNFS.writeFile(RNLogger.RN_LOG_FILE_PATH, logHeader, 'utf8')
      RNLogger.logToFileEnabled = true
      
      console.log('[RN] Logger initialized successfully')
      console.log('[RN] Log file path: ' + RNLogger.RN_LOG_FILE_PATH)
    } catch (error) {
      console.log('[RN] Failed to initialize logger:', error)
      RNLogger.logToFileEnabled = false
    }
  }
  
  // Log a message (always logs to console, optionally to file)
  static log(message: string) {
    // Always log to console
    console.log(message)
    
    // Add to queue for file logging if enabled
    if (RNLogger.logToFileEnabled && RNLogger.hasPermission) {
      const timestamp = new Date().toISOString()
      RNLogger.logQueue.push({ timestamp, message })
      
      // Process queue if not already processing
      if (!RNLogger.isWriting) {
        RNLogger.processQueue()
      }
    }
  }
  
  // Process the log queue (writes in batches)
  private static async processQueue() {
    if (RNLogger.isWriting || RNLogger.logQueue.length === 0) {
      return
    }
    
    RNLogger.isWriting = true
    
    try {
      // Take up to 50 entries at a time
      const entriesToWrite = RNLogger.logQueue.splice(0, 50)
      
      // Format entries
      const logContent = entriesToWrite
        .map(entry => `[${entry.timestamp}] ${entry.message}`)
        .join('\n') + '\n'
      
      // Append to file
      await RNFS.appendFile(RNLogger.RN_LOG_FILE_PATH, logContent, 'utf8')
      
      // If there are more entries, schedule another write
      if (RNLogger.logQueue.length > 0) {
        setTimeout(() => RNLogger.processQueue(), 100)
      }
    } catch (error) {
      console.log('[RN] Error writing to log file:', error)
      // Re-enable file logging might have failed
      if (error.message?.includes('Permission') || error.message?.includes('EACCES')) {
        RNLogger.logToFileEnabled = false
        RNLogger.hasPermission = false
      }
    }
    finally {
      RNLogger.isWriting = false
    }
  }
  
  // Export log file to Downloads folder (Android only)
  static async exportToDownloads(): Promise<string | null> {
    try {
      const exists = await RNFS.exists(RNLogger.RN_LOG_FILE_PATH)
      if (!exists) {
        console.log('[RN] No log file to export')
        return null
      }
      
      if (Platform.OS === 'android') {
        // Request permission for external storage
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          {
            title: 'Storage Permission',
            message: 'App needs permission to export RN log to Downloads folder',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel', 
            buttonPositive: 'OK',
          }
        )
        
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
          const exportPath = `${RNFS.DownloadDirectoryPath}/RN_Debug_Log_${timestamp}.txt`
          
          await RNFS.copyFile(RNLogger.RN_LOG_FILE_PATH, exportPath)
          console.log(`[RN] Log file exported to: ${exportPath}`)
          return exportPath
        } else {
          console.log('[RN] Storage permission denied')
        }
      }
      
      // Return internal path if export fails
      return RNLogger.RN_LOG_FILE_PATH
    } catch (error) {
      console.log('[RN] Error exporting log file:', error)
      return null
    }
  }
  
  // Enable or disable file logging
  static setFileLoggingEnabled(enabled: boolean) {
    RNLogger.logToFileEnabled = enabled && RNLogger.hasPermission
    if (enabled && !RNLogger.hasPermission) {
      console.log('[RN] File logging requested but no permission')
    }
  }
  
  // Get current log file path
  static getLogFilePath(): string {
    return RNLogger.RN_LOG_FILE_PATH
  }
  
  // Clear the log file
  static async clearLogFile() {
    try {
      RNLogger.logQueue = []
      await RNLogger.init()
      console.log('[RN] Log file cleared')
    } catch (error) {
      console.log('[RN] Error clearing log file:', error)
    }
  }
}