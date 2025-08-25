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
    this.data = props.data || Buffer.alloc(1)
  }

  parse(): LoRaWanAppEUIModel | undefined {
    const len = this.data?.length
    if (len >= 8) {
      const appEUI = this.data.toString("hex", 0, 8)
      return new LoRaWanAppEUIModel({ appEUI })
    }
  }
}