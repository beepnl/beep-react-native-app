import { Buffer } from 'buffer'

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
    // Ensure data is a proper Buffer instance
    this.data = Buffer.isBuffer(props.data) ? props.data : Buffer.from(props.data || [])
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