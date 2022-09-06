import DateTimeHelper from "../Helpers/DateTimeHelpers"
import FormatHelpers from "../Helpers/FormatHelpers"

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
    if (rawData?.length > 0) {
      data = rawData.readInt32BE()
    }
    return new LogFileSizeModel({ data })
  }
}
