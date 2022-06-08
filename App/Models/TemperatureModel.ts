import DateTimeHelper from "../Helpers/DateTimeHelpers"

export class TemperatureModel {
  data: Buffer
  value: number = 0
  timestamp: Date = new Date()

  constructor(props: any) {
    this.data = props.data
    this.value = Number(this.data)
  }

  toString() {
    return `${(this.value / 100).toFixed(2)} °C`
  }

}

export class TemperatureParser {
  data: Buffer;

  constructor(props: any) {
    this.data = props.data || Buffer.alloc(1)
  }

  parse(): Array<TemperatureModel> {
    const result: Array<TemperatureModel> = []
    if (this.data?.length > 0) {
      let sensorCount = this.data.readInt8()
      let i = 1   //skip count byte
      while (sensorCount) {
        const data = this.data.readInt16BE(i)
        result.push(new TemperatureModel({ data }))
        sensorCount -= 1
        i += 2    //offset to next value
      }
    }
    return result
  }
}