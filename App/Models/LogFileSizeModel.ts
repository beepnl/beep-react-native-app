import DateTimeHelper from "../Helpers/DateTimeHelpers"
import FormatHelpers from "../Helpers/FormatHelpers"
import { Buffer } from 'buffer'

export class LogFileSizeModel {
  data: number = 0
  timestamp: Date = new Date()

  constructor(props: any) {
    this.data = Number(props.data)
  }

  toString() {
    return `${FormatHelpers.formatSizeAsHumanReadable(this.data)}`
  }

  getTimestamp() {
    return `${DateTimeHelper.formatDateTime(this.timestamp)}`
  }

  value() {
    return this.data
  }

  static parse(rawData: any) {
    let data = 0
    // Ensure rawData is a proper Buffer instance
    const buffer = Buffer.isBuffer(rawData) ? rawData : Buffer.from(rawData || [])
    if (buffer?.length > 0) {
      data = buffer.readInt32BE()
    }
    return new LogFileSizeModel({ data })
  }
}
