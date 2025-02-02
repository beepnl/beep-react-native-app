export interface LogFileInfo {
  name: string;
  path: string;
  size: number;
  created: Date;
}

export class LogFileModel {
  static async getStoredLogFiles(): Promise<LogFileInfo[]> {
    const files = await RNFS.readDir(BleHelpers.LOG_FILES_DIR);
    return files
      .filter(file => file.name.startsWith('BeepBaseLog_'))
      .map(file => ({
        name: file.name,
        path: file.path,
        size: file.size,
        created: new Date(file.mtime || file.ctime),
      }))
      .sort((a, b) => b.created.getTime() - a.created.getTime());
  }

  static async deleteLogFile(filePath: string): Promise<void> {
    await RNFS.unlink(filePath);
  }
}