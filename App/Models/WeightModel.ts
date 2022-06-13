type CHANNEL_NAME = "UNKNOWN" | "A_GAIN128" | "B_GAIN32" | "A_GAIN64"
type Channel = {
  name: CHANNEL_NAME,
  value: number
}

export class WeightModel {
  channels: Array<Channel> = []

  constructor(props: any) {
    this.channels = props.data
  }

  toString() {
    return `${(this.channels.map(channel => `${channel.name}: ${channel.value}`).join(", "))}`
  }

}

export class WeightParser {
  data: Buffer;

  constructor(props: any) {
    this.data = props.data || Buffer.alloc(1)
  }

  parse(): WeightModel | undefined {
    const len = this.data?.length
    let i = 0
    while (i < len) {
      const channelByte = this.data.readUInt8(i++)
      let name: CHANNEL_NAME = "UNKNOWN"
      switch (channelByte) {
        case 1:
          name = "A_GAIN128"
          break;
        case 2:
          name = "B_GAIN32"
          break;
        case 4:
          name = "A_GAIN64"
          break;
      }

      const data = []
      //read 24bit signed value
      let byte1 = this.data.readUInt8(i++)
      const signed = byte1 & 0b10000000
      if (signed) {
        byte1 &= 0b01111111
      }
      const byte2 = this.data.readUInt8(i++)
      const byte3 = this.data.readUInt8(i++)
      let combined = (byte1<<16) | (byte2<<8) | (byte3)
      if (signed) {
        combined = -combined
      }

      const channel: Channel = {
        name,
        value: combined,
      }
      data.push(channel)

      return new WeightModel({ data })
    }
  }
}