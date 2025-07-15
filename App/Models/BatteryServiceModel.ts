import { Buffer } from 'buffer'

export class BatteryModel {
  percentage : number

  constructor(props: any) {
    this.percentage = props.percentage
  }

  toString() {
    return `${this.percentage}%`
  }

}

export class BatteryParser {
  data: Buffer;

  constructor(props: any) {
    // Ensure data is a proper Buffer instance
    this.data = Buffer.isBuffer(props.data) ? props.data : Buffer.from(props.data || [])
  }

  parse(): BatteryModel | undefined {
    const len = this.data?.length
    if (len >= 1) {
      const percentage = this.data.readUInt8(0)
      return new BatteryModel({ percentage })
    }
  }
}