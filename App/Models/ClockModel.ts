import DateTimeHelper from "../Helpers/DateTimeHelpers"

export class ClockModel {
  deviceDate: Date
  phoneDate: Date

  constructor(props: any) {
    this.deviceDate = new Date(Number(props.data) * 1000)
    this.phoneDate = new Date()
  }

  toDrift() {
    const ms = this.phoneDate.valueOf() - this.deviceDate.valueOf()
    const diffMs = Math.abs(this.phoneDate.valueOf() - this.deviceDate.valueOf())
    const diffSeconds = diffMs / 1000
    return `${ms > 0 ? "-" : "+"} ${diffSeconds.toFixed(2)}`
  }

  toDate() {
    return DateTimeHelper.formatDateLong(this.deviceDate)
  }

  toTime() {
    return DateTimeHelper.formatTime(this.deviceDate)
  }

  static parse(rawData: any) {
    let data = 0
    if (rawData?.length >= 4) {
      data = rawData.readUInt32BE()
    }
    return new ClockModel({ data })
  }
}
