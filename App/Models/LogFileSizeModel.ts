import DateTimeHelper from "../Helpers/DateTimeHelpers"

export class LogFileSizeModel {
  data: number = 0
  timestamp: Date = new Date()

  constructor(props: any) {
    this.data = Number(props.data)
  }

  private humanReadableFileSize(bytes: number): `${number} ${'B' | 'KB' | 'MB' | 'GB' | 'TB'}` {
    const index = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${Number((bytes / Math.pow(1024, index)).toFixed(2)) * 1} ${(['B', 'KB', 'MB', 'GB', 'TB'] as const)[index]}`;
  };

  toString() {
    return `${this.humanReadableFileSize(this.data)}  Timestamp: ${DateTimeHelper.formatTime(this.timestamp)}`
  }

  value() {
    return this.data
  }

  static parse(rawData: any) {
    let data = 0
    if (rawData?.length > 0) {
      data = rawData.readInt32BE()
    }
    return new LogFileSizeModel({ data })
  }
}
