import DateTimeHelper from "../Helpers/DateTimeHelpers"

export class ClockModel {
  deviceDate: Date
  phoneDate: Date
  clockSource: '0x25' | '0x2D' | null 

  constructor(props: any) {
    this.deviceDate = new Date(Number(props.data) * 1000)
    this.phoneDate = new Date()
    this.clockSource = props.clockSource || null
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

  
  static parse(rawData: Buffer ) {
    let data = 0
    let clockSource = null

    if (rawData?.length >= 4) {
      clockSource = `0x${rawData[0].toString(16).toUpperCase()}`

      data = rawData.readUInt32BE(1)// Offset by 1 to skip source byte
    }
    return new ClockModel({ data, clockSource})
  }
  isRtcModule(): boolean {
    return this.clockSource === '0x2D'
  }
}
