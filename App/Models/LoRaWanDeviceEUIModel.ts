import { Buffer } from 'buffer'

export class LoRaWanDeviceEUIModel {
  devEUI: string = ""
  formatted: string = ""

  constructor(props: any) {
    this.devEUI = props.devEUI
    this.formatted = props.devEUI.toUpperCase().match(/.{1,2}/g)?.join(" ")
  }

  toString() {
    return this.formatted
  }
}

export class LoRaWanDeviceEUIParser {
  data: Buffer;

  constructor(props: any) {
    // Ensure data is a proper Buffer instance
    this.data = Buffer.isBuffer(props.data) ? props.data : Buffer.from(props.data || [])
  }

  parse(): LoRaWanDeviceEUIModel | undefined {
    const len = this.data?.length
    if (len >= 8) {
      const devEUI = this.data.toString("hex", 0, 8)
      return new LoRaWanDeviceEUIModel({ devEUI })
    }
  }
}