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
    this.data = props.data || Buffer.alloc(1)
  }

  parse(): BatteryModel | undefined {
    const len = this.data?.length
    if (len >= 1) {
      const percentage = this.data.readUInt8(0)
      return new BatteryModel({ percentage })
    }
  }
}