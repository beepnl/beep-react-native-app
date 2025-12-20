import { Buffer } from 'buffer'

export class LoRaWanAppKeyModel {
  appKey: string = ""
  formatted: string = ""

  constructor(props: any) {
    this.appKey = props.appKey
    this.formatted = props.appKey.toUpperCase().match(/.{1,2}/g)?.join(" ")
  }

  toString() {
    return this.formatted
  }
}

export class LoRaWanAppKeyParser {
  data: Buffer;

  constructor(props: any) {
    // Ensure data is a proper Buffer instance
    this.data = Buffer.isBuffer(props.data) ? props.data : Buffer.from(props.data || [])
  }

  parse(): LoRaWanAppKeyModel | undefined {
    const len = this.data?.length
    if (len >= 8) {
      const appKey = this.data.toString("hex", 0, 16)
      return new LoRaWanAppKeyModel({ appKey })
    }
  }
}