import { Buffer } from 'buffer'

export class LoRaWanAppEUIModel {
  appEUI: string = ""
  formatted: string = ""

  constructor(props: any) {
    this.appEUI = props.appEUI
    this.formatted = props.appEUI.toUpperCase().match(/.{1,2}/g)?.join(" ")
  }

  toString() {
    return this.formatted
  }
}

export class LoRaWanAppEUIParser {
  data: Buffer;

  constructor(props: any) {
    // Ensure data is a proper Buffer instance
    this.data = Buffer.isBuffer(props.data) ? props.data : Buffer.from(props.data || [])
  }

  parse(): LoRaWanAppEUIModel | undefined {
    const len = this.data?.length
    if (len >= 8) {
      const appEUI = this.data.toString("hex", 0, 8)
      return new LoRaWanAppEUIModel({ appEUI })
    }
  }
}