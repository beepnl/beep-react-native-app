export class ApplicationConfigModel {
  measureToSendRatio: number
  measurementInterval: number

  constructor(props: any) {
    this.measureToSendRatio = props.measureToSendRatio
    this.measurementInterval = props.measurementInterval
  }
}

export class ApplicationConfigParser {
  data: Buffer;

  constructor(props: any) {
    this.data = props.data || Buffer.alloc(1)
  }

  parse(): ApplicationConfigModel | undefined {
    const len = this.data?.length
    if (len >= 3) {
      let i = 0
      const measureToSendRatio= this.data.readUInt8(i++)
      const measurementInterval = this.data.readUInt16BE(i)
      return new ApplicationConfigModel({ measureToSendRatio, measurementInterval })
    }
  }
}