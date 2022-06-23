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
    this.data = props.data || Buffer.alloc(1)
  }

  parse(): LoRaWanDeviceEUIModel | undefined {
    const len = this.data?.length
    if (len >= 8) {
      const devEUI = this.data.toString("hex", 0, 8)
      return new LoRaWanDeviceEUIModel({ devEUI })
    }
  }
}