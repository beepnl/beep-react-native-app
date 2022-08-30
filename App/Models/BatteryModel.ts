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
    return `${this.mvBattery} mV`
  }

  static parse(rawData: Buffer) {
    let mvBattery = 0
    let mvCPU = 0
    let percentage = 0
    if (rawData?.length >= 5) {
      mvBattery = rawData.readInt16BE()
      mvCPU = rawData.readInt16BE()
      percentage = rawData.readInt8()
    }
    return new BatteryModel({ mvBattery, mvCPU, percentage })
  }
}