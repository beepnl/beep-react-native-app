class BleHelpers {
  static LOG_FILES_DIR = RNFS.DocumentDirectoryPath + "/LogFiles";
  
  static async initLogFilesDir() {
    const exists = await RNFS.exists(BleHelpers.LOG_FILES_DIR);
    if (!exists) {
      await RNFS.mkdir(BleHelpers.LOG_FILES_DIR);
    }
  }

  static generateLogFileName() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    return `BeepBaseLog_${timestamp}.txt`;
  }

  static async initLogFile() {
    const newFileName = BleHelpers.generateLogFileName();
    const newFilePath = `${BleHelpers.LOG_FILES_DIR}/${newFileName}`;
    await RNFS.writeFile(newFilePath, '', 'utf8');
    BleHelpers.LOG_FILE_PATH = newFilePath;
    BleHelpers.lastFrame = -1;
    return newFilePath;
  }
}
