import { Buffer } from 'buffer'

//currently not being used since the battery service always returns 100%
export class BatteryModel {
  mvBattery: number
  mvCPU: number
  percentage : number

  constructor(props: any) {
    this.mvBattery = props.mvBattery
    this.mvCPU = props.mvCPU
    this.percentage = props.percentage
  }

  toString() {
    return `${this.percentage}%`
  }

  getVoltage() {
    return `${this.mvBattery / 1000} V`
  }

  static parse(rawData: Buffer) {
    let mvBattery = 0
    let mvCPU = 0
    let percentage = 0
    // Ensure rawData is a proper Buffer instance
    const buffer = Buffer.isBuffer(rawData) ? rawData : Buffer.from(rawData || [])
    if (buffer?.length >= 5) {
      mvBattery = buffer.readInt16BE(0)
      mvCPU = buffer.readInt16BE(2)
      percentage = buffer.readInt8(4)
    }
    return new BatteryModel({ mvBattery, mvCPU, percentage })
  }
}